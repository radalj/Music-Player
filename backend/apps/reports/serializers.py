from rest_framework import serializers

class DashboardSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_tracks = serializers.IntegerField()
    total_albums = serializers.IntegerField()
    total_artists = serializers.IntegerField()
    total_revenue = serializers.FloatField()