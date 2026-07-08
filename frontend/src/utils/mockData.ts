// src/utils/mockData.ts

export type SubscriptionType = 'free' | 'silver' | 'gold';
export type UserRole = 'listener' | 'artist' | 'supporter' | 'admin' | 'pending_artist';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password?: string;
  profileImage?: string;
  subscriptionType: SubscriptionType;
  role: UserRole;
  followers: number;
  following: number;
  dailyStreams: number;
  birthDate?: string;
  gender?: string;
  awaitingApproval?: boolean;
  portfolio?: string;
  submittedAt?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  verified: boolean;
  profileImage?: string;
  totalListeners: number;
  totalStreams: number;
  awaitingApproval?: boolean;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    spotify?: string;
  };
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  coverImage: string;
  releaseDate: Date;
  genre: string[];
  tracks: Track[];
  description?: string;
  label?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album?: Album;
  duration: number;
  coverImage: string;
  lyrics?: string;
  listeners: number;
  streams: number;
  audioUrl: string;
  genre: string[];
  releaseDate: Date;
  explicit?: boolean;
  featuredArtists?: Artist[];
}

export interface Playlist {
  id: string;
  name: string;
  creator: User;
  tracks: Track[];
  coverImage?: string;
  createdAt: Date;
  description?: string;
}

// ----- Mock Artists -----
export const mockArtists: Artist[] = [
  {
    id: 'artist1',
    name: 'The Midnight Waves',
    bio: 'Indie rock band from California, bringing nostalgic vibes with modern twists. Formed in 2018, they have been making waves in the indie scene with their dreamy soundscapes and heartfelt lyrics.',
    verified: true,
    profileImage: '/images/artists/midnight-waves.jpg',
    totalListeners: 45200,
    totalStreams: 1245000,
    socialLinks: {
      instagram: '@midnightwaves',
      twitter: '@midnightwaves',
      soundcloud: 'midnight-waves',
      spotify: 'midnight-waves',
    },
  },
  {
    id: 'artist2',
    name: 'Luna Star',
    bio: 'Soulful pop singer-songwriter with a voice that touches the heart. Luna\'s music blends pop, soul, and R&B with introspective lyrics about love, loss, and self-discovery.',
    verified: true,
    profileImage: '/images/artists/luna-star.jpg',
    totalListeners: 31200,
    totalStreams: 876000,
    socialLinks: {
      instagram: '@lunastar',
      twitter: '@lunastar',
      spotify: 'luna-star',
    },
  },
  {
    id: 'artist3',
    name: 'Neon Pulse',
    bio: 'Electronic music producer exploring the boundaries of synth-wave and ambient sounds. Neon Pulse creates immersive sonic experiences that transport listeners to futuristic landscapes.',
    verified: false,
    profileImage: '/images/artists/neon-pulse.jpg',
    totalListeners: 8900,
    totalStreams: 234000,
    socialLinks: {
      soundcloud: 'neon-pulse',
      spotify: 'neon-pulse',
    },
  },
  {
    id: 'artist4',
    name: 'Golden Echo',
    bio: 'Folk-pop duo known for their harmonious vocals and acoustic arrangements. Golden Echo brings warmth and intimacy to every performance, with songs that feel like home.',
    verified: true,
    profileImage: '/images/artists/golden-echo.jpg',
    totalListeners: 15600,
    totalStreams: 412000,
  },
  {
    id: 'artist5',
    name: 'Crimson Tide',
    bio: 'Heavy metal band from the Pacific Northwest, delivering powerful riffs and intense performances. Crimson Tide has been a staple in the metal scene for over a decade.',
    verified: true,
    profileImage: '/images/artists/crimson-tide.jpg',
    totalListeners: 28900,
    totalStreams: 789000,
  },
  {
    id: 'artist6',
    name: 'Velvet Sky',
    bio: 'Dream pop artist creating ethereal soundscapes with lush production and delicate vocals. Velvet Sky\'s music is perfect for late-night listening and introspection.',
    verified: false,
    profileImage: '/images/artists/velvet-sky.jpg',
    totalListeners: 7200,
    totalStreams: 198000,
  },
];

// ----- Create tracks with proper references -----
const artist1 = mockArtists[0];
const artist2 = mockArtists[1];
const artist3 = mockArtists[2];
const artist4 = mockArtists[3];
const artist5 = mockArtists[4];
const artist6 = mockArtists[5];

// ----- Mock Tracks (First pass - without album references) -----
export const mockTracks: Track[] = [
  // The Midnight Waves tracks
  {
    id: 'track1',
    title: 'Midnight Dreams',
    artist: artist1,
    duration: 235,
    coverImage: '/images/tracks/midnight-dreams.jpg',
    lyrics: 'Midnight dreams...\nVerse 1\nIn the midnight hour...',
    listeners: 15200,
    streams: 456000,
    audioUrl: '/audio/track1.mp3',
    genre: ['Indie Rock', 'Alternative'],
    releaseDate: new Date('2024-01-15'),
  },
  {
    id: 'track4',
    title: 'Ocean Waves',
    artist: artist1,
    duration: 210,
    coverImage: '/images/tracks/ocean-waves.jpg',
    lyrics: 'Ocean waves crashing...',
    listeners: 21000,
    streams: 678000,
    audioUrl: '/audio/track4.mp3',
    genre: ['Indie Rock', 'Surf'],
    releaseDate: new Date('2024-04-01'),
  },
  {
    id: 'track7',
    title: 'Starlight Serenade',
    artist: artist1,
    duration: 198,
    coverImage: '/images/tracks/starlight-serenade.jpg',
    lyrics: 'Under the starlight...',
    listeners: 9800,
    streams: 287000,
    audioUrl: '/audio/track7.mp3',
    genre: ['Indie Rock', 'Dream Pop'],
    releaseDate: new Date('2024-06-15'),
  },
  // Luna Star tracks
  {
    id: 'track2',
    title: 'Starlight',
    artist: artist2,
    duration: 198,
    coverImage: '/images/tracks/starlight.jpg',
    lyrics: 'Starlight shines so bright...',
    listeners: 9800,
    streams: 287000,
    audioUrl: '/audio/track2.mp3',
    genre: ['Pop', 'Soul'],
    releaseDate: new Date('2024-02-01'),
  },
  {
    id: 'track5',
    title: 'Heartbeat',
    artist: artist2,
    duration: 185,
    coverImage: '/images/tracks/heartbeat.jpg',
    lyrics: 'Heartbeat keeps me alive...',
    listeners: 5600,
    streams: 156000,
    audioUrl: '/audio/track5.mp3',
    genre: ['Pop', 'Ballad'],
    releaseDate: new Date('2024-04-15'),
  },
  {
    id: 'track8',
    title: 'Golden Hour',
    artist: artist2,
    duration: 212,
    coverImage: '/images/tracks/golden-hour.jpg',
    lyrics: 'In the golden hour light...',
    listeners: 13400,
    streams: 398000,
    audioUrl: '/audio/track8.mp3',
    genre: ['Pop', 'R&B'],
    releaseDate: new Date('2024-07-01'),
  },
  // Neon Pulse tracks
  {
    id: 'track3',
    title: 'Electric Feel',
    artist: artist3,
    duration: 267,
    coverImage: '/images/tracks/electric-feel.jpg',
    lyrics: 'Electric current flows...',
    listeners: 3400,
    streams: 98000,
    audioUrl: '/audio/track3.mp3',
    genre: ['Electronic', 'Synthwave'],
    releaseDate: new Date('2024-03-10'),
  },
  {
    id: 'track6',
    title: 'Neon Dreams',
    artist: artist3,
    duration: 220,
    coverImage: '/images/tracks/neon-dreams.jpg',
    lyrics: 'Neon lights in the dark...',
    listeners: 1800,
    streams: 45000,
    audioUrl: '/audio/track6.mp3',
    genre: ['Electronic', 'Ambient'],
    releaseDate: new Date('2024-05-01'),
  },
  {
    id: 'track9',
    title: 'Pulse',
    artist: artist3,
    duration: 245,
    coverImage: '/images/tracks/pulse.jpg',
    lyrics: 'Feel the pulse...',
    listeners: 2600,
    streams: 78000,
    audioUrl: '/audio/track9.mp3',
    genre: ['Electronic', 'House'],
    releaseDate: new Date('2024-08-20'),
  },
  // Golden Echo tracks
  {
    id: 'track10',
    title: 'Homeward Bound',
    artist: artist4,
    duration: 195,
    coverImage: '/images/tracks/homeward-bound.jpg',
    lyrics: 'Walking home...',
    listeners: 8700,
    streams: 234000,
    audioUrl: '/audio/track10.mp3',
    genre: ['Folk', 'Acoustic'],
    releaseDate: new Date('2024-03-20'),
  },
  {
    id: 'track11',
    title: 'Morning Light',
    artist: artist4,
    duration: 178,
    coverImage: '/images/tracks/morning-light.jpg',
    lyrics: 'Morning light breaks through...',
    listeners: 6200,
    streams: 189000,
    audioUrl: '/audio/track11.mp3',
    genre: ['Folk', 'Indie'],
    releaseDate: new Date('2024-06-10'),
  },
  // Crimson Tide tracks
  {
    id: 'track12',
    title: 'Rising Storm',
    artist: artist5,
    duration: 245,
    coverImage: '/images/tracks/rising-storm.jpg',
    lyrics: 'Storm is rising...',
    listeners: 11200,
    streams: 345000,
    audioUrl: '/audio/track12.mp3',
    genre: ['Metal', 'Rock'],
    releaseDate: new Date('2024-02-15'),
  },
  {
    id: 'track13',
    title: 'Iron Will',
    artist: artist5,
    duration: 230,
    coverImage: '/images/tracks/iron-will.jpg',
    lyrics: 'Iron will never breaks...',
    listeners: 8900,
    streams: 267000,
    audioUrl: '/audio/track13.mp3',
    genre: ['Metal', 'Thrash'],
    releaseDate: new Date('2024-05-20'),
  },
  // Velvet Sky tracks
  {
    id: 'track14',
    title: 'Ethereal',
    artist: artist6,
    duration: 210,
    coverImage: '/images/tracks/ethereal.jpg',
    lyrics: 'Ethereal dreams...',
    listeners: 3400,
    streams: 102000,
    audioUrl: '/audio/track14.mp3',
    genre: ['Dream Pop', 'Ambient'],
    releaseDate: new Date('2024-04-05'),
  },
  {
    id: 'track15',
    title: 'Velvet Night',
    artist: artist6,
    duration: 198,
    coverImage: '/images/tracks/velvet-night.jpg',
    lyrics: 'Velvet night surrounds me...',
    listeners: 2800,
    streams: 87000,
    audioUrl: '/audio/track15.mp3',
    genre: ['Dream Pop', 'Shoegaze'],
    releaseDate: new Date('2024-07-15'),
  },
];

// ----- Mock Albums -----
export const mockAlbums: Album[] = [
  {
    id: 'album1',
    title: 'Dreamscape',
    artist: artist1,
    coverImage: '/images/albums/dreamscape.jpg',
    releaseDate: new Date('2024-01-15'),
    genre: ['Indie Rock', 'Alternative'],
    tracks: [mockTracks[0], mockTracks[3], mockTracks[6]],
    description: 'A journey through dreams and memories, Dreamscape is the debut album from The Midnight Waves, featuring 10 tracks of lush indie rock.',
    label: 'Wave Records',
  },
  {
    id: 'album2',
    title: 'Soul Journey',
    artist: artist2,
    coverImage: '/images/albums/soul-journey.jpg',
    releaseDate: new Date('2024-02-01'),
    genre: ['Pop', 'Soul'],
    tracks: [mockTracks[1], mockTracks[4], mockTracks[7]],
    description: 'Soul Journey is a deeply personal album from Luna Star, exploring themes of love, identity, and self-discovery through soulful pop melodies.',
    label: 'Star Music',
  },
  {
    id: 'album3',
    title: 'Neon Dreams',
    artist: artist3,
    coverImage: '/images/albums/neon-dreams.jpg',
    releaseDate: new Date('2024-03-10'),
    genre: ['Electronic', 'Synthwave'],
    tracks: [mockTracks[2], mockTracks[5], mockTracks[8]],
    description: 'An immersive electronic journey through neon-lit cityscapes and dreamy synth landscapes.',
    label: 'Pulse Records',
  },
  {
    id: 'album4',
    title: 'Golden Echoes',
    artist: artist4,
    coverImage: '/images/albums/golden-echoes.jpg',
    releaseDate: new Date('2024-03-20'),
    genre: ['Folk', 'Acoustic'],
    tracks: [mockTracks[9], mockTracks[10]],
    description: 'Golden Echoes is a warm, intimate collection of folk songs about home, family, and finding your way.',
    label: 'Echo Records',
  },
  {
    id: 'album5',
    title: 'Crimson Storm',
    artist: artist5,
    coverImage: '/images/albums/crimson-storm.jpg',
    releaseDate: new Date('2024-02-15'),
    genre: ['Metal', 'Rock'],
    tracks: [mockTracks[11], mockTracks[12]],
    description: 'Crimson Storm is a powerful metal album that showcases the band\'s signature heavy riffs and intense energy.',
    label: 'Storm Records',
  },
  {
    id: 'album6',
    title: 'Velvet Dreams',
    artist: artist6,
    coverImage: '/images/albums/velvet-dreams.jpg',
    releaseDate: new Date('2024-04-05'),
    genre: ['Dream Pop', 'Ambient'],
    tracks: [mockTracks[13], mockTracks[14]],
    description: 'A dreamy, atmospheric collection of dream pop songs perfect for late-night listening.',
    label: 'Velvet Records',
  },
];

// ----- Assign album references to tracks -----
mockTracks[0].album = mockAlbums[0]; // Midnight Dreams -> Dreamscape
mockTracks[3].album = mockAlbums[0]; // Ocean Waves -> Dreamscape
mockTracks[6].album = mockAlbums[0]; // Starlight Serenade -> Dreamscape
mockTracks[1].album = mockAlbums[1]; // Starlight -> Soul Journey
mockTracks[4].album = mockAlbums[1]; // Heartbeat -> Soul Journey
mockTracks[7].album = mockAlbums[1]; // Golden Hour -> Soul Journey
mockTracks[2].album = mockAlbums[2]; // Electric Feel -> Neon Dreams
mockTracks[5].album = mockAlbums[2]; // Neon Dreams -> Neon Dreams
mockTracks[8].album = mockAlbums[2]; // Pulse -> Neon Dreams
mockTracks[9].album = mockAlbums[3]; // Homeward Bound -> Golden Echoes
mockTracks[10].album = mockAlbums[3]; // Morning Light -> Golden Echoes
mockTracks[11].album = mockAlbums[4]; // Rising Storm -> Crimson Storm
mockTracks[12].album = mockAlbums[4]; // Iron Will -> Crimson Storm
mockTracks[13].album = mockAlbums[5]; // Ethereal -> Velvet Dreams
mockTracks[14].album = mockAlbums[5]; // Velvet Night -> Velvet Dreams

// ----- Mock Users -----
export const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'johndoe',
    displayName: 'John Doe',
    email: 'john@example.com',
    profileImage: '/images/users/john.jpg',
    subscriptionType: 'gold',
    role: 'listener',
    followers: 234,
    following: 45,
    dailyStreams: 28,
    birthDate: '1995-03-15',
    gender: 'male',
  },
  // ... more users
];

// ----- Mock Playlists -----
export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist1',
    name: 'Chill Vibes',
    creator: mockUsers[0],
    tracks: [mockTracks[0], mockTracks[1], mockTracks[4]],
    coverImage: '/images/playlists/chill-vibes.jpg',
    createdAt: new Date('2024-02-10'),
    description: 'Relaxing tracks for a chill afternoon.',
  },
  // ... more playlists
];

// ----- Helper Functions -----
export const getArtistById = (id: string): Artist | undefined => {
  return mockArtists.find((artist) => artist.id === id);
};

export const getAlbumById = (id: string): Album | undefined => {
  return mockAlbums.find((album) => album.id === id);
};

// ✅ اصلاح تابع getTrackById برای پشتیبانی از آهنگ‌های ذخیره‌شده در localStorage
export const getTrackById = (id: string): Track | undefined => {
  // ۱. جستجو در mockTracks
  const mockTrack = mockTracks.find((track) => track.id === id);
  if (mockTrack) return mockTrack;

  // ۲. جستجو در localStorage برای آهنگ‌های هنرمند (کلیدهای artist_tracks_*)
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('artist_tracks_')) {
        try {
          const storedTracks = JSON.parse(localStorage.getItem(key) || '[]');
          const found = storedTracks.find((t: any) => t.id === id);
          if (found) {
            // تبدیل به فرمت Track با ساختار مورد انتظار
            // پیدا کردن یا ساخت Artist
            let artist: Artist;
            if (typeof found.artist === 'string') {
              // سعی می‌کنیم از mockArtists پیدا کنیم
              const existingArtist = mockArtists.find(a => a.name === found.artist);
              if (existingArtist) {
                artist = existingArtist;
              } else {
                // ساخت Artist جدید با اطلاعات محدود
                artist = {
                  id: `artist_${found.id}`,
                  name: found.artist,
                  bio: '',
                  verified: false,
                  totalListeners: 0,
                  totalStreams: 0,
                };
              }
            } else {
              artist = found.artist; // فرض می‌کنیم قبلاً به فرم Artist است
            }

            // ساخت Track
            const track: Track = {
              id: found.id,
              title: found.title,
              artist: artist,
              duration: found.duration || 0,
              coverImage: found.coverImage || '/images/default-cover.jpg',
              lyrics: found.lyrics || '',
              listeners: found.listeners || 0,
              streams: found.streams || 0,
              audioUrl: found.audioUrl || found.audioFile || '',
              genre: found.genre ? [found.genre] : [],
              releaseDate: found.createdAt ? new Date(found.createdAt) : new Date(),
              album: found.album || undefined,
              explicit: found.explicit || false,
              featuredArtists: found.featuredArtists || [],
            };
            return track;
          }
        } catch (e) {
          console.error('Error parsing localStorage in getTrackById:', e);
        }
      }
    }
  }

  return undefined;
};

export const getTracksByArtistId = (artistId: string): Track[] => {
  return mockTracks.filter((track) => track.artist.id === artistId);
};

export const getAlbumsByArtistId = (artistId: string): Album[] => {
  return mockAlbums.filter((album) => album.artist.id === artistId);
};

export const getTracksByAlbumId = (albumId: string): Track[] => {
  return mockTracks.filter((track) => track.album?.id === albumId);
};