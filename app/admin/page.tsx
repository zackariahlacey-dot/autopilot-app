'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { seedMarketplace } from '@/app/explore/actions';

const AdminMap = dynamic(() => import('./AdminMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-zinc-950 rounded-xl flex items-center justify-center"><p className="text-zinc-500">Loading map...</p></div>,
});

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      // This would normally use a proper auth check, but for demo purposes
      // we'll check client-side. In production, use middleware or server-side auth.
      const email = prompt('Enter super admin email:');
      
      if (email !== 'zackariahlacey@gmail.com') {
        alert('Unauthorized access');
        window.location.href = '/';
        return;
      }

      setUser({ email });
      
      // Fetch stats from API
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-purple-400 text-xl">Loading God Mode...</p>
        </div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalUsers = 0,
    totalActiveJobs = 0,
    activeEmergencies = 0,
    activeMarketplaceJobs = 0,
    totalBusinesses = 0,
    totalServices = 0,
    totalBookings = 0,
    sosRequests = [],
    marketplaceJobs = [],
    businesses = [],
  } = stats;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1800px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              🔥 GOD MODE
            </h1>
            <p className="text-zinc-400 mt-2">Super Admin Dashboard • Full System Control</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/50">
              <span className="text-purple-300 text-sm font-semibold">👑 {user.email}</span>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-all"
            >
              ← Back to Site
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Total Revenue</h3>
            </div>
            <p className="text-4xl font-bold text-emerald-400">${(totalRevenue / 100).toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-2">All platform transactions</p>
          </div>

          <div className="rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
            </div>
            <p className="text-4xl font-bold text-cyan-400">{totalUsers || 0}</p>
            <p className="text-xs text-zinc-500 mt-2">Registered vehicle owners</p>
          </div>

          <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-950/50 to-red-900/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Active Jobs</h3>
            </div>
            <p className="text-4xl font-bold text-red-400">{totalActiveJobs}</p>
            <p className="text-xs text-zinc-500 mt-2">SOS + Marketplace leads</p>
          </div>

          <div className="rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/50 to-purple-900/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Businesses</h3>
            </div>
            <p className="text-4xl font-bold text-purple-400">{totalBusinesses || 0}</p>
            <p className="text-xs text-zinc-500 mt-2">Registered shops</p>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-white mb-2">Services</h3>
            <p className="text-3xl font-bold text-emerald-400">{totalServices || 0}</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-white mb-2">Bookings</h3>
            <p className="text-3xl font-bold text-cyan-400">{totalBookings || 0}</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-white mb-2">Active SOS</h3>
            <p className="text-3xl font-bold text-red-400">{activeEmergencies || 0}</p>
          </div>
        </div>

        {/* Live Map */}
        <div className="rounded-2xl border-2 border-purple-500/50 bg-zinc-900/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            Live System Map
          </h2>
          <p className="text-zinc-400 mb-6">
            All active emergencies ({activeEmergencies || 0}) and marketplace leads ({activeMarketplaceJobs || 0})
          </p>
          <AdminMap 
            sosRequests={sosRequests || []}
            marketplaceJobs={marketplaceJobs || []}
            businesses={businesses || []}
          />
        </div>

        {/* Active SOS Requests */}
        {sosRequests && sosRequests.length > 0 && (
          <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/20 p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              🚨 Active Emergency Requests ({sosRequests.length})
            </h2>
            <div className="space-y-4">
              {sosRequests.map((req: any) => (
                <div key={req.id} className="p-4 rounded-xl bg-red-950/50 border border-red-500/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {req.emergency_type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <p className="text-red-300">📍 {req.address}</p>
                      {req.vehicles && (
                        <p className="text-red-400 mt-1">
                          🚗 {req.vehicles.year} {req.vehicles.make} {req.vehicles.model}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-200 text-sm font-bold">
                        {req.status.toUpperCase()}
                      </span>
                      <p className="text-xs text-red-500 mt-1">
                        {new Date(req.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Control */}
        <div className="rounded-2xl border-2 border-yellow-500/50 bg-yellow-950/20 p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ Database Control</h2>
          <p className="text-zinc-400 mb-6">Use with caution - these actions affect live data</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={async () => {
                if (confirm('Seed marketplace with 20 test businesses?')) {
                  await seedMarketplace();
                  window.location.reload();
                }
              }}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold transition-all shadow-lg"
            >
              🌱 Seed Marketplace Data
            </button>
            
            <button
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold transition-all shadow-lg"
              onClick={() => alert('Feature coming soon: Create test users with vehicles')}
            >
              👥 Generate Test Users
            </button>
          </div>

          <div className="mt-4">
            <button
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold transition-all shadow-lg"
              onClick={() => {
                if (confirm('⚠️ WARNING: This will reset test data. Are you sure?')) {
                  alert('Reset World feature coming soon');
                }
              }}
            >
              🌍 Reset World (Clear Test Data)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
