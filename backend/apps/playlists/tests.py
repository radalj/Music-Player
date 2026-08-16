from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from .models import Playlist


class PlaylistTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.free_plan = SubscriptionPlan.objects.create(name='free', price=0, max_playlists=2)
        self.user = User.objects.create_user(
            username='playuser', email='playuser@example.com', password='password123', display_name='Playlist User'
        )
        sub = self.user.subscription
        sub.plan = self.free_plan
        sub.save()

    def test_create_playlist(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/playlists/', {'name': 'Favorites'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Playlist.objects.filter(creator=self.user).count(), 1)

    def test_playlist_limit_enforcement(self):
        self.client.force_authenticate(user=self.user)
        Playlist.objects.create(creator=self.user, name='Playlist 1')
        Playlist.objects.create(creator=self.user, name='Playlist 2')

        # 3rd playlist creation should be forbidden for free tier (max 2)
        response = self.client.post('/api/playlists/', {'name': 'Playlist 3'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_playlist(self):
        self.client.force_authenticate(user=self.user)
        playlist = Playlist.objects.create(creator=self.user, name='Throwaway')
        response = self.client.delete(f'/api/playlists/{playlist.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Playlist.objects.filter(id=playlist.id).exists())
