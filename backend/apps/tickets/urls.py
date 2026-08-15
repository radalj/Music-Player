from rest_framework.routers import DefaultRouter
from .views import SupportTicketViewSet

router = DefaultRouter()
router.register(r'tickets', SupportTicketViewSet, basename='ticket')
router.register(r'', SupportTicketViewSet, basename='ticket-root')

urlpatterns = router.urls
