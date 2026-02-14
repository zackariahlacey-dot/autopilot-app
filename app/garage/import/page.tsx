import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReceiptScanner from './ReceiptScanner';

async function ImportContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  const isGold = subscription?.tier === 'gold' || subscription?.tier === 'platinum';

  // Get user's vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">No Vehicles Found</h2>
          <p className="text-zinc-400">Add a vehicle to your garage before importing service history.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors"
          >
            Go to Garage
          </Link>
        </div>
      </div>
    );
  }

  // Count existing scans (for free tier limit)
  const { count: scanCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'imported_receipt');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Garage
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4 relative">
            <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isGold && (
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center border-2 border-zinc-950">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            )}
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            AI Receipt Scanner
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Import your service history instantly by scanning old receipts
          </p>
          
          {!isGold && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700 text-sm">
              <span className="text-zinc-400">Free users:</span>
              <span className="text-white font-semibold">{Math.max(0, 1 - (scanCount || 0))} scan remaining</span>
              <Link href="/membership" className="text-amber-400 hover:text-amber-300 font-semibold">
                Upgrade →
              </Link>
            </div>
          )}
        </div>

        {/* Scanner Component */}
        <ReceiptScanner 
          vehicles={vehicles}
          userId={user.id}
          isGold={isGold}
          scanCount={scanCount || 0}
        />

        {/* Features */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Upload Receipt</h3>
              <p className="text-sm text-zinc-400">
                Take a photo or upload an old service receipt from any shop.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">AI Extraction</h3>
              <p className="text-sm text-zinc-400">
                Our AI scans the receipt and extracts service, date, price, and shop info.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Auto-Add to History</h3>
              <p className="text-sm text-zinc-400">
                Confirm the details and it's instantly added to your Digital Logbook.
              </p>
            </div>
          </div>
        </div>

        {/* Gold Upsell (for free users) */}
        {!isGold && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/80 to-orange-950/80 backdrop-blur-xl p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Unlock Unlimited Scanning with Gold</h3>
                  <p className="text-amber-200">
                    Import your entire service history and never lose track of maintenance again.
                  </p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-amber-100">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited receipt scans
                  </li>
                  <li className="flex items-center gap-2 text-sm text-amber-100">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    5% cashback on all services
                  </li>
                  <li className="flex items-center gap-2 text-sm text-amber-100">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Track up to 5 vehicles
                  </li>
                </ul>
                <Link
                  href="/membership"
                  className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition-all shadow-lg"
                >
                  Upgrade to Gold - $19/mo
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading scanner...</div>
      </div>
    }>
      <ImportContent />
    </Suspense>
  );
}
