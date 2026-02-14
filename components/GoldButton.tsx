'use client';

import { useState } from 'react';
import Image from 'next/image';
import { haptics } from '@/lib/haptics';

export default function GoldButton({ tier = 'gold' }: { tier?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
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

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Image
            src="/autopilot.png"
            alt="Autopilot"
            width={24}
            height={24}
            className="object-contain"
          />
          Join Autopilot Gold - $19/mo
        </>
      )}
    </button>
  );
}
