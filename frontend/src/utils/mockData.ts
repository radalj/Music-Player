import { User, Artist, Album, Track, Playlist, Notification } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'johndoe',
    displayName: 'John Doe',
    email: 'john@example.com',
    profileImage: '/images/profile1.jpg',
    subscriptionType: 'gold',
    role: 'listener',
    followers: 234,
    following: 45,
    dailyStreams: 28,
    birthDate: new Date('1995-03-15'),
    gender: 'male',
  },
  {
    id: 'user2',
    username: 'janedoe',
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    profileImage: '/images/profile2.jpg',
    subscriptionType: 'silver',
    role: 'artist',
    followers: 1250,
    following: 30,
    dailyStreams: 156,
    birthDate: new Date('1992-07-22'),
    gender: 'female',
  },
  {
    id: 'user3',
    username: 'alexsmith',
    displayName: 'Alex Smith',
    email: 'alex@example.com',
    profileImage: '/images/profile3.jpg',
    subscriptionType: 'free',
    role: 'listener',
    followers: 12,
    following: 67,
    dailyStreams: 3,
    birthDate: new Date('2000-11-05'),
    gender: 'non-binary',
  },
];

// Mock Artists
export const mockArtists: Artist[] = [
  {
    id: 'artist1',
    name: 'The Midnight Waves',
    bio: 'Indie rock band from California, bringing nostalgic vibes with modern twists.',
    verified: true,
    profileImage: '/images/artist1.jpg',
    totalListeners: 45200,
    totalStreams: 1245000,
  },
  {
    id: 'artist2',
    name: 'Luna Star',
    bio: 'Soulful pop singer-songwriter with a voice that touches the heart.',
    verified: true,
    profileImage: '/images/artist2.jpg',
    totalListeners: 31200,
    totalStreams: 876000,
  },
  {
    id: 'artist3',
    name: 'Neon Pulse',
    bio: 'Electronic music producer exploring the boundaries of synth-wave.',
    verified: false,
    profileImage: '/images/artist3.jpg',
    totalListeners: 8900,
    totalStreams: 234000,
  },
];

// Create tracks with proper references
const artist1 = mockArtists[0];
const artist2 = mockArtists[1];
const artist3 = mockArtists[2];

// Mock Tracks
export const mockTracks: Track[] = [
  {
    id: 'track1',
    title: 'Midnight Dreams',
    artist: artist1,
    album: undefined,
    duration: 235,
    coverImage: '/images/track1.jpg',
    lyrics: 'Lyrics for Midnight Dreams...\nVerse 1\nIn the midnight hour...',
    listeners: 15200,
    streams: 456000,
    audioUrl: '/audio/track1.mp3',
    genre: ['Indie Rock', 'Alternative'],
    releaseDate: new Date('2024-01-15'),
  },
  {
    id: 'track2',
    title: 'Starlight',
    artist: artist2,
    album: undefined,
    duration: 198,
    coverImage: '/images/track2.jpg',
    lyrics: 'Lyrics for Starlight...\nVerse 1\nStarlight shines so bright...',
    listeners: 9800,
    streams: 287000,
    audioUrl: '/audio/track2.mp3',
    genre: ['Pop', 'Soul'],
    releaseDate: new Date('2024-02-01'),
  },
  {
    id: 'track3',
    title: 'Electric Feel',
    artist: artist3,
    album: undefined,
    duration: 267,
    coverImage: '/images/track3.jpg',
    lyrics: 'Lyrics for Electric Feel...\nVerse 1\nElectric current flows...',
    listeners: 3400,
    streams: 98000,
    audioUrl: '/audio/track3.mp3',
    genre: ['Electronic', 'Synthwave'],
    releaseDate: new Date('2024-03-10'),
  },
  {
    id: 'track4',
    title: 'Ocean Waves',
    artist: artist1,
    album: undefined,
    duration: 210,
    coverImage: '/images/track4.jpg',
    lyrics: 'Ocean waves crashing...',
    listeners: 21000,
    streams: 678000,
    audioUrl: '/audio/track4.mp3',
    genre: ['Indie Rock', 'Surf'],
    releaseDate: new Date('2024-04-01'),
  },
  {
    id: 'track5',
    title: 'Heartbeat',
    artist: artist2,
    album: undefined,
    duration: 185,
    coverImage: '/images/track5.jpg',
    lyrics: 'Heartbeat keeps me alive...',
    listeners: 5600,
    streams: 156000,
    audioUrl: '/audio/track5.mp3',
    genre: ['Pop', 'Ballad'],
    releaseDate: new Date('2024-04-15'),
  },
];

// Mock Albums
export const mockAlbums: Album[] = [
  {
    id: 'album1',
    title: 'Dreamscape',
    artist: artist1,
    coverImage: '/images/album1.jpg',
    releaseDate: new Date('2024-01-15'),
    genre: ['Indie Rock', 'Alternative'],
    tracks: [mockTracks[0], mockTracks[3]],
  },
  {
    id: 'album2',
    title: 'Soul Journey',
    artist: artist2,
    coverImage: '/images/album2.jpg',
    releaseDate: new Date('2024-02-01'),
    genre: ['Pop', 'Soul'],
    tracks: [mockTracks[1], mockTracks[4]],
  },
  {
    id: 'album3',
    title: 'Neon Dreams',
    artist: artist3,
    coverImage: '/images/album3.jpg',
    releaseDate: new Date('2024-03-10'),
    genre: ['Electronic', 'Synthwave'],
    tracks: [mockTracks[2]],
  },
];

// Assign albums to tracks
mockTracks[0].album = mockAlbums[0];
mockTracks[1].album = mockAlbums[1];
mockTracks[2].album = mockAlbums[2];
mockTracks[3].album = mockAlbums[0];
mockTracks[4].album = mockAlbums[1];

// Mock Playlists
export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist1',
    name: 'Chill Vibes',
    creator: mockUsers[0],
    tracks: [mockTracks[0], mockTracks[1], mockTracks[4]],
    coverImage: '/images/playlist1.jpg',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'playlist2',
    name: 'Workout Mix',
    creator: mockUsers[0],
    tracks: [mockTracks[2], mockTracks[3]],
    coverImage: '/images/playlist2.jpg',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'playlist3',
    name: 'Study Session',
    creator: mockUsers[2],
    tracks: [mockTracks[1], mockTracks[4]],
    createdAt: new Date('2024-03-20'),
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user1',
    message: 'Your subscription will expire in 3 days. Renew now!',
    read: false,
    createdAt: new Date('2024-03-20'),
    type: 'subscription',
  },
  {
    id: 'notif2',
    userId: 'user1',
    message: 'New release from The Midnight Waves: "Dreamscape"',
    read: false,
    createdAt: new Date('2024-03-19'),
    type: 'new_release',
    link: '/albums/album1',
  },
  {
    id: 'notif3',
    userId: 'user1',
    message: 'Your artist account has been verified!',
    read: true,
    createdAt: new Date('2024-03-15'),
    type: 'approval',
  },
  {
    id: 'notif4',
    userId: 'user1',
    message: 'New ticket response from support team',
    read: true,
    createdAt: new Date('2024-03-14'),
    type: 'ticket',
  },
];

// Helper functions
export const getCurrentUser = (): User => mockUsers[0];

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getArtistById = (id: string): Artist | undefined => {
  return mockArtists.find(artist => artist.id === id);
};

export const getAlbumById = (id: string): Album | undefined => {
  return mockAlbums.find(album => album.id === id);
};

export const getTrackById = (id: string): Track | undefined => {
  return mockTracks.find(track => track.id === id);
};

export const getPlaylistById = (id: string): Playlist | undefined => {
  return mockPlaylists.find(playlist => playlist.id === id);
};

export const getNotificationsForUser = (userId: string): Notification[] => {
  return mockNotifications.filter(notif => notif.userId === userId);
};