from django.urls import path
from .views import TrackListCreateView, TrackRetrieveUpdateDestroyView, AlbumListCreateView, AlbumRetrieveUpdateDestroyView
from .views import ArtistGoldStatsView

urlpatterns = [
    path('tracks/', TrackListCreateView.as_view(), name='track-list'),
    path('tracks/<int:pk>/', TrackRetrieveUpdateDestroyView.as_view(), name='track-detail'),
    path('albums/', AlbumListCreateView.as_view(), name='album-list'),
    path('albums/<int:pk>/', AlbumRetrieveUpdateDestroyView.as_view(), name='album-detail'),
    path('artists/<int:artist_id>/gold-stats/', ArtistGoldStatsView.as_view(), name='artist-gold-stats')
]