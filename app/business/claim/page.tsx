import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { claimBusinessWithRedirect } from './actions';

async function ClaimBusinessContent({ 
  searchParams 
}: { 
  searchParams: Promise<{ business_id?: string; name?: string }> 
}) {
  const params = await searchParams;
  const businessId = params.business_id;
  const businessName = params.name;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user already has a business
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (existingBusiness) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Already Registered</h2>
          <p className="text-zinc-400">
            You already have a business registered: <span className="text-emerald-400 font-semibold">{existingBusiness.name}</span>
          </p>
          <a
            href="/business/dashboard"
            className="block w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!businessId || !businessName) {
    redirect('/explore');
  }

  // Fetch business details
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (!business || business.is_verified) {
    redirect('/explore');
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-black to-orange-950/20" />
      
      <div className="relative z-10 max-w-2xl mx-auto p-8 space-y-8">
        <header className="text-center space-y-3 pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Claim Your Business
          </h1>
          <p className="text-zinc-400">Join AUTOPILOT and start taking bookings</p>
        </header>

        {/* Business Info Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-orange-950/30 p-6">
          <p className="text-xs uppercase text-zinc-500 mb-3">You're claiming</p>
          <h2 className="text-2xl font-bold text-white mb-2">{business.name}</h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {business.address}
          </div>
        </div>

        {/* Claim Form */}
        <form action={claimBusinessWithRedirect} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <input type="hidden" name="businessId" value={businessId} />
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Verify Ownership</h3>
            <p className="text-sm text-zinc-400 mb-6">
              To claim this business, please provide verification details. Our team will review and activate your account within 24 hours.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-2">
              Business Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-2">
              Website (Optional)
            </label>
            <input
              type="url"
              id="website"
              name="website"
              placeholder="https://yourbusiness.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Tell us about your role at this business..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition resize-none"
            />
          </div>

          <div className="flex gap-3">
            <a
              href="/explore"
              className="flex-1 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors text-center"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 transition-all"
            >
              Submit Claim Request
            </button>
          </div>
        </form>

        {/* Benefits */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4">Why join AUTOPILOT?</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Accept online bookings 24/7
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Get paid instantly via Stripe
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              View customer vehicle health before service
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Appear on our live map for all users
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ClaimBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ business_id?: string; name?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    }>
      <ClaimBusinessContent searchParams={searchParams} />
    </Suspense>
  );
}
