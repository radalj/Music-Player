from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'title', 'message', 'link', 'is_read', 'notification_type', 'created_at']
        read_only_fields = ['recipient', 'created_at']
