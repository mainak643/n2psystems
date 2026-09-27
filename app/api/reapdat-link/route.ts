import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const REAPDAT_API = 'https://api.reapdat.com/api/v1';

/**
 * Outbound ceiling. The portal gives up on us at 12s, so anything slower than
 * this is a spinner the recruiter is already staring at; failing here at least
 * produces a logged reason instead of a severed connection.
 */
const UPSTREAM_TIMEOUT_MS = 10_000;

/**
 * Document upload and parse. Deliberately longer than the general ceiling: the
 * client allows 30s for this call, and a large PDF spends most of it upstream.
 */
const UPLOAD_TIMEOUT_MS = 28_000;

/** Kept in step with the panel's file input `accept` list. */
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'csv', 'xlsx', 'json']);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Ceilings on the two ingest fields that had none. `description` is a free-text
 * JD and `rawJson` is an arbitrary object, so between them the generated
 * document was unbounded and caller-controlled - a 413 from REAPDAT at best,
 * and at worst a knowledge base whose retrieval is drowned by one requisition.
 * Both cut points are announced in the text so the model knows it is reading a
 * truncation rather than the whole role.
 */
const MAX_DESCRIPTION_CHARS = 20_000;
const MAX_RAW_JSON_CHARS = 20_000;

/**
 * `screeningQuestions` was the one caller-controlled field with no ceiling at
 * all, which defeated the two above: a body carrying thousands of long
 * questions built an arbitrarily large ingest document in memory and posted it
 * upstream. A real screening round is a handful of questions.
 */
const MAX_SCREENING_QUESTIONS = 50;
const MAX_QUESTION_CHARS = 2_000;

/**
 * Origins allowed to call this proxy.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://ops.n2psystems.com',
  'https://n2psystems.com',
  'https://www.n2psystems.com',
  'https://n2-p-operations.vercel.app',
];

/** The portal's Vite dev server, off production only — see isAllowedOrigin. */
const DEV_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

const allowedOrigins = new Set(
  [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.NODE_ENV !== 'production' ? DEV_ALLOWED_ORIGINS : []),
    ...(process.env.REAPDAT_ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ]
);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Any localhost or 127.0.0.1 (any port, http or https) — but only off
  // production. This branch used to run everywhere, so anything a victim was
  // running on their own machine could reach the live provisioning API with
  // credentials attached.
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return true;
  }
  try {
    const parsed = new URL(origin);
    // Only this project's own preview deployments. A bare `.vercel.app` suffix
    // reflected every project on the platform - including an attacker's - and
    // paired it with Allow-Credentials.
    //
    // The prefix form of this check had the same hole one level down: it
    // matched `n2-p-operations-anything.vercel.app`, and project names are
    // first-come on Vercel, so anyone could claim one. Vercel preview hosts
    // are `<project>-<hash>-<scope>.vercel.app`, so require those two
    // trailing segments rather than an open-ended suffix.
    if (/^n2-p-operations-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/.test(parsed.hostname)) return true;
    if (
      parsed.hostname === 'ops.n2psystems.com' ||
      parsed.hostname === 'n2psystems.com' ||
      parsed.hostname === 'www.n2psystems.com' ||
      parsed.hostname === 'n2psystems.ca' ||
      parsed.hostname === 'www.n2psystems.ca'
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    Vary: 'Origin',
  };

  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Caller authentication.
 *
 * Everything past this point spends the operator's REAPDAT account: minting
 * links against a capped tenant quota, revoking them, and writing into a link's
 * knowledge base - the text the screening agent then speaks to candidates. CORS
 * is not a control for any of that. It is advisory, browser-only, and a request
 * that simply omits `Origin` (curl, a script, any server) was never rejected by
 * it at all.
 *
 * The bearer token is the Supabase session JWT the portal already holds, so
 * this adds no new secret to distribute. `auth.getUser` validates the
 * signature and expiry against the project rather than trusting the claims.
 */
async function isAuthenticatedCaller(req: NextRequest): Promise<boolean> {
  const header = req.headers.get('authorization') || '';
  if (!/^bearer\s/i.test(header)) return false;
  const token = header.slice(header.indexOf(' ') + 1).trim();
  if (!token) return false;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data?.user);
  } catch {
    // A transport failure reaching the auth server is not proof of identity.
    return false;
  }
}

function unauthorized(cors: Record<string, string>): NextResponse {
  return NextResponse.json(
    { ok: false, success: false, error: 'Authentication required.' },
    { status: 401, headers: cors }
  );
}

// In-memory token cache to prevent hitting Reapdat login rate limits
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let inflightLogin: Promise<string> | null = null;

async function login(): Promise<string> {
  const email = process.env.REAPDAT_EMAIL;
  const password = process.env.REAPDAT_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'REAPDAT credentials are not configured. Set REAPDAT_EMAIL and REAPDAT_PASSWORD.'
    );
  }

  const loginRes = await fetch(`${REAPDAT_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password: password.trim() }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!loginRes.ok) {
    const errData = await loginRes.json().catch(() => ({}));
    const errorMsg = errData.detail || `Reapdat login failed with status ${loginRes.status}`;
    console.error('Reapdat auth failed:', errorMsg);
    throw new Error(errorMsg);
  }

  const data = await loginRes.json();
  if (!data.access_token) {
    throw new Error('Reapdat login succeeded but returned no access_token');
  }

  const token = String(data.access_token);
  cachedToken = token;
  tokenExpiresAt = Date.now() + (data.expires_in || 14400) * 1000;

  return token;
}

async function getReapdatToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    cachedToken = null;
    tokenExpiresAt = 0;
    // Drop the shared promise too. Reusing it would hand the 401 retry the
    // very token that just failed, which is the one thing a force-refresh
    // exists to avoid. The abandoned login still settles harmlessly.
    inflightLogin = null;
  }

  if (cachedToken && tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken;
  }

  if (!inflightLogin) {
    inflightLogin = login().finally(() => {
      inflightLogin = null;
    });
  }

  return inflightLogin;
}

/**
 * Returns authentication headers: prefer Admin API Key (X-API-Key) if provided in env,
 * otherwise fall back to authenticated bearer token session.
 */
async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const adminKey = process.env.REAPDAT_ADMIN_API_KEY || process.env.REAPDAT_API_KEY;
  if (adminKey && adminKey.trim().startsWith('ua_admin_')) {
    return { 'X-API-Key': adminKey.trim() };
  }
  const token = await getReapdatToken(forceRefresh);
  return { Authorization: `Bearer ${token}` };
}

interface ReapdatLink {
  id: string;
  label?: string;
  tags?: string[];
  status?: string;
  url?: string;
  token?: string;
  channels?: string[];
  is_active?: boolean;
  kb_docs?: number;
  kb_chunks?: number;
  kb_sources?: Record<string, number>;
  created_at?: string;
}

/**
 * Matches a link to a requisition code accurately:
 * 1. Checks that the link is active
 * 2. Checks exact tag equality OR exact word boundary inside label (prevents REQ-4367 matching REQ-43674)
 */
function matchesReferenceCode(link: ReapdatLink, wantedCode: string): boolean {
  if (link.status && link.status !== 'active') return false;
  if (link.is_active === false) return false;
  const wanted = wantedCode.toLowerCase().trim();
  const hasTag = (link.tags || []).some((t) => String(t).toLowerCase().trim() === wanted);
  if (hasTag) return true;
  if (!link.label) return false;
  const escaped = wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(link.label);
}

/**
 * Reclaims the slot a superseded link is holding.
 *
 * `keepLinkId` is the replacement that has just been created. It is tagged
 * with the same reference code, so without excluding it this sweep would
 * delete the link it was called to make room for — cleanup now runs *after*
 * the create, not before, precisely so a failed create can no longer leave a
 * requisition with no link at all.
 */
async function revokeSupersededLinks(
  authHeaders: Record<string, string>,
  referenceCode: string,
  keepLinkId?: string
): Promise<void> {
  const listRes = await fetch(`${REAPDAT_API}/chat-links`, {
    headers: authHeaders,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!listRes.ok) {
    console.warn(`Reapdat link inventory unavailable (status ${listRes.status}); skipping cleanup.`);
    return;
  }

  const data = await listRes.json();
  const links: ReapdatLink[] = Array.isArray(data.links) ? data.links : [];
  const superseded = links.filter(
    (link) => matchesReferenceCode(link, referenceCode) && String(link.id) !== keepLinkId
  );

  for (const link of superseded) {
    const safeId = encodeURIComponent(link.id);
    const delRes = await fetch(`${REAPDAT_API}/chat-links/${safeId}`, {
      method: 'DELETE',
      headers: authHeaders,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (delRes.ok) {
      console.info(`Deleted superseded Reapdat link ${link.id} for ${referenceCode}.`);
    } else {
      await fetch(`${REAPDAT_API}/chat-links/${safeId}/revoke`, {
        method: 'POST',
        headers: authHeaders,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }).catch(() => {});
    }
  }
}

interface QuestionItem {
  id?: string;
  question?: string;
  idealAnswer?: string;
  answer?: string;
  responseType?: string;
  mustPass?: boolean;
  numericThreshold?: unknown;
}

interface IngestOutcome {
  ok: boolean;
  count: number;
  status?: number;
  error?: string;
}

/**
 * Recruiter-facing wording for a failed knowledge ingest. Every message says
 * what happened to the candidate link, because that is the recruiter's actual
 * question when a sync fails mid-hiring-round.
 */
function describeIngestFailure(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'Reapdat rejected the indexing request for this link. The screening link is unchanged - please contact an administrator.';
    case 404:
      return 'Reapdat no longer recognises this screening link. Generate a new link for this requisition.';
    case 413:
      return 'The requisition is too large for Reapdat to index. Shorten the job description and retry.';
    case 429:
      return 'Reapdat rate limited the knowledge sync. The screening link is unchanged - please retry in a minute.';
    default:
      return `Reapdat could not index the requisition (status ${status}). The screening link is unchanged - please retry the sync.`;
  }
}

/**
 * Loads comprehensive requisition context, structured JSON, and updated screening questions
 * directly onto the link's isolated knowledge base.
 */
async function ingestKnowledgeForLink(
  authHeaders: Record<string, string>,
  linkId: string,
  referenceCode: string,
  title: string,
  department: string,
  screeningQuestions: unknown[],
  details?: {
    description?: string;
    location?: string;
    workMode?: string;
    experienceLevel?: string;
    minExperienceYears?: number;
    maxExperienceYears?: number;
    mandatorySkills?: string[];
    preferredSkills?: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    clientName?: string;
    hiringManager?: string;
    employmentType?: string;
    rawJson?: Record<string, unknown>;
  }
): Promise<IngestOutcome> {
  const sections: string[] = [];

  // Reapdat's portal ingest appends; it has no endpoint for replacing or
  // deleting a link's existing passages. Every re-sync therefore leaves the
  // previous revision of this document in the knowledge base, and retrieval can
  // surface a superseded dealbreaker list. Stamping each revision and stating
  // the precedence rule in the text is what we can do from this side: it gives
  // the model the tiebreak it otherwise has to guess at.
  const revisionStamp = new Date().toISOString();

  const publicJobUrl = `https://www.n2psystems.com/jobs/${encodeURIComponent(referenceCode)}`;

  sections.push(`# N2P Systems Talent & Career Advisor Guidelines: ${title || 'Open Position'} (${referenceCode})`);
  sections.push(
    `## AUTHORITATIVE SPECIFICATION & REVISION CONTROL:
- Requisition Reference Code: ${referenceCode}
- Target Position: ${title || 'Open Position'}
- Hiring Company: N2P Systems Inc. (Official Careers: https://www.n2psystems.com/jobs)
- Direct Job Application URL: ${publicJobUrl}
- Document Revision: ${revisionStamp}
- PRECEDENCE DIRECTIVE: This document is the single authoritative specification for requisition ${referenceCode}. All earlier revisions for this requisition in the knowledge base are superseded: always prioritize this specification and the direct apply link above.

## N2P SYSTEMS COMPANY OVERVIEW:
N2P Systems Inc. is an industry-leading global IT consulting, engineering solutions, and specialized technology staffing firm headquartered in Canada (Ontario) with active client engagements across the United States and high-performance Global Delivery Centers in India (Chennai, Bangalore, Hyderabad, Pune, and Noida). We deliver digital transformation, cloud architecture, enterprise platform modernization, and top-tier technical teams for premier enterprises and high-growth innovators.

## ROLE MISSION & CONVERSATIONAL TALENT ADVISOR DIRECTIVES:
- Target Position: ${title || 'Open Position'}
- Requisition Reference Code: ${referenceCode}
- Hiring Company: N2P Systems
- Official Public Job Posting & Application Page: ${publicJobUrl}

### STRICT CONVERSATIONAL GUIDELINES (NO SCREENING QUESTION INTERROGATION):
1. ROLE AS TALENT & CAREER ADVISOR:
   - You are the friendly, professional N2P Systems Talent & Career Advisor.
   - DO NOT interrogate, test, or grill candidates with repetitive knockout screening questions in chat or during voice calls.
   - The job posting on our website already includes the complete application form and required screening questions.
   - When a candidate wants to apply for this role or asks how to apply, warmly guide them and share the official application URL:
     ${publicJobUrl}
   - Explain that they can submit their resume/CV and complete the short online application screening directly on that page.

2. MULTI-REGION CAREER NAVIGATION FLOW:
   - When a candidate expresses interest in opportunities or a specific skill stack (e.g. "I am interested in Java", "I want to apply", "Are you hiring?"):
     a. Greet warmly and acknowledge their interest or technical expertise.
     b. Inquire about their target work country:
        "Which country are you looking to apply for? We currently offer positions across India, Canada, and the United States."
     c. Location & Work Authorization Qualification:
        - If the candidate chooses CANADA or the UNITED STATES (US):
          Ask: "Are you currently legally authorized to work in [Canada / the United States] without requiring employer visa sponsorship?"
          * Authorized means any of: citizenship, permanent residency, a Green Card, or a valid open work permit. Treat any of these as qualified and do not probe further into immigration status.
          * If Authorized: Confirm their eligibility and share the matching open roles with their direct application links.
          * If Not Authorized (requires sponsorship): Politely inform them: "Currently, our openings in [Canada/US] require existing legal work authorization without employer visa sponsorship. You are welcome to explore our opportunities in India, or check our careers board at n2psystems.com/jobs for future sponsorship openings."
        - If the candidate chooses INDIA:
          No foreign visa sponsorship check is required. Proceed directly to presenting available India-based or remote roles with their direct application links.

3. ROLE PRESENTATION & DIRECT APPLY LINK:
   - In Chat: Highlight the role details (Title, Requisition Code, Location, Tech Stack) in clean markdown, using bold for the details that matter most, and give the apply link as a clickable markdown link rather than a bare URL:
     [Apply for this role](${publicJobUrl})
   - In Voice Call: Speak in natural conversational prose, 1 to 2 sentences per turn. Never read markdown symbols, bullet numbering, or a long tokenized URL aloud - they are unintelligible as speech. Give a clear spoken overview of the role and direct the candidate to the careers board by name:
     "You can view the full job specifications and submit your CV at n2psystems.com slash jobs."`
  );

  // 1. Comprehensive Role Specifications
  const roleSpecs: string[] = [];
  roleSpecs.push(`- Requisition Code: ${referenceCode}`);
  if (title) roleSpecs.push(`- Role Title: ${title}`);
  if (department) roleSpecs.push(`- Department: ${department}`);
  if (details?.clientName) roleSpecs.push(`- Client / Organization: ${details.clientName}`);
  if (details?.hiringManager) roleSpecs.push(`- Hiring Manager: ${details.hiringManager}`);
  if (details?.employmentType) roleSpecs.push(`- Employment Type: ${details.employmentType}`);
  if (details?.location) roleSpecs.push(`- Location: ${details.location}`);
  if (details?.workMode) roleSpecs.push(`- Work Mode: ${details.workMode}`);

  if (details?.experienceLevel || details?.minExperienceYears) {
    const expParts = [details.experienceLevel];
    if (details.minExperienceYears) {
      expParts.push(`${details.minExperienceYears}+ years`);
    }
    roleSpecs.push(`- Required Experience: ${expParts.filter(Boolean).join(' / ')}`);
  }

  if (details?.salaryMin || details?.salaryMax) {
    const curr = details.salaryCurrency || 'USD';
    const min = details.salaryMin ? Number(details.salaryMin).toLocaleString() : '0';
    const max = details.salaryMax ? Number(details.salaryMax).toLocaleString() : 'Negotiable';
    roleSpecs.push(`- Target Compensation: ${curr} ${min} - ${max}`);
  }

  if (details?.mandatorySkills && details.mandatorySkills.length > 0) {
    roleSpecs.push(`- Mandatory Core Skills (Must Have): ${details.mandatorySkills.join(', ')}`);
  }
  if (details?.preferredSkills && details.preferredSkills.length > 0) {
    roleSpecs.push(`- Preferred / Secondary Skills (Nice to Have): ${details.preferredSkills.join(', ')}`);
  }

  sections.push(`## Role Specifications:\n${roleSpecs.join('\n')}`);

  // 2. Comprehensive Candidate Guidance & FAQ Context
  sections.push(
    `## CANDIDATE GUIDANCE, SELECTION JOURNEY & FREQUENTLY ASKED QUESTIONS:
1. Candidate Selection Journey (What Candidates Should Expect):
   Explain the transparent 4-step N2P hiring journey if a candidate inquires about what happens after applying:
   - Step 1: Submit Application & Resume online at ${publicJobUrl}.
   - Step 2: Recruiter Profile Review & Initial Connect (within 2-4 business days).
   - Step 3: Technical & Architecture Deep-Dive (System Design / Hands-on Domain Discussion with engineering leaders).
   - Step 4: Final Fit & Offer Onboarding.

2. Transparent Compensation Guidance:
   - If target compensation is specified in Role Specifications above, share it transparently with the candidate.
   - If marked negotiable or unspecified, explain: "Compensation is competitive and tailored to your verified technical depth, seniority, and location standards. Our talent acquisition team will discuss the detailed package during the initial recruiter call."

3. Work Arrangements & Location:
   - Clearly confirm whether the position is Remote, Hybrid, or On-site as specified in the Role Specifications.
   - For hybrid roles, explain that N2P provides modern, collaborative office spaces with flexible team arrangements.

4. Ethical Safeguards & Fact Grounding:
   - Ground all answers strictly in the verified Role Specifications and Job Description below.
   - Never invent non-existent company benefits, health insurance plans, PTO days, or bonus structures not stated in this document.
   - Never make verbal hiring commitments, offers of employment, or salary guarantees.
   - If a candidate asks a question about internal logistics not covered here, politely state: "That is a great question. I will note that down for our recruitment team to discuss with you during your recruiter connect."`
  );

  // 3. Full Job Description Body
  if (details?.description) {
    const desc =
      details.description.length > MAX_DESCRIPTION_CHARS
        ? `${details.description.slice(0, MAX_DESCRIPTION_CHARS)}\n\n[Job description truncated at ${MAX_DESCRIPTION_CHARS} characters. Refer the candidate to the recruiter for anything not covered above.]`
        : details.description;
    sections.push(`## Job Description & Responsibilities:\n${desc}`);
  }

  // 4. Role Qualifications & Application Focus (Reference Background Only)
  const formattedQuestions: string[] = [];
  screeningQuestions.forEach((q) => {
    let questionText = '';
    let targetText = '';
    let typeText = '';

    if (typeof q === 'string') {
      questionText = q.trim().slice(0, MAX_QUESTION_CHARS);
    } else if (typeof q === 'object' && q !== null) {
      const item = q as QuestionItem;
      questionText = String(item.question ?? '').trim().slice(0, MAX_QUESTION_CHARS);
      if (item.idealAnswer || item.answer) {
        const ideal = String(item.idealAnswer || item.answer).trim().slice(0, MAX_QUESTION_CHARS);
        targetText = ` (Qualification expectation: ${ideal})`;
      }
      if (item.responseType) {
        typeText = ` [${item.responseType}]`;
      }
    }

    if (questionText) {
      formattedQuestions.push(
        `- ${questionText}${typeText}${targetText}`
      );
    }
  });

  if (formattedQuestions.length > 0) {
    sections.push(
      `## Role Qualifications & Application Focus (REFERENCE ONLY — DO NOT ASK AS CHAT QUESTIONS):
[NOTE FOR AI: These qualifications are evaluated when the candidate submits their application online at ${publicJobUrl}. DO NOT quiz or interrogate the candidate with these questions in chat or voice. Use this section only to answer candidate inquiries about what experience is expected for the role.]
${formattedQuestions.join('\n')}`
    );
  }

  // 5. Full Structured Dataset (JSON) for semantic entity parsing
  if (details?.rawJson && Object.keys(details.rawJson).length > 0) {
    // Compact, not pretty-printed: the indentation was pure token cost to the
    // retriever and bought nothing, since no human reads this section.
    const serialized = JSON.stringify(details.rawJson);
    if (serialized.length <= MAX_RAW_JSON_CHARS) {
      sections.push(
        `## Complete Requisition Data (Structured JSON):\n\`\`\`json\n${serialized}\n\`\`\``
      );
    }
    // Over the ceiling the block is dropped entirely rather than truncated:
    // half a JSON object is not parseable, and the prose sections above already
    // carry every field the agent screens on.
  }

  const unifiedDoc = sections.join('\n\n');

  try {
    const res = await fetch(`${REAPDAT_API}/knowledge/portal/ingest`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link_id: linkId,
        content: unifiedDoc,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (res.ok) {
      return { ok: true, count: 1 };
    }

    const errText = await res.text().catch(() => '');
    console.warn(`Could not ingest knowledge for link ${linkId}: status ${res.status}`, errText);
    return { ok: false, count: 0, status: res.status, error: describeIngestFailure(res.status) };
  } catch (err) {
    console.warn(`Failed to ingest knowledge for link ${linkId}:`, err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return {
      ok: false,
      count: 0,
      status: isTimeout ? 504 : 502,
      error: isTimeout
        ? 'Reapdat did not finish indexing the requisition within the time limit. The screening link is unchanged - please retry the sync.'
        : 'Could not reach Reapdat to index the requisition. The screening link is unchanged - please retry the sync.',
    };
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

/**
 * GET /api/reapdat-link?referenceCode=REQ-XXXXX
 * Fetches the specific active link for a single requisition.
 */
export async function GET(req: NextRequest) {
  const cors = corsHeaders(req);
  const ref = req.nextUrl.searchParams.get('referenceCode')?.trim();

  if (!ref) {
    return NextResponse.json(
      { status: 'ok', service: 'reapdat-link-provisioner' },
      { headers: cors }
    );
  }

  // The bare probe above stays open for uptime checks; resolving a requisition
  // to its live candidate link does not.
  if (!(await isAuthenticatedCaller(req))) return unauthorized(cors);

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${REAPDAT_API}/chat-links`, {
      headers: authHeaders,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: `Reapdat returned status ${res.status}` },
        { status: res.status, headers: cors }
      );
    }

    const data = await res.json();
    const links: ReapdatLink[] = Array.isArray(data.links) ? data.links : [];
    const matched = links.find((l) => matchesReferenceCode(l, ref));

    if (!matched) {
      return NextResponse.json(
        { ok: true, success: true, found: false, message: `No active link found for ${ref}` },
        { status: 200, headers: cors }
      );
    }

    return NextResponse.json(
      { ok: true, success: true, found: true, link: matched },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query link';
    return NextResponse.json(
      { ok: false, success: false, error: msg },
      { status: 500, headers: cors }
    );
  }
}

/**
 * PATCH /api/reapdat-link
 * Updates channels (chat/call/book) or active state for a specific link.
 */
export async function PATCH(req: NextRequest) {
  const cors = corsHeaders(req);
  if (!(await isAuthenticatedCaller(req))) return unauthorized(cors);

  try {
    const body = await req.json().catch(() => ({}));
    const linkId = String(body.linkId ?? '').trim();

    if (!linkId) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing linkId' },
        { status: 400, headers: cors }
      );
    }

    const payload: Record<string, unknown> = {};
    if (Array.isArray(body.channels) && body.channels.length > 0) {
      payload.channels = body.channels;
    }
    if (typeof body.label === 'string') {
      payload.label = body.label.slice(0, 120);
    }
    if (typeof body.is_active === 'boolean') {
      payload.is_active = body.is_active;
    }

    const authHeaders = await getAuthHeaders();
    const safeLinkId = encodeURIComponent(linkId);
    const patchRes = await fetch(`${REAPDAT_API}/chat-links/${safeLinkId}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, success: false, error: err.detail || `Update failed (${patchRes.status})` },
        { status: patchRes.status, headers: cors }
      );
    }

    const updated = await patchRes.json();
    return NextResponse.json(
      { ok: true, success: true, link: updated },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating link';
    return NextResponse.json(
      { ok: false, success: false, error: msg },
      { status: 500, headers: cors }
    );
  }
}

/**
 * POST /api/reapdat-link
 * Handles:
 * 1. multipart/form-data: Document uploads to link knowledge base (/knowledge/portal/upload)
 * 2. action="revoke": Revokes an active link
 * 3. Default: Provisions a new screening link and syncs knowledge
 */
export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const contentType = req.headers.get('content-type') || '';

  if (!(await isAuthenticatedCaller(req))) return unauthorized(cors);

  try {
    /*
      Mutable on purpose. The create call below retries once on a 401 with a
      freshly-minted token; that token used to be captured in a local, so every
      later call in this request — the knowledge ingest above all — carried on
      using the credential that had just been rejected. The link got created
      and the ingest then failed, so the recruiter was told indexing was
      rejected while a real link existed with an empty knowledge base, and the
      screening agent interviewed candidates knowing nothing about the role.
    */
    let authHeaders = await getAuthHeaders();

    // 1. Handle File Upload (Multipart Form Data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const linkId = formData.get('link_id') as string | null;

      if (!file || !linkId) {
        return NextResponse.json(
          { ok: false, success: false, error: 'Both file and link_id are required' },
          { status: 400, headers: cors }
        );
      }

      // The panel checks type and size before it posts, but that check is a
      // convenience for the recruiter, not a control: this handler is reachable
      // directly. Re-check both here, where the trust boundary actually is.
      const extension = (file.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
        return NextResponse.json(
          {
            ok: false,
            success: false,
            error: `Unsupported file type ".${extension}". Allowed: ${[...ALLOWED_UPLOAD_EXTENSIONS].map((e) => `.${e}`).join(', ')}`,
          },
          { status: 415, headers: cors }
        );
      }

      if (file.size === 0) {
        return NextResponse.json(
          { ok: false, success: false, error: 'The uploaded file is empty.' },
          { status: 400, headers: cors }
        );
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            success: false,
            error: `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
          },
          { status: 413, headers: cors }
        );
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('link_id', linkId);

      const uploadRes = await fetch(`${REAPDAT_API}/knowledge/portal/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: uploadData,
        // Parsing and chunking a 10 MB document is not a 10-second job. The
        // general ceiling here would abort mid-parse and report a network
        // failure for an upload that was progressing normally.
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        return NextResponse.json(
          { ok: false, success: false, error: err.detail || `Upload failed (${uploadRes.status})` },
          { status: uploadRes.status, headers: cors }
        );
      }

      const uploadResult = await uploadRes.json();
      return NextResponse.json(
        { ok: true, success: true, result: uploadResult },
        { status: 200, headers: cors }
      );
    }

    // 2. JSON Request Handling
    const body = await req.json().catch(() => ({}));

    // Action: Revoke Link
    if (body.action === 'revoke' && body.linkId) {
      const safeRevokeId = encodeURIComponent(body.linkId);
      const revokeRes = await fetch(`${REAPDAT_API}/chat-links/${safeRevokeId}/revoke`, {
        method: 'POST',
        headers: authHeaders,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!revokeRes.ok) {
        const err = await revokeRes.json().catch(() => ({}));
        return NextResponse.json(
          { ok: false, success: false, error: err.detail || 'Failed to revoke link' },
          { status: revokeRes.status, headers: cors }
        );
      }

      return NextResponse.json(
        { ok: true, success: true, message: 'Link successfully revoked' },
        { status: 200, headers: cors }
      );
    }

    // Default: Provision link & sync knowledge
    const referenceCode = String(body.referenceCode ?? '').trim().slice(0, 20);
    const title = String(body.title ?? '').trim().slice(0, 100);
    const department = String(body.department ?? '').trim().slice(0, 40);
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 100) : '';
    const workMode = typeof body.workMode === 'string' ? body.workMode.trim().slice(0, 50) : '';
    const experienceLevel = typeof body.experienceLevel === 'string' ? body.experienceLevel.trim().slice(0, 50) : '';
    const minExperienceYears = typeof body.minExperienceYears === 'number' ? body.minExperienceYears : undefined;
    const maxExperienceYears = typeof body.maxExperienceYears === 'number' ? body.maxExperienceYears : undefined;
    const mandatorySkills = Array.isArray(body.mandatorySkills)
      ? body.mandatorySkills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20)
      : [];
    const preferredSkills = Array.isArray(body.preferredSkills)
      ? body.preferredSkills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20)
      : [];
    const salaryMin = typeof body.salaryMin === 'number' ? body.salaryMin : undefined;
    const salaryMax = typeof body.salaryMax === 'number' ? body.salaryMax : undefined;
    const salaryCurrency = typeof body.salaryCurrency === 'string' ? body.salaryCurrency.trim() : undefined;
    const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : undefined;
    const hiringManager = typeof body.hiringManager === 'string' ? body.hiringManager.trim() : undefined;
    const employmentType = typeof body.employmentType === 'string' ? body.employmentType.trim() : undefined;
    const rawJson = typeof body.rawJson === 'object' && body.rawJson !== null ? body.rawJson : undefined;
    const screeningQuestions = Array.isArray(body.screeningQuestions)
      ? body.screeningQuestions.slice(0, MAX_SCREENING_QUESTIONS)
      : [];

    if (!referenceCode) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing referenceCode in request body' },
        { status: 400, headers: cors }
      );
    }

    // Action: Sync Knowledge for existing link without changing URL.
    //
    // This branch always returns. It must never fall through to the creation
    // path below: creation revokes the requisition's current link and mints a
    // fresh 32-character token, so a sync that degraded into a create would
    // silently invalidate every candidate URL and QR code already handed out -
    // and burn one of the tenant's 20 link slots doing it. A sync that cannot
    // find its link is an error the recruiter needs to see, not a new link.
    if (body.action === 'sync_knowledge' || (body.linkId && body.action === 'update_knowledge')) {
      let targetLinkId = body.linkId ? String(body.linkId).trim() : '';
      let targetUrl = body.linkUrl ? String(body.linkUrl) : '';
      let lookupFailed = false;

      if (!targetLinkId && referenceCode) {
        const listRes = await fetch(`${REAPDAT_API}/chat-links`, {
          headers: authHeaders,
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        }).catch(() => null);

        if (listRes && listRes.ok) {
          const listData = await listRes.json().catch(() => ({}));
          const links: ReapdatLink[] = Array.isArray(listData.links) ? listData.links : [];
          const matched = links.find((l) => matchesReferenceCode(l, referenceCode));
          if (matched) {
            targetLinkId = matched.id;
            targetUrl = matched.url || '';
          }
        } else {
          // Reachability problem, not a missing link. Worth distinguishing:
          // "retry" and "the link is gone" call for different recruiter action.
          lookupFailed = true;
          console.warn(
            `Reapdat link lookup failed during sync for ${referenceCode} (status ${listRes?.status ?? 'network error'}).`
          );
        }
      }

      if (!targetLinkId) {
        return NextResponse.json(
          {
            ok: false,
            success: false,
            // Machine-readable so the portal does not have to pattern-match
            // English prose to tell "this link is gone, mint a new one" from
            // "REAPDAT is unreachable, change nothing and retry".
            code: lookupFailed ? 'upstream_unreachable' : 'link_not_found',
            error: lookupFailed
              ? 'Could not reach Reapdat to locate this screening link. The candidate link is unchanged - please retry the sync in a moment.'
              : `No active Reapdat screening link exists for ${referenceCode}. Generate a link before syncing knowledge.`,
          },
          { status: lookupFailed ? 502 : 404, headers: cors }
        );
      }

      {
        const greetingText = `Welcome! I am the AI Talent Advisor for the ${title || 'Open Position'} role (${referenceCode}) at N2P Systems. Feel free to ask me anything about this position, our requirements, or our global career opportunities across India, Canada, and the US!`;
        // Update link metadata to ensure greeting is set and main kb contamination is disabled
        const safeTargetLinkId = encodeURIComponent(targetLinkId);
        await fetch(`${REAPDAT_API}/chat-links/${safeTargetLinkId}`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inherit_main_kb: false,
            greeting: greetingText,
            agent_name: 'N2P Talent Advisor',
          }),
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        }).catch((patchErr) => console.warn('Failed to update greeting during sync:', patchErr));

        const ingested = await ingestKnowledgeForLink(
          authHeaders,
          targetLinkId,
          referenceCode,
          title,
          department,
          screeningQuestions,
          {
            description,
            location,
            workMode,
            experienceLevel,
            minExperienceYears,
            maxExperienceYears,
            mandatorySkills,
            preferredSkills,
            salaryMin,
            salaryMax,
            salaryCurrency,
            clientName,
            hiringManager,
            employmentType,
            rawJson,
          }
        );

        // A sync that indexed nothing is a failed sync. Reporting it as success
        // leaves the recruiter believing the agent screens on questions it has
        // never seen.
        if (!ingested.ok) {
          return NextResponse.json(
            {
              ok: false,
              success: false,
              error: ingested.error || 'Reapdat could not index the requisition.',
              linkId: targetLinkId,
              link: targetUrl,
            },
            { status: ingested.status && ingested.status >= 400 ? ingested.status : 502, headers: cors }
          );
        }

        const dbClient = supabaseAdmin || supabase;
        if (dbClient && targetUrl) {
          try {
            await dbClient
              .from('requirements')
              .update({ reapdat_chat_link: targetUrl, reapdat_enabled: true })
              .eq('reference_code', referenceCode);
          } catch (dbErr) {
            console.warn(`Database sync mirror skipped for ${referenceCode}:`, dbErr);
          }
        }

        return NextResponse.json(
          {
            ok: true,
            success: true,
            status: 'provisioned',
            link: targetUrl,
            linkId: targetLinkId,
            message: `REAPDAT knowledge base updated with latest screening questions for ${referenceCode}`,
            details: {
              id: targetLinkId,
              ingested_knowledge_items: ingested.count,
            },
          },
          { status: 200, headers: cors }
        );
      }
    }

    const linkLabel = title ? `${title} (${referenceCode})` : `Requisition ${referenceCode}`;
    const tags: string[] = [referenceCode];
    if (department) tags.push(department);

    const greetingText = `Welcome! I am the AI Talent Advisor for the ${title || 'Open Position'} role (${referenceCode}) at N2P Systems. Feel free to ask me anything about this position, our requirements, or our global career opportunities across India, Canada, and the US!`;

    const payload = {
      label: linkLabel.slice(0, 120),
      tags: tags.slice(0, 8),
      channels: Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ['chat', 'call'],
      inherit_main_kb: false, // Isolates this requisition so it does not pull other roles or company website crawls
      greeting: greetingText,
      agent_name: 'N2P Talent Advisor',
    };

    let createRes = await fetch(`${REAPDAT_API}/chat-links`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (createRes.status === 401) {
      console.warn('Reapdat rejected cached token; re-authenticating once.');
      // Reassigned, not shadowed — the ingest below must use the new token too.
      authHeaders = await getAuthHeaders(true);
      createRes = await fetch(`${REAPDAT_API}/chat-links`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    }

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: errData.detail || `Link creation failed with status ${createRes.status}`,
        },
        { status: createRes.status, headers: cors }
      );
    }

    const linkData = await createRes.json();
    const linkUrl = linkData.url;
    const linkId = String(linkData.id ?? '');

    /*
      Best-effort cleanup of the previous link for this reference code, and
      deliberately *after* the replacement exists. Revoking first meant a
      create that failed for any reason — the tenant link cap, a 500, a
      timeout — left the requisition with no working link at all: every
      candidate URL and printed QR code already handed out went dead, while
      the database still pointed at the link that had just been deleted.
    */
    try {
      await revokeSupersededLinks(authHeaders, referenceCode, linkId);
    } catch (cleanupErr) {
      console.warn('Reapdat link cleanup skipped:', cleanupErr);
    }

    let ingestedItems = 0;
    let ingestWarning: string | undefined;
    if (linkId) {
      try {
        const ingested = await ingestKnowledgeForLink(
          authHeaders,
          linkId,
          referenceCode,
          title,
          department,
          screeningQuestions,
          {
            description,
            location,
            workMode,
            experienceLevel,
            minExperienceYears,
            maxExperienceYears,
            mandatorySkills,
            preferredSkills,
            salaryMin,
            salaryMax,
            salaryCurrency,
            clientName,
            hiringManager,
            employmentType,
            rawJson,
          }
        );
        ingestedItems = ingested.count;
        if (!ingested.ok) {
          // The link exists and is usable, so this is a warning rather than a
          // failure - but the recruiter has to know the agent is running on an
          // empty knowledge base until they re-sync.
          ingestWarning = ingested.error;
        }
      } catch (ingestErr) {
        console.warn(`Reapdat knowledge ingest skipped for ${referenceCode}:`, ingestErr);
        ingestWarning = 'The screening link was created, but Reapdat did not index the requisition. Use "Re-sync Knowledge" before sharing the link.';
      }
    }

    const dbClient = supabaseAdmin || supabase;
    if (dbClient) {
      const { error: dbError } = await dbClient
        .from('requirements')
        .update({ reapdat_chat_link: linkUrl, reapdat_enabled: true })
        .eq('reference_code', referenceCode);

      if (dbError) {
        console.warn(
          `Proxy-side requirement mirror skipped for ${referenceCode}: ${dbError.message}`
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        success: true,
        status: 'provisioned',
        link: linkUrl,
        linkId: linkData.id,
        message: ingestWarning
          ? `Screening link created for ${referenceCode}, but the knowledge base was not indexed: ${ingestWarning}`
          : `REAPDAT chat & voice screening link provisioned for ${referenceCode}`,
        warning: ingestWarning,
        details: {
          id: linkData.id,
          token: linkData.token,
          channels: linkData.channels,
          ingested_knowledge_items: ingestedItems,
        },
      },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    console.error('Reapdat link provisioning failed:', errorMsg);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: isTimeout ? 'Reapdat did not respond in time. Please try again.' : errorMsg,
      },
      { status: isTimeout ? 504 : 500, headers: cors }
    );
  }
}
