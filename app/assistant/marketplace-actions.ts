'use server';

import { createClient } from '@/lib/supabase/server';

export async function createMarketplaceJob(
  category: string,
  serviceType: string,
  description: string,
  urgency: string = 'normal'
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'You must be logged in to request quotes' };
    }

    // Get user's primary vehicle
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const vehicleId = vehicles?.[0]?.id || null;

    // Create marketplace job
    const { data: job, error: jobError } = await supabase
      .from('marketplace_jobs')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        category,
        service_type: serviceType,
        description,
        urgency,
        status: 'open',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create marketplace job:', jobError);
      return { error: 'Failed to create quote request' };
    }

    console.log('✅ Created marketplace job:', job.id);

    return {
      success: true,
      jobId: job.id,
      message: `Quote request sent to local ${category.replace('_', ' ')} shops! You'll be notified when they respond.`,
    };
  } catch (error) {
    console.error('Marketplace job creation error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function submitQuote(
  jobId: string,
  quotedPrice: number,
  message: string,
  estimatedDuration?: number
) {
  try {
    const supabase = await createClient();
    
    // Get current user's business
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'You must be logged in' };
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (businessError || !business) {
      return { error: 'You must have a registered business to submit quotes' };
    }

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('marketplace_quotes')
      .insert({
        job_id: jobId,
        business_id: business.id,
        quoted_price: Math.round(quotedPrice * 100), // Convert to cents
        message,
        estimated_duration: estimatedDuration,
        status: 'pending',
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Failed to submit quote:', quoteError);
      return { error: 'Failed to submit quote. You may have already quoted this job.' };
    }

    // Update job status to 'quoted'
    await supabase
      .from('marketplace_jobs')
      .update({ status: 'quoted' })
      .eq('id', jobId);

    console.log('✅ Quote submitted:', quote.id);

    return {
      success: true,
      quoteId: quote.id,
      message: 'Quote sent successfully! The customer will be notified.',
    };
  } catch (error) {
    console.error('Quote submission error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function acceptQuote(quoteId: string) {
  try {
    const supabase = await createClient();
    
    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('marketplace_quotes')
      .select(`
        *,
        marketplace_jobs (user_id, vehicle_id, service_type),
        businesses (id, name)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return { error: 'Quote not found' };
    }

    // Verify user owns this job
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || quote.marketplace_jobs.user_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Update quote status
    const { error: updateError } = await supabase
      .from('marketplace_quotes')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (updateError) {
      return { error: 'Failed to accept quote' };
    }

    // Update job status
    await supabase
      .from('marketplace_jobs')
      .update({ status: 'accepted' })
      .eq('id', quote.job_id);

    // Create booking
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 2); // Schedule 2 days from now

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        vehicle_id: quote.marketplace_jobs.vehicle_id,
        service_id: null, // Marketplace quotes don't have a specific service_id
        business_id: quote.business_id,
        date: bookingDate.toISOString(),
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) {
      console.warn('Failed to create booking:', bookingError);
    }

    return {
      success: true,
      bookingId: booking?.id,
      message: `Quote accepted! Booking created with ${quote.businesses.name}.`,
    };
  } catch (error) {
    console.error('Accept quote error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
