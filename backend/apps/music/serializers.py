from rest_framework import serializers
from .models import Track, Album
from apps.users.serializers import UserSerializer


class TrackSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)

    class Meta:
        model = Track
        fields = [
            'id', 'title', 'artist', 'audio_file', 'cover_image', 'lyrics',
            'duration', 'genre', 'release_year', 'is_single',
            'listeners', 'streams', 'created_at',
        ]
        read_only_fields = ['id', 'artist', 'listeners', 'streams', 'created_at']
        extra_kwargs = {
            'duration': {'required': False},
            'lyrics': {'required': False, 'allow_blank': True, 'allow_null': True},
            'audio_file': {'required': False},
            'cover_image': {'required': False, 'allow_null': True},
            'genre': {'required': False, 'allow_blank': True, 'allow_null': True},
            'release_year': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        if self.instance is None and not attrs.get('audio_file'):
            raise serializers.ValidationError({'audio_file': 'This field is required.'})
        return attrs

    def create(self, validated_data):
        validated_data.setdefault('duration', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get('audio_file'):
            validated_data.pop('audio_file', None)
        return super().update(instance, validated_data)


class AlbumSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    tracks = TrackSerializer(many=True, read_only=True)
    track_ids = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='tracks',
    )

    class Meta:
        model = Album
        fields = [
            'id', 'title', 'artist', 'cover_image', 'tracks', 'track_ids',
            'release_date', 'genre', 'created_at',
        ]
        read_only_fields = ['id', 'artist', 'created_at']
        extra_kwargs = {
            'cover_image': {'required': False, 'allow_null': True},
            'genre': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
