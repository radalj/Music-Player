'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isReady } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // اگر کاربر قبلاً وارد شده باشد، به خانه هدایت کن
  useEffect(() => {
    if (!isReady || !user) return;
    if (user.role === 'admin' || user.role === 'supporter') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/home');
    }
  }, [user, router, isReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const loggedIn = await login(trimmedEmail, password);
      toast.success('Welcome back! 🎵');
      if (loggedIn.role === 'admin' || loggedIn.role === 'supporter') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-lg w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">🎵 MusicApp</h1>
          <p className="text-text-secondary mt-2">Welcome to your music</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
              placeholder="you@example.com"
              data-testid="login-email"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
              placeholder="••••••••"
              data-testid="login-password"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full p-3 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/register" className="text-text-secondary hover:text-white text-sm block transition">
            Don't have an account? <span className="text-primary">Sign Up</span>
          </Link>
          <Link href="/forgot-password" data-testid="forgot-password-link" className="text-text-secondary hover:text-white text-sm block transition">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}