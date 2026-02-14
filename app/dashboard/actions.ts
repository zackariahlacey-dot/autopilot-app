'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addVehicle(formData: FormData): Promise<{ error?: string } | void> {
  const make = formData.get('make') as string;
  const model = formData.get('model') as string;
  const year = formData.get('year') as string;

  if (!make?.trim() || !model?.trim() || !year?.trim()) {
    return { error: 'Make, Model, and Year are required.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to add a vehicle.' };
  }

  const { error } = await supabase.from('vehicles').insert({
    user_id: user.id,
    make: make.trim(),
    model: model.trim(),
    year: year.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
}

export async function addVehicleAction(formData: FormData) {
  const result = await addVehicle(formData);
  if (result?.error) {
    throw new Error(result.error);
  }
}
