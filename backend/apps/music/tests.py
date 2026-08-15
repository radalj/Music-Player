from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.users.models import User
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from .models import Track, Album


class MusicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.free_plan = SubscriptionPlan.objects.create(name='free', price=0, max_streams_per_day=2)
        self.artist = User.objects.create_user(
            username='musicartist', email='artist@example.com', password='password123', display_name='Music Artist', role='artist'
        )
        self.listener = User.objects.create_user(
            username='musiclistener', email='listener@example.com', password='password123', display_name='Music Listener', role='listener'
        )
        UserSubscription.objects.create(user=self.listener, plan=self.free_plan)

        dummy_audio = SimpleUploadedFile("song.mp3", b"audio data", content_type="audio/mpeg")
        self.track = Track.objects.create(
            title='Test Song',
            artist=self.artist,
            audio_file=dummy_audio,
            duration=180,
            genre='Pop'
        )

    def test_list_tracks_and_search(self):
        response = self.client.get('/api/music/tracks/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_track_playback_and_daily_stream_limit(self):
        self.client.force_authenticate(user=self.listener)
        # 1st play
        res1 = self.client.post(f'/api/music/tracks/{self.track.id}/play/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        # 2nd play
        res2 = self.client.post(f'/api/music/tracks/{self.track.id}/play/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        # 3rd play exceeds daily limit of 2
        res3 = self.client.post(f'/api/music/tracks/{self.track.id}/play/')
        self.assertEqual(res3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
