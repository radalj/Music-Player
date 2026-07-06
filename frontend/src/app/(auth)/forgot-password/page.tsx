// src/app/(auth)/forgot-password/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('لطفاً ایمیل خود را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      // در این مرحله فقط شبیه‌سازی می‌کنیم
      // در واقعیت، درخواست به سرور ارسال می‌شود
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      toast.success('لینک بازیابی رمز عبور به ایمیل شما ارسال شد ✅');
      
      // بعد از ۳ ثانیه به صفحه ورود برگردید
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      toast.error('خطا در ارسال درخواست. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-lg w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">🔑 فراموشی رمز عبور</h1>
          <p className="text-text-secondary mt-2">
            ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">
                آدرس ایمیل
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                placeholder="you@example.com"
                required
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-primary text-black font-bold rounded-full hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
            </button>
          </form>
        ) : (
          <div className="text-center text-text-secondary py-4">
            <p>✅ ایمیل بازیابی ارسال شد.</p>
            <p className="text-sm mt-2">در حال انتقال به صفحه ورود...</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-text-secondary hover:text-white text-sm transition"
          >
            ← بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}