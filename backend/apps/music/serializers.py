from rest_framework import serializers
from .models import Track, Album
from apps.users.serializers import UserSerializer
from apps.users.models import User

class TrackSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    artist_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='artist'), source='artist', write_only=True
    )

    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = ['id', 'listeners', 'streams', 'created_at']

class AlbumSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    artist_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='artist'), source='artist', write_only=True
    )
    tracks = TrackSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = '__all__'
        read_only_fields = ['id', 'created_at']