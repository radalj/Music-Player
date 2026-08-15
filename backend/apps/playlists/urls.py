from django.urls import path
from .views import (
    PlaylistListCreateView, PlaylistRetrieveUpdateDestroyView,
    AddTrackToPlaylistView, RemoveTrackFromPlaylistView
)

urlpatterns = [
    path('', PlaylistListCreateView.as_view(), name='playlist-list'),
    path('<int:pk>/', PlaylistRetrieveUpdateDestroyView.as_view(), name='playlist-detail'),
    path('<int:pk>/add_track/', AddTrackToPlaylistView.as_view(), name='playlist-add-track'),
    path('<int:pk>/add-track/', AddTrackToPlaylistView.as_view(), name='playlist-add-track-dash'),
    path('<int:pk>/remove_track/', RemoveTrackFromPlaylistView.as_view(), name='playlist-remove-track'),
    path('<int:pk>/remove-track/', RemoveTrackFromPlaylistView.as_view(), name='playlist-remove-track-dash'),

    # Aliases under /playlists/
    path('playlists/', PlaylistListCreateView.as_view(), name='playlist-list-alias'),
    path('playlists/<int:pk>/', PlaylistRetrieveUpdateDestroyView.as_view(), name='playlist-detail-alias'),
    path('playlists/<int:pk>/add_track/', AddTrackToPlaylistView.as_view(), name='playlist-add-track-alias'),
    path('playlists/<int:pk>/add-track/', AddTrackToPlaylistView.as_view(), name='playlist-add-track-dash-alias'),
    path('playlists/<int:pk>/remove_track/', RemoveTrackFromPlaylistView.as_view(), name='playlist-remove-track-alias'),
    path('playlists/<int:pk>/remove-track/', RemoveTrackFromPlaylistView.as_view(), name='playlist-remove-track-dash-alias'),
]