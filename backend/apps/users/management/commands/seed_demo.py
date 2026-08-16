from datetime import date, timedelta
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.users.models import User
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.music.models import Track, Album
from apps.playlists.models import Playlist
from apps.notifications.models import Notification
from apps.tickets.models import SupportTicket, TicketReply


TINY_MP3 = (
    b'\xff\xfb\x90\x00' + b'\x00' * 256
)


def dummy_audio(name='track.mp3'):
    return ContentFile(TINY_MP3, name=name)


class Command(BaseCommand):
    help = 'Seed demo users, plans, tracks, playlists, tickets and notifications'

    def handle(self, *args, **options):
        plans = {
            'free': {'price': 0, 'max_playlists': 6, 'max_streams_per_day': 60,
                     'can_upload_profile': False, 'can_download': False,
                     'early_access': False, 'show_analytics': False},
            'silver': {'price': 9.99, 'max_playlists': 100, 'max_streams_per_day': 100,
                       'can_upload_profile': True, 'can_download': True,
                       'early_access': False, 'show_analytics': False},
            'gold': {'price': 19.99, 'max_playlists': None, 'max_streams_per_day': None,
                     'can_upload_profile': True, 'can_download': True,
                     'early_access': True, 'show_analytics': True},
        }
        plan_objs = {}
        for name, defaults in plans.items():
            plan, _ = SubscriptionPlan.objects.get_or_create(name=name, defaults=defaults)
            for key, value in defaults.items():
                setattr(plan, key, value)
            plan.save()
            plan_objs[name] = plan

        def upsert_user(email, username, display_name, role, plan_name='free', **extra):
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'display_name': display_name,
                    'role': role,
                    **extra,
                },
            )
            if not created:
                user.display_name = display_name
                user.role = role
                for key, value in extra.items():
                    setattr(user, key, value)
            user.set_password('Password123!')
            user.save()
            UserSubscription.objects.update_or_create(
                user=user,
                defaults={
                    'plan': plan_objs[plan_name],
                    'is_active': True,
                    'expiry_date': timezone.now() + timedelta(days=365),
                },
            )
            return user

        listener = upsert_user(
            'listener@music.app', 'listener', 'Free Listener', 'listener', 'free',
            birth_date=date(1998, 4, 12), gender='female',
        )
        gold = upsert_user(
            'gold@music.app', 'golduser', 'Gold Listener', 'listener', 'gold',
            birth_date=date(1994, 8, 21), gender='male',
        )
        artist = upsert_user(
            'artist@music.app', 'midnight', 'The Midnight Waves', 'artist', 'free',
            verified=True, awaiting_approval=False,
            bio='Indie rock band bringing nostalgic vibes with modern twists.',
            portfolio='https://soundcloud.com/midnight-waves',
        )
        pending = upsert_user(
            'pending.artist@music.app', 'pendingartist', 'Neon Pulse', 'artist', 'free',
            verified=False, awaiting_approval=True,
            portfolio='https://soundcloud.com/neon-pulse',
        )
        supporter = upsert_user(
            'support@music.app', 'supporter', 'Support Agent', 'supporter', 'free',
        )
        admin = upsert_user(
            'admin@music.app', 'admin', 'System Admin', 'admin', 'gold',
        )
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        track, _ = Track.objects.get_or_create(
            title='Midnight Dreams',
            artist=artist,
            defaults={
                'duration': 235,
                'lyrics': 'Midnight dreams...\nIn the midnight hour...',
                'genre': 'Indie Rock',
                'release_year': 2024,
                'listeners': 15200,
                'streams': 456000,
                'is_single': False,
            },
        )
        if not track.audio_file:
            track.audio_file.save('midnight-dreams.mp3', dummy_audio('midnight-dreams.mp3'), save=True)

        single, _ = Track.objects.get_or_create(
            title='Ocean Waves',
            artist=artist,
            defaults={
                'duration': 210,
                'lyrics': 'Ocean waves crashing...',
                'genre': 'Indie Rock',
                'release_year': 2024,
                'listeners': 21000,
                'streams': 678000,
                'is_single': True,
            },
        )
        if not single.audio_file:
            single.audio_file.save('ocean-waves.mp3', dummy_audio('ocean-waves.mp3'), save=True)

        album, _ = Album.objects.get_or_create(
            title='Dreamscape',
            artist=artist,
            defaults={
                'release_date': date(2024, 1, 15),
                'genre': 'Indie Rock',
            },
        )
        album.tracks.add(track)

        playlist, _ = Playlist.objects.get_or_create(
            name='Chill Vibes',
            creator=gold,
        )
        playlist.tracks.add(track, single)

        Notification.objects.get_or_create(
            recipient=listener,
            title='Subscription reminder',
            defaults={
                'message': 'Your free plan has a daily stream limit of 60 tracks.',
                'link': '/subscriptions',
                'notification_type': 'subscription_expiring',
                'is_read': False,
            },
        )
        Notification.objects.get_or_create(
            recipient=gold,
            title='New release from The Midnight Waves',
            defaults={
                'message': "The Midnight Waves published a new track: 'Ocean Waves'.",
                'link': f'/player/{single.id}',
                'notification_type': 'new_release',
                'is_read': False,
            },
        )
        Notification.objects.get_or_create(
            recipient=pending,
            title='Artist application received',
            defaults={
                'message': 'Your artist account is awaiting review.',
                'link': '/pending-approval',
                'notification_type': 'artist_approval',
                'is_read': False,
            },
        )
        Notification.objects.get_or_create(
            recipient=admin,
            title='New artist verification request',
            defaults={
                'message': f'{pending.display_name} requested artist verification.',
                'link': '/admin/dashboard',
                'notification_type': 'support_ticket',
                'is_read': False,
            },
        )

        ticket, _ = SupportTicket.objects.get_or_create(
            user=listener,
            subject='Cannot play a track',
            defaults={'status': 'open'},
        )
        TicketReply.objects.get_or_create(
            ticket=ticket,
            sender=listener,
            defaults={'message': 'Playback stops after a few seconds.'},
        )

        gold.follow(artist)

        self.stdout.write(self.style.SUCCESS(
            'Demo data ready. Accounts (password: Password123!):\n'
            '  listener@music.app (free)\n'
            '  gold@music.app (gold)\n'
            '  artist@music.app (verified artist)\n'
            '  pending.artist@music.app (awaiting approval)\n'
            '  support@music.app (supporter)\n'
            '  admin@music.app (admin)'
        ))
