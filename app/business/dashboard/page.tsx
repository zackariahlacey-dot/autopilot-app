import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { addService, updateBookingStatus } from './actions';

async function BusinessDashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get the user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, category, address')
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    redirect('/business/register');
  }

  // Fetch services for this business
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, price')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  // Fetch bookings for revenue and upcoming count
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, date, services!inner(business_id, price)')
    .eq('services.business_id', business.id);

  // Calculate revenue from confirmed bookings (status: 'confirmed')
  const totalRevenue = bookings
    ?.filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => {
      const service = Array.isArray(b.services) ? b.services[0] : b.services;
      return sum + (service?.price || 0);
    }, 0) || 0;

  // Count upcoming confirmed bookings
  const upcomingBookings = bookings
    ?.filter((b) => new Date(b.date) >= new Date() && b.status === 'confirmed')
    .length || 0;

  // Get upcoming bookings for list
  const upcomingBookingsList = bookings
    ?.filter((b) => new Date(b.date) >= new Date() && b.status === 'confirmed')
    .slice(0, 5) || [];

  // Fetch transactions for monthly revenue chart
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, completed_at')
    .eq('business_id', business.id)
    .order('completed_at', { ascending: false });

  // Calculate monthly revenue for last 6 months
  const monthlyRevenue: Record<string, number> = {};
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyRevenue[key] = 0;
  }

  transactions?.forEach((t) => {
    const month = new Date(t.completed_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (monthlyRevenue[month] !== undefined) {
      monthlyRevenue[month] += t.amount;
    }
  });

  const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1);

  // Fetch marketplace jobs (Live Leads)
  const { data: marketplaceJobs } = await supabase
    .from('marketplace_jobs')
    .select(`
      *,
      marketplace_quotes!left(id, quoted_price, business_id),
      vehicles(make, model, year)
    `)
    .eq('category', business.category)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);

  // Filter out jobs we've already quoted
  const availableLeads = marketplaceJobs?.filter(job => {
    const hasQuoted = job.marketplace_quotes?.some((q: any) => q.business_id === business.id);
    return !hasQuoted;
  }) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Business Dashboard
          </h1>
          <p className="text-zinc-400">{business.name} • {business.category}</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-white">${(totalRevenue / 100).toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Upcoming Bookings</h3>
            </div>
            <p className="text-3xl font-bold text-white">{upcomingBookings}</p>
          </div>
        </div>

        {/* Live Leads Section */}
        <section className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-orange-950/30 backdrop-blur-xl p-6 shadow-2xl shadow-amber-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  🔴 Live Leads
                </h2>
                <p className="text-sm text-amber-300/80">New quote requests from customers nearby</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50">
              <span className="text-amber-300 font-bold">{availableLeads.length} Available</span>
            </div>
          </div>

          {availableLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No new leads at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableLeads.map((job) => (
                <div key={job.id} className="rounded-xl border border-amber-500/30 bg-zinc-900/50 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{job.service_type}</h3>
                      {job.vehicles && (
                        <p className="text-sm text-zinc-400">
                          {job.vehicles.year} {job.vehicles.make} {job.vehicles.model}
                        </p>
                      )}
                      {job.description && (
                        <p className="text-sm text-zinc-300 mt-2">{job.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        job.urgency === 'urgent' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                          : 'bg-zinc-700 text-zinc-300'
                      }`}>
                        {job.urgency}
                      </span>
                    </div>
                  </div>

                  {/* Quote Form */}
                  <form action={async (formData: FormData) => {
                    'use server';
                    const { submitQuote } = await import('./marketplace-actions');
                    await submitQuote(formData);
                  }} className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="businessId" value={business.id} />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Your Quote ($)</label>
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          min="0"
                          required
                          placeholder="150.00"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Duration (min)</label>
                        <input
                          type="number"
                          name="duration"
                          min="15"
                          step="15"
                          placeholder="60"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Message to Customer</label>
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="We can fit you in tomorrow! Free brake inspection included."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
                    >
                      📤 Send Quote
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Monthly Revenue Chart */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-cyan-500" />
            Monthly Revenue
          </h2>
          
          <div className="space-y-4">
            {Object.entries(monthlyRevenue).map(([month, amount]) => {
              const percentage = maxRevenue > 0 ? (amount / maxRevenue) * 100 : 0;
              return (
                <div key={month}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400 font-medium">{month}</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      ${(amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 bg-zinc-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    >
                      {amount > 0 && (
                        <span className="text-xs font-semibold text-white drop-shadow-lg">
                          ${(amount / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Service Management */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            Your Services
          </h2>

          {!services || services.length === 0 ? (
            <p className="text-zinc-500 mb-6">No services yet. Add your first service below.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 mb-6">
              {services.map((s) => (
                <li key={s.id} className="py-4 first:pt-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-100">{s.name}</p>
                    {s.description && <p className="text-sm text-zinc-500 mt-1">{s.description}</p>}
                  </div>
                  <span className="text-emerald-400 font-semibold">${(s.price / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          <form action={addService} className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300">Add New Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Service Name"
                required
                className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
              />
              <input
                type="text"
                name="description"
                placeholder="Description (optional)"
                className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  name="price"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <input
                type="number"
                name="duration"
                placeholder="Duration (minutes)"
                min="1"
                required
                className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                Add Service
              </button>
            </div>
          </form>
        </section>

        {/* Upcoming Bookings List */}
        {upcomingBookingsList.length > 0 && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-cyan-500" />
              Upcoming Orders
            </h2>
            <div className="space-y-3">
              {upcomingBookingsList.map((booking: any) => {
                const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
                const statusColors: Record<string, string> = {
                  confirmed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                };
                
                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <Link 
                        href={`/business/orders/${booking.id}`}
                        className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {service?.name || 'Service'}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </Link>
                      
                      <div className="text-right">
                        <span className="text-emerald-400 font-semibold block mb-1">
                          ${(service?.price / 100).toFixed(2)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || 'bg-zinc-700 text-zinc-300'}`}>
                          {booking.status === 'in_progress' ? 'In Progress' : booking.status === 'ready' ? 'Ready' : 'Confirmed'}
                        </span>
                      </div>
                    </div>

                    {/* Status Control Buttons */}
                    <div className="flex gap-2">
                      {booking.status === 'confirmed' && (
                        <form action={updateBookingStatus} className="flex-1">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="newStatus" value="in_progress" />
                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            🔧 Start Job
                          </button>
                        </form>
                      )}
                      
                      {booking.status === 'in_progress' && (
                        <form action={updateBookingStatus} className="flex-1">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="newStatus" value="ready" />
                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                          >
                            ✓ Ready for Pickup
                          </button>
                        </form>
                      )}
                      
                      {booking.status === 'ready' && (
                        <form action={updateBookingStatus} className="flex-1">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="newStatus" value="completed" />
                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                          >
                            🏁 Mark Completed
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading dashboard...</div>
      </div>
    }>
      <BusinessDashboardContent />
    </Suspense>
  );
}
