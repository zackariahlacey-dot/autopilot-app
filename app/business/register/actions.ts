'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function registerBusiness(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const address = formData.get('address') as string;

  if (!name?.trim() || !category?.trim() || !address?.trim()) {
    throw new Error('Business Name, Category, and Address are required.');
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in to register a business.');
  }

  // Check if user already has a business
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (existingBusiness) {
    throw new Error('You already have a registered business.');
  }

  const { error } = await supabase.from('businesses').insert({
    owner_id: user.id,
    name: name.trim(),
    category: category.trim(),
    address: address.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/business/dashboard');
  redirect('/business/dashboard');
}
