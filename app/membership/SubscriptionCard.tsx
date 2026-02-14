'use client';

import { useState } from 'react';
import { haptics } from '@/lib/haptics';
import Image from 'next/image';

type SubscriptionCardProps = {
  tier: string;
  name: string;
  price: number;
  color: 'zinc' | 'amber' | 'purple';
  badge?: string;
  features: string[];
  currentTier: string;
  isCurrent: boolean;
  userId?: string;
};

export default function SubscriptionCard({
  tier,
  name,
  price,
  color,
  badge,
  features,
  currentTier,
  isCurrent,
  userId,
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (tier === 'free' || isCurrent) return;

    haptics.medium();
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          tier,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      haptics.error();
      alert('Failed to start subscription. Please try again.');
      setIsLoading(false);
    }
  };

  const colorClasses = {
    zinc: {
      border: 'border-zinc-700',
      bg: 'from-zinc-900 to-zinc-800',
      badge: 'bg-zinc-700 text-zinc-300',
      button: 'from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white',
      text: 'text-zinc-400',
      accent: 'text-zinc-300',
    },
    amber: {
      border: 'border-amber-500/50',
      bg: 'from-amber-950/50 to-orange-950/50',
      badge: 'bg-amber-500 text-black',
      button: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black',
      text: 'text-amber-200',
      accent: 'text-amber-400',
    },
    purple: {
      border: 'border-purple-500/50',
      bg: 'from-purple-950/50 to-pink-950/50',
      badge: 'bg-purple-500 text-white',
      button: 'from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white',
      text: 'text-purple-200',
      accent: 'text-purple-400',
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 ${classes.border} bg-gradient-to-br ${classes.bg} ${
        isCurrent ? 'ring-2 ring-offset-2 ring-offset-black ring-amber-500' : ''
      } transition-all hover:scale-[1.02]`}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full ${classes.badge} text-xs font-bold`}>
          {badge}
        </div>
      )}

      {/* Current Plan Indicator */}
      {isCurrent && (
        <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
          ACTIVE
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className={`text-2xl font-bold ${classes.accent}`}>{name}</h3>
          <div className="flex items-end justify-center gap-1">
            <span className="text-5xl font-bold text-white">${price}</span>
            <span className={`text-lg mb-2 ${classes.text}`}>/month</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <svg
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${classes.accent}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-sm ${classes.text}`}>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <button
          onClick={handleSubscribe}
          disabled={tier === 'free' || isCurrent || isLoading}
          className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 ${
            tier === 'free' || isCurrent
              ? 'bg-zinc-800 text-zinc-500 cursor-default'
              : `bg-gradient-to-r ${classes.button}`
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : isCurrent ? (
            'Current Plan'
          ) : tier === 'free' ? (
            'Free Forever'
          ) : (
            <>
              <Image
                src="/autopilot.png"
                alt="Autopilot"
                width={20}
                height={20}
                className="object-contain"
              />
              Upgrade to {name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
