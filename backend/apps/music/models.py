from django.db import models
from apps.users.models import User
from apps.core.validators import validate_audio_file, validate_image_file, validate_file_size

class Track(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tracks')
    audio_file = models.FileField(upload_to='tracks/', validators=[validate_audio_file, validate_file_size])
    cover_image = models.ImageField(upload_to='covers/', validators=[validate_image_file], null=True, blank=True)
    lyrics = models.TextField(null=True, blank=True)
    duration = models.IntegerField(help_text="مدت زمان بر حسب ثانیه")
    genre = models.CharField(max_length=100, null=True, blank=True)
    release_year = models.IntegerField(null=True, blank=True)
    collaborators = models.ManyToManyField(User, related_name='collaborated_tracks', blank=True)
    is_single = models.BooleanField(default=True)   # True: تک‌آهنگ، False: بخشی از آلبوم
    listeners = models.IntegerField(default=0)
    streams = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='albums')
    cover_image = models.ImageField(upload_to='albums/', validators=[validate_image_file],null=True, blank=True)
    tracks = models.ManyToManyField(Track, related_name='albums', blank=True)
    release_date = models.DateField()
    genre = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title