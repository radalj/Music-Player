from django.urls import path
from .views import (
    TrackListCreateView, TrackRetrieveUpdateDestroyView, TrackPlayView,
    TrackRecommendationView, AlbumListCreateView, AlbumRetrieveUpdateDestroyView,
    ArtistGoldStatsView,
)

urlpatterns = [
    path('tracks/', TrackListCreateView.as_view(), name='track-list'),
    path('tracks/recommendations/', TrackRecommendationView.as_view(), name='track-recommendations'),
    path('tracks/<int:pk>/', TrackRetrieveUpdateDestroyView.as_view(), name='track-detail'),
    path('tracks/<int:pk>/play/', TrackPlayView.as_view(), name='track-play'),
    path('albums/', AlbumListCreateView.as_view(), name='album-list'),
    path('albums/<int:pk>/', AlbumRetrieveUpdateDestroyView.as_view(), name='album-detail'),
    path('artists/<int:artist_id>/gold-stats/', ArtistGoldStatsView.as_view(), name='artist-gold-stats'),
]