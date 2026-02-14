import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from './actions';
import { Suspense } from 'react';
import Link from 'next/link';

async function BookingContent({ serviceId }: { serviceId?: string }) {
  const supabase = await createClient();
  
  // Fetch services (either specific service or all)
  let services;
  let error;
  
  if (serviceId) {
    const result = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId);
    services = result.data;
    error = result.error;
  } else {
    const result = await supabase.from('services').select('*');
    services = result.data;
    error = result.error;
  }
  
  if (error) {
    return <div className="text-red-500 p-8">Error loading services: {error.message}</div>;
  }

  // Fetch current user and their vehicles
  const { data: { user } } = await supabase.auth.getUser();
  const { data: vehicles } = user 
    ? await supabase.from('vehicles').select('id, make, model, year').eq('user_id', user.id)
    : { data: null };

  const hasVehicles = vehicles && vehicles.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {services?.map((service) => (
        <div key={service.id} className="p-8 rounded-3xl glass-card glass-card-hover border-white/10">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-semibold">{service.name}</h3>
            <div className="text-blue-400 font-mono">${service.price / 100}</div>
          </div>
          <p className="text-zinc-400 mb-8">{service.description}</p>
          
          {!hasVehicles ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
                <p className="text-amber-400 text-sm font-medium">
                  You need to add a vehicle to your garage before booking.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="block w-full py-4 rounded-xl bg-electric-blue/20 border border-electric-blue/40 text-electric-blue text-center font-bold hover:bg-electric-blue/30 transition tap-feedback"
              >
                Go to My Garage
              </Link>
            </div>
          ) : (
            <form action={createCheckoutSession}>
              <input type="hidden" name="serviceId" value={service.id} />
              
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                Select Vehicle
              </label>
              <select
                name="vehicleId"
                required
                className="w-full glass-card border-white/10 rounded-xl p-3 mb-6 focus:border-electric-blue/50 outline-none transition text-white"
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.year})
                  </option>
                ))}
              </select>
              
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                Select date
              </label>
              <input 
                type="date" 
                name="bookingDate"
                required
                className="w-full glass-card border-white/10 rounded-xl p-3 mb-6 focus:border-electric-blue/50 outline-none transition text-white color-scheme-dark"
              />
              
              <button 
                type="submit" 
                className="w-full py-4 rounded-xl bg-electric-blue text-white font-bold hover:bg-[#0060d3] transition shadow-lg shadow-electric-blue/20 tap-feedback"
              >
                Book Now
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingPage({ searchParams }: { searchParams: { service?: string } }) {
  const serviceId = searchParams.service;
  
  return (
    <div className="min-h-screen bg-tesla-black text-white p-8 flex flex-col items-center page-transition">
      <div className="max-w-4xl w-full space-y-12">
        <header className="text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
            Book Your Session
          </h1>
          <p className="text-zinc-400 mt-4 text-lg">Select a service to get started.</p>
        </header>
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
            <p className="text-zinc-400">Loading services...</p>
          </div>
        }>
          <BookingContent serviceId={serviceId} />
        </Suspense>
      </div>
    </div>
  );
}