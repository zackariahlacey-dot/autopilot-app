import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { addVehicleAction } from './actions';
import { SkeletonVehicleCard, SkeletonCard } from '@/components/SkeletonCard';
import PageTransition from '@/components/animations/PageTransition';

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year')
    .eq('user_id', user.id);

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      date,
      status,
      services (
        name,
        price
      ),
      vehicles (
        make,
        model,
        year
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  return (
    <PageTransition>
      <div className="min-h-screen bg-tesla-black text-white">
        <div className="max-w-4xl mx-auto p-8 space-y-12">
          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
                  My Garage
                </h1>
                <p className="text-zinc-400 mt-1">Manage your vehicles and service history</p>
              </div>
            <Link
              href="/booking"
              className="px-5 py-2.5 rounded-xl bg-electric-blue/20 border border-electric-blue/40 text-electric-blue font-medium hover:bg-electric-blue/30 transition-all active:scale-95"
            >
              Book Service
            </Link>
          </div>

          {/* Import Receipt CTA */}
          <Link
            href="/garage/import"
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-950/50 to-pink-950/50 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Scan Old Receipts
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/50">
                  GOLD
                </span>
              </h3>
              <p className="text-sm text-zinc-400">Import your service history with AI-powered scanning</p>
            </div>
            <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </header>

        {/* My Garage - Vehicles Grid */}
        <section className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-emerald-500" />
              My Fleet ({vehicles?.length || 0} {vehicles?.length === 1 ? 'Vehicle' : 'Vehicles'})
            </h2>
            <Link
              href="/membership"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
            >
              ⭐ Upgrade for 5+ Vehicles
            </Link>
          </div>

          {!vehicles || vehicles.length === 0 ? (
            <div className="space-y-6">
              <p className="text-zinc-500">No vehicles in your garage yet. Add your first vehicle to get started!</p>
              <form action={addVehicleAction} className="flex flex-wrap gap-4">
                <input
                  type="text"
                  name="make"
                  placeholder="Make (e.g. Toyota)"
                  required
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
                />
                <input
                  type="text"
                  name="model"
                  placeholder="Model (e.g. Camry)"
                  required
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
                />
                <input
                  type="text"
                  name="year"
                  placeholder="Year (e.g. 2023)"
                  required
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition w-24"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors"
                >
                  Add Vehicle
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/garage/${vehicle.id}`}
                className="block rounded-2xl glass-card glass-card-hover border-white/10 p-6 transition-all group relative overflow-hidden tap-feedback"
              >
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/0 to-electric-cyan/0 group-hover:from-electric-blue/10 group-hover:to-electric-cyan/10 transition-all duration-500"></div>
                  
                  <div className="relative z-10 space-y-4">
                    {/* Car Icon */}
                    <div className="w-14 h-14 rounded-full bg-electric-blue/20 flex items-center justify-center group-hover:bg-electric-blue/30 transition-all">
                      <svg className="w-7 h-7 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>

                    {/* Vehicle Info */}
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-electric-blue transition-colors mb-1">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-zinc-500 text-sm">{vehicle.year}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-xs text-zinc-500">Healthy</span>
                      </div>
                      <span className="text-zinc-700">•</span>
                      <span className="text-xs text-zinc-500">View HUD</span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <svg className="absolute bottom-4 right-4 w-6 h-6 text-zinc-700 group-hover:text-electric-blue transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}

              {/* Add Another Vehicle Card */}
              <div className="rounded-2xl border-2 border-dashed border-white/10 glass-card p-6 hover:border-electric-blue/50 hover:bg-white/10 transition-all group cursor-pointer tap-feedback">
                <form action={addVehicleAction} className="h-full flex flex-col justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-electric-blue/10 flex items-center justify-center group-hover:bg-electric-blue/20 transition-all mx-auto">
                    <svg className="w-7 h-7 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-1">Add Vehicle</h3>
                    <p className="text-sm text-zinc-500 mb-4">Track another car</p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="make"
                      placeholder="Make"
                      required
                      className="w-full px-3 py-2 rounded-lg glass-card border-white/10 text-white text-sm placeholder-zinc-500 focus:border-electric-blue/50 outline-none transition"
                    />
                    <input
                      type="text"
                      name="model"
                      placeholder="Model"
                      required
                      className="w-full px-3 py-2 rounded-lg glass-card border-white/10 text-white text-sm placeholder-zinc-500 focus:border-electric-blue/50 outline-none transition"
                    />
                    <input
                      type="number"
                      name="year"
                      placeholder="Year"
                      required
                      min="1900"
                      max="2099"
                      className="w-full px-3 py-2 rounded-lg glass-card border-white/10 text-white text-sm placeholder-zinc-500 focus:border-electric-blue/50 outline-none transition"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-electric-blue/20 border border-electric-blue/40 text-electric-blue font-medium hover:bg-electric-blue/30 transition-all text-sm tap-feedback"
                    >
                      Add to Fleet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* Service History - Bookings */}
        <section className="premium-card">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-cyan-500" />
            Service History
          </h2>

          {!bookings || bookings.length === 0 ? (
            <p className="text-zinc-500">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {bookings.map((b) => {
                const service = Array.isArray(b.services) ? b.services[0] : b.services;
                const serviceName = service?.name ?? 'Service';
                const vehicle = Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles;
                const vehicleInfo = vehicle ? `${vehicle.make} ${vehicle.model}` : 'No vehicle';
                return (
                  <li key={b.id} className="py-4 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-100">{serviceName}</p>
                        <span className="text-zinc-600">•</span>
                        <p className="text-sm text-zinc-400">{vehicleInfo}</p>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {new Date(b.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        b.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {b.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        </div>
      </div>
    </PageTransition>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tesla-black text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>

        {/* Vehicles Grid Skeleton */}
        <div className="premium-card">
          <div className="skeleton skeleton-title w-40 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonVehicleCard />
            <SkeletonVehicleCard />
            <SkeletonVehicleCard />
          </div>
        </div>

        {/* Service History Skeleton */}
        <div className="premium-card">
          <div className="skeleton skeleton-title w-40 mb-4" />
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
