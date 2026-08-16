from decimal import Decimal, InvalidOperation
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer
from apps.core.permissions import IsAdminUser


PLAN_DEFAULTS = {
    'free': {
        'price': Decimal('0'),
        'max_playlists': 6,
        'max_streams_per_day': 60,
        'can_upload_profile': False,
        'can_download': False,
        'early_access': False,
        'show_analytics': False,
    },
    'silver': {
        'price': Decimal('9.99'),
        'max_playlists': 100,
        'max_streams_per_day': 100,
        'can_upload_profile': True,
        'can_download': True,
        'early_access': False,
        'show_analytics': True,
    },
    'gold': {
        'price': Decimal('19.99'),
        'max_playlists': None,
        'max_streams_per_day': None,
        'can_upload_profile': True,
        'can_download': True,
        'early_access': True,
        'show_analytics': True,
    },
}


def ensure_plan(name):
    defaults = PLAN_DEFAULTS.get(name, {'price': Decimal('0')})
    plan, _ = SubscriptionPlan.objects.get_or_create(name=name, defaults=defaults)
    return plan


class SubscriptionPlanListView(generics.ListAPIView):
    """List all subscription plans"""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class AdminUpdatePlanPriceView(generics.RetrieveUpdateAPIView):
    """Admin-only endpoint to update subscription prices dynamically in DB"""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class AdminBulkUpdatePlanPricesView(APIView):
    """Update shared silver/gold catalog prices so every user sees the new amounts."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def patch(self, request):
        payload = request.data or {}
        updated = []
        for name in ('silver', 'gold'):
            if name not in payload:
                continue
            try:
                price = Decimal(str(payload[name]))
            except (InvalidOperation, TypeError, ValueError):
                return Response(
                    {'error': f'Invalid price for {name}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if price < 0:
                return Response(
                    {'error': f'Price for {name} cannot be negative.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            plan = ensure_plan(name)
            plan.price = price
            plan.save(update_fields=['price'])
            updated.append(plan)

        if not updated:
            return Response({'error': 'Provide silver and/or gold prices.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Subscription prices updated for all users.',
            'plans': SubscriptionPlanSerializer(SubscriptionPlan.objects.all(), many=True).data,
        })


class MySubscriptionView(generics.RetrieveAPIView):
    """Get active user subscription"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        free_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='free',
            defaults={
                'price': 0,
                'max_playlists': 6,
                'max_streams_per_day': 60,
                'can_upload_profile': False,
                'can_download': False,
                'early_access': False,
                'show_analytics': False
            }
        )
        subscription, created = UserSubscription.objects.get_or_create(
            user=self.request.user,
            defaults={
                'plan': free_plan,
                'expiry_date': timezone.now() + timedelta(days=365*10)
            }
        )
        return subscription


class PurchaseSubscriptionView(APIView):
    """Purchase or upgrade subscription"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        duration_months = request.data.get('duration_months', 1)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        if duration_months not in [1, 3, 6, 12]:
            return Response(
                {'error': 'Invalid duration. Choose 1, 3, 6, or 12 months.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscription, created = UserSubscription.objects.get_or_create(user=request.user)

        if subscription.expiry_date and subscription.expiry_date > timezone.now():
            new_expiry = subscription.expiry_date + timedelta(days=30 * duration_months)
        else:
            new_expiry = timezone.now() + timedelta(days=30 * duration_months)

        subscription.plan = plan
        subscription.expiry_date = new_expiry
        subscription.is_active = True
        subscription.save()

        serializer = UserSubscriptionSerializer(subscription)
        return Response({
            'message': f'Successfully upgraded to {plan.get_name_display()} for {duration_months} month(s)',
            'subscription': serializer.data
        }, status=status.HTTP_200_OK)