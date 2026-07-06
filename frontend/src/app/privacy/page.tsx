// src/app/privacy/page.tsx
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark p-8 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-8 rounded-lg max-w-2xl w-full border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">سیاست حریم خصوصی</h1>
        <div className="text-text-secondary space-y-3 text-sm">
          <p>ما به حریم خصوصی شما احترام می‌گذاریم. اطلاعات شما فقط برای بهبود تجربه کاربری استفاده می‌شود.</p>
          <p>اطلاعات شخصی مانند نام، ایمیل، تاریخ تولد و جنسیت شما محرمانه نگهداری می‌شوند.</p>
          <p>ما اطلاعات شما را بدون رضایت شما به اشخاص ثالث نمی‌فروشیم یا به اشتراک نمی‌گذاریم.</p>
          <p>شما می‌توانید در هر زمان درخواست حذف اطلاعات خود را بدهید.</p>
        </div>
        <Link href="/register" className="inline-block mt-6 text-primary hover:underline">
          ← بازگشت به ثبت‌نام
        </Link>
      </div>
    </div>
  );
}