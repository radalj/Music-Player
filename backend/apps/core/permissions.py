from rest_framework import permissions
from apps.subscriptions.models import SubscriptionPlan


class IsSelfOrAdmin(permissions.BasePermission):
    """Only user themselves or admin can access"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user


class IsArtistOrReadOnly(permissions.BasePermission):
    """Only artist or admin can create/modify tracks and albums"""
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

        plan = None
        if hasattr(user, 'subscription') and user.subscription and user.subscription.plan:
            plan = user.subscription.plan
        else:
            plan = SubscriptionPlan.objects.filter(name='free').first()

        max_playlists = plan.max_playlists if plan else 6
        if max_playlists is None:
            return True

        from apps.playlists.models import Playlist
        current_count = Playlist.objects.filter(creator=user).count()
        if current_count >= max_playlists:
            plan_title = plan.get_name_display() if plan else 'Free'
            self.message = f"You have reached the maximum of {max_playlists} playlists for your {plan_title} subscription plan."
            return False
        return True


class HasGoldAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role == 'admin':
            return True
        try:
            subscription = request.user.subscription
            return subscription.plan and subscription.plan.name == 'gold'
        except Exception:
            return False