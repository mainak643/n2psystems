import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Revalidate every 60 seconds or allow on-demand freshness
export const revalidate = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const { data: requirements, error } = await supabase
      .from('requirements')
      .select(`
        id,
        reference_code,
        title,
        department,
        employment_type,
        experience_level,
        location,
        work_mode,
        salary_min,
        salary_max,
        salary_currency,
        openings,
        status,
        skills,
        description,
        min_experience_years,
        max_experience_years,
        mandatory_skills,
        preferred_skills,
        closing_date,
        created_at,
        updated_at,
        screening_questions,
        reapdat_enabled,
        reapdat_chat_link,
        recruitment_clients (
          name,
          location,
          industry
        )
      `)
      .in('status', ['Active', 'Open'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs for public API:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active jobs', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://n2psystems.vercel.app';
    const formatted = (requirements || []).map((req) => ({
      ...req,
      apply_url: `${baseUrl}/jobs/${req.reference_code}`,
      form_url: `${baseUrl}/jobs/${req.reference_code}`,
      job_url: `${baseUrl}/jobs/${req.reference_code}`,
    }));

    return NextResponse.json(formatted, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500, headers: corsHeaders }
    );
  }
}

