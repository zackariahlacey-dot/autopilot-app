import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import Link from 'next/link';
import { mockGeocode } from '@/lib/geocoding';
import { GlobalSearch } from '@/components/GlobalSearch';
import SOSButton from '@/components/SOSButton';
import PageTransition from '@/components/animations/PageTransition';
import AnimatedCard from '@/components/animations/AnimatedCard';

async function HomeContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-tesla-black text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-electric-blue via-electric-cyan to-electric-blue bg-clip-text text-transparent animate-pulse">
                AUTOPILOT
              </h1>
              <p className="text-2xl text-zinc-400">
                Your vehicle's digital twin. Always connected.
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <AnimatedCard delay={0} className="text-left">
              <div className="w-12 h-12 rounded-xl bg-electric-blue/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-Time Health</h3>
              <p className="text-sm text-zinc-400">Track your vehicle's condition with live diagnostics</p>
            </AnimatedCard>

            <AnimatedCard delay={0.1} className="text-left">
              <div className="w-12 h-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Find Services</h3>
              <p className="text-sm text-zinc-400">Discover trusted mechanics on the map</p>
            </AnimatedCard>

            <AnimatedCard delay={0.2} className="text-left">
              <div className="w-12 h-12 rounded-xl bg-electric-teal/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant Booking</h3>
              <p className="text-sm text-zinc-400">Schedule service in seconds, pay online</p>
            </AnimatedCard>
          </div>

          <div className="flex gap-4 justify-center mt-12">
            <Link
              href="/auth/sign-up"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-electric-blue to-electric-cyan text-black font-bold hover:shadow-lg hover:shadow-electric-blue/50 transition-all active:scale-95"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 rounded-xl glass-card hover:bg-glass-hover text-white font-semibold transition-all active:scale-95"
            >
              Sign In
            </Link>
          </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Fetch user's primary vehicle
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  const primaryVehicle = vehicles?.[0];

  // Calculate vehicle health if we have a vehicle
  let vehicleHealth = null;
  if (primaryVehicle) {
    let oilLife = 100;
    if (primaryVehicle.last_oil_change && primaryVehicle.mileage && primaryVehicle.mileage_at_last_oil) {
      const milesSinceOil = primaryVehicle.mileage - primaryVehicle.mileage_at_last_oil;
      oilLife = Math.max(0, Math.min(100, 100 - (milesSinceOil / 5000 * 100)));
    } else if (primaryVehicle.last_oil_change) {
      const daysSinceOil = (Date.now() - new Date(primaryVehicle.last_oil_change).getTime()) / (1000 * 60 * 60 * 24);
      oilLife = Math.max(0, Math.min(100, 100 - (daysSinceOil / 90 * 100)));
    }

    let detailHealth = 100;
    if (primaryVehicle.last_detail) {
      const daysSinceDetail = (Date.now() - new Date(primaryVehicle.last_detail).getTime()) / (1000 * 60 * 60 * 24);
      detailHealth = Math.max(0, Math.min(100, 100 - (daysSinceDetail / 60 * 100)));
    }

    vehicleHealth = Math.round((oilLife * 0.6) + (detailHealth * 0.4));
  }

  // Fetch nearby businesses (verified only for list)
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, category, address')
    .eq('is_verified', true)
    .limit(3);

  const businessesWithDistance = businesses?.map(b => ({
    ...b,
    distance: Math.random() * 5 + 0.5, // Mock distance for now
  }));

  // Get marketplace stats
  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });

  const { count: totalServices } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true });

  // Get time of day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-cyan-950/20" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
        {/* Mission Control Header */}
        <header className="text-center space-y-4 pt-8">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            {timeGreeting}! {primaryVehicle ? `Your ${primaryVehicle.make} ${primaryVehicle.model} is at ${vehicleHealth}% Health` : 'Welcome to Mission Control'}
          </h1>
          <p className="text-zinc-400 text-lg">Your command center • Live status • Real-time diagnostics</p>
          
          {/* Marketplace Stats Ticker */}
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-zinc-400">{totalBusinesses || 0} Businesses nearby</span>
            </div>
            <div className="w-px h-4 bg-zinc-700"></div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span className="text-zinc-400">{totalServices || 0} Services available today</span>
            </div>
          </div>
        </header>

        {/* Vehicle Health Card (Top Row) */}
        {primaryVehicle && vehicleHealth !== null && (
          <Link
            href={`/garage/${primaryVehicle.id}`}
            className="block rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-8 hover:border-emerald-500/50 transition-all shadow-2xl shadow-emerald-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Primary Vehicle</p>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {primaryVehicle.make} {primaryVehicle.model}
                </h2>
                <p className="text-zinc-400">{primaryVehicle.year}</p>
              </div>
              
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="rgba(63, 63, 70, 0.3)" strokeWidth="8" fill="none" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    stroke="url(#healthGradient)" 
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${vehicleHealth * 3.52} 352`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {vehicleHealth}
                  </span>
                  <span className="text-zinc-500 text-sm">Health</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Global Search Bar */}
        <section className="py-4">
          <GlobalSearch />
          <p className="text-center text-zinc-500 text-xs mt-3">
            Ask anything: "I need brake service", "Where's the closest oil change?", "My car won't start"
          </p>
        </section>

        {/* Emergency SOS Button */}
        <section className="max-w-4xl mx-auto">
          <SOSButton />
        </section>

        {/* Quick Actions (Middle Row) */}
        <section>
          <h3 className="text-xl font-semibold text-zinc-200 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/diagnose"
              className="group p-6 rounded-2xl border border-zinc-800 bg-gradient-to-br from-purple-900/30 to-blue-900/30 hover:from-purple-900/50 hover:to-blue-900/50 hover:border-purple-500/50 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 flex items-center justify-center mb-4 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">AI Diagnose</h4>
                <p className="text-sm text-zinc-400">What's wrong?</p>
              </div>
            </Link>

            <Link
              href="/booking"
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-1">Book Service</h4>
              <p className="text-sm text-zinc-400">Schedule now</p>
            </Link>

            <Link
              href="/dashboard"
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-cyan-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-1">My Garage</h4>
              <p className="text-sm text-zinc-400">View vehicles</p>
            </Link>

            <Link
              href="/explore"
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-blue-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-1">Explore Map</h4>
              <p className="text-sm text-zinc-400">Find shops</p>
            </Link>
          </div>
        </section>

        {/* Nearby Services (Bottom Row) */}
        {businessesWithDistance && businessesWithDistance.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-zinc-200 mb-4">Nearby Services</h3>
            <div className="space-y-3">
              {businessesWithDistance.map((business) => (
                <Link
                  key={business.id}
                  href={`/shop/${business.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {business.name}
                      </h4>
                      <p className="text-sm text-zinc-500 capitalize">
                        {business.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">{business.distance.toFixed(1)} mi</p>
                    <p className="text-xs text-zinc-500">~{Math.round(business.distance * 3)} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
