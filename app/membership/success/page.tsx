'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { haptics } from '@/lib/haptics';

function MembershipSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [notificationShown, setNotificationShown] = useState(false);

  useEffect(() => {
    if (sessionId && !notificationShown && 'Notification' in window) {
      // Trigger success haptic
      haptics.success();

      // Request notification permission and send
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Welcome to Autopilot Gold! 🚀', {
            body: 'You now have access to 5% CarCoins cash back, Priority AI Chat, and Automatic Scheduling!',
            icon: '/autopilot.png',
            badge: '/autopilot.png',
            tag: 'gold-welcome',
          });
        }
      });

      setNotificationShown(true);
    }
  }, [sessionId, notificationShown]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full p-8 rounded-3xl bg-gradient-to-br from-amber-950/50 to-yellow-950/50 border-2 border-amber-500/50 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-full flex items-center justify-center mx-auto animate-bounce">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>

        {/* Welcome Message */}
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
            Welcome to Autopilot Gold! 🚀
          </h1>
          <p className="text-lg text-amber-200">
            Your subscription is now active. You've unlocked premium features!
          </p>
        </div>

        {/* Gold Perks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-amber-300 mb-1">5% Cash Back</h3>
            <p className="text-sm text-amber-200/70">Earn CarCoins on every service</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-amber-300 mb-1">Priority AI</h3>
            <p className="text-sm text-amber-200/70">Skip the queue with instant responses</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold text-amber-300 mb-1">Auto Schedule</h3>
            <p className="text-sm text-amber-200/70">AI books maintenance automatically</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all shadow-lg"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/assistant"
            className="px-8 py-4 rounded-xl bg-zinc-800 border border-amber-500/50 text-amber-300 font-semibold hover:bg-zinc-700 hover:border-amber-500 active:scale-95 transition-all"
          >
            Try Priority AI Chat
          </Link>
        </div>

        {/* Billing Info */}
        <p className="text-xs text-amber-300/60 pt-4">
          You'll be charged $19/month. Cancel anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="loading-spinner w-12 h-12" />
      </div>
    }>
      <MembershipSuccessContent />
    </Suspense>
  );
}
