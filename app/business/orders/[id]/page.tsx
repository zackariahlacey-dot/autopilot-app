import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

async function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get business owned by this user
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    redirect('/business/register');
  }

  // Fetch booking with all related data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      date,
      status,
      created_at,
      user_id,
      vehicle_id,
      services (
        name,
        description,
        price
      ),
      vehicles (
        id,
        make,
        model,
        year,
        mileage,
        license_plate,
        last_oil_change,
        last_detail,
        mileage_at_last_oil
      )
    `)
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (bookingError || !booking) {
    notFound();
  }

  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;

  // Calculate vehicle health metrics
  let oilLife = 50;
  if (vehicle.last_oil_change && vehicle.mileage && vehicle.mileage_at_last_oil) {
    const milesSinceOil = vehicle.mileage - vehicle.mileage_at_last_oil;
    oilLife = Math.max(0, Math.min(100, 100 - (milesSinceOil / 5000 * 100)));
  } else if (vehicle.last_oil_change) {
    const daysSinceOil = (Date.now() - new Date(vehicle.last_oil_change).getTime()) / (1000 * 60 * 60 * 24);
    oilLife = Math.max(0, Math.min(100, 100 - (daysSinceOil / 90 * 100)));
  }

  let detailHealth = 60;
  if (vehicle.last_detail) {
    const daysSinceDetail = (Date.now() - new Date(vehicle.last_detail).getTime()) / (1000 * 60 * 60 * 24);
    detailHealth = Math.max(0, Math.min(100, 100 - (daysSinceDetail / 60 * 100)));
  }

  const vehicleHealth = Math.round((oilLife * 0.6) + (detailHealth * 0.4));

  // Fetch customer's service history for this vehicle
  const { data: serviceHistory } = await supabase
    .from('bookings')
    .select(`
      id,
      date,
      status,
      services (
        name,
        price
      )
    `)
    .eq('vehicle_id', vehicle.id)
    .eq('user_id', booking.user_id)
    .order('date', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-cyan-950/20" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Link
          href="/business/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Order Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Order #{id.substring(0, 8)}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              booking.status === 'confirmed' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(booking.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Service Details Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Service Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Service</span>
              <span className="text-white font-semibold">{service.name}</span>
            </div>
            {service.description && (
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">Description</span>
                <span className="text-zinc-300 text-right max-w-md">{service.description}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <span className="text-zinc-400">Total</span>
              <span className="text-emerald-400 font-bold text-xl">
                ${(service.price / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Twin HUD */}
        <div className="rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl p-8 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Vehicle HUD</h2>
              <p className="text-zinc-400 text-sm">Pre-service diagnostics</p>
            </div>
          </div>

          {/* Vehicle Header */}
          <div className="text-center space-y-2 mb-8 pb-6 border-b border-zinc-800">
            <h3 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-zinc-500 text-lg">{vehicle.year}</p>
          </div>

          {/* Health Score Circle */}
          <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900/30 to-zinc-950/30 p-6 mb-6">
            <div className="text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Vehicle Health Score</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="72" stroke="rgba(63, 63, 70, 0.3)" strokeWidth="8" fill="none" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="72" 
                    stroke="url(#healthGradientMechanic)" 
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${vehicleHealth * 4.52} 452`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="healthGradientMechanic" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold bg-gradient-to-br from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {vehicleHealth}
                  </span>
                  <span className="text-zinc-500 text-lg">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Mileage</p>
              <p className="text-lg font-semibold text-cyan-400">
                {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Oil Life</p>
              <p className="text-lg font-semibold text-white">{Math.round(oilLife)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Detail Status</p>
              <p className="text-lg font-semibold text-white">{Math.round(detailHealth)}%</p>
            </div>
            {vehicle.license_plate && (
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <p className="text-xs text-zinc-500 mb-1">License Plate</p>
                <p className="text-lg font-semibold text-white font-mono">{vehicle.license_plate}</p>
              </div>
            )}
          </div>

          {/* Service History Timeline */}
          <div className="rounded-xl bg-zinc-900/30 border border-zinc-800 p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-medium mb-4">
              Customer Service History
            </h3>
            
            {!serviceHistory || serviceHistory.length === 0 ? (
              <p className="text-center text-zinc-600 py-4">No previous service history</p>
            ) : (
              <div className="space-y-3">
                {serviceHistory.map((record, index) => {
                  const recordService = Array.isArray(record.services) ? record.services[0] : record.services;
                  return (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          record.status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">{recordService?.name || 'Service'}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading order details...</div>
      </div>
    }>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
