'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function simulatePayment(bookingId: string) {
  try {
    const supabase = await createClient();
    
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (id, name, price, business_id),
        vehicles (id, user_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { error: 'Booking not found' };
    }

    const service = typeof booking.services === 'object' && 'name' in booking.services 
      ? booking.services 
      : null;

    if (!service) {
      return { error: 'Service information not found' };
    }

    // Update booking status to 'paid'
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return { error: 'Failed to process payment' };
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        vehicle_id: booking.vehicle_id,
        business_id: service.business_id,
        service_id: booking.service_id,
        amount: service.price,
        currency: 'USD',
        service_name: service.name,
        completed_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.warn('Failed to create transaction record:', transactionError);
    }

    // Revalidate pages
    revalidatePath(`/garage/${booking.vehicle_id}`);
    revalidatePath('/business/dashboard');

    return { success: true, message: 'Payment processed successfully!' };
  } catch (error) {
    console.error('Payment simulation error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
