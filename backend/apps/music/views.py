from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Track, Album, User
from .serializers import TrackSerializer, AlbumSerializer
from apps.core.permissions import IsArtistOrReadOnly  # اضافه شد
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.permissions import HasGoldAccess
from rest_framework.parsers import MultiPartParser, FormParser


class TrackListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]  # ✅
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genre', 'artist__id', 'is_single']
    search_fields = ['title', 'artist__display_name']
    ordering_fields = ['listeners', 'streams', 'created_at']

class TrackRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]  # ✅

class AlbumListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]  # ✅

class AlbumRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistOrReadOnly]  # ✅
    
class ArtistGoldStatsView(APIView):
    """
    نمایش آمار پیشرفته (شنوندگان، استریم‌ها) - فقط برای کاربران طلایی
    """
    permission_classes = [permissions.IsAuthenticated, HasGoldAccess]

    def get(self, request, artist_id):
        # در اینجا داده‌های واقعی را از دیتابیس بگیرید
        # فعلاً داده‌های نمونه برمی‌گردانیم
        data = {
            "artist_id": artist_id,
            "total_listeners": 45200,
            "total_streams": 1245000,
            "message": "This is premium Gold data!"
        }
        return Response(data)