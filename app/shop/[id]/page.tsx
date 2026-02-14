import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

async function ShopContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch business details
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, category, address')
    .eq('id', id)
    .single();

  if (businessError || !business) {
    notFound();
  }

  // Fetch services for this business
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes')
    .eq('business_id', id)
    .order('price', { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Explore
        </Link>

        {/* Business Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {business.name}
          </h1>
          <p className="text-zinc-400 text-lg capitalize">
            {business.category.replace('_', ' ')}
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {business.address}
          </div>
        </header>

        {/* Services */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-100">Services</h2>
          
          {!services || services.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-zinc-500">No services available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <span className="text-emerald-400 font-bold text-lg">
                      ${(service.price / 100).toFixed(2)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-zinc-400 mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration_minutes} min
                    </div>
                  </div>
                  <Link
                    href={`/booking?service=${service.id}`}
                    className="block w-full py-3 rounded-xl bg-white text-black text-center font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading shop...</div>
      </div>
    }>
      <ShopContent params={params} />
    </Suspense>
  );
}
