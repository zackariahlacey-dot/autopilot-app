import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    // Fetch user context from database
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const primaryVehicle = vehicles?.[0];

    // Get recent service history
    const { data: serviceHistory } = await supabase
      .from('transactions')
      .select('service_name, amount, completed_at, business_name')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    // Calculate health score
    let healthScore = 100;
    let oilLife = 100;
    let detailHealth = 100;

    if (primaryVehicle) {
      if (primaryVehicle.last_oil_change && primaryVehicle.mileage && primaryVehicle.mileage_at_last_oil) {
        const milesSince = primaryVehicle.mileage - primaryVehicle.mileage_at_last_oil;
        oilLife = Math.max(0, Math.min(100, 100 - (milesSince / 5000 * 100)));
      }

      if (primaryVehicle.last_detail) {
        const daysSince = (Date.now() - new Date(primaryVehicle.last_detail).getTime()) / (1000 * 60 * 60 * 24);
        detailHealth = Math.max(0, Math.min(100, 100 - (daysSince / 90 * 100)));
      }

      healthScore = Math.round((oilLife * 0.6 + detailHealth * 0.4));
    }

    // Build context for AI
    const contextMessage = primaryVehicle ? `
VEHICLE CONTEXT:
- Vehicle: ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}
- Mileage: ${primaryVehicle.mileage?.toLocaleString() || 'Unknown'} miles
- Health Score: ${healthScore}%
- Oil Life: ${Math.round(oilLife)}%
- Detail Health: ${Math.round(detailHealth)}%
- Last Oil Change: ${primaryVehicle.last_oil_change ? new Date(primaryVehicle.last_oil_change).toLocaleDateString() : 'Unknown'}
- Last Detail: ${primaryVehicle.last_detail ? new Date(primaryVehicle.last_detail).toLocaleDateString() : 'Unknown'}

RECENT SERVICES:
${serviceHistory && serviceHistory.length > 0 ? serviceHistory.map(s => 
  `- ${s.service_name} at ${s.business_name} (${new Date(s.completed_at).toLocaleDateString()}) - $${(s.amount / 100).toFixed(2)}`
).join('\n') : 'No recent service history'}

CURRENT DATE: ${new Date().toLocaleDateString()}
` : 'User has not registered a vehicle yet.';

    const result = await streamText({
      model: openai('gpt-4o'),
      system: `You are Autopilot, a high-end AI automotive expert. You help the user manage their vehicle with precision and professionalism.

YOUR PERSONALITY:
- Professional, concise, and proactive
- Safety-first mindset
- Cost-conscious but quality-focused
- Use technical accuracy without being overwhelming
- Friendly but not overly casual

GUIDELINES:
- If the user mentions a problem, suggest checking local shops or booking a service
- Provide specific, actionable advice
- Reference their actual vehicle data when relevant
- Alert them to urgent maintenance needs
- Use emojis sparingly and professionally

${contextMessage}`,
      messages,
      tools: {
        searchShops: {
          description: 'Search for nearby automotive shops by category (oil_change, detailing, mechanic, tires, towing, body_shop)',
          inputSchema: z.object({
            category: z.enum(['oil_change', 'detailing', 'mechanic', 'tires', 'towing', 'body_shop', 'glass_repair']),
            reason: z.string().describe('Brief reason why this search is needed'),
          }),
          execute: async (args) => {
            const { data: shops } = await supabase
              .from('businesses')
              .select('id, name, category, address, phone, is_verified')
              .eq('category', args.category)
              .limit(5);

            return {
              success: true,
              shops: shops || [],
              action: 'show_shops',
            };
          },
        },
        requestQuotes: {
          description: 'Request quotes from local shops for a specific service or repair',
          inputSchema: z.object({
            problem: z.string().describe('Description of the problem or service needed'),
            category: z.string().describe('Service category'),
          }),
          execute: async (args) => {
            const { data: userVehicles } = await supabase
              .from('vehicles')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);

            if (!userVehicles || userVehicles.length === 0) {
              return { success: false, error: 'No vehicle found' };
            }

            const { data: job } = await supabase
              .from('marketplace_jobs')
              .insert({
                user_id: user.id,
                vehicle_id: userVehicles[0].id,
                problem_description: args.problem,
                category: args.category,
                status: 'open',
                latitude: 34.1478,
                longitude: -118.1445,
              })
              .select()
              .single();

            return {
              success: true,
              job_id: job?.id,
              action: 'quotes_requested',
              message: 'Quotes have been requested from local shops. You\'ll receive notifications when they respond.',
            };
          },
        },
        checkHealth: {
          description: 'Check the current health status and maintenance alerts for the vehicle',
          inputSchema: z.object({
            detailed: z.boolean().optional().describe('Whether to include detailed breakdown'),
          }),
          execute: async (args) => {
            if (!primaryVehicle) {
              return { success: false, error: 'No vehicle registered' };
            }

            const alerts = [];
            if (oilLife < 20) alerts.push('⚠️ Oil change needed soon');
            if (detailHealth < 30) alerts.push('🧼 Car needs detailing');

            return {
              success: true,
              vehicle: `${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}`,
              health_score: healthScore,
              oil_life: Math.round(oilLife),
              detail_health: Math.round(detailHealth),
              mileage: primaryVehicle.mileage,
              alerts,
              action: 'show_health_report',
            };
          },
        },
        bookService: {
          description: 'Prompt the user to book a specific service',
          inputSchema: z.object({
            service_type: z.string().describe('Type of service to book (e.g., oil change, brake service)'),
            urgency: z.enum(['low', 'medium', 'high']).describe('How urgent is this service'),
          }),
          execute: async (args) => {
            return {
              success: true,
              action: 'prompt_booking',
              service_type: args.service_type,
              urgency: args.urgency,
              message: args.urgency === 'high' 
                ? `This ${args.service_type} should be done soon for safety.`
                : `It's a good time to schedule your ${args.service_type}.`,
            };
          },
        },
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
