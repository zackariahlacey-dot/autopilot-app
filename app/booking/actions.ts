'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// 1. Get the current user ID
export async function getCurrentUserId() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { userId: null, error: 'You must be logged in.' };
  return { userId: user.id, error: null };
}

// 2. Fetch all services
export async function getServices() {
  const supabase = await createClient();
  const { data: services, error } = await supabase.from('services').select('*');
  if (error) return { data: null, error: error.message };
  return { data: services, error: null };
}

// 3. Create Stripe Checkout Session (Next.js 15 compatible)
export async function createCheckoutSession(formData: FormData) {
  const serviceId = formData.get('serviceId') as string;
  const bookingDate = formData.get('bookingDate') as string;
  const vehicleId = formData.get('vehicleId') as string;

  const headerList = await headers();
  const origin = headerList.get('origin') || 'http://localhost:3000';

  if (!bookingDate) throw new Error('Please select a date');
  if (!vehicleId) throw new Error('Please select a vehicle');

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in to book a session.');
  }

  // Fetch the service to get the business_id and price
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('business_id, price')
    .eq('id', serviceId)
    .single();

  if (serviceError || !service) {
    throw new Error('Service not found.');
  }

  // Insert booking with status 'pending' BEFORE creating Stripe session
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      service_id: serviceId,
      vehicle_id: vehicleId,
      business_id: service.business_id,
      date: bookingDate,
      status: 'pending',
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? 'Failed to create booking.');
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Car Service Booking',
            description: 'Professional Automotive Service',
          },
          unit_amount: service.price, // Use actual service price
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/booking`,
    metadata: {
      bookingId: booking.id,
      serviceId,
      vehicleId,
      businessId: service.business_id,
      bookingDate,
      userId: user.id,
    },
  });

  if (session.url) {
    redirect(session.url);
  }
}