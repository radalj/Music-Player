'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import { extractPlans, planPrice } from '@/utils/plans';
import { canUseSubscriptions, isSupportStaff } from '@/utils/roles';
import { SubscriptionType } from '@/types';
import { CheckIcon, SparklesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Plan {
  id: number;
  name: 'free' | 'silver' | 'gold';
  price: string | number;
  max_playlists: number;
  max_streams_per_day: number;
}

export default function SubscriptionsPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('silver');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [currentPlanName, setCurrentPlanName] = useState<string>('free');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!canUseSubscriptions(user.role)) {
      router.replace(isSupportStaff(user.role) ? '/admin/dashboard' : '/home');
      return;
    }
    setCurrentPlanName(user.subscriptionType || 'free');
  }, [user, router]);

  useEffect(() => {
    if (!user || !canUseSubscriptions(user.role)) return;
    api
      .get('/subscriptions/my-subscription/')
      .then((res) => {
        const name = res.data?.plan?.name;
        if (name) {
          setCurrentPlanName(name);
          updateUser({
            subscriptionType: name as SubscriptionType,
            subscription_type: name as SubscriptionType,
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans/');
        const mapped = extractPlans(res.data).map((p) => ({
          id: p.id,
          name: p.name as Plan['name'],
          price: p.price,
          max_playlists: p.max_playlists ?? 0,
          max_streams_per_day: p.max_streams_per_day ?? 0,
        }));
        if (mapped.length > 0) setPlans(mapped);
      } catch (e) {
        console.error('Error loading plans:', e);
      }
    };
    fetchPlans();
    const onFocus = () => fetchPlans();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const getPlanPrice = (planName: string) => {
    return (planPrice(plans, planName) * durationMonths).toFixed(2);
  };

  const handleUpgrade = () => {
    if (!user) {
      toast.error('Please login to upgrade subscription');
      router.push('/login');
      return;
    }

    if (selectedPlan === 'free') {
      toast.error('Free plan is already default');
      return;
    }

    router.push(`/checkout?plan=${encodeURIComponent(selectedPlan)}&months=${durationMonths}`);
  };

  if (!isMounted) {
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

  if (!user) {
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center pb-28">
          <p className="text-white">Please login to view subscriptions.</p>
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
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">⭐ Upgrade Your Subscription</h1>
            <p className="text-text-secondary">
              Unlock unlimited streams, higher playlist quotas, early access releases, and premium audio quality.
            </p>
            <div className="mt-4 inline-block bg-[#1a1a1a] border border-gray-800 rounded-full px-4 py-1.5 text-sm text-text-secondary">
              Current Plan: <span className="text-primary font-bold uppercase">{currentPlanName}</span>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-[#1a1a1a] border border-gray-800 p-1.5 rounded-xl flex gap-2">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setDurationMonths(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    durationMonths === m ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {m} Month{m > 1 ? 's' : ''} {m === 12 && ' (Best Value)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className={`bg-[#1a1a1a] border rounded-2xl p-6 flex flex-col justify-between ${
              selectedPlan === 'free' ? 'border-gray-500' : 'border-gray-800'
            }`}>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Base / Free</h3>
                <p className="text-text-secondary text-sm mb-4">Essential music streaming</p>
                <div className="text-3xl font-bold text-white mb-6">$0 <span className="text-xs text-text-secondary">/ forever</span></div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> Max 6 Playlists</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> 60 Streams / Day</li>
                  <li className="flex items-center gap-2 text-gray-500">🚫 Profile Picture Upload</li>
                  <li className="flex items-center gap-2 text-gray-500">🚫 Early Access Releases</li>
                </ul>
              </div>
              <button
                disabled
                className="mt-6 w-full py-2.5 bg-gray-800 text-gray-500 font-medium rounded-xl cursor-not-allowed"
              >
                Current Default
              </button>
            </div>

            <div className={`bg-[#1a1a1a] border rounded-2xl p-6 flex flex-col justify-between relative ${
              selectedPlan === 'silver' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-800'
            }`}>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Silver</h3>
                <p className="text-text-secondary text-sm mb-4">For active music enthusiasts</p>
                <div className="text-3xl font-bold text-white mb-6">
                  ${getPlanPrice('silver')} <span className="text-xs text-text-secondary">/ {durationMonths} mo</span>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> Max 100 Playlists</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> 100 Streams / Day</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> Custom Profile Picture</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-400" /> 📊 Artist stream analytics</li>
                  <li className="flex items-center gap-2 text-gray-500">🚫 Early Access Releases</li>
                </ul>
              </div>
              <button
                onClick={() => setSelectedPlan('silver')}
                className={`mt-6 w-full py-2.5 font-medium rounded-xl transition ${
                  selectedPlan === 'silver' ? 'bg-primary text-black' : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              >
                {selectedPlan === 'silver' ? 'Selected' : 'Choose Silver'}
              </button>
            </div>

            <div className={`bg-[#1a1a1a] border rounded-2xl p-6 flex flex-col justify-between relative ${
              selectedPlan === 'gold' ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-800'
            }`}>
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <SparklesIcon className="w-3.5 h-3.5" /> POPULAR
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-1">Gold</h3>
                <p className="text-text-secondary text-sm mb-4">Unlimited freedom & stats</p>
                <div className="text-3xl font-bold text-white mb-6">
                  ${getPlanPrice('gold')} <span className="text-xs text-text-secondary">/ {durationMonths} mo</span>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-yellow-400" /> Unlimited Playlists</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-yellow-400" /> Unlimited Streams</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-yellow-400" /> Custom Profile Picture</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-yellow-400" /> ⭐ Early Access Releases</li>
                  <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-yellow-400" /> 📊 Artist stream analytics</li>
                </ul>
              </div>
              <button
                onClick={() => setSelectedPlan('gold')}
                className={`mt-6 w-full py-2.5 font-medium rounded-xl transition ${
                  selectedPlan === 'gold' ? 'bg-yellow-400 text-black font-bold' : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              >
                {selectedPlan === 'gold' ? 'Selected' : 'Choose Gold'}
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-bold text-lg">Ready to upgrade?</h4>
              <p className="text-text-secondary text-sm">
                Selected: <span className="text-white font-bold uppercase">{selectedPlan}</span> for {durationMonths} month(s) — Total: <span className="text-primary font-bold">${getPlanPrice(selectedPlan)}</span>
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={selectedPlan === 'free'}
              className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCardIcon className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}
