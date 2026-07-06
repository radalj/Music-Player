// src/app/pending-approval/page.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function PendingApprovalPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-lg max-w-md w-full border border-gray-800 text-center">
        {/* آیکون */}
        <div className="text-6xl mb-4">⏳</div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          در انتظار تأیید
        </h1>
        
        <p className="text-text-secondary mb-4">
          {user?.displayName || 'هنرمند'} عزیز،
          <br />
          حساب کاربری شما با موفقیت ثبت شد و در انتظار تأیید ادمین است.
        </p>
        
        <div className="bg-[#2a2a2a] p-4 rounded-lg text-right text-sm text-text-secondary space-y-1">
          <p>📧 ایمیل: <span className="text-white">{user?.email}</span></p>
          <p>🎭 نام هنری: <span className="text-white">{user?.displayName}</span></p>
          <p>📋 وضعیت: <span className="text-yellow-400">در انتظار تأیید</span></p>
        </div>
        
        <p className="text-text-secondary text-sm mt-4">
          پس از تأیید توسط ادمین، ایمیل تأیید برای شما ارسال خواهد شد.
          <br />
          همچنین می‌توانید از طریق ایمیل، نتیجه تأیید را پیگیری کنید.
        </p>
        
        <button
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="mt-6 px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-md hover:bg-red-600/30 transition text-sm"
        >
          خروج از حساب
        </button>
      </div>
    </div>
  );
}