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
from apps.core.permissions import IsAdminOrSupporter, IsAdminUser


class DashboardSummaryView(APIView):
    """
    خلاصه آمار کلی سامانه (فقط برای ادمین و پشتیبان)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupporter]

    def get(self, request):
        # تعداد کل کاربران بر اساس نقش
        user_stats = User.objects.values('role').annotate(count=Count('id'))
        
        # تعداد کاربران بر اساس نوع اشتراک
        subscription_stats = UserSubscription.objects.filter(
            is_active=True
        ).values('plan__name').annotate(count=Count('id'))
        
        # آمار محتوا
        total_tracks = Track.objects.count()
        total_albums = Album.objects.count()
        total_playlists = Playlist.objects.count()
        
        # آمار هنرمندان
        total_artists = User.objects.filter(role='artist').count()
        verified_artists = User.objects.filter(role='artist', verified=True).count()
        pending_artists = User.objects.filter(role='artist', verified=False).count()
        
        # درآمد کل از اشتراک‌ها
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
    گزارش مالی ماهانه هنرمندان (فقط ادمین)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        # دریافت ماه جاری
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # آمار هنرمندان در ماه جاری
        artist_stats = []
        artists = User.objects.filter(role='artist', verified=True)
        
        for artist in artists:
            # تعداد شنوندگان منحصربه‌فرد این هنرمند در ماه جاری
            # (شبیه‌سازی با داده‌های موجود - در واقعیت از Track.listeners استفاده می‌شود)
            unique_listeners = Track.objects.filter(
                artist=artist,
                created_at__gte=month_start
            ).aggregate(
                total_listeners=Sum('listeners')
            )['total_listeners'] or 0
            
            # تعداد استریم‌های هنرمند در ماه جاری
            total_streams = Track.objects.filter(
                artist=artist,
                created_at__gte=month_start
            ).aggregate(
                total_streams=Sum('streams')
            )['total_streams'] or 0
            
            # محاسبه پاداش (فرمول نمونه: هر ۱۰۰۰ استریم = ۱ دلار)
            payout = (total_streams / 1000) * 0.5  # 0.5 دلار به ازای هر ۱۰۰۰ استریم
            
            # وضعیت پرداخت (از مدل FinancialRecord یا شبیه‌سازی)
            # در فاز دوم، از یک مدل جداگانه برای FinancialRecord استفاده می‌شود
            
            artist_stats.append({
                'artist_id': artist.id,
                'artist_name': artist.display_name,
                'unique_listeners': unique_listeners,
                'total_streams': total_streams,
                'calculated_payout': round(payout, 2),
                'status': 'pending'  # یا 'settled'
            })
        
        # مرتب‌سازی بر اساس بیشترین استریم
        artist_stats.sort(key=lambda x: x['total_streams'], reverse=True)
        
        return Response({
            'month': month_start.strftime('%Y-%m'),
            'artists': artist_stats,
            'summary': {
                'total_artists': len(artist_stats),
                'total_streams': sum(a['total_streams'] for a in artist_stats),
                'total_payout': sum(a['calculated_payout'] for a in artist_stats),
            }
        })


class ArtistPerformanceView(APIView):
    """
    گزارش عملکرد یک هنرمند خاص (برای خود هنرمند یا ادمین)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, artist_id):
        # فقط خود هنرمند یا ادمین/پشتیبان می‌تواند ببیند
        if request.user.role not in ['admin', 'supporter'] and request.user.id != artist_id:
            return Response(
                {'error': 'شما دسترسی به این اطلاعات را ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            artist = User.objects.get(id=artist_id, role='artist')
        except User.DoesNotExist:
            return Response({'error': 'هنرمند یافت نشد.'}, status=404)
        
        # آمار کلی
        tracks = Track.objects.filter(artist=artist)
        total_tracks = tracks.count()
        total_listeners = tracks.aggregate(total=Sum('listeners'))['total'] or 0
        total_streams = tracks.aggregate(total=Sum('streams'))['total'] or 0
        
        # محاسبه درآمد تخمینی (در فاز دوم با فرمول دقیق)
        estimated_revenue = (total_streams / 1000) * 0.5
        
        # ۱۰ آهنگ محبوب هنرمند
        top_tracks = tracks.order_by('-listeners')[:10].values(
            'id', 'title', 'listeners', 'streams'
        )
        
        # آمار ماهانه (۶ ماه اخیر)
        monthly_stats = []
        now = timezone.now()
        for i in range(6):
            month = now.replace(day=1) - timedelta(days=30 * i)
            month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            monthly_streams = Track.objects.filter(
                artist=artist,
                created_at__range=[month_start, month_end]
            ).aggregate(total=Sum('streams'))['total'] or 0
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'streams': monthly_streams,
            })
        
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
            'monthly_stats': monthly_stats,
        })


class SubscriptionRevenueView(APIView):
    """
    گزارش درآمد حاصل از اشتراک‌ها (فقط ادمین)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        # درآمد کل
        total_revenue = Transaction.objects.filter(
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # درآمد ماه جاری
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Transaction.objects.filter(
            status='success',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # توزیع کاربران بر اساس اشتراک
        subscription_distribution = UserSubscription.objects.filter(
            is_active=True
        ).values('plan__name').annotate(count=Count('id'))
        
        # تعداد خریدهای اشتراک در ماه جاری
        monthly_purchases = Transaction.objects.filter(
            status='success',
            created_at__gte=month_start
        ).count()
        
        return Response({
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'monthly_purchases': monthly_purchases,
            'subscription_distribution': subscription_distribution,
        })