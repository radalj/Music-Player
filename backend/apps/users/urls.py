from django.urls import path
from .views import (
    RegisterView, LoginView, ProfileView, UserSettingsView,
    FollowUserView, PendingArtistsView, ApproveArtistView, RejectArtistView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('settings/', UserSettingsView.as_view(), name='user-settings'),
    path('<int:pk>/follow/', FollowUserView.as_view(), name='follow-user'),
    path('pending-artists/', PendingArtistsView.as_view(), name='pending-artists'),
    path('artists/<int:pk>/approve/', ApproveArtistView.as_view(), name='approve-artist'),
    path('artists/<int:pk>/reject/', RejectArtistView.as_view(), name='reject-artist'),
]