'use client';

import Link from 'next/link';
import { haptics } from '@/lib/haptics';

export default function SOSButton() {
  const handleClick = () => {
    haptics.emergency();
  };

  return (
    <Link
      href="/emergency"
      onClick={handleClick}
      className="block relative overflow-hidden p-6 md:p-8 rounded-2xl border-4 border-red-500 bg-gradient-to-br from-red-950 to-red-900 hover:border-red-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-red-500/30"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse" />
      <div className="relative z-10 flex items-center justify-center gap-4">
        <div className="w-16 h-16 md:w-14 md:h-14 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
          <span className="text-4xl md:text-3xl">🚨</span>
        </div>
        <div className="text-left">
          <h3 className="text-2xl md:text-xl font-bold text-white mb-1">EMERGENCY SOS</h3>
          <p className="text-red-200 text-base md:text-sm">Need immediate roadside assistance? Tap here</p>
        </div>
      </div>
    </Link>
  );
}
