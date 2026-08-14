from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer

class SubscriptionPlanListView(generics.ListAPIView):
    """نمایش لیست همه پلن‌های اشتراک (بدون نیاز به احراز هویت)"""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]  # عمومی

class MySubscriptionView(generics.RetrieveAPIView):
    """دریافت اشتراک فعلی کاربر (نیاز به احراز هویت)"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]  # ✅ فقط کاربران وارد شده

    def get_object(self):
        subscription, created = UserSubscription.objects.get_or_create(
            user=self.request.user,
            defaults={
                'plan': SubscriptionPlan.objects.get(name='free'),
                'expiry_date': timezone.now() + timedelta(days=365*10)
            }
        )
        return subscription

class PurchaseSubscriptionView(APIView):
    """خرید یا ارتقا اشتراک (نیاز به احراز هویت)"""
    permission_classes = [permissions.IsAuthenticated]  # ✅ فقط کاربران وارد شده

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

        # شبیه‌سازی پرداخت موفق
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