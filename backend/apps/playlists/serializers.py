from rest_framework import serializers
from .models import Playlist
from apps.music.serializers import TrackSerializer
from apps.users.serializers import UserSerializer
from apps.music.models import Track

class PlaylistSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)  # فقط خواندنی
    tracks = TrackSerializer(many=True, read_only=True)
    track_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Track.objects.all(),
        source='tracks',
        write_only=True,
        required=False
    )

    class Meta:
        model = Playlist
        fields = '__all__'
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at']