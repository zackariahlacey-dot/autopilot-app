'use server';

import { createClient } from '@/lib/supabase/server';

type ActionButton = {
  label: string;
  icon?: string;
  href?: string;
  action?: string;
  variant?: 'primary' | 'secondary';
};

type AssistantResponse = {
  message: string;
  actions?: ActionButton[];
  businesses?: Array<{
    id: string;
    name: string;
    category: string;
    address: string;
    is_verified: boolean;
  }>;
  data?: any;
};

export async function sendMessage(userMessage: string): Promise<AssistantResponse> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        message: "I need you to be logged in to help you with personalized assistance. Please sign in to continue.",
      };
    }

    // Normalize the message
    const message = userMessage.toLowerCase().trim();

    // Get user's primary vehicle
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const primaryVehicle = vehicles?.[0];

    // PROACTIVE MAINTENANCE REMINDERS (check first before responding)
    if (primaryVehicle && message.includes('proactive')) {
      const currentMileage = primaryVehicle.mileage || 0;
      const lastOilMileage = primaryVehicle.mileage_at_last_oil || 0;
      const milesSinceOil = currentMileage - lastOilMileage;

      // Check if approaching 60k major service
      if (currentMileage >= 55000 && currentMileage < 65000) {
        const milesUntil60k = 60000 - currentMileage;
        const weeksEstimate = Math.ceil(milesUntil60k / 200); // Assume 200 miles/week

        return {
          message: `🔔 **Proactive Alert**: I noticed your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} is at ${currentMileage.toLocaleString()} miles. You're due for a major 60,000-mile service in approximately ${weeksEstimate} weeks!\n\n**Recommended services:**\n• Transmission fluid flush\n• Spark plug replacement\n• Air & cabin filter replacement\n• Coolant system service\n• Brake fluid flush\n\nI've found 3 local shops with quotes starting at **$199**. Should I book the best deal for you?`,
          actions: [
            {
              label: '🚀 Get 3 Quotes from Shops',
              icon: '💬',
              action: 'request_quotes_60k',
              variant: 'primary',
            },
            {
              label: 'View All Mechanics',
              icon: '🔧',
              href: '/explore?category=mechanic',
              variant: 'secondary',
            },
          ],
        };
      }

      // Check if oil change is coming up
      if (milesSinceOil >= 4000 && milesSinceOil < 5500) {
        const milesUntilDue = 5000 - milesSinceOil;
        
        return {
          message: `⏰ **Proactive Reminder**: Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} will need an oil change in about ${milesUntilDue} miles. Want me to schedule it now and save you the hassle?`,
          actions: [
            {
              label: 'Schedule Oil Change',
              icon: '📅',
              href: '/explore?category=oil_change',
              variant: 'primary',
            },
            {
              label: 'Remind Me Later',
              icon: '⏰',
              action: 'snooze_reminder',
              variant: 'secondary',
            },
          ],
        };
      }
    }

    // Oil change inquiry
    if (message.includes('oil change') || message.includes('oil service')) {
      if (!primaryVehicle) {
        return {
          message: "I don't see any vehicles in your garage yet. Add your car first so I can track your maintenance schedule!",
        };
      }

      const lastOilChange = primaryVehicle.last_oil_change 
        ? new Date(primaryVehicle.last_oil_change) 
        : null;
      const currentMileage = primaryVehicle.mileage || 0;
      const mileageAtLastOil = primaryVehicle.mileage_at_last_oil || 0;
      const milesSinceOil = currentMileage - mileageAtLastOil;

      if (!lastOilChange) {
        return {
          message: `I don't have your last oil change date on record for your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}. I recommend getting one soon if you're not sure! Most cars need an oil change every 3,000-5,000 miles or 3-6 months.`,
          actions: [
            {
              label: '+ Add Service Record',
              icon: '📝',
              href: `/garage/${primaryVehicle.id}`,
              variant: 'secondary',
            },
            {
              label: 'Book Oil Change',
              icon: '📅',
              href: '/explore?category=oil_change',
              variant: 'primary',
            },
          ],
        };
      }

      const daysSinceOil = Math.floor((Date.now() - lastOilChange.getTime()) / (1000 * 60 * 60 * 24));
      const monthsSinceOil = Math.floor(daysSinceOil / 30);

      if (milesSinceOil >= 5000 || monthsSinceOil >= 6) {
        return {
          message: `🚨 Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} is overdue for an oil change! It's been ${milesSinceOil.toLocaleString()} miles and ${monthsSinceOil} months since your last service. I recommend booking one ASAP.`,
          actions: [
            {
              label: 'Find Oil Change Shops',
              icon: '🔍',
              href: '/explore?category=oil_change',
              variant: 'primary',
            },
          ],
        };
      } else if (milesSinceOil >= 3500 || monthsSinceOil >= 4) {
        return {
          message: `⚠️ Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} is getting close to needing an oil change. You've driven ${milesSinceOil.toLocaleString()} miles since your last service (${monthsSinceOil} months ago). Most experts recommend changing it every 5,000 miles or 6 months.`,
          actions: [
            {
              label: 'Find Shops Nearby',
              icon: '📍',
              href: '/explore?category=oil_change',
              variant: 'primary',
            },
          ],
        };
      } else {
        return {
          message: `✅ Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} is looking good! You've only driven ${milesSinceOil.toLocaleString()} miles since your last oil change (${monthsSinceOil} months ago). You should be good for another ${5000 - milesSinceOil} miles or ${6 - monthsSinceOil} months.`,
        };
      }
    }

    // Car wash / detailing search
    if (message.includes('car wash') || message.includes('wash') || message.includes('detailing') || message.includes('detail') || message.includes('nearby')) {
      // First try verified shops
      const { data: verifiedBusinesses } = await supabase
        .from('businesses')
        .select('id, name, address, category, is_verified')
        .eq('category', 'detailing')
        .eq('is_verified', true)
        .limit(5);

      if (verifiedBusinesses && verifiedBusinesses.length > 0) {
        return {
          message: `I found ${verifiedBusinesses.length} verified car wash and detailing shops near you. Check them out below!`,
          businesses: verifiedBusinesses,
          actions: [
            {
              label: 'View on Map',
              icon: '🗺️',
              href: '/explore?category=detailing',
              variant: 'secondary',
            },
          ],
        };
      }

      // If no verified shops, search for unclaimed
      const { data: unclaimedBusinesses } = await supabase
        .from('businesses')
        .select('id, name, address, category, is_verified')
        .eq('category', 'detailing')
        .eq('is_verified', false)
        .limit(5);

      if (unclaimedBusinesses && unclaimedBusinesses.length > 0) {
        return {
          message: `I found ${unclaimedBusinesses.length} local car washes. They aren't verified on AUTOPILOT yet, but I can help you request quotes from them!`,
          businesses: unclaimedBusinesses,
          actions: [
            {
              label: '🚀 Get 3 Quotes',
              icon: '💬',
              action: 'request_quotes',
              variant: 'primary',
            },
            {
              label: 'View All on Map',
              icon: '🗺️',
              href: '/explore?category=detailing',
              variant: 'secondary',
            },
          ],
        };
      }

      return {
        message: "I couldn't find any car wash or detailing shops near you right now. Try checking the Explore Map to see all available options!",
        actions: [
          {
            label: 'View All Businesses',
            icon: '🗺️',
            href: '/explore',
            variant: 'primary',
          },
        ],
      };
    }

    // Brake issue diagnostic
    if (message.includes('brake') && (message.includes('squeak') || message.includes('noise') || message.includes('sound'))) {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, address, category, is_verified')
        .eq('category', 'mechanic')
        .limit(5);

      return {
        message: `🔧 Squeaking brakes are usually caused by:\n\n1. **Worn brake pads** - The most common cause\n2. **Rust or debris** on the rotors\n3. **Lack of lubrication** on brake components\n\nI recommend getting a brake inspection soon. Want me to get quotes from local shops?`,
        businesses: businesses && businesses.length > 0 ? businesses : undefined,
        actions: [
          {
            label: '🚀 Send to 3 Local Shops for Quotes',
            icon: '💬',
            action: 'request_quotes_brake',
            variant: 'primary',
          },
          {
            label: 'Find Mechanics',
            icon: '🔧',
            href: '/explore?category=mechanic',
            variant: 'secondary',
          },
        ],
      };
    }

    // Health score inquiry
    if (message.includes('health') || message.includes('score') || message.includes('condition')) {
      if (!primaryVehicle) {
        return {
          message: "Add your vehicle to the Garage first, and I'll be able to track its health score for you!",
        };
      }

      // Calculate health score (same logic as HUD)
      const lastOilChange = primaryVehicle.last_oil_change ? new Date(primaryVehicle.last_oil_change) : null;
      const lastDetail = primaryVehicle.last_detail ? new Date(primaryVehicle.last_detail) : null;
      const currentMileage = primaryVehicle.mileage || 0;
      const mileageAtLastOil = primaryVehicle.mileage_at_last_oil || 0;
      const milesSinceOil = currentMileage - mileageAtLastOil;

      let oilHealth = 100;
      if (milesSinceOil > 5000) oilHealth = 0;
      else if (milesSinceOil > 3500) oilHealth = 50;

      let detailHealth = 100;
      if (lastDetail) {
        const daysSinceDetail = Math.floor((Date.now() - lastDetail.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceDetail > 90) detailHealth = 50;
        if (daysSinceDetail > 180) detailHealth = 0;
      }

      const healthScore = Math.round((oilHealth + detailHealth) / 2);

      const healthEmoji = healthScore >= 80 ? '💚' : healthScore >= 50 ? '💛' : '❤️';
      const healthStatus = healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Fair' : 'Needs Attention';

      return {
        message: `${healthEmoji} Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} has a health score of **${healthScore}%** (${healthStatus}).\n\nOil Life: ${oilHealth}%\nDetail Status: ${detailHealth}%\n\n${healthScore < 80 ? "Consider scheduling maintenance soon to keep your vehicle in top shape!" : "Your car is in great shape! Keep up the maintenance."}`,
      };
    }

    // General diagnostic
    if (message.includes('why') || message.includes('problem') || message.includes('issue') || message.includes('wrong')) {
      return {
        message: "I can help diagnose common car issues! Try asking me about specific symptoms like:\n\n• 'Why are my brakes squeaking?'\n• 'Why is my engine making noise?'\n• 'Why is my car shaking?'\n\nFor complex issues, I recommend using the full AI Diagnose tool or visiting a mechanic. Want me to find nearby mechanics?",
      };
    }

    // Find services
    if (message.includes('find') || message.includes('where') || message.includes('nearby') || message.includes('near me')) {
      if (message.includes('mechanic') || message.includes('repair')) {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, name, address, is_verified')
          .eq('category', 'mechanic')
          .eq('is_verified', true)
          .limit(5);

        if (!businesses || businesses.length === 0) {
          return { message: "I couldn't find verified mechanics right now. Check the Explore Map for all options!" };
        }

        return {
          message: `Here are ${businesses.length} verified mechanics near you:\n\n${businesses.map((b, i) => `${i + 1}. **${b.name}**\n   ${b.address}`).join('\n\n')}\n\nHead to the Explore Map to view services and book!`,
        };
      }

      return {
        message: "What kind of service are you looking for? I can help you find:\n\n• Car washes / Detailing\n• Mechanics / Repair shops\n• Oil change services\n• Tire shops\n\nJust ask!",
      };
    }

    // Default response
    return {
      message: "I'm here to help with:\n\n✓ Checking your maintenance schedule\n✓ Finding nearby auto services\n✓ Diagnosing common car problems\n✓ Answering questions about your vehicle\n\nWhat would you like to know?",
    };

  } catch (error) {
    console.error('AI Assistant error:', error);
    return {
      message: "I'm having trouble right now. Please try again in a moment.",
    };
  }
}
