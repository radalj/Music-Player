from django.urls import path
from .views import SubscriptionPlanListView, MySubscriptionView, PurchaseSubscriptionView

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='plan-list'),
    path('my-subscription/', MySubscriptionView.as_view(), name='my-subscription'),
    path('purchase/', PurchaseSubscriptionView.as_view(), name='purchase'),
]