'use client';

import { useState } from 'react';
import { simulatePayment } from '@/app/garage/[id]/payment-actions';

type PayNowButtonProps = {
  bookingId: string;
  amount: number;
  serviceName: string;
};

export default function PayNowButton({ bookingId, amount, serviceName }: PayNowButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    setMessage('');

    try {
      const result = await simulatePayment(bookingId);

      if (result.error) {
        setMessage(`❌ ${result.error}`);
        setIsProcessing(false);
      } else {
        setMessage('✅ Payment successful! Refreshing...');
        // Refresh the page after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setMessage('❌ Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 text-white font-bold text-sm hover:from-emerald-400 hover:via-cyan-400 hover:to-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            💳 Pay Now - ${(amount / 100).toFixed(2)}
          </span>
        )}
      </button>

      {message && (
        <p className={`text-sm text-center ${message.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}

      <p className="text-xs text-center text-zinc-500">
        Simulated Stripe payment for {serviceName}
      </p>
    </div>
  );
}
