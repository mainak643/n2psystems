import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';
import { inferCurrency, formatSalary } from '@/lib/jobs-service';

// Real-time freshness with fast edge caching
export const revalidate = 30;

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

/**
 * Select lists are module-level literals on purpose. `supabase.select()` derives
 * its row type by parsing the string at the type level, and a ternary expression
 * in that position collapses to `ParserError<"Unexpected input: ">` - which is
 * what put 42 errors on this file and, with type checking wired in as a build
 * gate in next.config, broke `next build` outright.
 *
 * Keep every column the handler reads in BOTH lists. `.returns<...>()` asserts
 * the row shape rather than deriving it, so a column missing here is invisible
 * to the type checker and only shows up as a silently absent field: the
 * summary branch built `summary` from `description` and filtered on `skills`
 * while selecting neither, so `?summary=true` returned no summary at all and
 * reported `skills: []` for every role.
 */
const SUMMARY_COLUMNS = `
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
            mandatory_skills,
            min_experience_years,
            reapdat_chat_link,
            description,
            skills,
            preferred_skills
          `;

const FULL_COLUMNS = `
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
            public_screening_questions,
            reapdat_enabled,
            reapdat_chat_link
          `;

/**
 * Shape of a public requisition row.
 *
 * Declared here and applied with `.returns<>()` because `supabase.select()`
 * infers its row type by parsing the select string at the type level, and these
 * lists are long enough to exhaust that parser - it gives up partway and yields
 * `ParserError<"Unexpected input: ...">`, so every property access below fails
 * to compile. With type checking wired in as a build gate in next.config that
 * failed `next build` outright. Naming the columns once restores real checking
 * at the consumption sites instead of silencing it.
 */
interface PublicRequirementRow {
  id: string;
  reference_code: string | null;
  title: string | null;
  department: string | null;
  employment_type: string | null;
  experience_level: string | null;
  location: string | null;
  work_mode: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  openings: number | null;
  status: string | null;
  skills: string[] | null;
  description: string | null;
  min_experience_years: number | null;
  max_experience_years: number | null;
  mandatory_skills: string[] | null;
  preferred_skills: string[] | null;
  closing_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  public_screening_questions: unknown[] | null;
  reapdat_enabled: boolean | null;
  reapdat_chat_link: string | null;
}

/**
 * PostgREST's `ilike` reads `%` and `_` as wildcards, so an unescaped
 * `?code=%` matched every active row — and because the empty-result guard
 * further down never fired, the caller got an arbitrary job back with a 200
 * instead of the 404 the lookup should have produced.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codeParam = searchParams.get('code') || searchParams.get('reference_code') || searchParams.get('ref') || '';
    const queryParam = (searchParams.get('q') || searchParams.get('query') || searchParams.get('search') || '').toLowerCase().trim();
    const isSummary = searchParams.get('summary') === 'true' || searchParams.get('compact') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);

    let query = supabase
      .from('requirements')
      .select(isSummary ? SUMMARY_COLUMNS : FULL_COLUMNS)
      .in('status', ['Active', 'Open'])
      .order('created_at', { ascending: false });

    if (codeParam.trim()) {
      query = query.ilike('reference_code', escapeLikePattern(codeParam.trim())).limit(1);
    } else if (!queryParam) {
      /*
        The keyword filter below runs in memory, because it also searches the
        `skills` / `mandatory_skills` arrays. A database LIMIT here would
        therefore cut the rows *before* they are searched: `?q=react&limit=5`
        only ever looked at the five newest roles, and `?summary=true&q=…` at
        the newest eight, reporting a live job as not found. When a query is
        present, fetch the active set and apply the limit after filtering.
      */
      if (limitParam > 0) query = query.limit(limitParam);
      else if (isSummary) query = query.limit(8);
    }

    const { data: requirements, error } = await query.returns<PublicRequirementRow[]>();

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

    // Applied here rather than only in the query, so a searched request still
    // honours its limit (and a summary request still stays under its 8).
    const effectiveLimit = limitParam > 0 ? limitParam : isSummary ? 8 : 0;
    if (effectiveLimit > 0) {
      items = items.slice(0, effectiveLimit);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_URL || 'https://n2psystems.com';
    /**
     * A single pre-formatted line per job for AI agents to read verbatim.
     *
     * Reapdat (and any future agent) receives structured JSON but reconstructs
     * it into prose — badly: duplicated salaries, stray braces, garbled `Pay: }`
     * on voice calls. This field removes the guesswork: the agent can quote it
     * as-is, and every field is represented exactly once, in the right order.
     */
    const buildAgentText = (r: PublicRequirementRow): string => {
      const salary = formatSalary(r.salary_min, r.salary_max, r.salary_currency, r.location);
      const parts = [
        r.title || 'Untitled Role',
        `in ${r.department || 'Engineering'}`,
        `– ${r.location || 'Location TBD'}`,
        r.work_mode ? `(${r.work_mode})` : '',
        r.employment_type ? `| ${r.employment_type}` : '',
        salary ? `| Pay: ${salary}` : '',
        r.min_experience_years ? `| ${r.min_experience_years}+ yrs exp` : '',
        r.reference_code ? `| Ref: ${r.reference_code}` : '',
      ];
      return parts.filter(Boolean).join(' ');
    };

    const formatted = items.map((req) => {
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
        salary_min: req.salary_min && Number(req.salary_min) > 0 ? Number(req.salary_min) : null,
        salary_max: req.salary_max && Number(req.salary_max) > 0 ? Number(req.salary_max) : null,
        salary_currency: inferCurrency(req.salary_currency, req.location),
        salary_range: formatSalary(req.salary_min, req.salary_max, req.salary_currency, req.location) || null,
        openings: req.openings,
        status: req.status,
        mandatory_skills: req.mandatory_skills || [],
        preferred_skills: req.preferred_skills || [],
        skills: req.skills || [],
        // Same slug rule the site itself uses (lib/jobs-service.ts maps a job's
        // id as `reference_code || id`). Without the fallback a requisition
        // with no reference code published the URL ".../jobs/null", and
        // without encoding a code containing a space or slash broke the path.
        job_url: `${baseUrl}/jobs/${encodeURIComponent(req.reference_code || req.id)}`,
        apply_url: `${baseUrl}/jobs/${encodeURIComponent(req.reference_code || req.id)}/apply`,
        screening_chat_link: req.reapdat_chat_link || undefined,
        // Pre-formatted line for AI agents — read this verbatim instead of
        // reconstructing from structured fields.
        agent_text: buildAgentText(req),
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
        // Sourced from the sanitized column: the DB trigger has already stripped
        // idealAnswer/numericThreshold, and `anon` can no longer read the raw
        // one at all. The per-field mapping below stays as a second guard.
        screening_questions: Array.isArray(req.public_screening_questions)
          ? req.public_screening_questions
              .map((q: unknown) => {
                if (typeof q === 'string') return q.trim();
                if (typeof q === 'object' && q !== null) {
                  const item = q as { id?: string; question?: string; responseType?: string };
                  if (item.question) {
                    return {
                      id: item.id,
                      question: String(item.question).trim(),
                      responseType: item.responseType,
                    };
                  }
                }
                return null;
              })
              .filter(Boolean)
          : [],
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

