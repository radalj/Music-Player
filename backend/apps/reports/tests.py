from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.subscriptions.models import SubscriptionPlan


class PaymentsAndReportsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.silver_plan = SubscriptionPlan.objects.create(name='silver', price=10)
        self.user = User.objects.create_user(
            username='payuser', email='payuser@example.com', password='password123', display_name='Pay User'
        )
        self.admin = User.objects.create_user(
            username='reportadmin', email='reportadmin@example.com', password='password123', display_name='Report Admin', role='admin'
        )
        self.artist = User.objects.create_user(
            username='reportartist', email='reportartist@example.com', password='password123', display_name='Report Artist', role='artist', verified=True
        )

    def test_mock_payment_purchase(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/payments/mock/', {
            'plan_id': self.silver_plan.id,
            'duration_months': 1
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_dashboard_summary_and_monthly_report(self):
        self.client.force_authenticate(user=self.admin)
        res_summary = self.client.get('/api/reports/dashboard/summary/')
        self.assertEqual(res_summary.status_code, status.HTTP_200_OK)

        res_monthly = self.client.get('/api/reports/financial/monthly/')
        self.assertEqual(res_monthly.status_code, status.HTTP_200_OK)

    def test_confirm_settlement_for_artist(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/reports/financial/settle/{self.artist.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'settled')
