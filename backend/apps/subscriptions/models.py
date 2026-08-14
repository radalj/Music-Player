from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SubscriptionPlan(models.Model):
    """
    مدل اصلی برای تعریف انواع اشتراک (رایگان، نقره‌ای، طلایی)
    قیمت‌ها و ویژگی‌ها در اینجا ذخیره می‌شوند تا مدیر بتواند آن‌ها را تغییر دهد.
    """
    SUBSCRIPTION_TYPES = (
        ('free', 'Free'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
    )
    
    name = models.CharField(max_length=20, choices=SUBSCRIPTION_TYPES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # محدودیت‌ها (null = نامحدود)
    max_playlists = models.IntegerField(null=True, blank=True)
    max_streams_per_day = models.IntegerField(null=True, blank=True)
    
    # قابلیت‌ها
    can_upload_profile = models.BooleanField(default=False)
    can_download = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False)
    show_analytics = models.BooleanField(default=False)
    
    # مدت زمان اعتبار پایه (به ماه)
    default_duration_months = models.IntegerField(default=1, help_text="مدت زمان اعتبار اشتراک بر حسب ماه (پیش‌فرض برای خرید)")
    
    def __str__(self):
        return f"{self.get_name_display()} - ${self.price}"

    class Meta:
        ordering = ['price']


class UserSubscription(models.Model):
    """
    مدل برای نگهداری اشتراک فعلی هر کاربر و تاریخ انقضای آن
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name if self.plan else 'None'}"
    
    def is_expired(self):
        from django.utils import timezone
        if self.expiry_date and self.expiry_date < timezone.now():
            return True
        return False