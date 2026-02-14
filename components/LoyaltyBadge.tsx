'use client';

type LoyaltyBadgeProps = {
  rank: string;
  healthStreakDays: number;
  totalServices: number;
};

const RANK_CONFIG = {
  beginner: {
    name: 'Beginner',
    color: 'from-zinc-500 to-zinc-600',
    icon: '🚗',
    requirement: 'Start your journey',
  },
  pro_driver: {
    name: 'Pro Driver',
    color: 'from-blue-500 to-cyan-500',
    icon: '⭐',
    requirement: '100% health for 90 days',
  },
  expert: {
    name: 'Expert',
    color: 'from-purple-500 to-pink-500',
    icon: '👑',
    requirement: '100% health for 180 days',
  },
  legend: {
    name: 'Legend',
    color: 'from-amber-500 to-orange-500',
    icon: '🏆',
    requirement: '100% health for 365 days',
  },
};

export default function LoyaltyBadge({ rank, healthStreakDays, totalServices }: LoyaltyBadgeProps) {
  const config = RANK_CONFIG[rank as keyof typeof RANK_CONFIG] || RANK_CONFIG.beginner;
  
  // Calculate progress to next rank
  let nextRank = 'pro_driver';
  let daysNeeded = 90;
  let progressPercent = (healthStreakDays / 90) * 100;

  if (rank === 'pro_driver') {
    nextRank = 'expert';
    daysNeeded = 180;
    progressPercent = (healthStreakDays / 180) * 100;
  } else if (rank === 'expert') {
    nextRank = 'legend';
    daysNeeded = 365;
    progressPercent = (healthStreakDays / 365) * 100;
  } else if (rank === 'legend') {
    progressPercent = 100;
    daysNeeded = 365;
  }

  return (
    <div className={`rounded-2xl border-2 bg-gradient-to-br ${config.color} p-1 shadow-2xl relative overflow-hidden`}>
      {/* Animated shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
           style={{ animationDuration: '3s' }}></div>
      
      <div className="relative bg-zinc-950 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-3xl shadow-lg`}>
              {config.icon}
            </div>
            <div>
              <h3 className={`text-xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                {config.name}
              </h3>
              <p className="text-sm text-zinc-500">{config.requirement}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-zinc-900/50 p-3 border border-zinc-800">
            <p className="text-2xl font-bold text-white mb-1">
              {healthStreakDays}
              <span className="text-sm text-zinc-500 ml-1">days</span>
            </p>
            <p className="text-xs text-zinc-500">Health Streak</p>
          </div>
          <div className="rounded-xl bg-zinc-900/50 p-3 border border-zinc-800">
            <p className="text-2xl font-bold text-white mb-1">
              {totalServices}
              <span className="text-sm text-zinc-500 ml-1">total</span>
            </p>
            <p className="text-xs text-zinc-500">Services</p>
          </div>
        </div>

        {/* Progress to next rank */}
        {rank !== 'legend' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-400">
                Next: {RANK_CONFIG[nextRank as keyof typeof RANK_CONFIG].name}
              </p>
              <p className="text-xs text-zinc-500">
                {daysNeeded - healthStreakDays} days to go
              </p>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">Perks:</p>
          <div className="space-y-1">
            {rank === 'pro_driver' && (
              <>
                <p className="text-xs text-emerald-400">✓ 10% priority booking</p>
                <p className="text-xs text-emerald-400">✓ Exclusive deals</p>
              </>
            )}
            {rank === 'expert' && (
              <>
                <p className="text-xs text-purple-400">✓ 15% priority booking</p>
                <p className="text-xs text-purple-400">✓ VIP support</p>
                <p className="text-xs text-purple-400">✓ Free vehicle inspections</p>
              </>
            )}
            {rank === 'legend' && (
              <>
                <p className="text-xs text-amber-400">✓ 25% priority booking</p>
                <p className="text-xs text-amber-400">✓ Concierge service</p>
                <p className="text-xs text-amber-400">✓ Premium partner discounts</p>
                <p className="text-xs text-amber-400">✓ Lifetime warranty on services</p>
              </>
            )}
            {rank === 'beginner' && (
              <p className="text-xs text-zinc-500">Keep your car healthy to unlock perks!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
