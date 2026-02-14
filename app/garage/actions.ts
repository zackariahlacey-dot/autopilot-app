'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateVehicleStats(formData: FormData) {
  const vehicleId = formData.get('vehicleId') as string;
  const mileageStr = formData.get('mileage') as string;
  const lastOilChange = formData.get('lastOilChange') as string;
  const lastDetail = formData.get('lastDetail') as string;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in.');
  }

  // Verify the vehicle belongs to the user
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', user.id)
    .single();

  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  const updates: any = {};
  
  if (mileageStr?.trim()) {
    const mileage = parseInt(mileageStr, 10);
    if (!isNaN(mileage) && mileage >= 0) {
      updates.mileage = mileage;
    }
  }

  if (lastOilChange?.trim()) {
    updates.last_oil_change = lastOilChange;
  }

  if (lastDetail?.trim()) {
    updates.last_detail = lastDetail;
  }

  const { error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', vehicleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/garage/${vehicleId}`);
}
