// User Types
export type SubscriptionType = 'free' | 'silver' | 'gold';
export type UserRole = 'listener' | 'artist' | 'supporter' | 'admin' | 'pending_artist';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profileImage?: string;
  subscriptionType: SubscriptionType;
  role: UserRole;
  followers: number;
  following: number;
  dailyStreams: number;
  birthDate?: Date;
  gender?: string;
  awaitingApproval?: boolean;
  portfolio?: string;
  submittedAt?: string;
  password?: string;
}

// Artist Types
export interface Artist {
  id: string;
  name: string;
  bio: string;
  verified: boolean;
  profileImage?: string;
  totalListeners: number;
  totalStreams: number;
  awaitingApproval?: boolean;
}

// Music Types
export interface Album {
  id: string;
  title: string;
  artist: Artist;
  coverImage: string;
  releaseDate: Date;
  genre: string[];
  tracks: Track[];
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
}

// Playlist Types
export interface Playlist {
  id: string;
  name: string;
  creator: User;
  tracks: Track[];
  coverImage?: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'subscription' | 'new_release' | 'approval' | 'ticket';
  link?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  birthDate: string;
  gender: string;
  acceptPrivacy: boolean;
}

export interface ArtistRegisterFormData {
  email: string;
  password: string;
  artistName: string;
  portfolio: string;
}

export interface RegisterFormData {
  username: string;          // نام کاربری (unique)
  displayName: string;       // نام نمایشی
  email: string;
  password: string;
  passwordConfirm: string;
  birthDate: string;
  gender: string;
  acceptPrivacy: boolean;
}