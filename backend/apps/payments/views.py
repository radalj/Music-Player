import logging
import json
import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from datetime import timedelta
from .models import Transaction
from .serializers import TransactionSerializer
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

logger = logging.getLogger(__name__)


class RequestPaymentView(APIView):
    """
    مرحله ۱: درخواست پرداخت از زرین‌پال (نسخه v4)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        duration_months = request.data.get('duration_months', 1)

        # اعتبارسنجی
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        if duration_months not in [1, 3, 6, 12]:
            return Response(
                {'error': 'Invalid duration. Choose 1, 3, 6, or 12.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # محاسبه مبلغ به ریال (قیمت پلن به تومان/دلار * ۱۰)
        amount = int(plan.price * duration_months * 100000)
        logger.info(f"Amount in Rials: {amount}")

        # اگر مبلغ صفر بود (برای تست)، یک مقدار پیش‌فرض قرار دهید
        if amount < 10000:
            amount = 10000
            logger.warning("Amount was 0, set to 10000 for testing.")

        # ذخیره تراکنش در دیتابیس (وضعیت pending)
        transaction = Transaction.objects.create(
            user=request.user,
            plan=plan,
            amount=plan.price * duration_months,
            duration_months=duration_months,
            status='pending'
        )

        # ✅ داده‌های درخواست با کلیدهای کوچک (طبق مستندات v4)
        data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,  # 36 کاراکتر
            "amount": amount,
            "callback_url": settings.ZARINPAL_CALLBACK_URL,
            "description": f'خرید اشتراک {plan.get_name_display()} - {duration_months} ماهه',
            "metadata": {
                "user_id": str(request.user.id),
                "transaction_id": str(transaction.id)
            }
        }

        # انتخاب آدرس Sandbox یا Production
        if settings.ZARINPAL_SANDBOX:
            url = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
        else:
            url = 'https://api.zarinpal.com/pg/v4/payment/request.json'

        headers = {'Content-Type': 'application/json'}

        try:
            # ارسال درخواست به زرین‌پال
            response = requests.post(url, data=json.dumps(data), headers=headers, timeout=30)

            # لاگ‌گیری برای اشکال‌زدایی
            logger.info(f"Zarinpal status: {response.status_code}")
            logger.info(f"Zarinpal response: {response.text}")

            if response.status_code == 200:
                result = response.json()
                # در نسخه v4، پاسخ در کلید `data` قرار دارد
                if result.get('data', {}).get('code') == 100:
                    authority = result['data']['authority']
                    transaction.authority = authority
                    transaction.save()

                    # لینک پرداخت
                    if settings.ZARINPAL_SANDBOX:
                        payment_url = f'https://sandbox.zarinpal.com/pg/StartPay/{authority}'
                    else:
                        payment_url = f'https://www.zarinpal.com/pg/StartPay/{authority}'

                    return Response({
                        'payment_url': payment_url,
                        'authority': authority,
                        'transaction_id': transaction.id
                    })
                else:
                    # خطای زرین‌پال با کد مشخص
                    error_code = result.get('data', {}).get('code')
                    logger.error(f"Zarinpal error code: {error_code}")
                    return Response({
                        'error': f'خطای زرین‌پال: {error_code}',
                        'details': result
                    }, status=400)
            else:
                logger.error(f"HTTP error from Zarinpal: {response.status_code}")
                return Response(
                    {'error': f'خطا در ارتباط با زرین‌پال: {response.status_code}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except requests.exceptions.Timeout:
            logger.error("Zarinpal request timeout")
            return Response({'error': 'ارسال درخواست به زرین‌پال با timeout مواجه شد'}, status=504)
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error to Zarinpal: {e}")
            return Response({'error': 'اتصال به زرین‌پال برقرار نشد'}, status=503)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({'error': f'خطای ناشناخته: {str(e)}'}, status=500)


class VerifyPaymentView(APIView):
    """
    مرحله ۲: تایید پرداخت (بازگشت از درگاه) - نسخه v4
    """
    permission_classes = [permissions.AllowAny]  # زرین‌پال به این آدرس درخواست می‌دهد

    def get(self, request):
        authority = request.GET.get('Authority')
        status_param = request.GET.get('Status')

        # اگر کاربر پرداخت را لغو کرده باشد
        if status_param == 'NOK':
            try:
                transaction = Transaction.objects.get(authority=authority)
                transaction.status = 'canceled'
                transaction.save()
            except Transaction.DoesNotExist:
                pass
            return redirect(f'http://localhost:3000/payment-result?status=canceled')

        try:
            transaction = Transaction.objects.get(authority=authority)
        except Transaction.DoesNotExist:
            return Response({'error': 'تراکنش یافت نشد'}, status=404)

        # تایید پرداخت در زرین‌پال
        data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": int(transaction.amount * 10),  # ریال
            "authority": authority,
        }

        if settings.ZARINPAL_SANDBOX:
            url = 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
        else:
            url = 'https://api.zarinpal.com/pg/v4/payment/verify.json'

        try:
            response = requests.post(url, data=json.dumps(data), headers={'Content-Type': 'application/json'}, timeout=30)
            logger.info(f"Verify response: {response.text}")

            result = response.json()

            # در نسخه v4، پاسخ در کلید `data` قرار دارد
            if result.get('data', {}).get('code') == 100:
                # پرداخت موفق
                ref_id = result['data'].get('ref_id')
                transaction.status = 'success'
                transaction.ref_id = ref_id
                transaction.save()

                # فعال‌سازی اشتراک کاربر
                subscription, created = UserSubscription.objects.get_or_create(user=transaction.user)

                if subscription.expiry_date and subscription.expiry_date > timezone.now():
                    new_expiry = subscription.expiry_date + timedelta(days=30 * transaction.duration_months)
                else:
                    new_expiry = timezone.now() + timedelta(days=30 * transaction.duration_months)

                subscription.plan = transaction.plan
                subscription.expiry_date = new_expiry
                subscription.is_active = True
                subscription.save()

                return redirect(f'http://localhost:3000/payment-result?status=success&ref_id={ref_id}')
            else:
                # پرداخت ناموفق
                transaction.status = 'failed'
                transaction.save()
                return redirect(f'http://localhost:3000/payment-result?status=failed')

        except Exception as e:
            logger.error(f"Verify error: {e}")
            return Response({'error': f'خطا در تایید پرداخت: {str(e)}'}, status=500)


# ============================================
# Mock Payment View (روش جایگزین برای تست)
# ============================================
class MockPaymentView(APIView):
    """
    شبیه‌سازی پرداخت (بدون نیاز به درگاه واقعی)
    برای مواقعی که زرین‌پال در دسترس نیست یا مشکل دارد.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        try:
            duration_months = int(request.data.get('duration_months', 1))
        except (ValueError, TypeError):
            duration_months = 1

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

        if duration_months not in [1, 3, 6, 12]:
            return Response(
                {'error': 'Invalid duration. Choose 1, 3, 6, or 12.'},
                status=400
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

        return Response({
            'message': '✅ اشتراک با موفقیت فعال شد (شبیه‌سازی)',
            'plan': plan.name,
            'expiry_date': new_expiry
        }, status=200)