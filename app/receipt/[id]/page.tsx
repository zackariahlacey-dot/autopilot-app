import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

async function ReceiptContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch transaction details
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select(`
      *,
      vehicles (
        make,
        model,
        year,
        license_plate
      )
    `)
    .eq('id', id)
    .single();

  if (error || !transaction) {
    notFound();
  }

  const vehicle = Array.isArray(transaction.vehicles) ? transaction.vehicles[0] : transaction.vehicles;
  const receiptUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/receipt/${id}`;

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl print:shadow-none">
        {/* Print & Download buttons */}
        <div className="mb-6 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
          >
            🖨️ Print Receipt
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-zinc-200 text-black hover:bg-zinc-300 transition-colors"
          >
            ← Back to Garage
          </Link>
        </div>

        {/* Receipt */}
        <div className="border-4 border-black p-12">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b-2 border-black">
            <h1 className="text-5xl font-bold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                AUTOPILOT
              </span>
            </h1>
            <p className="text-sm text-zinc-600">DIGITAL SERVICE RECEIPT</p>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase text-zinc-500 mb-1">Receipt ID</p>
              <p className="font-mono text-sm">{transaction.id.substring(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500 mb-1">Date</p>
              <p className="text-sm">
                {new Date(transaction.completed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-zinc-100 p-6 rounded-lg mb-8">
            <p className="text-xs uppercase text-zinc-500 mb-3">Vehicle</p>
            <p className="text-2xl font-bold mb-1">
              {vehicle?.make} {vehicle?.model} ({vehicle?.year})
            </p>
            {vehicle?.license_plate && (
              <p className="text-sm text-zinc-600">License Plate: {vehicle.license_plate}</p>
            )}
            {transaction.vehicle_mileage && (
              <p className="text-sm text-zinc-600">Mileage at Service: {transaction.vehicle_mileage.toLocaleString()} miles</p>
            )}
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <p className="text-xs uppercase text-zinc-500 mb-3">Service Performed</p>
            <h2 className="text-3xl font-bold mb-2">{transaction.service_name}</h2>
            {transaction.service_description && (
              <p className="text-zinc-600">{transaction.service_description}</p>
            )}
          </div>

          {/* Shop Info */}
          <div className="mb-8">
            <p className="text-xs uppercase text-zinc-500 mb-1">Serviced By</p>
            <p className="text-xl font-semibold">{transaction.mechanic_name}</p>
          </div>

          {/* Amount */}
          <div className="bg-black text-white p-8 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Amount Paid</p>
                <p className="text-5xl font-bold">${(transaction.amount / 100).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Status</p>
                <p className="text-emerald-400 font-semibold">PAID</p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center border-t-2 border-black pt-8">
            <p className="text-xs uppercase text-zinc-500 mb-4">Scan to View Online</p>
            <div className="inline-block p-4 bg-white border-2 border-black">
              <div className="w-32 h-32 bg-zinc-200 flex items-center justify-center">
                {/* QR Code placeholder - in production, use a QR code library */}
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 font-mono break-all px-8">
              {receiptUrl}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-zinc-300 text-center">
            <p className="text-xs text-zinc-500">
              Thank you for choosing AUTOPILOT
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Digital receipt • Lifetime record • Always accessible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading receipt...</div>
      </div>
    }>
      <ReceiptContent params={params} />
    </Suspense>
  );
}
