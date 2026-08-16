from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import User, UserSettings
from .serializers import UserSerializer, UserSettingsSerializer
from apps.core.permissions import IsSelfOrAdmin
from apps.notifications.models import Notification


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


class ProfileView(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # Enforce profile photo upload restriction for base/free subscription
        if 'profile_image' in request.FILES or ('profile_image' in request.data and request.data['profile_image']):
            sub = user.get_subscription()
            sub_tier = sub.plan.name if (sub and sub.plan) else 'free'
            if sub_tier == 'free':
                return Response(
                    {'error': 'Base/Free subscription tier does not allow profile photo uploads.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.follow(target_user)
        return Response({'message': f'You are now following {target_user.display_name}.'})

    def delete(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        request.user.unfollow(target_user)
        return Response({'message': f'You unfollowed {target_user.display_name}.'})


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        data = UserSerializer(user).data
        data['is_following'] = request.user.is_following(user)
        return Response(data)


class FollowStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        target = get_object_or_404(User, pk=pk)
        return Response({
            'is_following': request.user.is_following(target),
            'followers_count': target.followers.count(),
            'following_count': target.following.count(),
        })


class PendingArtistsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['supporter', 'admin'] and not request.user.is_staff:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        pending = User.objects.filter(role='artist', awaiting_approval=True)
        return Response(UserSerializer(pending, many=True).data)


class ApproveArtistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ['supporter', 'admin'] and not request.user.is_staff:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            artist = User.objects.get(pk=pk, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)

        artist.verified = True
        artist.awaiting_approval = False
        artist.save()

        # Send Notification to artist
        Notification.objects.create(
            recipient=artist,
            title="Artist Account Approved",
            message="Your artist account has been approved by the support team!",
            link="/artist-dashboard",
            notification_type="artist_approval"
        )

        return Response({'message': f'Artist {artist.display_name} approved successfully.'})


class RejectArtistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ['supporter', 'admin'] and not request.user.is_staff:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            artist = User.objects.get(pk=pk, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Requirements not met.')
        artist.verified = False
        artist.awaiting_approval = False
        artist.save()

        # Send Notification to artist
        Notification.objects.create(
            recipient=artist,
            title="Artist Account Rejected",
            message=f"Your artist application was rejected. Reason: {reason}",
            link="/pending-approval",
            notification_type="artist_approval"
        )

        return Response({'message': f'Artist {artist.display_name} rejected.'})


class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings_obj, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj