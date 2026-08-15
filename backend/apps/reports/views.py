from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.music.models import Track, Album
from apps.playlists.models import Playlist
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.payments.models import Transaction
from apps.reports.models import FinancialRecord
from apps.notifications.models import Notification
from apps.core.permissions import IsAdminOrSupporter, IsAdminUser


class DashboardSummaryView(APIView):
    """
    Summary dashboard metrics for Admin and Supporters
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupporter]

    def get(self, request):
        user_stats = User.objects.values('role').annotate(count=Count('id'))
        subscription_stats = UserSubscription.objects.filter(
            is_active=True
        ).values('plan__name').annotate(count=Count('id'))

        total_tracks = Track.objects.count()
        total_albums = Album.objects.count()
        total_playlists = Playlist.objects.count()

        total_artists = User.objects.filter(role='artist').count()
        verified_artists = User.objects.filter(role='artist', verified=True).count()
        pending_artists = User.objects.filter(role='artist', awaiting_approval=True).count()

        total_revenue = Transaction.objects.filter(
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'users': {
                'total': User.objects.count(),
                'by_role': user_stats,
                'by_subscription': subscription_stats,
            },
            'content': {
                'tracks': total_tracks,
                'albums': total_albums,
                'playlists': total_playlists,
            },
            'artists': {
                'total': total_artists,
                'verified': verified_artists,
                'pending': pending_artists,
            },
            'revenue': {
                'total': float(total_revenue),
            }
        })


class MonthlyFinancialReportView(APIView):
    """
    Monthly financial calculation report for artists
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        month_str = now.strftime('%Y-%m')
        
        artist_stats = []
        artists = User.objects.filter(role='artist', verified=True)
        
        for artist in artists:
            unique_listeners = Track.objects.filter(
                artist=artist
            ).aggregate(
                total_listeners=Sum('listeners')
            )['total_listeners'] or 0

            total_streams = Track.objects.filter(
                artist=artist
            ).aggregate(
                total_streams=Sum('streams')
            )['total_streams'] or 0

            payout = (total_streams / 1000) * 0.5

            record, _ = FinancialRecord.objects.get_or_create(
                artist=artist,
                month=month_str,
                defaults={'total_streams': total_streams, 'payout_amount': round(payout, 2), 'status': 'pending'}
            )

            artist_stats.append({
                'artist_id': artist.id,
                'artist_name': artist.display_name,
                'unique_listeners': unique_listeners,
                'total_streams': total_streams,
                'calculated_payout': float(record.payout_amount),
                'status': record.status
            })

        artist_stats.sort(key=lambda x: x['total_streams'], reverse=True)

        return Response({
            'month': month_str,
            'artists': artist_stats,
            'summary': {
                'total_artists': len(artist_stats),
                'total_streams': sum(a['total_streams'] for a in artist_stats),
                'total_payout': sum(a['calculated_payout'] for a in artist_stats),
            }
        })


class ConfirmSettlementView(APIView):
    """
    Admin action to confirm financial settlement for an artist
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, artist_id):
        try:
            artist = User.objects.get(pk=artist_id, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        month_str = now.strftime('%Y-%m')

        record, created = FinancialRecord.objects.get_or_create(
            artist=artist,
            month=month_str,
            defaults={'payout_amount': 0.00}
        )
        record.status = 'settled'
        record.settled_at = now
        record.save()

        # Send notification to artist
        Notification.objects.create(
            recipient=artist,
            title="Monthly Financial Settlement Completed",
            message=f"Your monthly payout of ${record.payout_amount} has been marked as settled.",
            link="/artist-dashboard",
            notification_type="financial_calculation"
        )

        return Response({
            'message': f'Financial settlement for {artist.display_name} confirmed.',
            'status': record.status,
            'settled_at': record.settled_at
        })


class ArtistPerformanceView(APIView):
    """
    Performance statistics for a specific artist
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, artist_id):
        if request.user.role not in ['admin', 'supporter'] and request.user.id != artist_id:
            return Response(
                {'error': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            artist = User.objects.get(id=artist_id, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'Artist not found.'}, status=404)

        tracks = Track.objects.filter(artist=artist)
        total_tracks = tracks.count()
        total_listeners = tracks.aggregate(total=Sum('listeners'))['total'] or 0
        total_streams = tracks.aggregate(total=Sum('streams'))['total'] or 0

        estimated_revenue = (total_streams / 1000) * 0.5

        top_tracks = tracks.order_by('-listeners')[:10].values(
            'id', 'title', 'listeners', 'streams'
        )

        return Response({
            'artist': {
                'id': artist.id,
                'name': artist.display_name,
                'bio': artist.bio,
                'verified': artist.verified,
            },
            'statistics': {
                'total_tracks': total_tracks,
                'total_listeners': total_listeners,
                'total_streams': total_streams,
                'estimated_revenue': round(estimated_revenue, 2),
            },
            'top_tracks': list(top_tracks),
        })


class SubscriptionRevenueView(APIView):
    """
    Subscription revenue report for Admin
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_revenue = Transaction.objects.filter(
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Transaction.objects.filter(
            status='success',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        subscription_distribution = UserSubscription.objects.filter(
            is_active=True
        ).values('plan__name').annotate(count=Count('id'))

        monthly_purchases = Transaction.objects.filter(
            status='success',
            created_at__gte=month_start
        ).count()

        return Response({
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'monthly_purchases': monthly_purchases,
            'subscription_distribution': list(subscription_distribution),
        })