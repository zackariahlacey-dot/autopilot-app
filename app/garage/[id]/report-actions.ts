'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateVehicleReport(vehicleId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify vehicle belongs to user
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('user_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Get service history (transactions)
    const { data: services } = await supabase
      .from('transactions')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('completed_at', { ascending: false });

    // Calculate health score
    const oilLife = vehicle.last_oil_change 
      ? Math.max(0, Math.min(100, 100 - ((Date.now() - new Date(vehicle.last_oil_change).getTime()) / (1000 * 60 * 60 * 24 * 180)) * 100))
      : 0;
    
    const detailLife = vehicle.last_detail
      ? Math.max(0, Math.min(100, 100 - ((Date.now() - new Date(vehicle.last_detail).getTime()) / (1000 * 60 * 60 * 24 * 90)) * 100))
      : 0;

    const healthScore = Math.round((oilLife * 0.6 + detailLife * 0.4));

    // Calculate total investment
    const totalInvestment = services?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    // Get businesses where services were performed
    const businessIds = [...new Set(services?.map(s => s.business_id).filter(Boolean))];
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, category')
      .in('id', businessIds);

    // Generate unique slug
    const { data: slugData } = await supabase.rpc('generate_report_slug');
    const slug = slugData || Math.random().toString(36).substring(2, 10);

    // Create snapshot data
    const snapshotData = {
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        license_plate: vehicle.license_plate,
      },
      services: services?.map(s => ({
        service_name: s.service_name,
        amount: s.amount,
        completed_at: s.completed_at,
        business_name: s.business_name,
        mileage_at_service: s.mileage_at_service,
        type: s.type,
      })) || [],
      businesses: businesses || [],
      generated_at: new Date().toISOString(),
    };

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('vehicle_reports')
      .insert({
        vehicle_id: vehicleId,
        user_id: user.id,
        report_slug: slug,
        snapshot_data: snapshotData,
        health_score: healthScore,
        total_investment: totalInvestment,
        service_count: services?.length || 0,
        is_public: true,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Failed to create report:', reportError);
      return { success: false, error: 'Failed to generate report' };
    }

    revalidatePath(`/garage/${vehicleId}`);

    return { 
      success: true, 
      reportSlug: report.report_slug,
      reportUrl: `/report/${report.report_slug}`
    };
  } catch (error) {
    console.error('Generate report error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
