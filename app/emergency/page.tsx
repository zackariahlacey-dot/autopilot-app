import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmergencyClient from './EmergencyClient';

async function EmergencyContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's primary vehicle
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  const primaryVehicle = vehicles?.[0];

  // Get nearby towing/roadside businesses (will use user's location in client)
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .or('category.eq.towing,category.eq.roadside_assistance')
    .limit(50);

  return (
    <EmergencyClient 
      userId={user.id}
      vehicle={primaryVehicle}
      businesses={businesses || []}
    />
  );
}

export const metadata = {
  title: 'Emergency Dispatch - AUTOPILOT',
  description: 'Get immediate roadside assistance',
};

export default function EmergencyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-red-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-red-200 text-xl">Initializing Emergency Mode...</p>
        </div>
      </div>
    }>
      <EmergencyContent />
    </Suspense>
  );
}
