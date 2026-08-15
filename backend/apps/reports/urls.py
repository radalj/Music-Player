from django.urls import path
from .views import (
    DashboardSummaryView,
    MonthlyFinancialReportView,
    ConfirmSettlementView,
    ArtistPerformanceView,
    SubscriptionRevenueView,
)

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('financial/monthly/', MonthlyFinancialReportView.as_view(), name='monthly-financial'),
    path('financial/settle/<int:artist_id>/', ConfirmSettlementView.as_view(), name='confirm-settlement'),
    path('artist/<int:artist_id>/performance/', ArtistPerformanceView.as_view(), name='artist-performance'),
    path('revenue/subscription/', SubscriptionRevenueView.as_view(), name='subscription-revenue'),
]