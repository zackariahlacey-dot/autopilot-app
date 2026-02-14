'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ClaimResult = {
  success?: boolean;
  error?: string;
  redirectUrl?: string;
};

export async function claimBusiness(formData: FormData): Promise<ClaimResult> {
  try {
    const businessId = formData.get('businessId') as string;
    const ownerName = formData.get('ownerName') as string;
    const ownerEmail = formData.get('ownerEmail') as string;
    const phone = formData.get('phone') as string;

    if (!businessId || !ownerName?.trim() || !ownerEmail?.trim()) {
      return { error: 'Business ID, name, and email are required.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to claim a business.' };
    }

    // Check if user already has a business
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existingBusiness) {
      return { error: 'You already own a business. Each user can only own one business.' };
    }

    // Verify business exists and is unclaimed
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, is_verified, owner_id')
      .eq('id', businessId)
      .single();

    if (!business) {
      return { error: 'Business not found.' };
    }

    if (business.is_verified || business.owner_id) {
      return { error: 'This business has already been claimed by another user.' };
    }

    console.log(`Claiming business ${business.name} for user ${user.id}`);

    // Instantly claim the business (magic: grey pin becomes cyan)
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        owner_id: user.id,
        is_verified: true, // Instantly verified for demo purposes
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('Failed to claim business:', updateError);
      return { error: 'Failed to claim business. Please try again.' };
    }

    console.log(`✅ Successfully claimed business ${business.name}`);

    // Revalidate the explore page to update the map
    revalidatePath('/explore');
    revalidatePath('/api/businesses');

    return { 
      success: true,
      redirectUrl: '/business/dashboard'
    };

  } catch (error) {
    console.error('Claim business error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// Legacy function that redirects (for the existing claim page)
export async function claimBusinessWithRedirect(formData: FormData) {
  const result = await claimBusiness(formData);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  redirect(result.redirectUrl || '/business/dashboard');
}
