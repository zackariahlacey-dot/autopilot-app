import { Suspense } from 'react';
import { confirmBooking } from './actions';
import Link from 'next/link';
import SuccessHaptic from '@/components/SuccessHaptic';

async function SuccessContent({ 
  searchParams 
}: { 
  searchParams: Promise<{ session_id?: string }> 
}) {
  const params = await searchParams;
  const sessionId = params.session_id || null;

  let bookingConfirmed = false;
  let errorMessage = '';

  if (sessionId) {
    try {
      await confirmBooking(sessionId);
      bookingConfirmed = true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to confirm booking';
      console.error('Booking confirmation error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <SuccessHaptic isSuccess={bookingConfirmed} />
      <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Payment Successful!
          </h1>
          <p className="text-zinc-400">
            {bookingConfirmed 
              ? "Your booking is confirmed and your vehicle's maintenance records have been updated."
              : "Your payment was received."}
          </p>
          {errorMessage && (
            <p className="text-amber-400 text-sm mt-2">Note: {errorMessage}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-4 md:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:from-emerald-400 hover:to-cyan-400 active:scale-95 transition-all"
          >
            Go to My Garage
          </Link>
          <Link
            href="/explore"
            className="w-full py-4 md:py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 hover:border-emerald-500/50 active:scale-95 transition-all"
          >
            Explore More Services
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Processing payment...</div>
      </div>
    }>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}