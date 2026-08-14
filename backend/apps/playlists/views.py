from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import Playlist
from .serializers import PlaylistSerializer
from apps.core.permissions import HasPlaylistLimit  # ← اضافه شد

class PlaylistListCreateView(generics.ListCreateAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, HasPlaylistLimit]  # ← اضافه شد

    def get_queryset(self):
        return Playlist.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        # ایجاد پلی‌لیست با کاربر فعلی (محدودیت قبلاً توسط Permission بررسی شده)
        serializer.save(creator=self.request.user)


class PlaylistRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Playlist.objects.filter(creator=self.request.user)