import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { registerBusiness } from './actions';

async function RegistrationForm() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user already has a business
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (existingBusiness) {
    redirect('/business/dashboard');
  }

  return (
    <form action={registerBusiness} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
          Business Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Elite Auto Detailing"
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
        >
          <option value="">Select a category</option>
          <option value="mechanic">Mechanic</option>
          <option value="detailer">Detailer</option>
          <option value="glass">Glass Repair</option>
          <option value="body_shop">Body Shop</option>
          <option value="tire_shop">Tire Shop</option>
          <option value="oil_change">Oil Change</option>
          <option value="car_wash">Car Wash</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-300 mb-2">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          required
          placeholder="123 Main St, City, State 12345"
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
        />
      </div>

      <button
        type="submit"
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
      >
        Register Business
      </button>
    </form>
  );
}

export default function BusinessRegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Register Your Business
          </h1>
          <p className="text-zinc-400">Join our premium automotive services network</p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <div className="animate-pulse text-zinc-500">Loading...</div>
          </div>
        }>
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}
