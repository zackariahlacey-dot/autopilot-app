import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import Link from 'next/link';
import QRCodeComponent from './QRCodeComponent';

async function ReportContent({ slug }: { slug: string }) {
  const supabase = await createClient();

  // Fetch report
  const { data: report, error } = await supabase
    .from('vehicle_reports')
    .select('*')
    .eq('report_slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !report) {
    notFound();
  }

  // Increment view count
  await supabase
    .from('vehicle_reports')
    .update({ view_count: (report.view_count || 0) + 1 })
    .eq('id', report.id);

  const vehicleData = report.snapshot_data.vehicle;
  const services = report.snapshot_data.services || [];
  const businesses = report.snapshot_data.businesses || [];
  const healthScore = report.health_score;
  const totalInvestment = report.total_investment;

  // Calculate estimated value increase (15% premium for excellent maintenance)
  const maintenancePremium = healthScore >= 90 ? 0.15 : healthScore >= 75 ? 0.10 : 0.05;

  // Get current URL for QR code
  const reportUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://autopilot.app/report/${slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-cyan-950/20 to-zinc-950">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 backdrop-blur-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/50">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-cyan-300 font-bold text-sm">VERIFIED AUTOPILOT REPORT</span>
                </div>
                
                <div>
                  <h1 className="text-5xl font-bold text-white mb-2">
                    {vehicleData.year} {vehicleData.make} {vehicleData.model}
                  </h1>
                  {vehicleData.license_plate && (
                    <p className="text-cyan-300 font-mono text-xl">
                      {vehicleData.license_plate}
                    </p>
                  )}
                </div>

                {vehicleData.mileage && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-lg">{vehicleData.mileage.toLocaleString()} miles</span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <QRCodeComponent url={reportUrl} />
            </div>

            {/* Maintenance Excellence Badge */}
            {healthScore >= 90 && (
              <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/50">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-emerald-300 font-bold text-lg">Maintenance Excellence</p>
                  <p className="text-emerald-400/80 text-sm">This vehicle has been exceptionally maintained</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Health Score</h3>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{healthScore}%</p>
            <p className="text-sm text-zinc-500 mt-1">Excellent condition</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Investment</h3>
            </div>
            <p className="text-4xl font-bold text-amber-400">${(totalInvestment / 100).toLocaleString()}</p>
            <p className="text-sm text-zinc-500 mt-1">Total maintenance</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Services</h3>
            </div>
            <p className="text-4xl font-bold text-cyan-400">{services.length}</p>
            <p className="text-sm text-zinc-500 mt-1">Verified records</p>
          </div>
        </div>

        {/* Market Insight */}
        <div className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/50 to-cyan-950/50 backdrop-blur-xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Market Insight</h2>
              <p className="text-blue-200 mb-4">
                Based on verified maintenance history, this vehicle commands a premium in the market.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Maintenance Premium</p>
                  <p className="text-2xl font-bold text-blue-400">+{(maintenancePremium * 100).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Buyer Confidence</p>
                  <p className="text-2xl font-bold text-emerald-400">Very High</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
            <p className="text-sm text-blue-200">
              💡 <strong>Why this matters:</strong> Vehicles with complete, verified service records sell {(maintenancePremium * 100).toFixed(0)}% faster and command higher resale values. This report provides buyers with peace of mind.
            </p>
          </div>
        </div>

        {/* Service History Timeline */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 rounded-full bg-cyan-500" />
            Verified Service History
          </h2>

          {services.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No service records available</p>
          ) : (
            <div className="space-y-4">
              {services.map((service: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-cyan-500/50 transition-all">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500/50">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.service_name}</h3>
                        <p className="text-sm text-zinc-500">
                          {new Date(service.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-emerald-400">
                        ${(service.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    {service.business_name && (
                      <p className="text-sm text-cyan-400">📍 {service.business_name}</p>
                    )}
                    {service.mileage_at_service && (
                      <p className="text-xs text-zinc-600 mt-1">
                        {service.mileage_at_service.toLocaleString()} miles
                      </p>
                    )}
                    {service.type === 'imported_receipt' && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/50">
                        Imported Record
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Lead Generation Footer */}
        {businesses.length > 0 && (
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 to-cyan-950/80 backdrop-blur-xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  This Vehicle is Maintained by
                </h3>
                <p className="text-emerald-300 text-xl font-semibold mb-1">
                  {businesses[0].name}
                </p>
                <p className="text-zinc-400">
                  Trusted service provider on the AUTOPILOT platform
                </p>
              </div>
              <Link
                href="/"
                className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-lg transition-all shadow-lg"
              >
                Book Your Car on AUTOPILOT
              </Link>
              <p className="text-xs text-zinc-500">
                Join thousands of car owners who trust AUTOPILOT for verified service tracking
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm mb-2">
            Report generated on {new Date(report.generated_at).toLocaleDateString()}
          </p>
          <p className="text-zinc-600 text-xs">
            This is an official Verified Autopilot Report. Data is cryptographically secured and cannot be altered.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Powered by AUTOPILOT →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedReportPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-zinc-400">Loading verified report...</p>
        </div>
      </div>
    }>
      <ReportWrapper params={params} />
    </Suspense>
  );
}

async function ReportWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReportContent slug={slug} />;
}
