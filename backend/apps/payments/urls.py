from django.urls import path
from .views import RequestPaymentView, VerifyPaymentView,MockPaymentView

urlpatterns = [
    path('request/', RequestPaymentView.as_view(), name='request-payment'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('mock/', MockPaymentView.as_view(), name='mock-pay'),
    
]