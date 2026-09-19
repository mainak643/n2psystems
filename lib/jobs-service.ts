import { supabase, isSupabaseConfigured } from './supabase';
import type { Job } from './jobs-data';

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Postgres `numeric` arrives as a JSON number, a null column arrives as null,
 * and a mis-seeded row can arrive as a string. Everything downstream does
 * arithmetic or formatting on these, so normalise once here.
 */
function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Indian salaries group in lakhs, not millions — an INR figure rendered with a
 * US locale reads "₹1.2M" where every candidate expects "₹12L". Currency also
 * has to drive the symbol: the previous implementation hardcoded "$", so the
 * live ₹12,00,000–₹24,00,000 requisition published from the portal rendered on
 * the public site as "$1200K - $2400K INR".
 */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  CAD: 'en-CA',
  GBP: 'en-GB',
  EUR: 'en-IE',
};

function formatSalary(min?: number | null, max?: number | null, currency?: string | null): string {
  const lo = toNumber(min);
  const hi = toNumber(max);
  if (lo === undefined && hi === undefined) return 'Competitive';

  const code = (currency || 'USD').toUpperCase();
  const locale = LOCALE_BY_CURRENCY[code] || 'en-US';

  const formatNum = (num: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        notation: 'compact',
        compactDisplay: 'short',
        // Keep a decimal only where it carries information: $95.5K, but $150K
        // and ₹12L rather than $150.0K and ₹12.0L.
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(num);
    } catch {
      // A malformed ISO code makes Intl throw rather than degrade.
      return `${code} ${Math.round(num).toLocaleString('en-US')}`;
    }
  };

  if (lo !== undefined && hi !== undefined) return `${formatNum(lo)} - ${formatNum(hi)} ${code}`;
  if (lo !== undefined) return `From ${formatNum(lo)} ${code}`;
  return `Up to ${formatNum(hi as number)} ${code}`;
}

function normalizeEmploymentType(type?: string): "Full-time" | "Contract" | "Part-time" {
  if (!type) return "Full-time";
  const lower = type.toLowerCase();
  if (lower.includes('contract')) return "Contract";
  if (lower.includes('part')) return "Part-time";
  return "Full-time";
}

function normalizeWorkMode(mode?: string): "Remote" | "Onsite" | "Hybrid" {
  if (!mode) return "Hybrid";
  const lower = mode.toLowerCase();
  if (lower.includes('remote')) return "Remote";
  if (lower.includes('on-site') || lower.includes('onsite')) return "Onsite";
  return "Hybrid";
}

const BULLET_RE = /^\s*(?:[•▪◦*\-–—]|\d+[.)])\s+/;

/** A heading is a short line that introduces a list — never a list item itself. */
function sectionOf(line: string): 'responsibilities' | 'requirements' | null {
  if (line.length > 64 || BULLET_RE.test(line)) return null;
  const lower = line.toLowerCase();
  if (
    lower.includes('responsibilit') ||
    lower.includes('what you will do') ||
    lower.includes("what you'll do") ||
    lower.includes('key duties')
  ) {
    return 'responsibilities';
  }
  if (
    lower.includes('requirement') ||
    lower.includes('qualification') ||
    lower.includes('what you bring') ||
    lower.includes("what you'll need") ||
    lower.includes('must have') ||
    lower.includes('skills')
  ) {
    return 'requirements';
  }
  return null;
}

/**
 * Splits a free-text JD into two bullet lists.
 *
 * Two failure modes this guards against, both reachable with the Gemini-parsed
 * descriptions the portal writes:
 *
 *  - The heading test used to run against every line, so a real bullet like
 *    "• Gather requirements from stakeholders" was read as a "requirements"
 *    heading, silently dropped, and every bullet after it filed under the wrong
 *    list. `sectionOf` now only matches short, non-bullet lines.
 *  - Only lines opening with a bullet glyph were collected, so a JD listing its
 *    duties as plain lines under a heading produced nothing and fell through to
 *    the generic placeholder copy. Once a heading establishes the section,
 *    plain lines count too.
 */
function extractBulletPoints(text?: string): { responsibilities: string[]; requirements: string[] } {
  if (!text) return { responsibilities: [], requirements: [] };

  const responsibilities: string[] = [];
  const requirements: string[] = [];
  let current: 'overview' | 'responsibilities' | 'requirements' = 'overview';

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const heading = sectionOf(line);
    if (heading) {
      current = heading;
      continue;
    }

    const isBullet = BULLET_RE.test(line);
    const cleaned = line.replace(BULLET_RE, '').trim();
    // Under 6 chars is noise; over 300 is a prose paragraph, not a bullet.
    if (cleaned.length < 6 || cleaned.length > 300) continue;

    if (current === 'responsibilities') {
      responsibilities.push(cleaned);
    } else if (current === 'requirements') {
      requirements.push(cleaned);
    } else if (isBullet) {
      // Bullets before any heading: the first few read as duties, rest as asks.
      (responsibilities.length < 5 ? responsibilities : requirements).push(cleaned);
    }
  }

  return { responsibilities, requirements };
}

/**
 * Last resort when a requisition's description carries no usable list — better
 * than rendering an empty "Key Responsibilities" card, but deliberately generic
 * so it reads as boilerplate rather than as invented specifics about the role.
 */
function genericResponsibilities(title?: string): string[] {
  return [
    `Lead technical execution and solution design for ${title || 'this role'}`,
    'Collaborate with agile teams to build, scale, and maintain high-quality platforms',
    'Optimize performance, security, and developer best practices',
  ];
}

const GENERIC_REQUIREMENTS = [
  'Proven professional track record in relevant technologies',
  'Strong analytical, problem-solving, and communication capabilities',
  'Ability to thrive in high-ownership and collaborative environments',
];

/**
 * Exactly the columns migration 00024 grants `anon`, plus the client embed.
 * Selecting `*` as anon would ask for hiring_manager/priority/candidate_count
 * too and PostgREST fails the whole request on the first ungranted column.
 */
const PUBLIC_JOB_COLUMNS =
  'id, reference_code, title, department, employment_type, experience_level, location, work_mode, ' +
  'salary_min, salary_max, salary_currency, openings, status, skills, description, ' +
  'min_experience_years, max_experience_years, mandatory_skills, preferred_skills, public_screening_questions, ' +
  'closing_date, created_at, updated_at, recruitment_clients(name, location, industry)';

export function mapRequirementToJob(req: any): Job {
  const extracted = extractBulletPoints(req.description);

  const skills: string[] = Array.isArray(req.skills) ? req.skills.filter(Boolean) : [];
  const mandatory: string[] = Array.isArray(req.mandatory_skills) ? req.mandatory_skills.filter(Boolean) : [];
  const techStack =
    skills.length > 0
      ? skills
      : mandatory.length > 0
        ? mandatory
        : ['Technical Consulting', 'Software Engineering'];

  const minYears = toNumber(req.min_experience_years);
  const rawQuestions = req.public_screening_questions || req.screening_questions;
  const screeningQuestions: string[] = Array.isArray(rawQuestions)
    ? rawQuestions
        .map((q: any) => {
          if (typeof q === 'string') return q.trim();
          if (typeof q === 'object' && q !== null && q.question) return String(q.question).trim();
          return '';
        })
        .filter((text: string) => text.length > 0)
    : [];

  return {
    id: req.reference_code || req.id,
    title: req.title || 'Technology Consultant',
    company: req.recruitment_clients?.name?.trim() || 'N2P Enterprise Client',
    location: req.location?.trim() || 'Toronto, Canada',
    type: normalizeEmploymentType(req.employment_type),
    mode: normalizeWorkMode(req.work_mode),
    experience: req.experience_level?.trim() || (minYears !== undefined ? `${minYears}+ years` : '3+ years'),
    salary: formatSalary(req.salary_min, req.salary_max, req.salary_currency),
    techStack,
    domain: req.department?.trim() || 'Software Engineering',
    postedDate: formatRelativeTime(req.created_at),
    description: req.description || `Exciting opportunity for a ${req.title} with N2P Systems.`,
    responsibilities:
      extracted.responsibilities.length > 0
        ? extracted.responsibilities
        : genericResponsibilities(req.title),
    // Prefer what the JD actually said, then the recruiter's mandatory-skills
    // list, and only then boilerplate.
    requirements:
      extracted.requirements.length > 0
        ? extracted.requirements
        : mandatory.length > 0
          ? mandatory.map((s) => `Strong proficiency and experience with ${s}`)
          : GENERIC_REQUIREMENTS,
    requirementUuid: req.id || undefined,
    screeningQuestions,
    datePostedISO: req.created_at || undefined,
    validThroughISO: req.closing_date || undefined,
    salaryMin: toNumber(req.salary_min),
    salaryMax: toNumber(req.salary_max),
    salaryCurrency: req.salary_currency || undefined,
  };
}

let memoryCachedJobs: { data: Job[]; timestamp: number } | null = null;
const jobCache = new Map<string, { data: Job | null; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory cache

/**
 * A server render has to finish, but it does not have to finish in a second.
 *
 * This was 1200ms, which a cold Supabase connection (DNS + TLS + query) beats
 * only sometimes — during a production build every request lost the race, so
 * `/jobs` prerendered an empty board and `/jobs/REQ-11968` returned 404 for a
 * live posting. Since the seed data was removed there is nothing left to mask
 * a timeout: a slow query now reads to a visitor, and to Google, as "this role
 * does not exist". Both pages are ISR-cached for 60s, so paying a slower first
 * render is much cheaper than serving a wrong one.
 */
const QUERY_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function fetchPublishedJobs(): Promise<Job[]> {
  const now = Date.now();
  if (memoryCachedJobs && now - memoryCachedJobs.timestamp < CACHE_TTL_MS) {
    return memoryCachedJobs.data;
  }

  if (isSupabaseConfigured()) {
    try {
      const queryPromise = supabase
        .from('requirements')
        .select(PUBLIC_JOB_COLUMNS)
        .in('status', ['Active', 'Open'])
        .order('created_at', { ascending: false });

      const { data, error } = (await withTimeout(queryPromise)) as any;

      if (error) {
        console.warn('[jobs] Supabase rejected the published-roles query:', error.message);
      } else if (data && data.length > 0) {
        const mapped = data.map(mapRequirementToJob);
        memoryCachedJobs = { data: mapped, timestamp: Date.now() };
        return mapped;
      } else {
        console.warn('[jobs] No published requirements visible to the public key.');
      }
    } catch (err) {
      console.warn('[jobs] Error or timeout fetching live jobs from Supabase:', err);
    }
  }

  if (memoryCachedJobs) {
    return memoryCachedJobs.data;
  }

  return [];
}

/** Reference codes are opaque, so only try the UUID column when it can be one. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Next has already percent-decoded a dynamic segment by the time it reaches us,
 * so decoding again is only a safety net for links built elsewhere — and it
 * throws URIError on an already-decoded id containing a bare "%", which took
 * the whole route down with a 500 rather than a 404.
 */
function safeDecode(id: string): string {
  try {
    return decodeURIComponent(id).trim();
  } catch {
    return id.trim();
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const decodedId = safeDecode(id);
  if (!decodedId) return null;

  const now = Date.now();
  const cached = jobCache.get(decodedId.toLowerCase());
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (isSupabaseConfigured()) {
    try {
      // One round trip, not two: `.eq('id', 'REQ-1001')` against a uuid column
      // is a 22P02 type error, so the old unconditional UUID retry spent a
      // query and logged a Postgres error on every reference-code lookup.
      const queryPromise = supabase
        .from('requirements')
        .select(PUBLIC_JOB_COLUMNS)
        .eq(UUID_RE.test(decodedId) ? 'id' : 'reference_code', decodedId)
        .in('status', ['Active', 'Open'])
        .maybeSingle();

      const { data, error } = (await withTimeout(queryPromise)) as any;

      if (error) {
        console.warn(`[jobs] Supabase rejected the lookup for "${decodedId}":`, error.message);
      } else if (data) {
        const mapped = mapRequirementToJob(data);
        jobCache.set(decodedId.toLowerCase(), { data: mapped, timestamp: Date.now() });
        return mapped;
      } else {
        // The query genuinely came back empty: this reference code is not a
        // published requisition. That is the only result worth remembering as
        // a miss.
        jobCache.set(decodedId.toLowerCase(), { data: null, timestamp: Date.now() });
      }
    } catch (err) {
      console.warn(`[jobs] Error or timeout fetching job ${decodedId} from Supabase:`, err);
    }
  }

  // Deliberately not cached. A timeout or a rejected query says nothing about
  // whether the role exists, and caching it turned one slow request into a
  // sticky 404 on a live posting for the whole TTL — long enough for a crawler
  // to record the job as gone.
  return null;
}

export function getDynamicFilterOptions(jobs: Job[]) {
  const uniq = (values: (string | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => Boolean(v && v.trim())))).sort((a, b) =>
      a.localeCompare(b)
    );

  return {
    locations: ['All Locations', ...uniq(jobs.map((j) => j.location))],
    domains: ['All Domains', ...uniq(jobs.map((j) => j.domain))],
    experiences: ['All Levels', ...uniq(jobs.map((j) => j.experience))],
    modes: ['All Modes', 'Remote', 'Hybrid', 'Onsite'],
  };
}
