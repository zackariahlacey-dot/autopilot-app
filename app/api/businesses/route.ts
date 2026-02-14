import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch all businesses (both verified and unclaimed)
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, category, address, is_verified')
      .order('is_verified', { ascending: false }) // Verified first
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching businesses:', error);
      // Return empty array instead of error object to prevent frontend crashes
      return NextResponse.json([], { status: 200 });
    }

    // Ensure we always return an array
    if (!Array.isArray(businesses)) {
      console.warn('Businesses data is not an array:', businesses);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(businesses || []);
  } catch (error) {
    console.error('Unexpected error in businesses API:', error);
    // Always return an array even on catastrophic failure
    return NextResponse.json([], { status: 200 });
  }
}
