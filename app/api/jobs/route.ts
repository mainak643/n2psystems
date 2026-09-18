import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Real-time freshness with fast edge caching (10s stale-while-revalidate)
export const revalidate = 10;

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codeParam = searchParams.get('code') || searchParams.get('reference_code') || searchParams.get('ref') || '';
    const queryParam = (searchParams.get('q') || searchParams.get('query') || searchParams.get('search') || '').toLowerCase().trim();
    const isSummary = searchParams.get('summary') === 'true' || searchParams.get('compact') === 'true';

    let query = supabase
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

    if (codeParam.trim()) {
      query = query.ilike('reference_code', codeParam.trim());
    }

    const { data: requirements, error } = await query;

    if (error) {
      console.error('Error fetching jobs for public API:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active jobs', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    let items = requirements || [];

    // Optional keyword search filter across title, department, location, skills
    if (queryParam) {
      items = items.filter((r) => {
        const titleMatch = (r.title || '').toLowerCase().includes(queryParam);
        const deptMatch = (r.department || '').toLowerCase().includes(queryParam);
        const locMatch = (r.location || '').toLowerCase().includes(queryParam);
        const skillsMatch = (r.skills || []).some((s: string) => s.toLowerCase().includes(queryParam)) ||
                            (r.mandatory_skills || []).some((s: string) => s.toLowerCase().includes(queryParam));
        return titleMatch || deptMatch || locMatch || skillsMatch;
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://n2psystems.vercel.app';
    const formatted = items.map((req) => {
      const client = Array.isArray(req.recruitment_clients) ? req.recruitment_clients[0] : req.recruitment_clients;
      const base = {
        id: req.id,
        reference_code: req.reference_code,
        title: req.title,
        department: req.department,
        employment_type: req.employment_type,
        experience_level: req.experience_level,
        min_experience_years: req.min_experience_years,
        max_experience_years: req.max_experience_years,
        location: req.location,
        work_mode: req.work_mode,
        salary_min: req.salary_min,
        salary_max: req.salary_max,
        salary_currency: req.salary_currency,
        salary_range: req.salary_min || req.salary_max
          ? `${req.salary_currency || 'USD'} ${Number(req.salary_min || 0).toLocaleString()} - ${Number(req.salary_max || 0).toLocaleString()}`
          : 'Competitive / Negotiable',
        openings: req.openings,
        status: req.status,
        mandatory_skills: req.mandatory_skills || [],
        preferred_skills: req.preferred_skills || [],
        skills: req.skills || [],
        client_name: client?.name || undefined,
        job_url: `${baseUrl}/jobs/${req.reference_code}`,
        apply_url: `${baseUrl}/jobs/${req.reference_code}/apply`,
        screening_chat_link: req.reapdat_chat_link || undefined,
      };

      if (isSummary) {
        // High-density summary for lightning-fast agent lookups (under 5KB payload)
        return {
          ...base,
          summary: req.description ? `${req.description.slice(0, 160).replace(/\s+/g, ' ')}...` : undefined,
        };
      }

      // Complete specification for deep-dive single job lookups
      return {
        ...base,
        description: req.description,
        screening_questions: req.screening_questions || [],
        closing_date: req.closing_date,
        created_at: req.created_at,
        updated_at: req.updated_at,
      };
    });

    // If specific job code was requested, return that job object directly
    if (codeParam.trim()) {
      if (formatted.length === 0) {
        return NextResponse.json(
          { found: false, error: `No active job found with reference code ${codeParam}` },
          { status: 404, headers: corsHeaders }
        );
      }
      return NextResponse.json(formatted[0], {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      });
    }

    return NextResponse.json(formatted, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
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

