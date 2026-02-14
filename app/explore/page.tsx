'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { mockGeocode } from '@/lib/geocoding';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse text-zinc-400">Loading map...</div>
    </div>
  ),
});

type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  is_verified: boolean;
};

type BusinessWithCoords = Business & {
  lat: number;
  lng: number;
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', icon: '🌐', category: null },
  { id: 'detailing', label: 'Wash', icon: '🧼', category: 'detailing' },
  { id: 'oil_change', label: 'Oil', icon: '🛢️', category: 'oil_change' },
  { id: 'mechanic', label: 'Repair', icon: '🔧', category: 'mechanic' },
  { id: 'tire_shop', label: 'Tires', icon: '🛞', category: 'tire_shop' },
  { id: 'body_shop', label: 'Body', icon: '🚗', category: 'body_shop' },
  { id: 'glass_repair', label: 'Glass', icon: '🪟', category: 'glass_repair' },
];

export default function ExplorePage() {
  const [businesses, setBusinesses] = useState<BusinessWithCoords[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchBusinesses = () => {
    setLoading(true);
    fetch('/api/businesses')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Array check before mapping
        if (!Array.isArray(data)) {
          console.error('API returned non-array data:', data);
          setBusinesses([]);
          setFilteredBusinesses([]);
          setLoading(false);
          return;
        }

        // Handle empty array
        if (data.length === 0) {
          console.warn('No businesses found in database');
          setBusinesses([]);
          setFilteredBusinesses([]);
          setLoading(false);
          return;
        }

        // Map businesses with coordinates
        const businessesWithCoords = data.map((b: Business) => ({
          ...b,
          ...mockGeocode(b.address),
        }));
        
        setBusinesses(businessesWithCoords);
        setFilteredBusinesses(businessesWithCoords);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch businesses:', err);
        // Fallback to empty array to prevent crash
        setBusinesses([]);
        setFilteredBusinesses([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Handle URL search params (from home page search)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Real-time search and category filtering
  useEffect(() => {
    let filtered = businesses;

    // Apply category filter first
    if (activeCategory) {
      filtered = filtered.filter((b) => b.category === activeCategory);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        return (
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().replace('_', ' ').includes(query) ||
          b.address.toLowerCase().includes(query)
        );
      });
    }

    setFilteredBusinesses(filtered);
  }, [searchQuery, activeCategory, businesses]);


  if (loading) {
    return (
      <div className="h-screen bg-tesla-black flex items-center justify-center">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-tesla-black text-white relative overflow-hidden flex page-transition">
      {/* Business List Sidebar */}
      <div className="w-96 h-full glass-nav border-r border-white/10 overflow-y-auto z-[999] shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="sticky top-0 glass-nav pb-4 -mt-6 pt-6 -mx-6 px-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white mb-1">Nearby Businesses</h2>
            <p className="text-sm text-zinc-400">
              {filteredBusinesses.filter(b => b.is_verified).length} verified • {filteredBusinesses.filter(b => !b.is_verified).length} unclaimed
            </p>
          </div>

          {/* Business Cards */}
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">No businesses found</p>
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={business.is_verified ? `/shop/${business.id}` : `/business/claim?business_id=${business.id}&name=${encodeURIComponent(business.name)}`}
                className={`block p-4 rounded-xl border transition-all glass-card-hover tap-feedback ${
                  business.is_verified
                    ? 'bg-electric-blue/10 border-electric-blue/50 shadow-lg shadow-electric-blue/10'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base leading-tight">
                        {business.name}
                      </h3>
                      {business.is_verified && (
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                      business.is_verified 
                        ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30' 
                        : 'bg-white/5 text-zinc-500 border border-white/10'
                    }`}>
                      {business.category.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <p className="text-zinc-400 text-sm flex items-start gap-1.5">
                  <svg className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="line-clamp-1">{business.address}</span>
                </p>

                {!business.is_verified && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Claim to start accepting bookings
                    </div>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 h-full relative">
        <MapView businesses={filteredBusinesses} />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-96 right-0 z-[1000] p-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Explore Services
              </h1>
              <p className="text-zinc-200 mt-1 drop-shadow">
                {filteredBusinesses.length} {searchQuery ? 'results' : 'businesses near you'}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl glass-card border-white/10 text-white hover:bg-white/10 transition-colors shadow-lg tap-feedback"
            >
              My Garage
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'Oil Change', 'Tire Shop', 'Brake Service'..."
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-card border-white/10 text-white placeholder-zinc-400 focus:border-electric-blue/50 focus:ring-2 focus:ring-electric-blue/20 outline-none transition shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors tap-feedback"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveCategory(activeCategory === filter.category ? null : filter.category)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  activeCategory === filter.category
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 hover:border-emerald-500/50'
                }`}
              >
                <span className="mr-1.5">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
