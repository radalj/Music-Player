from rest_framework import serializers
from .models import User, UserSettings


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'password',
            'role', 'profile_image', 'bio', 'verified',
            'followers_count', 'following_count'
        ]
        read_only_fields = ['id', 'followers_count', 'following_count']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'id', 'user', 'notifications_enabled', 'sound_enabled',
            'language', 'theme', 'default_quality', 'crossfade_enabled',
            'autoplay', 'explicit_content', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'updated_at']