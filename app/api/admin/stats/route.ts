import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Security check
    if (!user || user.email !== 'zackariahlacey@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all stats
    const { data: transactions } = await supabase.from('transactions').select('amount');
    const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    const { count: totalUsers } = await supabase.from('vehicles').select('user_id', { count: 'exact', head: true });

    const { count: activeMarketplaceJobs } = await supabase
      .from('marketplace_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: activeEmergencies } = await supabase
      .from('emergency_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['searching', 'dispatched', 'en_route']);

    const { count: totalBusinesses } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    const { count: totalServices } = await supabase.from('services').select('*', { count: 'exact', head: true });
    const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });

    const { data: sosRequests } = await supabase
      .from('emergency_requests')
      .select('*, vehicles(*), users:user_id(*)')
      .in('status', ['searching', 'dispatched', 'en_route'])
      .order('created_at', { ascending: false });

    const { data: marketplaceJobs } = await supabase
      .from('marketplace_jobs')
      .select('*, vehicles(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const { data: businesses } = await supabase.from('businesses').select('*');

    return NextResponse.json({
      totalRevenue,
      totalUsers,
      activeMarketplaceJobs,
      activeEmergencies,
      totalActiveJobs: (activeMarketplaceJobs || 0) + (activeEmergencies || 0),
      totalBusinesses,
      totalServices,
      totalBookings,
      sosRequests: sosRequests || [],
      marketplaceJobs: marketplaceJobs || [],
      businesses: businesses || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
