from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserSettings


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)
        from apps.subscriptions.models import SubscriptionPlan, UserSubscription
        free_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='free',
            defaults={
                'price': 0,
                'max_playlists': 6,
                'max_streams_per_day': 60,
                'can_upload_profile': False,
                'can_download': False,
                'early_access': False,
                'show_analytics': False,
            },
        )
        UserSubscription.objects.get_or_create(
            user=instance,
            defaults={'plan': free_plan, 'is_active': True},
        )