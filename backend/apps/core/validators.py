from django.core.exceptions import ValidationError
import os



def validate_audio_file(value):
    ext = os.path.splitext(value.name)[1]  # پسوند فایل
    valid_extensions = ['.mp3', '.wav', '.flac']
    if not ext.lower() in valid_extensions:
        raise ValidationError(f'Unsupported file type. Allowed: {", ".join(valid_extensions)}')

def validate_image_file(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if not ext.lower() in valid_extensions:
        raise ValidationError(f'Unsupported image type. Allowed: {", ".join(valid_extensions)}')

def validate_file_size(value, max_size=50*1024*1024):
    if value.size > max_size:
        raise ValidationError(f'File size exceeds {max_size // (1024*1024)} MB limit.')