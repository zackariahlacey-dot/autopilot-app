import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LiveAssistant from './LiveAssistant';

async function AssistantContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's primary vehicle
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  const primaryVehicleId = vehicles?.[0]?.id;

  return (
    <div className="min-h-screen bg-tesla-black text-white page-transition">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent mb-2">
            AI Assistant
          </h1>
          <p className="text-zinc-400">
            Powered by GPT-4o • Real-time automotive intelligence
          </p>
        </div>

        {/* Chat Interface */}
        <div className="rounded-2xl glass-card border-white/10 overflow-hidden">
          <LiveAssistant userId={user.id} vehicleId={primaryVehicleId} />
        </div>

        {/* Quick Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl glass-card border-white/10">
            <h3 className="text-sm font-semibold text-electric-blue mb-1">What I Can Do</h3>
            <p className="text-xs text-zinc-400">
              Check health, find shops, get quotes, diagnose issues
            </p>
          </div>
          <div className="p-4 rounded-xl glass-card border-white/10">
            <h3 className="text-sm font-semibold text-electric-blue mb-1">Your Data</h3>
            <p className="text-xs text-zinc-400">
              I have access to your vehicle and service history
            </p>
          </div>
          <div className="p-4 rounded-xl glass-card border-white/10">
            <h3 className="text-sm font-semibold text-electric-blue mb-1">Live AI</h3>
            <p className="text-xs text-zinc-400">
              Responses stream in real-time with function calling
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Assistant - AUTOPILOT',
  description: 'Your personal automotive AI assistant',
};

export default function AssistantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-tesla-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner w-16 h-16 mx-auto" />
          <p className="text-electric-blue text-xl">Loading AI Assistant...</p>
        </div>
      </div>
    }>
      <AssistantContent />
    </Suspense>
  );
}
