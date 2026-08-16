'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: any): User {
  const displayName = raw.displayName || raw.display_name || raw.username || '';
  const subscriptionType = (raw.subscriptionType || raw.subscription_type || 'free') as User['subscriptionType'];
  const followers =
    typeof raw.followers === 'number' ? raw.followers : (raw.followers_count ?? 0);
  const following =
    typeof raw.following === 'number' ? raw.following : (raw.following_count ?? 0);

  return {
    ...raw,
    id: String(raw.id),
    username: raw.username || '',
    email: raw.email || '',
    role: raw.role || 'listener',
    displayName,
    display_name: displayName,
    profileImage: raw.profileImage || raw.profile_image,
    profile_image: raw.profileImage || raw.profile_image,
    subscriptionType,
    subscription_type: subscriptionType,
    dailyStreams: raw.dailyStreams ?? raw.daily_streams ?? 0,
    daily_streams: raw.dailyStreams ?? raw.daily_streams ?? 0,
    birthDate: raw.birthDate || raw.birth_date,
    birth_date: raw.birthDate || raw.birth_date,
    awaitingApproval: raw.awaitingApproval ?? raw.awaiting_approval ?? false,
    awaiting_approval: raw.awaitingApproval ?? raw.awaiting_approval ?? false,
    followers,
    following,
    followers_count: raw.followers_count ?? followers,
    following_count: raw.following_count ?? following,
  };
}

// ---------- Provider ----------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          return normalizeUser(JSON.parse(saved));
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return;
    let parsed: any;
    try {
      parsed = JSON.parse(saved);
    } catch {
      return;
    }
    if (!parsed?.access) return;

    fetch(`${API_URL}/users/profile/`, {
      headers: { Authorization: `Bearer ${parsed.access}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const normalized = normalizeUser({
          ...parsed,
          ...data,
          access: parsed.access,
          refresh: parsed.refresh,
        });
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
      })
      .catch(() => {});
  }, []);

  // ---------- ورود از طریق بک‌اند ----------
  // در AuthContext.tsx، بخش login:

  const login = async (email: string, password: string) => {
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedPassword = typeof password === 'string' ? password : '';

    if (!trimmedEmail || !trimmedPassword) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await fetch(`${API_URL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid credentials');
      }

      const data = await response.json();

      if (!data.user) {
        throw new Error('User data not received');
      }

      const normalized = normalizeUser({
        ...data.user,
        access: data.access,
        refresh: data.refresh,
      });
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
      return normalized;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  // ---------- ثبت‌نام از طریق بک‌اند (با لاگین خودکار) ----------
  const register = async (userData: any) => {
    try {
      const response = await fetch(`${API_URL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // استخراج پیام خطا از پاسخ
        let errorMessage = 'Registration failed';
        if (errorData) {
          // اگر errorData یک آبجکت با کلیدهای خطا باشد
          if (typeof errorData === 'object') {
            // جمع‌آوری تمام پیام‌های خطا
            const messages = Object.values(errorData).flat().join(' ');
            if (messages) errorMessage = messages;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        }
        throw new Error(errorMessage);
      }

      await response.json();
      return await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = normalizeUser({ ...prev, ...partial });
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  // ---------- خروج از حساب ----------
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}