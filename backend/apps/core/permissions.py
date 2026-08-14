from rest_framework import permissions
from apps.subscriptions.models import SubscriptionPlan

class IsSelfOrAdmin(permissions.BasePermission):
    """فقط خود کاربر یا ادمین اجازه دسترسی دارند"""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.role == 'admin'
        if hasattr(obj, 'id'):
            return obj == request.user or request.user.role == 'admin'
        return False

class IsArtistOrReadOnly(permissions.BasePermission):
    """فقط هنرمند یا ادمین اجازه ایجاد/ویرایش اثر دارند"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['artist', 'admin']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'artist'):
            return obj.artist == request.user or request.user.role == 'admin'
        return request.user.role == 'admin'

class IsAdminOrSupporter(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'supporter']

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class HasPlaylistLimit(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        user = request.user
        if not user.is_authenticated:
            return False
        try:
            subscription = user.subscription
            plan = subscription.plan
        except:
            plan = SubscriptionPlan.objects.get(name='free')
        max_playlists = plan.max_playlists
        if max_playlists is None:
            return True
        from apps.playlists.models import Playlist
        current_count = Playlist.objects.filter(creator=user).count()
        if current_count >= max_playlists:
            raise PermissionError(f"You have reached the maximum of {max_playlists} playlists for your plan.")
        return True

class HasGoldAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role == 'admin':
            return True
        try:
            subscription = request.user.subscription
            return subscription.plan and subscription.plan.name == 'gold'
        except:
            return False