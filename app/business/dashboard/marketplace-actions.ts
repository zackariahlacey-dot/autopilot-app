'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitQuote(formData: FormData) {
  try {
    const jobId = formData.get('jobId') as string;
    const businessId = formData.get('businessId') as string;
    const price = parseFloat(formData.get('price') as string);
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : null;
    const message = formData.get('message') as string;

    if (!jobId || !businessId || isNaN(price)) {
      throw new Error('Invalid form data');
    }

    const supabase = await createClient();

    // Create quote
    const { error: quoteError } = await supabase
      .from('marketplace_quotes')
      .insert({
        job_id: jobId,
        business_id: businessId,
        quoted_price: Math.round(price * 100), // Convert to cents
        message: message || null,
        estimated_duration: duration,
        status: 'pending',
      });

    if (quoteError) {
      console.error('Failed to submit quote:', quoteError);
      throw new Error('Failed to submit quote');
    }

    // Update job status to 'quoted'
    await supabase
      .from('marketplace_jobs')
      .update({ status: 'quoted' })
      .eq('id', jobId);

    revalidatePath('/business/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Submit quote error:', error);
    throw error;
  }
}
