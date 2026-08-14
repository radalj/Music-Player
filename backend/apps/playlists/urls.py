from django.urls import path
from .views import PlaylistListCreateView, PlaylistRetrieveUpdateDestroyView

urlpatterns = [
    path('', PlaylistListCreateView.as_view(), name='playlist-list'),
    path('<int:pk>/', PlaylistRetrieveUpdateDestroyView.as_view(), name='playlist-detail'),
]