'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';

export async function confirmBooking(sessionId: string) {
  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  try {
    // Retrieve the Stripe session to get metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || !session.metadata) {
      throw new Error('Invalid session');
    }

    const { bookingId, serviceId, vehicleId } = session.metadata;

    if (!bookingId || !serviceId || !vehicleId) {
      throw new Error('Missing booking metadata');
    }

    const supabase = await createClient();

    // Update booking status to 'confirmed'
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (bookingError) {
      throw new Error(`Failed to confirm booking: ${bookingError.message}`);
    }

    // Fetch the service to determine what maintenance date to update
    const { data: service } = await supabase
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .single();

    if (service) {
      const serviceName = service.name.toLowerCase();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const updates: any = {};

      // Auto-update vehicle maintenance dates based on service type
      if (serviceName.includes('oil') || serviceName.includes('change')) {
        updates.last_oil_change = today;
        
        // Also update mileage_at_last_oil if current mileage exists
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('mileage')
          .eq('id', vehicleId)
          .single();
        
        if (vehicle?.mileage) {
          updates.mileage_at_last_oil = vehicle.mileage;
        }
      }

      if (serviceName.includes('detail') || serviceName.includes('wash') || serviceName.includes('clean')) {
        updates.last_detail = today;
      }

      // Update vehicle if we have any maintenance updates
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', vehicleId);
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath(`/garage/${vehicleId}`);
    revalidatePath('/business/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
}
