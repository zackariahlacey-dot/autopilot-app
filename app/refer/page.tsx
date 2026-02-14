import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReferralCard from './ReferralCard';

async function ReferralContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get or create referral code
  let { data: referral } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', user.id)
    .single();

  if (!referral) {
    // Generate unique referral code
    const code = `${user.email?.split('@')[0]?.toUpperCase().slice(0, 6) || 'USER'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const { data: newReferral } = await supabase
      .from('referrals')
      .insert({ referrer_id: user.id, referral_code: code })
      .select('referral_code')
      .single();
    
    referral = newReferral;
  }

  // Get referral stats
  const { data: referrals, count: totalReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact' })
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const completedReferrals = referrals?.filter((r: any) => r.status === 'completed').length || 0;
  const totalEarned = completedReferrals * 20; // $20 per referral

  // Get wallet balance
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Garage
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
            <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Invite Friends, Earn Rewards
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Share AUTOPILOT with friends and you <strong>both</strong> get <span className="text-emerald-400 font-bold">$20 in CarCoins</span> toward your next service!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalReferrals || 0}</p>
            <p className="text-sm text-zinc-400">Friends Invited</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-cyan-950/50 backdrop-blur-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{completedReferrals}</p>
            <p className="text-sm text-zinc-400">Joined AUTOPILOT</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-orange-950/50 backdrop-blur-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{(wallet?.balance || 0) / 100}</p>
            <p className="text-sm text-zinc-400">CarCoins Balance</p>
          </div>
        </div>

        {/* Referral Card */}
        <ReferralCard referralCode={referral?.referral_code || ''} />

        {/* How It Works */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 rounded-full bg-purple-500" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Share Your Link</h3>
              <p className="text-sm text-zinc-400">
                Copy your unique referral link and share it with friends via text, email, or social media.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">They Sign Up</h3>
              <p className="text-sm text-zinc-400">
                When your friend signs up using your link, they get 50 CarCoins as a welcome bonus.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Both Get Rewarded</h3>
              <p className="text-sm text-zinc-400">
                You both receive an additional 20 CarCoins ($20 value) when they book their first service!
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        {referrals && referrals.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Referrals</h2>
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ref.status === 'completed' ? 'bg-emerald-500/20' : 'bg-zinc-700'
                    }`}>
                      <svg className={`w-5 h-5 ${ref.status === 'completed' ? 'text-emerald-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{ref.referred_user_id ? 'Friend joined!' : 'Pending'}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ref.status === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {ref.status === 'completed' ? '+$20 Earned' : 'Invited'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReferralPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    }>
      <ReferralContent />
    </Suspense>
  );
}
