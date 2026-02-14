'use client';

import { useState } from 'react';

type ReferralCardProps = {
  referralCode: string;
};

export default function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/sign-up?ref=${referralCode}`
    : `https://autopilot.app/auth/sign-up?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'Email',
      icon: '📧',
      href: `mailto:?subject=Join me on AUTOPILOT&body=Hey! I'm using AUTOPILOT to manage my car maintenance. Sign up with my link and we both get $20 in CarCoins: ${referralLink}`,
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=Just joined AUTOPILOT for car maintenance! Use my link and we both get $20 in CarCoins 🚗✨&url=${encodeURIComponent(referralLink)}`,
    },
    {
      name: 'Facebook',
      icon: '👥',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    },
  ];

  return (
    <div className="rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/80 to-pink-950/80 backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/20">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Referral Link</h2>
          <p className="text-zinc-300">Share this link with friends to start earning CarCoins!</p>
        </div>

        {/* Referral Code Display */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/50 border border-purple-500/30">
          <div className="flex-1 overflow-x-auto">
            <code className="text-purple-300 font-mono text-sm whitespace-nowrap">
              {referralLink}
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold transition-all"
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>

        {/* Quick Share Buttons */}
        <div>
          <p className="text-sm text-zinc-400 mb-3">Or share directly:</p>
          <div className="flex gap-3">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-purple-500/50 hover:bg-zinc-800 transition-all group"
              >
                <span className="text-3xl">{option.icon}</span>
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
                  {option.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Referral Code Badge */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-purple-500/20">
          <span className="text-zinc-400 text-sm">Your referral code:</span>
          <span className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 font-mono font-bold">
            {referralCode}
          </span>
        </div>
      </div>
    </div>
  );
}
