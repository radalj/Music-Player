from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Playlist
from .serializers import PlaylistSerializer
from apps.music.models import Track
from apps.core.permissions import HasPlaylistLimit


class PlaylistListCreateView(generics.ListCreateAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, HasPlaylistLimit]

    def get_queryset(self):
        return Playlist.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class PlaylistRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Playlist.objects.filter(creator=self.request.user)


class AddTrackToPlaylistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        playlist = get_object_or_404(Playlist, pk=pk, creator=request.user)
        track_id = request.data.get('track_id')
        if not track_id:
            return Response({'error': 'track_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        track = get_object_or_404(Track, pk=track_id)
        playlist.tracks.add(track)
        serializer = PlaylistSerializer(playlist)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveTrackFromPlaylistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        playlist = get_object_or_404(Playlist, pk=pk, creator=request.user)
        track_id = request.data.get('track_id')
        if not track_id:
            return Response({'error': 'track_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        track = get_object_or_404(Track, pk=track_id)
        playlist.tracks.remove(track)
        serializer = PlaylistSerializer(playlist)
        return Response(serializer.data, status=status.HTTP_200_OK)