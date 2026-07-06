'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- توابع کمکی برای مدیریت کاربران در localStorage ----------
const getRegisteredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('registeredUsers');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveRegisteredUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('registeredUsers', JSON.stringify(users));
};

// ثبت کاربر جدید در لیست کاربران ثبت‌نام شده
export const registerUserInStorage = (newUser: User) => {
  const users = getRegisteredUsers();
  // جلوگیری از ثبت تکراری (بر اساس ایمیل)
  const exists = users.some(u => u.email === newUser.email);
  if (!exists) {
    users.push(newUser);
    saveRegisteredUsers(users);
    // همچنین کاربر فعلی را در localStorage ذخیره می‌کنیم (برای لاگین خودکار در صورت نیاز)
    localStorage.setItem('user', JSON.stringify(newUser));
  }
  return newUser;
};

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

  // ورود کاربر
  const login = async (email: string, password: string) => {
    const users = getRegisteredUsers();
    // جستجوی کاربر با ایمیل و رمز عبور (در حالت واقعی، رمز هش می‌شود)
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!foundUser) {
      throw new Error('ایمیل یا رمز عبور نادرست است');
    }
    setUser(foundUser);
    localStorage.setItem('user', JSON.stringify(foundUser));
  };

  // خروج از حساب
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
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