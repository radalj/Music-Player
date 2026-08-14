from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from apps.core.validators import validate_image_file


class User(AbstractUser):
    ROLE_CHOICES = (
        ('listener', 'Listener'),
        ('artist', 'Artist'),
        ('supporter', 'Supporter'),
        ('admin', 'Admin'),
    )

    # فیلدهای اصلی
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='listener')
    
    # اطلاعات شخصی
    display_name = models.CharField(max_length=100)
    profile_image = models.ImageField(
        upload_to='profiles/',
        validators=[validate_image_file],
        null=True, blank=True
    )
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)      # برای هنرمندان
    
    # آمار و روابط
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following_users', blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='follower_users', blank=True)
    daily_streams = models.IntegerField(default=0)
    
    # فیلدهای مخصوص هنرمند
    verified = models.BooleanField(default=False)
    awaiting_approval = models.BooleanField(default=False)
    portfolio = models.TextField(null=True, blank=True)

    # برای فرمان createsuperuser
    REQUIRED_FIELDS = ['email', 'display_name']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def get_subscription(self):
        """دریافت اشتراک فعال کاربر"""
        if hasattr(self, 'subscription') and self.subscription.is_active:
            return self.subscription
        return None

    def follow(self, user):
        """دنبال کردن یک کاربر دیگر"""
        if user == self:
            raise ValueError("You cannot follow yourself.")
        self.following.add(user)

    def unfollow(self, user):
        """لغو دنبال کردن یک کاربر"""
        self.following.remove(user)

    def is_following(self, user):
        """بررسی آیا کاربر مورد نظر را دنبال می‌کند؟"""
        return self.following.filter(id=user.id).exists()

    @property
    def followers_count(self):
        return self.followers.count()

    @property
    def following_count(self):
        return self.following.count()


class UserSettings(models.Model):
    """تنظیمات کاربر (هماهنگ‌شده بین دستگاه‌ها)"""
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('fa', 'Persian'),
    )
    THEME_CHOICES = (
        ('dark', 'Dark'),
        ('light', 'Light'),
    )
    QUALITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # اعلان‌ها
    notifications_enabled = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    
    # نمایش و زبان
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='dark')
    
    # پخش‌کننده
    default_quality = models.CharField(max_length=10, choices=QUALITY_CHOICES, default='medium')
    crossfade_enabled = models.BooleanField(default=False)
    autoplay = models.BooleanField(default=True)
    explicit_content = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.username}"