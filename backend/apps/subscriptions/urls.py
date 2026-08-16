from django.urls import path
from .views import (
    SubscriptionPlanListView, AdminUpdatePlanPriceView, AdminBulkUpdatePlanPricesView,
    MySubscriptionView, PurchaseSubscriptionView
)

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='plan-list'),
    path('plans/prices/', AdminBulkUpdatePlanPricesView.as_view(), name='admin-plan-prices'),
    path('plans/<int:pk>/', AdminUpdatePlanPriceView.as_view(), name='admin-plan-detail'),
    path('my-subscription/', MySubscriptionView.as_view(), name='my-subscription'),
    path('purchase/', PurchaseSubscriptionView.as_view(), name='purchase'),
]