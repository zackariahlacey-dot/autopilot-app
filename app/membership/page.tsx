import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubscriptionCard from './SubscriptionCard';

async function MembershipContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get perk usage stats
  const { data: perkUsage } = await supabase
    .from('subscription_perks')
    .select('*')
    .eq('user_id', user.id);

  // Get wallet for cashback history
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const currentTier = subscription?.tier || 'free';
  const isGold = currentTier === 'gold';

  // Calculate total cashback earned
  const { data: cashbackTransactions } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'loyalty_reward');

  const totalCashback = cashbackTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-amber-950/20 to-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Garage
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
            <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            Autopilot Membership
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Unlock premium features and earn rewards on every service
          </p>
        </div>

        {/* Current Plan Banner */}
        {isGold && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/80 to-orange-950/80 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Autopilot Gold Member</h2>
                  <p className="text-amber-300">You're earning 5% cashback on every service!</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">${(totalCashback / 100).toFixed(2)}</p>
                <p className="text-sm text-zinc-400">Total Cashback Earned</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <SubscriptionCard
            tier="free"
            name="Free"
            price={0}
            color="zinc"
            features={[
              'Single vehicle tracking',
              'Basic AI assistant',
              'Service history',
              'Health monitoring',
              'Safety recall alerts',
            ]}
            currentTier={currentTier}
            isCurrent={currentTier === 'free'}
          />

          {/* Gold Tier */}
          <SubscriptionCard
            tier="gold"
            name="Autopilot Gold"
            price={19}
            color="amber"
            badge="POPULAR"
            features={[
              '5% cashback in CarCoins',
              'Priority AI chat support',
              'Automatic maintenance scheduling',
              'Multi-vehicle support (up to 5)',
              'Predictive maintenance alerts',
              'Price comparison across shops',
              'Monthly health reports',
            ]}
            currentTier={currentTier}
            isCurrent={currentTier === 'gold'}
            userId={user.id}
          />

          {/* Platinum Tier */}
          <SubscriptionCard
            tier="platinum"
            name="Autopilot Platinum"
            price={49}
            color="purple"
            badge="PREMIUM"
            features={[
              'Everything in Gold',
              '10% cashback in CarCoins',
              'Unlimited vehicles',
              'Concierge service',
              'White-glove maintenance',
              'Exclusive shop partnerships',
              'Annual detail service',
              'Roadside assistance',
            ]}
            currentTier={currentTier}
            isCurrent={currentTier === 'platinum'}
            userId={user.id}
          />
        </div>

        {/* Benefits Showcase */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why Upgrade to Gold?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Earn While You Drive</h3>
              <p className="text-zinc-400">
                Get 5% back in CarCoins on every service. $200 oil change? Get $10 back instantly.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Never Miss Maintenance</h3>
              <p className="text-zinc-400">
                AI monitors your mileage and auto-schedules services before you even think about it.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Fleet Management</h3>
              <p className="text-zinc-400">
                Track up to 5 vehicles with individual health scores and service schedules.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-zinc-400">Yes! Cancel anytime and keep access until your billing period ends.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <h3 className="text-lg font-semibold text-white mb-2">Do CarCoins expire?</h3>
              <p className="text-zinc-400">Never! Your CarCoins stay in your wallet forever.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <h3 className="text-lg font-semibold text-white mb-2">Can I use cashback immediately?</h3>
              <p className="text-zinc-400">Absolutely! Cashback appears instantly after service completion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading membership details...</div>
      </div>
    }>
      <MembershipContent />
    </Suspense>
  );
}
