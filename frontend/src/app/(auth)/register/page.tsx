'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerUserInStorage } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { RegisterFormData, ArtistRegisterFormData, User } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    birthDate: '',
    gender: '',
    acceptPrivacy: false,
  });

  const [artistData, setArtistData] = useState<ArtistRegisterFormData>({
    email: '',
    password: '',
    artistName: '',
    portfolio: '',
  });

  // ---------- تابع کمکی برای بررسی تکراری بودن ایمیل در localStorage ----------
  const isEmailRegistered = (email: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return users.some((u: any) => u.email === email);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isArtist) {
      if (formData.password !== formData.passwordConfirm) {
        toast.error('Passwords do not match');
        return;
      }
      if (!formData.acceptPrivacy) {
        toast.error('Please accept the privacy policy');
        return;
      }
      if (!formData.username || !formData.displayName || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      if (!artistData.email || !artistData.password || !artistData.artistName) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (artistData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    // ---------- بررسی تکراری بودن ایمیل ----------
    const emailToCheck = isArtist ? artistData.email : formData.email;
    if (isEmailRegistered(emailToCheck)) {
      toast.error('This email is already registered. Please use a different email or login.');
      return; // از ادامه جلوگیری می‌کند (لاگین خودکار و هدایت انجام نمی‌شود)
    }

    setLoading(true);

    try {
      const mockUser = {
        id: 'newuser_' + Date.now(),
        username: isArtist
          ? artistData.artistName.toLowerCase().replace(/\s/g, '')
          : formData.username,
        displayName: isArtist ? artistData.artistName : formData.displayName,
        email: emailToCheck,
        password: isArtist ? artistData.password : formData.password,
        subscriptionType: 'free' as const,
        role: isArtist ? 'pending_artist' : 'listener',
        followers: 0,
        following: 0,
        dailyStreams: 0,
        ...(isArtist && {
          awaitingApproval: true,
          portfolio: artistData.portfolio,
          submittedAt: new Date().toISOString(),
        }),
      };

      registerUserInStorage(mockUser as User);
      await login(mockUser.email, mockUser.password);

      // ✅ Always redirect to home (pending banner will be shown there)
      toast.success(
        isArtist
          ? '✅ Artist account created! Pending admin approval.'
          : '✅ Registration successful!'
      );
      router.push('/home');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 py-12">
      <div className="bg-[#1a1a1a] p-8 rounded-lg w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">🎵 MusicApp</h1>
          <p className="text-text-secondary mt-2">Create your account</p>
        </div>

        <div className="flex rounded-lg bg-[#2a2a2a] p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md transition ${
              !isArtist ? 'bg-primary text-black font-bold' : 'text-text-secondary'
            }`}
            onClick={() => setIsArtist(false)}
          >
            Listener
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md transition ${
              isArtist ? 'bg-primary text-black font-bold' : 'text-text-secondary'
            }`}
            onClick={() => setIsArtist(true)}
          >
            Artist
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isArtist ? (
            // ---------- Listener Form ----------
            <>
              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Username * <span className="text-xs text-gray-500">(unique)</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="user123"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    setFormData({ ...formData, passwordConfirm: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.acceptPrivacy}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptPrivacy: e.target.checked })
                  }
                  className="w-4 h-4 accent-primary"
                  required
                />
                <label className="text-text-secondary text-sm">
                  I accept the{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </>
          ) : (
            // ---------- Artist Form ----------
            <>
              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Artist Name *
                </label>
                <input
                  type="text"
                  value={artistData.artistName}
                  onChange={(e) =>
                    setArtistData({ ...artistData, artistName: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="Your stage name"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={artistData.email}
                  onChange={(e) =>
                    setArtistData({ ...artistData, email: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="artist@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  value={artistData.password}
                  onChange={(e) =>
                    setArtistData({ ...artistData, password: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  Portfolio / Links
                </label>
                <textarea
                  value={artistData.portfolio}
                  onChange={(e) =>
                    setArtistData({ ...artistData, portfolio: e.target.value })
                  }
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition resize-none"
                  placeholder="Links to your music, Instagram, etc."
                  rows={3}
                />
                <p className="text-text-secondary text-xs mt-1">
                  Optional – used for identity verification
                </p>
              </div>

              <div className="text-sm text-text-secondary bg-[#2a2a2a] p-3 rounded-lg">
                ⚠️ Artist accounts require admin approval before you can publish music.
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-primary text-black font-bold rounded-full hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Registering...'
              : isArtist
              ? 'Register as Artist'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-text-secondary hover:text-white text-sm transition"
          >
            Already have an account? <span className="text-primary">Sign In</span>
          </Link>
        </div>
      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Privacy Policy</h2>
            <div className="text-text-secondary space-y-3 text-sm">
              <p>We respect your privacy. Your information is used only to improve your experience.</p>
              <p>Personal details such as name, email, birth date, and gender are kept confidential.</p>
              <p>We do not sell or share your information with third parties without your consent.</p>
              <p>You can request deletion of your data at any time.</p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="mt-6 w-full p-2 bg-primary text-black font-bold rounded-md hover:bg-opacity-80 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}