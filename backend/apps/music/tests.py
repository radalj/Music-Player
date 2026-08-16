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

    def test_artist_can_upload_track_with_lyrics(self):
        self.client.force_authenticate(user=self.artist)
        audio = make_audio('release.mp3')
        response = self.client.post(
            '/api/music/tracks/',
            {
                'title': 'Lyric Song',
                'audio_file': audio,
                'lyrics': 'Hello from the other side',
                'duration': 120,
                'genre': 'Pop',
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['lyrics'], 'Hello from the other side')
        self.assertEqual(response.data['title'], 'Lyric Song')
        self.assertEqual(response.data['artist']['id'], self.artist.id)

    def test_artist_can_upload_album_with_track(self):
        self.client.force_authenticate(user=self.artist)
        audio = make_audio('album-track.mp3')
        track_res = self.client.post(
            '/api/music/tracks/',
            {
                'title': 'Album Cut',
                'audio_file': audio,
                'lyrics': 'Verse one',
                'duration': 200,
                'is_single': False,
            },
            format='multipart',
        )
        self.assertEqual(track_res.status_code, status.HTTP_201_CREATED)
        album_res = self.client.post('/api/music/albums/', {
            'title': 'Debut Album',
            'release_date': '2026-01-01',
            'genre': 'Pop',
            'track_ids': [track_res.data['id']],
        }, format='json')
        self.assertEqual(album_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(album_res.data['title'], 'Debut Album')
        self.assertEqual(len(album_res.data['tracks']), 1)
        self.assertEqual(album_res.data['tracks'][0]['title'], 'Album Cut')

    def test_list_tracks_and_search(self):
        response = self.client.get('/api/music/tracks/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_tracks_with_json_content_type(self):
        response = self.client.get(
            '/api/music/tracks/',
            HTTP_CONTENT_TYPE='application/json',
        )
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

    def test_free_listener_cannot_view_artist_stats(self):
        self.track.listeners = 10
        self.track.streams = 40
        self.track.save()
        self.client.force_authenticate(user=self.listener)
        response = self.client.get(f'/api/music/artists/{self.artist.id}/gold-stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_silver_and_gold_listeners_can_view_artist_stats(self):
        from apps.subscriptions.models import SubscriptionPlan

        self.track.listeners = 12
        self.track.streams = 55
        self.track.save()
        silver_plan = SubscriptionPlan.objects.create(
            name='silver', price=10, max_playlists=100, show_analytics=True
        )
        gold_plan = SubscriptionPlan.objects.create(
            name='gold', price=20, max_playlists=None, show_analytics=True
        )

        self.listener.subscription.plan = silver_plan
        self.listener.subscription.save()
        self.client.force_authenticate(user=self.listener)
        silver_res = self.client.get(f'/api/music/artists/{self.artist.id}/gold-stats/')
        self.assertEqual(silver_res.status_code, status.HTTP_200_OK)
        self.assertEqual(silver_res.data['total_listeners'], 12)
        self.assertEqual(silver_res.data['total_streams'], 55)

        self.listener.subscription.plan = gold_plan
        self.listener.subscription.save()
        gold_res = self.client.get(f'/api/music/artists/{self.artist.id}/gold-stats/')
        self.assertEqual(gold_res.status_code, status.HTTP_200_OK)
        self.assertEqual(gold_res.data['total_streams'], 55)


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

