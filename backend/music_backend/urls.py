from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/music/', include('apps.music.urls')),
    path('api/playlists/', include('apps.playlists.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
] +  static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)