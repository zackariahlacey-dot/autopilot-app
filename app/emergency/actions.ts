'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type CreateEmergencyRequestData = {
  vehicleId?: string;
  latitude: number;
  longitude: number;
  emergencyType: string;
  description: string;
};

export async function createEmergencyRequest(data: CreateEmergencyRequestData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get address from coordinates (mock for now)
    const address = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;

    // Create emergency request
    const { data: emergency, error: emergencyError } = await supabase
      .from('emergency_requests')
      .insert({
        user_id: user.id,
        vehicle_id: data.vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: address,
        emergency_type: data.emergencyType,
        description: data.description,
        status: 'searching',
        priority: 1, // Critical
      })
      .select()
      .single();

    if (emergencyError) {
      console.error('Failed to create emergency request:', emergencyError);
      return { success: false, error: 'Failed to create emergency request' };
    }

    return {
      success: true,
      emergencyId: emergency.id,
    };
  } catch (error) {
    console.error('Create emergency request error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function dispatchEmergency(emergencyId: string, businessId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get business details
    const { data: business } = await supabase
      .from('businesses')
      .select('name, phone')
      .eq('id', businessId)
      .single();

    // Update emergency request
    const { error: updateError } = await supabase
      .from('emergency_requests')
      .update({
        business_id: businessId,
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
        driver_name: business?.name || 'Driver',
        driver_phone: business?.phone,
        eta_minutes: 15, // Mock ETA
      })
      .eq('id', emergencyId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to dispatch emergency:', updateError);
      return { success: false, error: 'Failed to dispatch' };
    }

    // Create booking for the service
    const { data: emergency } = await supabase
      .from('emergency_requests')
      .select('*, vehicles(*)')
      .eq('id', emergencyId)
      .single();

    if (emergency) {
      await supabase.from('bookings').insert({
        user_id: user.id,
        business_id: businessId,
        vehicle_id: emergency.vehicle_id,
        service_date: new Date().toISOString(),
        status: 'confirmed',
        is_emergency: true,
        emergency_location: {
          latitude: emergency.latitude,
          longitude: emergency.longitude,
          address: emergency.address,
        },
      });
    }

    revalidatePath('/business/dashboard');
    revalidatePath('/emergency');

    return { success: true };
  } catch (error) {
    console.error('Dispatch emergency error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function cancelEmergency(emergencyId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('emergency_requests')
      .update({
        status: 'cancelled',
      })
      .eq('id', emergencyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to cancel emergency:', error);
      return { success: false, error: 'Failed to cancel' };
    }

    revalidatePath('/emergency');
    return { success: true };
  } catch (error) {
    console.error('Cancel emergency error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateEmergencyStatus(emergencyId: string, status: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const updates: any = { status };

    if (status === 'arrived') {
      updates.arrived_at = new Date().toISOString();
    } else if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('emergency_requests')
      .update(updates)
      .eq('id', emergencyId);

    if (error) {
      console.error('Failed to update emergency status:', error);
      return { success: false, error: 'Failed to update status' };
    }

    revalidatePath('/business/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Update emergency status error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
