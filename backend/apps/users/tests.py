from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import User
from apps.subscriptions.models import SubscriptionPlan, UserSubscription


class UserAuthAndProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.free_plan = SubscriptionPlan.objects.create(name='free', price=0, max_playlists=6)
        self.silver_plan = SubscriptionPlan.objects.create(name='silver', price=10, max_playlists=100)

        self.listener = User.objects.create_user(
            username='listener1',
            email='listener1@example.com',
            password='password123',
            display_name='Listener One',
            role='listener'
        )
        sub = self.listener.subscription
        sub.plan = self.free_plan
        sub.save()

        self.artist = User.objects.create_user(
            username='artist1',
            email='artist1@example.com',
            password='password123',
            display_name='Artist One',
            role='artist',
            awaiting_approval=True
        )

        self.admin = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            display_name='Admin User',
            role='admin'
        )

    def test_listener_registration(self):
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123',
            'display_name': 'New User',
            'role': 'listener'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

    def test_login_returns_jwt_tokens(self):
        response = self.client.post('/api/users/login/', {
            'email': 'listener1@example.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_admin_login_and_profile(self):
        response = self.client.post('/api/users/login/', {
            'email': 'admin1@example.com',
            'password': 'password123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], 'admin')
        self.assertIn('access', response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        profile = self.client.get('/api/users/profile/')
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data['email'], 'admin1@example.com')

    def test_base_user_profile_photo_upload_restriction(self):
        self.listener.subscription.plan = self.free_plan
        self.listener.subscription.save()
        self.client.force_authenticate(user=self.listener)
        dummy_image = SimpleUploadedFile("avatar.jpg", b"fake image content", content_type="image/jpeg")
        response = self.client.patch('/api/users/profile/', {'profile_image': dummy_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_silver_user_can_start_profile_photo_upload(self):
        self.listener.subscription.plan = self.silver_plan
        self.listener.subscription.save()
        self.client.force_authenticate(user=self.listener)
        dummy_image = SimpleUploadedFile("avatar.jpg", b"fake image content", content_type="image/jpeg")
        response = self.client.patch('/api/users/profile/', {'profile_image': dummy_image}, format='multipart')
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_json_patch_updates_display_name(self):
        self.client.force_authenticate(user=self.listener)
        response = self.client.patch(
            '/api/users/profile/',
            {'display_name': 'Updated Listener', 'gender': 'female'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], 'Updated Listener')
        self.listener.refresh_from_db()
        self.assertEqual(self.listener.display_name, 'Updated Listener')

    def test_list_other_users(self):
        self.client.force_authenticate(user=self.listener)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        emails = [item['email'] for item in results]
        self.assertIn(self.artist.email, emails)
        self.assertNotIn(self.listener.email, emails)

    def test_follow_and_unfollow_user(self):
        self.client.force_authenticate(user=self.listener)
        response = self.client.post(f'/api/users/{self.artist.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.listener.is_following(self.artist))
        self.assertEqual(response.data['followers_count'], 1)
        self.assertTrue(response.data['is_following'])

        listing = self.client.get('/api/users/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        results = listing.data if isinstance(listing.data, list) else listing.data.get('results', [])
        artist_row = next(item for item in results if item['email'] == self.artist.email)
        self.assertEqual(artist_row['followers_count'], 1)
        self.assertTrue(artist_row['is_following'])

        response_del = self.client.delete(f'/api/users/{self.artist.id}/follow/')
        self.assertEqual(response_del.status_code, status.HTTP_200_OK)
        self.assertFalse(self.listener.is_following(self.artist))
        self.assertEqual(response_del.data['followers_count'], 0)

        listing_after = self.client.get('/api/users/')
        results_after = listing_after.data if isinstance(listing_after.data, list) else listing_after.data.get('results', [])
        artist_row_after = next(item for item in results_after if item['email'] == self.artist.email)
        self.assertEqual(artist_row_after['followers_count'], 0)
        self.assertFalse(artist_row_after['is_following'])

    def test_approve_artist_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/users/artists/{self.artist.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artist.refresh_from_db()
        self.assertTrue(self.artist.verified)
        self.assertFalse(self.artist.awaiting_approval)

    def test_supporter_can_approve_artist(self):
        supporter = User.objects.create_user(
            username='support1',
            email='support1@example.com',
            password='password123',
            display_name='Support One',
            role='supporter',
        )
        self.client.force_authenticate(user=supporter)
        response = self.client.post(f'/api/users/artists/{self.artist.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artist.refresh_from_db()
        self.assertTrue(self.artist.verified)
