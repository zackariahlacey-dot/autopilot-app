import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch pending quotes for user's jobs
    const { data: quotes, error } = await supabase
      .from('marketplace_quotes')
      .select(`
        *,
        marketplace_jobs!inner (
          id,
          user_id,
          service_type,
          status
        ),
        businesses (
          id,
          name
        )
      `)
      .eq('marketplace_jobs.user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Failed to fetch quotes:', error);
      return NextResponse.json([], { status: 200 });
    }

    // Format quotes for frontend
    const formattedQuotes = quotes?.map(q => ({
      id: q.id,
      job_id: q.job_id,
      business_id: q.business_id,
      business_name: typeof q.businesses === 'object' && 'name' in q.businesses ? q.businesses.name : 'Unknown Business',
      service_type: typeof q.marketplace_jobs === 'object' && 'service_type' in q.marketplace_jobs 
        ? q.marketplace_jobs.service_type 
        : 'Service',
      quoted_price: q.quoted_price,
      message: q.message,
      created_at: q.created_at,
    })) || [];

    return NextResponse.json(formattedQuotes);
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
