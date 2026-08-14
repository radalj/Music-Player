from django.db import models
from django.contrib.auth import get_user_model
from apps.subscriptions.models import SubscriptionPlan

User = get_user_model()

class Transaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'در انتظار پرداخت'),
        ('success', 'پرداخت موفق'),
        ('failed', 'پرداخت ناموفق'),
        ('canceled', 'لغو شده'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    duration_months = models.IntegerField()  # 1, 3, 6, 12
    
    # اطلاعات تراکنش
    authority = models.CharField(max_length=100, blank=True, null=True)  # کد پیگیری زرین‌پال
    ref_id = models.CharField(max_length=100, blank=True, null=True)     # شماره مرجع
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} - {self.status}"