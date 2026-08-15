from django.db import models
from apps.users.models import User


class Notification(models.Model):
    TYPE_CHOICES = (
        ('subscription_expiring', 'Subscription Expiring'),
        ('new_release', 'New Release'),
        ('artist_approval', 'Artist Approval'),
        ('financial_calculation', 'Financial Calculation'),
        ('support_ticket', 'Support Ticket'),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='new_release')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.title}"
