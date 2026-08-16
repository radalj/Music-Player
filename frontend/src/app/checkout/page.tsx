'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import { extractPlans, planPrice, CatalogPlan } from '@/utils/plans';
import { SubscriptionType } from '@/types';
import { canUseSubscriptions } from '@/utils/roles';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCardNumber(value: string) {
  return onlyDigits(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function isValidExpiry(value: string) {
  const match = value.trim().match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);
  return expiry >= now;
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-dark items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}

function CheckoutForm() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = (searchParams.get('plan') || 'silver').toLowerCase();
  const months = Number(searchParams.get('months') || 1);
  const durationMonths = [1, 3, 6, 12].includes(months) ? months : 1;

  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !canUseSubscriptions(user.role)) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/home');
    }
  }, [user, router]);

  useEffect(() => {
    const loadPlans = () => {
      api
        .get('/subscriptions/plans/')
        .then((res) => setPlans(extractPlans(res.data)))
        .catch(() => {});
    };
    loadPlans();
    const onFocus = () => loadPlans();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const total = useMemo(() => {
    const monthly = planPrice(plans, plan);
    return (monthly * durationMonths).toFixed(2);
  }, [plans, plan, durationMonths]);

  const handlePay = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error('Please login to upgrade subscription');
      router.push('/login');
      return;
    }
    if (!cardName.trim()) {
      toast.error(t('checkout.invalid_name'));
      return;
    }
    if (onlyDigits(cardNumber).length !== 16) {
      toast.error(t('checkout.invalid_card'));
      return;
    }
    if (!isValidExpiry(expiry)) {
      toast.error(t('checkout.invalid_expiry'));
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      toast.error(t('checkout.invalid_cvv'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/payments/mock/', {
        plan,
        duration_months: durationMonths,
        payment_method: 'card',
      });
      const payload = res.data || {};
      const planName = (payload.subscription_type || payload.plan || plan) as SubscriptionType;
      updateUser({
        ...(payload.user || {}),
        subscriptionType: planName,
        subscription_type: planName,
      });
      toast.success(t('checkout.success'));
      router.push('/subscriptions');
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || 'Payment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center pb-28">
          <p className="text-white">Please login to continue.</p>
        </main>
        <Player />
      </div>
    );
  }

  if (!canUseSubscriptions(user.role)) {
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center pb-28">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </main>
        <Player />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{t('checkout.title')}</h1>
          <p className="text-text-secondary mb-6">{t('checkout.subtitle')}</p>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 mb-6">
            <p className="text-text-secondary text-sm">
              {t('checkout.plan')}: <span className="text-white font-bold uppercase">{plan}</span>
            </p>
            <p className="text-text-secondary text-sm mt-1">
              {t('checkout.duration')}: <span className="text-white font-bold">{durationMonths}</span> {t('checkout.months')}
            </p>
            <p className="text-text-secondary text-sm mt-1">
              {t('checkout.total')}: <span className="text-primary font-bold">${total}</span>
            </p>
          </div>

          <form onSubmit={handlePay} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 space-y-4" data-testid="checkout-form">
            <div>
              <label className="block text-text-secondary text-sm mb-1">{t('checkout.card_name')}</label>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                data-testid="card-name"
                className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                placeholder="Ali Listener"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">{t('checkout.card_number')}</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                inputMode="numeric"
                data-testid="card-number"
                className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none tracking-widest"
                placeholder="ACCT-000015"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">{t('checkout.expiry')}</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  data-testid="card-expiry"
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                  placeholder="12/28"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">{t('checkout.cvv')}</label>
                <input
                  value={cvv}
                  onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                  data-testid="card-cvv"
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                  placeholder="123"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="pay-button"
              className="w-full py-3 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCardIcon className="w-5 h-5" />
              {loading ? t('checkout.processing') : t('checkout.pay')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/subscriptions')}
              className="w-full py-2 text-text-secondary hover:text-white transition"
            >
              {t('checkout.back')}
            </button>
          </form>
        </div>
      </main>
      <Player />
    </div>
  );
}
