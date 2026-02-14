import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    // Search businesses (by name or category)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, category, address, is_verified')
      .or(`name.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .limit(5);

    // Search vehicles (by make or model)
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, user_id')
      .or(`make.ilike.${searchTerm},model.ilike.${searchTerm}`)
      .limit(5);

    // Search marketplace jobs (by problem description)
    const { data: marketplaceJobs } = await supabase
      .from('marketplace_jobs')
      .select('id, problem_description, category, created_at')
      .ilike('problem_description', searchTerm)
      .eq('status', 'open')
      .limit(5);

    // Format results with type indicators
    const results = [
      ...(businesses || []).map(b => ({
        id: b.id,
        type: 'business' as const,
        title: b.name,
        subtitle: `${b.category} • ${b.address}`,
        url: `/shop/${b.id}`,
        icon: b.is_verified ? '✓' : '🏢',
      })),
      ...(vehicles || []).map(v => ({
        id: v.id,
        type: 'vehicle' as const,
        title: `${v.year} ${v.make} ${v.model}`,
        subtitle: 'Vehicle',
        url: `/garage/${v.id}`,
        icon: '🚗',
      })),
      ...(marketplaceJobs || []).map(j => ({
        id: j.id,
        type: 'marketplace_job' as const,
        title: j.problem_description,
        subtitle: `${j.category} • Lead`,
        url: '/assistant',
        icon: '💰',
      })),
    ];

    return NextResponse.json({ results, query });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
