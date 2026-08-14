from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'max_playlists', 'max_streams_per_day', 'early_access']
    list_editable = ['price']  # مدیر می‌تواند مستقیم قیمت را از لیست تغییر دهد!
    search_fields = ['name']

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'expiry_date', 'is_active']
    list_filter = ['plan', 'is_active']
    search_fields = ['user__username', 'user__email']