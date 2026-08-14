from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription
from apps.users.serializers import UserSerializer

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.all(), source='plan', write_only=True
    )
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user', 'plan', 'plan_id', 'start_date', 'expiry_date', 'is_active']
        read_only_fields = ['id', 'user', 'start_date', 'expiry_date', 'is_active']