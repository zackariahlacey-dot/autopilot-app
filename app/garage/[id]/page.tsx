import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { UpdateStatsForm } from './UpdateStatsForm';
import CarCoinWallet from '@/components/CarCoinWallet';
import LoyaltyBadge from '@/components/LoyaltyBadge';
import GenerateReportButton from '@/components/GenerateReportButton';
import { fetchSafetyRecalls } from './actions';

async function VehicleHUD({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch vehicle with maintenance data
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (vehicleError || !vehicle) {
    notFound();
  }

  // Fetch service history for THIS specific vehicle
  const { data: bookings } = await supabase
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
    .eq('vehicle_id', id)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  // SMART OIL LIFE CALCULATION
  let oilLife = 100;
  if (vehicle.last_oil_change && vehicle.mileage && vehicle.mileage_at_last_oil) {
    const milesSinceOil = vehicle.mileage - vehicle.mileage_at_last_oil;
    oilLife = Math.max(0, Math.min(100, 100 - (milesSinceOil / 5000 * 100)));
  } else if (vehicle.last_oil_change) {
    const daysSinceOil = (Date.now() - new Date(vehicle.last_oil_change).getTime()) / (1000 * 60 * 60 * 24);
    oilLife = Math.max(0, Math.min(100, 100 - (daysSinceOil / 90 * 100)));
  } else {
    oilLife = 50; // Default if no data
  }

  // TIRE HEALTH CALCULATION
  let tireHealth = 100;
  const lastTireService = bookings?.find(b => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    return service?.name?.toLowerCase().includes('tire');
  });
  if (lastTireService) {
    const daysSinceTire = (Date.now() - new Date(lastTireService.date).getTime()) / (1000 * 60 * 60 * 24);
    tireHealth = Math.max(0, Math.min(100, 100 - (daysSinceTire / 180 * 100)));
  } else {
    tireHealth = 75; // Default if no tire service recorded
  }

  // DETAIL STATUS CALCULATION
  let detailHealth = 100;
  if (vehicle.last_detail) {
    const daysSinceDetail = (Date.now() - new Date(vehicle.last_detail).getTime()) / (1000 * 60 * 60 * 24);
    detailHealth = Math.max(0, Math.min(100, 100 - (daysSinceDetail / 60 * 100)));
  } else {
    detailHealth = 60; // Default if never detailed
  }

  // VEHICLE HEALTH SCORE - Weighted Average
  const healthScore = Math.round(
    (oilLife * 0.5) + (tireHealth * 0.3) + (detailHealth * 0.2)
  );

  // Fetch NHTSA Safety Recalls
  const recallsData = await fetchSafetyRecalls(vehicle.make, vehicle.model, vehicle.year);
  const recalls = recallsData.success ? recallsData.recalls : [];

  // Calculate Total Investment (sum of all transactions for this vehicle)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('vehicle_id', id)
    .eq('user_id', user.id);

  const totalInvestment = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Get user's CarCoin wallet
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  // Get user's loyalty rank
  const { data: loyaltyRank } = await supabase
    .from('loyalty_ranks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch full transaction history for digital logbook
  const { data: fullTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('vehicle_id', id)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  // Calculate predictive maintenance milestones
  const currentMileage = vehicle.mileage || 0;
  const predictiveMaintenance = [];
  
  // Major service intervals
  if (currentMileage < 60000) {
    predictiveMaintenance.push({
      mileage: 60000,
      service: 'Major Service (Transmission Flush & Spark Plugs)',
      estimatedCost: 45000,
    });
  }
  if (currentMileage < 100000) {
    predictiveMaintenance.push({
      mileage: 100000,
      service: '100K Mile Service (Timing Belt & Full Inspection)',
      estimatedCost: 85000,
    });
  }
  
  // Regular maintenance reminders
  const milesSinceLastOil = vehicle.mileage_at_last_oil ? currentMileage - vehicle.mileage_at_last_oil : 5000;
  if (milesSinceLastOil < 5000) {
    const nextOilMileage = currentMileage + (5000 - milesSinceLastOil);
    predictiveMaintenance.push({
      mileage: nextOilMileage,
      service: 'Oil Change',
      estimatedCost: 5500,
    });
  }
  
  predictiveMaintenance.sort((a, b) => a.mileage - b.mileage);

  // Check for active booking
  const activeBooking = bookings?.find(b => 
    b.status === 'in_progress' || b.status === 'ready' || b.status === 'confirmed'
  );

  // Calculate progress percentage based on status
  let progressPercent = 0;
  let progressLabel = '';
  let progressColor = '';
  
  if (activeBooking) {
    if (activeBooking.status === 'confirmed') {
      progressPercent = 25;
      progressLabel = 'Booking Confirmed';
      progressColor = 'from-amber-500 to-orange-500';
    } else if (activeBooking.status === 'in_progress') {
      progressPercent = 60;
      progressLabel = 'Service In Progress';
      progressColor = 'from-blue-500 to-cyan-500';
    } else if (activeBooking.status === 'ready') {
      progressPercent = 90;
      progressLabel = 'Ready for Pickup';
      progressColor = 'from-emerald-500 to-green-500';
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-cyan-950/20" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {/* Header with Back Button and Generate Report */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Garage
          </Link>
          
          {/* Generate Report Button */}
          <GenerateReportButton 
            vehicleId={id} 
            vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
        </div>

        {/* Live Status Progress Bar */}
        {activeBooking && (
          <div className="rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl p-6 shadow-2xl shadow-cyan-500/20 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-1">🔴 LIVE STATUS</h3>
                <p className="text-sm text-zinc-400">
                  {(() => {
                    const service = Array.isArray(activeBooking.services) 
                      ? activeBooking.services[0] 
                      : activeBooking.services;
                    return service && typeof service === 'object' && 'name' in service 
                      ? service.name 
                      : 'Service';
                  })()} • Scheduled for {new Date(activeBooking.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{progressPercent}%</p>
                <p className="text-xs text-zinc-400">Complete</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-1000 rounded-full relative`}
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className={`${progressPercent >= 25 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                ✓ Confirmed
              </span>
              <span className={`${progressPercent >= 60 ? 'text-cyan-400' : 'text-zinc-600'}`}>
                {progressPercent >= 60 ? '✓' : '○'} In Progress
              </span>
              <span className={`${progressPercent >= 90 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {progressPercent >= 90 ? '✓' : '○'} Ready
              </span>
            </div>

            <p className="text-center mt-4 text-lg font-semibold text-white">
              {progressLabel}
            </p>
          </div>
        )}

        {/* Vehicle Header with Update Button */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-zinc-500 text-lg mt-2">{vehicle.year}</p>
          </div>
          <UpdateStatsForm vehicleId={id} currentMileage={vehicle.mileage} />
        </header>

        {/* Safety Recalls Alert (if any) */}
        {recalls.length > 0 && (
          <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/30 backdrop-blur-xl p-6 shadow-2xl shadow-red-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  {recalls.length} Active Safety Recall{recalls.length > 1 ? 's' : ''}
                </h3>
                <p className="text-red-300/80 text-sm mb-4">
                  This vehicle has open recalls from the manufacturer. Contact your dealer immediately.
                </p>
                <div className="space-y-3">
                  {recalls.slice(0, 3).map((recall) => (
                    <div key={recall.NHTSACampaignNumber} className="rounded-xl bg-red-950/50 border border-red-500/30 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-red-200">{recall.Component}</h4>
                        <span className="text-xs font-mono text-red-400/60">#{recall.NHTSACampaignNumber}</span>
                      </div>
                      <p className="text-xs text-red-300/70 mb-2">{recall.Subject}</p>
                      <p className="text-xs text-red-200/60 leading-relaxed">
                        <strong>Risk:</strong> {recall.Consequence || recall.Summary}
                      </p>
                    </div>
                  ))}
                  {recalls.length > 3 && (
                    <p className="text-xs text-red-400/60 text-center pt-2">
                      + {recalls.length - 3} more recall{recalls.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Score - Large Center Display */}
        <div className="relative rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl p-8 shadow-2xl shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl" />
          <div className="relative text-center space-y-4">
            <p className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Vehicle Health Score</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="rgba(63, 63, 70, 0.3)" strokeWidth="8" fill="none" />
                <circle 
                  cx="96" 
                  cy="96" 
                  r="88" 
                  stroke="url(#healthGradient)" 
                  strokeWidth="8" 
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore * 5.53} 553`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${healthScore < 70 ? 'animate-pulse' : ''}`}>
                <span className="text-6xl font-bold bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {healthScore}
                </span>
                <span className="text-zinc-500 text-lg">%</span>
              </div>
            </div>
            <p className={`font-medium ${healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-cyan-400' : healthScore >= 40 ? 'text-amber-400' : 'text-red-400'} ${healthScore < 70 ? 'animate-pulse' : ''}`}>
              {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention'}
            </p>
          </div>
        </div>

        {/* CarCoin Wallet & Loyalty Badge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {wallet && (
            <CarCoinWallet balance={wallet.balance} userId={user.id} />
          )}
          {loyaltyRank && (
            <LoyaltyBadge 
              rank={loyaltyRank.current_rank}
              healthStreakDays={loyaltyRank.health_streak_days || 0}
              totalServices={loyaltyRank.total_services || 0}
            />
          )}
        </div>

        {/* Total Investment Card */}
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-orange-950/50 backdrop-blur-xl p-8 shadow-2xl shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-amber-400/60 font-medium mb-2">Total Investment</p>
              <h3 className="text-5xl font-bold text-white mb-1">
                ${(totalInvestment / 100).toFixed(2)}
              </h3>
              <p className="text-amber-400 text-sm">Building your vehicle's value</p>
            </div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border-2 border-amber-500/30">
              <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Progress Bars & Stats */}
          <div className="space-y-6">
            {/* Oil Life */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Oil Life</h3>
                <span className="text-2xl font-bold text-emerald-400">{Math.round(oilLife)}%</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${oilLife}%` }}
                />
              </div>
            </div>

            {/* Tire Rotation */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Tire Health</h3>
                <span className="text-2xl font-bold text-cyan-400">{Math.round(tireHealth)}%</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${tireHealth}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
              <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-medium mb-4">Vehicle Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-1">Make</p>
                  <p className="text-lg font-semibold text-white">{vehicle.make}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-1">Model</p>
                  <p className="text-lg font-semibold text-white">{vehicle.model}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-1">Year</p>
                  <p className="text-lg font-semibold text-white">{vehicle.year}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-1">Mileage</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'}
                  </p>
                </div>
                {vehicle.license_plate && (
                  <div className="p-4 rounded-xl bg-zinc-800/50 col-span-2">
                    <p className="text-xs text-zinc-500 mb-1">License Plate</p>
                    <p className="text-lg font-semibold text-white font-mono">{vehicle.license_plate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Digital Logbook - Past & Future */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-medium mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Digital Logbook
            </h3>
            
            <div className="relative space-y-6">
              {/* Continuous timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 via-zinc-600 to-zinc-800" />
              
              {/* Past Services */}
              {fullTransactions && fullTransactions.length > 0 && fullTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 border-2 border-emerald-500">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <Link href={`/receipt/${transaction.id}`} className="block group">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 hover:bg-emerald-950/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{transaction.service_name}</h4>
                        <span className="text-emerald-400 font-semibold text-sm">
                          ${(transaction.amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {new Date(transaction.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}

              {/* Present - "You are here" marker */}
              <div className="relative pl-12">
                <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/30 border-2 border-cyan-400 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                </div>
                <div className="rounded-xl border-2 border-cyan-500/50 bg-cyan-950/30 p-4">
                  <p className="text-cyan-400 font-semibold text-sm">📍 Current Status</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Mileage not tracked'}
                  </p>
                </div>
              </div>

              {/* Future Reminders */}
              {predictiveMaintenance.length > 0 && predictiveMaintenance.slice(0, 2).map((reminder, idx) => (
                <div key={`future-${idx}`} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center bg-zinc-700/50 border-2 border-zinc-600 border-dashed">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="rounded-xl border border-zinc-700 border-dashed bg-zinc-900/30 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-zinc-300">{reminder.service}</h4>
                      <span className="text-zinc-500 font-semibold text-sm">
                        ${(reminder.estimatedCost / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-3">
                      Due at: {reminder.mileage.toLocaleString()} miles
                      {vehicle.mileage && (
                        <span className="ml-2 text-xs">({(reminder.mileage - vehicle.mileage).toLocaleString()} miles away)</span>
                      )}
                    </p>
                    <Link
                      href="/booking"
                      className="inline-block text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-cyan-400 transition-colors"
                    >
                      Reserve Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Maintenance Section */}
        {predictiveMaintenance.length > 0 && (
          <div className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/50 to-purple-950/50 backdrop-blur-xl p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Predictive Maintenance</h3>
                <p className="text-sm text-zinc-400">AI-powered service recommendations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictiveMaintenance.slice(0, 4).map((item, idx) => (
                <div key={`pred-${idx}`} className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-5 hover:bg-blue-950/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{item.service}</h4>
                      <p className="text-sm text-blue-400">
                        At {item.mileage.toLocaleString()} miles
                        {vehicle.mileage && (
                          <span className="text-zinc-500 ml-2">
                            ({(item.mileage - vehicle.mileage).toLocaleString()} miles)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        ${(item.estimatedCost / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">estimated</p>
                    </div>
                  </div>
                  <Link
                    href="/booking"
                    className="block w-full text-center py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                  >
                    Reserve Now • Lock Today's Price
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center pt-4">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Book Service
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading vehicle data...</div>
      </div>
    }>
      <VehicleHUD params={params} />
    </Suspense>
  );
}
