from django.db import models
from apps.users.models import User
from apps.music.models import Track
from apps.core.validators import validate_image_file  # ← اضافه شد


class Playlist(models.Model):
    name = models.CharField(max_length=200)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
    tracks = models.ManyToManyField(Track, related_name='playlists', blank=True)
    cover_image = models.ImageField(upload_to='playlists/', validators=[validate_image_file],null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} by {self.creator.username}"