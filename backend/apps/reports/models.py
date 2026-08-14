# apps/reports/models.py (یا apps/financial/models.py)
from django.db import models
from apps.users.models import User

class FinancialRecord(models.Model):
    artist = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='financial_records'  # ← unique name
    )
    month = models.CharField(max_length=7)  # YYYY-MM
    total_streams = models.IntegerField(default=0)
    payout_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('settled', 'Settled')],
        default='pending'
    )
    settled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artist.display_name} - {self.month} - {self.status}"