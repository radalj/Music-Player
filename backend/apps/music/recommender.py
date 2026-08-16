from collections import Counter
import math

from .models import PlayHistory, Track

GENRE_WEIGHT = 5.0
ARTIST_WEIGHT = 4.0
FOLLOWED_ARTIST_WEIGHT = 2.0
RECENT_LIMIT = 40
DEFAULT_LIMIT = 8


def normalize_genre(genre):
    if not genre:
        return None
    cleaned = genre.strip().lower()
    return cleaned or None


def _reason_for(track, genre_counts, artist_counts, followed_ids):
    genre_key = normalize_genre(track.genre)
    if genre_key and genre_key in genre_counts:
        return 'genre', track.genre
    if track.artist_id in artist_counts:
        return 'artist', None
    if track.artist_id in followed_ids:
        return 'follow', None
    return 'popular', None


def recommend_tracks_for_user(user, limit=DEFAULT_LIMIT):
    """Content-based recommendations from play history, followed artists, then popularity.

    Scores are deterministic: the same listening history always yields the same order.
    Popularity is only a tie-breaker so suggestions stay taste-based, not random.
    """
    recent = list(
        PlayHistory.objects.filter(user=user)
        .select_related('track')
        .order_by('-played_at')[:RECENT_LIMIT]
    )
    recent_ids = {entry.track_id for entry in recent}

    genre_counts = Counter()
    artist_counts = Counter()
    for entry in recent:
        genre_key = normalize_genre(entry.track.genre)
        if genre_key:
            genre_counts[genre_key] += 1
        artist_counts[entry.track.artist_id] += 1

    followed_ids = set(user.following.values_list('id', flat=True))
    candidates = list(Track.objects.select_related('artist').all())

    scored = []
    for track in candidates:
        genre_key = normalize_genre(track.genre)
        score = 0.0
        if genre_key and genre_key in genre_counts:
            score += GENRE_WEIGHT * genre_counts[genre_key]
        if track.artist_id in artist_counts:
            score += ARTIST_WEIGHT * artist_counts[track.artist_id]
        if track.artist_id in followed_ids:
            score += FOLLOWED_ARTIST_WEIGHT
        score += math.log1p(track.streams or 0) * 0.1
        if track.id in recent_ids:
            score -= 8.0
        scored.append((score, track))

    scored.sort(key=lambda item: (-item[0], -(item[1].streams or 0), item[1].id))

    results = []
    for score, track in scored[:limit]:
        reason_code, reason_genre = _reason_for(track, genre_counts, artist_counts, followed_ids)
        results.append({
            'track': track,
            'score': round(score, 4),
            'reason_code': reason_code,
            'reason_genre': reason_genre,
        })
    return results
