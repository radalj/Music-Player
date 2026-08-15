from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from .models import SubscriptionPlan, UserSubscription


class SubscriptionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.free_plan = SubscriptionPlan.objects.create(name='free', price=0)
        self.silver_plan = SubscriptionPlan.objects.create(name='silver', price=9.99)
        self.gold_plan = SubscriptionPlan.objects.create(name='gold', price=19.99)

        self.user = User.objects.create_user(
            username='subuser', email='subuser@example.com', password='password123', display_name='Sub User'
        )
        self.admin = User.objects.create_user(
            username='adminuser', email='adminuser@example.com', password='password123', display_name='Admin', role='admin'
        )

    def test_list_plans(self):
        response = self.client.get('/api/subscriptions/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)

    def test_get_my_subscription(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/subscriptions/my-subscription/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_update_subscription_price(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/subscriptions/plans/{self.silver_plan.id}/', {'price': 12.99})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.silver_plan.refresh_from_db()
        self.assertEqual(float(self.silver_plan.price), 12.99)
