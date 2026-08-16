from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.users.models import User
from .models import Track, Album, PlayHistory
from .recommender import recommend_tracks_for_user


def make_audio(name='song.mp3'):
    return SimpleUploadedFile(name, b'audio data', content_type='audio/mpeg')


class MusicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.artist = User.objects.create_user(
            username='musicartist', email='artist@example.com', password='password123', display_name='Music Artist', role='artist'
        )
        self.listener = User.objects.create_user(
            username='musiclistener', email='listener@example.com', password='password123', display_name='Music Listener', role='listener'
        )
        self.free_plan = self.listener.subscription.plan
        self.free_plan.max_streams_per_day = 2
        self.free_plan.save()

        dummy_audio = make_audio()
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
        self.assertEqual(PlayHistory.objects.filter(user=self.listener, track=self.track).count(), 1)
        # 2nd play
        res2 = self.client.post(f'/api/music/tracks/{self.track.id}/play/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        # 3rd play exceeds daily limit of 2
        res3 = self.client.post(f'/api/music/tracks/{self.track.id}/play/')
        self.assertEqual(res3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class RecommendationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.indie_artist = User.objects.create_user(
            username='indie', email='indie@example.com', password='password123',
            display_name='Indie Artist', role='artist',
        )
        self.pop_artist = User.objects.create_user(
            username='popstar', email='pop@example.com', password='password123',
            display_name='Pop Artist', role='artist',
        )
        self.listener = User.objects.create_user(
            username='fan', email='fan@example.com', password='password123',
            display_name='Fan', role='listener',
        )

        self.indie_a = Track.objects.create(
            title='Indie One', artist=self.indie_artist, audio_file=make_audio('a.mp3'),
            duration=180, genre='Indie Rock', streams=10,
        )
        self.indie_b = Track.objects.create(
            title='Indie Two', artist=self.indie_artist, audio_file=make_audio('b.mp3'),
            duration=180, genre='Indie Rock', streams=5,
        )
        self.pop_hit = Track.objects.create(
            title='Pop Hit', artist=self.pop_artist, audio_file=make_audio('c.mp3'),
            duration=180, genre='Pop', streams=999999,
        )

    def test_recommendations_prefer_listened_genre_over_popularity(self):
        PlayHistory.objects.create(user=self.listener, track=self.indie_a)
        ranked = recommend_tracks_for_user(self.listener, limit=3)
        titles = [item['track'].title for item in ranked]
        self.assertEqual(titles[0], 'Indie Two')
        self.assertNotEqual(titles[0], 'Pop Hit')
        self.assertEqual(ranked[0]['reason_code'], 'genre')

        first_call = [item['track'].id for item in ranked]
        second_call = [item['track'].id for item in recommend_tracks_for_user(self.listener, limit=3)]
        self.assertEqual(first_call, second_call)

    def test_recommendations_endpoint_requires_auth_and_returns_payload(self):
        response = self.client.get('/api/music/tracks/recommendations/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        PlayHistory.objects.create(user=self.listener, track=self.indie_a)
        self.client.force_authenticate(user=self.listener)
        response = self.client.get('/api/music/tracks/recommendations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Indie Two')
        self.assertEqual(results[0]['reason_code'], 'genre')
        self.assertEqual(results[0]['reason_genre'], 'Indie Rock')

