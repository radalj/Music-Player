from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from .models import Notification


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='notiuser', email='notiuser@example.com', password='password123', display_name='Noti User'
        )
        self.notification = Notification.objects.create(
            recipient=self.user,
            title='Test Title',
            message='Test Message'
        )

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/notifications/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_mark_notification_as_read(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/notifications/notifications/{self.notification.id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
