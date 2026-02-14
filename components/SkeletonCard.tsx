'use client';

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 bg-white/10 rounded-lg mb-4 w-3/4" />
      <div className="h-4 bg-white/5 rounded mb-3" />
      <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
      <div className="h-4 bg-white/5 rounded w-1/2" />
    </div>
  );
}

export function SkeletonVehicleCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-6 bg-white/10 rounded-lg mb-2 w-48" />
          <div className="h-4 bg-white/5 rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonShopCard() {
  return (
    <div className="skeleton-card animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <div className="skeleton skeleton-text w-40" />
          <div className="skeleton skeleton-text w-24" />
        </div>
      </div>
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text w-2/3" />
      <div className="flex gap-2 mt-4">
        <div className="skeleton h-8 w-24 rounded-lg" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'vehicle' | 'shop' }) {
  const SkeletonComponent = type === 'vehicle' ? SkeletonVehicleCard : type === 'shop' ? SkeletonShopCard : SkeletonCard;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
