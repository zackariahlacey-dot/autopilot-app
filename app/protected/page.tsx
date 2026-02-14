import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/auth/login");
  }

  // Fetch user's vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(3);

  // Fetch recent appointments (placeholder - you can add a real appointments table later)
  const { data: appointments } = await supabase
    .from('transactions')
    .select('id, service_name, amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // AI Insights (static for now, can be dynamic later)
  const aiInsights = [
    "Your oil change is due in ~500 miles. Book ahead to avoid delays!",
    "Tire pressure drops in cold weather. Check yours this week.",
    "3 verified shops near you offer 15% off detailing this month.",
  ];
  const randomInsight = aiInsights[Math.floor(Math.random() * aiInsights.length)];

  return (
    <div className="min-h-screen bg-tesla-black text-white page-transition">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header with Logout */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-zinc-400 mt-2">{user.email}</p>
          </div>
          
          <form action="/auth/signout" method="post">
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 hover:border-electric-blue/50 transition-all tap-feedback"
            >
              Logout
            </button>
          </form>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Garage Card */}
          <Link href="/dashboard" className="glass-card glass-card-hover border-white/10 p-6 rounded-2xl space-y-4 tap-feedback">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Garage</h2>
              <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {vehicles && vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <p className="font-medium text-white">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-zinc-500">{vehicle.year}</p>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-sm text-electric-blue flex items-center gap-2">
                    View all vehicles
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-zinc-500 mb-4">No vehicles yet</p>
                <div className="inline-flex items-center gap-2 text-sm text-electric-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add your first car
                </div>
              </div>
            )}
          </Link>

          {/* Active Appointments Card */}
          <Link href="/dashboard" className="glass-card glass-card-hover border-white/10 p-6 rounded-2xl space-y-4 tap-feedback">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Active Appointments</h2>
              <div className="w-10 h-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-electric-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {appointments && appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-white">{apt.service_name}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        apt.status === 'completed' 
                          ? 'bg-electric-blue/20 text-electric-blue' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                      ${(apt.amount / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-zinc-500 mb-4">No appointments yet</p>
                <Link href="/booking" className="inline-flex items-center gap-2 text-sm text-electric-cyan">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Book a service
                </Link>
              </div>
            )}
          </Link>

          {/* AI Insights Card */}
          <div className="glass-card border-electric-blue/30 p-6 rounded-2xl space-y-4 shadow-lg shadow-electric-blue/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">AI Insights</h2>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-electric-cyan flex items-center justify-center animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-electric-blue/10 to-electric-cyan/10 border border-electric-blue/20">
              <p className="text-white leading-relaxed">
                💡 {randomInsight}
              </p>
            </div>

            <Link 
              href="/assistant"
              className="block w-full py-3 rounded-xl bg-electric-blue/20 border border-electric-blue/40 text-electric-blue text-center font-medium hover:bg-electric-blue/30 transition-all tap-feedback"
            >
              Ask Autopilot AI
            </Link>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/explore"
            className="glass-card glass-card-hover border-white/10 p-6 rounded-xl flex items-center gap-4 tap-feedback"
          >
            <div className="w-12 h-12 rounded-xl bg-electric-blue/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Find Services</h3>
              <p className="text-sm text-zinc-500">Browse nearby shops</p>
            </div>
          </Link>

          <Link 
            href="/booking"
            className="glass-card glass-card-hover border-white/10 p-6 rounded-xl flex items-center gap-4 tap-feedback"
          >
            <div className="w-12 h-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-electric-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Book Service</h3>
              <p className="text-sm text-zinc-500">Schedule maintenance</p>
            </div>
          </Link>

          <Link 
            href="/membership"
            className="glass-card glass-card-hover border-amber-500/30 p-6 rounded-xl flex items-center gap-4 tap-feedback shadow-lg shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">Join Gold</h3>
              <p className="text-sm text-zinc-500">Unlock premium perks</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
