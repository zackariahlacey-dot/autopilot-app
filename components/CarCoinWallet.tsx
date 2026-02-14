'use client';

import { useState } from 'react';
import Link from 'next/link';

type CarCoinWalletProps = {
  balance: number; // Balance in cents (100 = 1 CarCoin)
  userId: string;
};

export default function CarCoinWallet({ balance, userId }: CarCoinWalletProps) {
  const coins = balance / 100;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/80 to-orange-950/80 backdrop-blur-xl p-6 shadow-2xl shadow-amber-500/20 relative overflow-hidden">
      {/* Animated glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">CarCoin Wallet</h3>
              <p className="text-sm text-amber-300/80">Your rewards balance</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            <svg className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Balance Display */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {coins.toFixed(0)}
            </span>
            <span className="text-2xl text-amber-400">🪙</span>
          </div>
          <p className="text-amber-300/80 text-sm">
            = ${(coins).toFixed(2)} in service credits
          </p>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-amber-500/30 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30">
              <span className="text-zinc-300 text-sm">1 CarCoin</span>
              <span className="text-amber-400 font-semibold">= $1.00</span>
            </div>

            <Link
              href="/refer"
              className="block w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center font-semibold hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Invite Friends for +$20
              </span>
            </Link>

            <p className="text-xs text-center text-zinc-500 mt-2">
              Use CarCoins to get discounts on any service
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
