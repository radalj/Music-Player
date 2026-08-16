from rest_framework import generics, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum
from .models import Track, Album, User, PlayHistory
from .serializers import TrackSerializer, AlbumSerializer
from .recommender import recommend_tracks_for_user
from apps.core.permissions import IsArtistOrReadOnly, HasAnalyticsAccess
from apps.notifications.models import Notification


class TrackListCreateView(generics.ListCreateAPIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genre', 'artist', 'is_single']
    search_fields = ['title', 'artist__display_name', 'artist__username']
    ordering_fields = ['listeners', 'streams', 'created_at']

    def perform_create(self, serializer):
        track = serializer.save(artist=self.request.user)
        # Notify followers
        followers = self.request.user.followers.all()
        for f in followers:
            Notification.objects.create(
                recipient=f,
                title="New Release!",
                message=f"{self.request.user.display_name} published a new track: '{track.title}'.",
                link=f"/player/{track.id}",
                notification_type="new_release"
            )


class TrackRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]


class TrackPlayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            track = Track.objects.get(pk=pk)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        sub = user.get_subscription()
        plan_name = sub.plan.name if (sub and sub.plan) else 'free'
        max_daily = sub.plan.max_streams_per_day if (sub and sub.plan) else 60
        if max_daily is not None and user.daily_streams >= max_daily:
            return Response(
                {
                    'error': f'Daily stream limit of {max_daily} reached for your {plan_name.title()} subscription. Upgrade to Gold for unlimited streams.'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Increment stream counts
        user.daily_streams += 1
        user.save()

        track.streams += 1
        track.listeners += 1
        track.save()
        PlayHistory.objects.create(user=user, track=track)

        return Response({
            'message': 'Track playback registered.',
            'streams': track.streams,
            'user_daily_streams': user.daily_streams
        })


class AlbumListCreateView(generics.ListCreateAPIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genre', 'artist']
    search_fields = ['title', 'artist__display_name', 'artist__username']
    ordering_fields = ['release_date', 'created_at']

    def perform_create(self, serializer):
        album = serializer.save(artist=self.request.user)
        # Notify followers
        followers = self.request.user.followers.all()
        for f in followers:
            Notification.objects.create(
                recipient=f,
                title="New Album Released!",
                message=f"{self.request.user.display_name} published a new album: '{album.title}'.",
                link=f"/album/{album.id}",
                notification_type="new_release"
            )


class AlbumRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]


class ArtistGoldStatsView(APIView):
    """
    Artist listener and stream statistics for Silver and Gold subscribers.
    """
    permission_classes = [permissions.IsAuthenticated, HasAnalyticsAccess]

    def get(self, request, artist_id):
        try:
            artist = User.objects.get(pk=artist_id, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)

        total_streams = Track.objects.filter(artist=artist).aggregate(Sum('streams'))['streams__sum'] or 0
        total_listeners = Track.objects.filter(artist=artist).aggregate(Sum('listeners'))['listeners__sum'] or 0

        data = {
            "artist_id": artist.id,
            "artist_name": artist.display_name,
            "total_listeners": total_listeners,
            "total_streams": total_streams,
            "message": "Premium listener metrics retrieved."
        }
        return Response(data)


class TrackRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 8))
        except (TypeError, ValueError):
            limit = 8
        limit = max(1, min(limit, 20))

        recommendations = recommend_tracks_for_user(request.user, limit=limit)
        payload = []
        for item in recommendations:
            data = TrackSerializer(item['track'], context={'request': request}).data
            data['reason_code'] = item['reason_code']
            data['reason_genre'] = item['reason_genre']
            payload.append(data)

        return Response({'results': payload})