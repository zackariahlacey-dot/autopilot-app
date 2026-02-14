'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateEmergencyStatus } from '@/app/emergency/actions';

export async function addService(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const priceStr = formData.get('price') as string;
  const durationStr = formData.get('duration') as string;

  if (!name?.trim() || !priceStr?.trim() || !durationStr?.trim()) {
    throw new Error('Service name, price, and duration are required.');
  }

  const price = Math.round(parseFloat(priceStr) * 100); // Convert to cents
  if (isNaN(price) || price <= 0) {
    throw new Error('Please enter a valid price.');
  }

  const duration = parseInt(durationStr, 10);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Please enter a valid duration in minutes.');
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in.');
  }

  // Get the user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    throw new Error('You must register a business first.');
  }

  const { error } = await supabase.from('services').insert({
    business_id: business.id,
    name: name.trim(),
    description: description?.trim() || '',
    price,
    duration_minutes: duration,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/business/dashboard');
}

export async function updateBookingStatus(formData: FormData) {
  const bookingId = formData.get('bookingId') as string;
  const newStatus = formData.get('newStatus') as string;

  if (!bookingId || !newStatus) {
    throw new Error('Booking ID and status are required.');
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in.');
  }

  // Get the user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    throw new Error('You must register a business first.');
  }

  // Verify this booking belongs to this business and fetch full details
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, 
      vehicle_id, 
      service_id, 
      user_id,
      business_id,
      services(name, description, price)
    `)
    .eq('id', bookingId)
    .eq('business_id', business.id)
    .single();

  if (!booking) {
    throw new Error('Booking not found or does not belong to your business.');
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // If completed, finalize and create transaction
  if (newStatus === 'completed' && booking.vehicle_id && booking.service_id) {
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    const serviceName = service?.name?.toLowerCase() || '';
    const today = new Date().toISOString().split('T')[0];
    const updates: any = {};

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('mileage')
      .eq('id', booking.vehicle_id)
      .single();

    // Auto-update based on service type
    if (serviceName.includes('oil') || serviceName.includes('change')) {
      updates.last_oil_change = today;
      
      if (vehicle?.mileage) {
        updates.mileage_at_last_oil = vehicle.mileage;
      }
    }

    if (serviceName.includes('detail') || serviceName.includes('wash') || serviceName.includes('clean')) {
      updates.last_detail = today;
    }

    // Update vehicle if we have maintenance updates
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', booking.vehicle_id);
      
      // Revalidate vehicle page
      revalidatePath(`/garage/${booking.vehicle_id}`);
    }

    // Get business name for mechanic/shop name
    const { data: businessData } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', booking.business_id)
      .single();

    // Create transaction record (Digital Receipt)
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        vehicle_id: booking.vehicle_id,
        business_id: booking.business_id,
        service_id: booking.service_id,
        amount: service?.price || 0,
        service_name: service?.name || 'Service',
        service_description: service?.description || '',
        mechanic_name: businessData?.name || 'Shop',
        vehicle_mileage: vehicle?.mileage || null,
      })
      .select('id')
      .single();

    if (transaction) {
      console.log(`Transaction created: ${transaction.id} for booking ${bookingId}`);
    }
  }

  revalidatePath('/business/dashboard');
  revalidatePath(`/business/orders/${bookingId}`);
}
