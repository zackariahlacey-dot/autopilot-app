'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ImportReceiptData = {
  vehicleId: string;
  service: string;
  date: string;
  price: number; // in cents
  shop: string;
  mileage?: number;
};

export async function importReceipt(data: ImportReceiptData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify vehicle belongs to user
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', data.vehicleId)
      .eq('user_id', user.id)
      .single();

    if (!vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Parse the date (format: "May 12, 2023")
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: 'Invalid date format' };
    }

    // Create transaction record (imported receipt)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        vehicle_id: data.vehicleId,
        service_name: data.service,
        amount: data.price,
        business_name: data.shop,
        completed_at: parsedDate.toISOString(),
        type: 'imported_receipt',
        notes: 'Imported via AI Receipt Scanner',
      });

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError);
      return { success: false, error: 'Failed to save receipt' };
    }

    // Update vehicle mileage if provided
    if (data.mileage) {
      await supabase
        .from('vehicles')
        .update({ mileage: data.mileage })
        .eq('id', data.vehicleId);
    }

    // Update vehicle maintenance dates based on service type
    const serviceLower = data.service.toLowerCase();
    if (serviceLower.includes('oil')) {
      await supabase
        .from('vehicles')
        .update({
          last_oil_change: parsedDate.toISOString(),
          mileage_at_last_oil: data.mileage || 0,
        })
        .eq('id', data.vehicleId);
    } else if (serviceLower.includes('detail') || serviceLower.includes('wash')) {
      await supabase
        .from('vehicles')
        .update({ last_detail: parsedDate.toISOString() })
        .eq('id', data.vehicleId);
    }

    revalidatePath(`/garage/${data.vehicleId}`);
    revalidatePath('/dashboard');
    revalidatePath('/garage/import');

    return { success: true };
  } catch (error) {
    console.error('Import receipt error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
