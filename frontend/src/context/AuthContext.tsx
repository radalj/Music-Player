'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- Provider ----------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // ---------- ورود از طریق بک‌اند ----------
  // در AuthContext.tsx، بخش login:

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('Login response:', data); // ← لاگ برای دیباگ

      if (!data.user) {
        throw new Error('User data not received');
      }

      const userData = data.user;
      const tokenData = { access: data.access, refresh: data.refresh };
      const userWithToken = { ...userData, ...tokenData };
      localStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userData);
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

      const data = await response.json();
      // لاگین خودکار
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
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