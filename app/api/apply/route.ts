import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { clampString } from '@/lib/sanitize'
import { verifyFileMagicBytes } from '@/lib/file-security'

/**
 * POST /api/apply — the one door into the ATS for website applicants.
 *
 * The browser used to upload the CV and insert the row itself, as `anon`. That
 * meant the only file checks were the declared MIME type and size, both of
 * which a caller controls, and a failed insert stranded the upload because
 * `anon` cannot delete. Here, before anything is stored:
 *
 *   1. size — 2 MB, checked on Content-Length before the body is read;
 *   2. real type — PDF or DOCX by content, not by name or declared MIME;
 *   3. fields — the same bounds as the table's CHECK constraints;
 *   4. the requisition is live, and this person has not already applied to it.
 *
 * Only then is the CV uploaded and the row inserted. AI screening starts from
 * the database's insert trigger and never blocks this response; whether the
 * document is actually a CV (and not, say, an ID card) is judged there, and a
 * non-CV is marked `invalid_document` for a recruiter — it never becomes a
 * candidate.
 *
 * Runs with the service role when SUPABASE_SERVICE_ROLE_KEY is set, and falls
 * back to the anon grants otherwise, so deploying this route never breaks
 * applications. Revoke the anon grants (portal migration 00064) only once the
 * key is configured here.
 */

export const runtime = 'nodejs'

/** Authoritative. The form mirrors it for a friendlier message; this decides. */
const MAX_BYTES = 2 * 1024 * 1024
/** Multipart framing and the text fields, on top of the file itself. */
const MAX_BODY_BYTES = MAX_BYTES + 64 * 1024

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const reject = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** Same rule as the portal's _shared/identity.ts. */
const linkedInSlug = (raw: string): string | null => {
  const match = /linkedin\.com\/(?:in|pub)\/([^/?#\s]+)/i.exec(raw)
  return match ? match[1].toLowerCase() : null
}

/** One line per event, without the applicant's name, email or CV. */
const log = (event: string, fields: Record<string, string | number | undefined>) =>
  console.info(
    `[pipeline] event=${event} ` +
      Object.entries(fields)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join(' ')
  )

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rate = checkRateLimit(`apply:${ip}`, 10, 600)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many applications from this connection. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.reset) } }
    )
  }

  // Refuse an oversized upload before reading it into memory.
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    log('application_rejected', { reason: 'too_large' })
    return reject('Your resume is over 2 MB. Please attach a smaller PDF or DOCX.', 413)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return reject('The application could not be read. Please try again.')
  }

  // Bots fill every field; people never see this one.
  if (String(form.get('website_hp') ?? '')) return NextResponse.json({ ok: true }, { status: 201 })

  const field = (name: string, max: number) => clampString(String(form.get(name) ?? ''), max)
  const requirementId = field('requirementId', 36)
  const fullName = field('fullName', 120)
  const email = field('email', 254).toLowerCase()
  const phone = field('phone', 40)
  const location = field('location', 160)
  const currentCompany = field('currentCompany', 160)
  const linkedinUrl = field('linkedinUrl', 300)
  const coverNote = field('coverNote', 4000)
  const experienceRaw = field('experienceYears', 8)

  if (!UUID_RE.test(requirementId)) return reject('This job posting could not be identified. Please reload the page.')
  if (fullName.length < 2) return reject('Please enter your full name.')
  if (!EMAIL_RE.test(email)) return reject('Please enter a valid email address.')
  if (phone.length < 5) return reject('Please enter your phone number.')
  if (location.length < 2) return reject('Please enter your current location.')
  if (!linkedinUrl || !linkedinUrl.toLowerCase().includes('linkedin.com/')) {
    return reject('Please enter a valid LinkedIn profile URL.')
  }

  const normalizedLinkedIn = /^https?:\/\//i.test(linkedinUrl)
    ? linkedinUrl
    : `https://${linkedinUrl}`

  let experienceYears: number | null = null
  if (experienceRaw) {
    experienceYears = Number(experienceRaw)
    if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 60) {
      return reject('Enter a number of years between 0 and 60.')
    }
  }

  const resume = form.get('resume')
  if (!(resume instanceof File) || resume.size === 0) return reject('Please upload your resume/CV.')
  if (resume.size > MAX_BYTES) {
    log('application_rejected', { reason: 'too_large' })
    return reject('Your resume is over 2 MB. Please attach a smaller PDF or DOCX.', 413)
  }
  const check = await verifyFileMagicBytes(resume)
  if (!check.valid) {
    log('application_rejected', { reason: 'file_type' })
    return reject(check.reason ?? 'Please upload your resume/CV as a PDF or DOCX file.', 415)
  }
  const ext = resume.name.split('.').pop()!.toLowerCase()

  const db = supabaseAdmin ?? supabase

  // Live postings only. The anon client can only see Active/Open ones anyway
  // (portal 00024); the service role sees everything, so the status is checked.
  const { data: requisition } = await db
    .from('requirements')
    .select('id, reference_code, status')
    .eq('id', requirementId)
    .maybeSingle()
  if (!requisition || !['Active', 'Open'].includes(requisition.status)) {
    return reject('This job is no longer accepting applications.', 410)
  }

  // Same person, same job: refused before anything is uploaded. The unique
  // index on (requirement_id, lower(email)) is the authority; this only saves
  // the upload, and also catches a second email behind the same LinkedIn.
  if (supabaseAdmin) {
    const like = (v: string) => v.replace(/[\\%_]/g, '\\$&')
    const slug = linkedInSlug(normalizedLinkedIn)
    const [byEmail, byLinkedIn] = await Promise.all([
      supabaseAdmin.from('job_applications').select('id').eq('requirement_id', requirementId).ilike('email', like(email)).limit(1),
      slug
        ? supabaseAdmin
            .from('job_applications')
            .select('linkedin_url')
            .eq('requirement_id', requirementId)
            .ilike('linkedin_url', `%linkedin.com/in/${like(slug)}%`)
            .limit(5)
        : Promise.resolve({ data: [] as { linkedin_url: string | null }[] }),
    ])
    const duplicate =
      (byEmail.data ?? []).length > 0 ||
      (byLinkedIn.data ?? []).some((row) => linkedInSlug(row.linkedin_url ?? '') === slug)
    if (duplicate) {
      log('application_duplicate', { requisition: requisition.reference_code ?? undefined })
      return reject('You have already applied to this role. Our team has your profile.', 409)
    }
  }

  const folder = String(requisition.reference_code || 'REQ').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 20)
  const path = `${folder}/${randomUUID()}.${ext}`

  const { error: uploadError } = await db.storage
    .from('applications')
    .upload(path, resume, { contentType: CONTENT_TYPES[ext], upsert: false })
  if (uploadError) {
    log('upload_failed', { requisition: requisition.reference_code ?? undefined })
    console.error('[apply] upload failed:', uploadError.message)
    return reject('We could not upload your resume. Please try again.', 502)
  }

  // No `.select()`: under the anon fallback there is no SELECT grant (00025),
  // and asking for the row back would turn a working insert into an error.
  const { error: insertError } = await db.from('job_applications').insert({
    requirement_id: requirementId,
    full_name: fullName,
    email,
    phone: phone || null,
    location: location || null,
    current_company: currentCompany || null,
    experience_years: experienceYears,
    linkedin_url: normalizedLinkedIn || null,
    cover_note: coverNote || null,
    resume_path: path,
    resume_filename: resume.name.slice(0, 260),
  })

  if (insertError) {
    // The service role can reap the upload a failed insert would strand.
    if (supabaseAdmin) await supabaseAdmin.storage.from('applications').remove([path]).catch(() => undefined)
    if (insertError.code === '23505') {
      log('application_duplicate', { requisition: requisition.reference_code ?? undefined })
      return reject('You have already applied to this role. Our team has your profile.', 409)
    }
    console.error('[apply] insert failed:', insertError.message)
    return reject('We could not record your application. Please try again.', 502)
  }

  log('application_received', { requisition: requisition.reference_code ?? undefined, type: ext, bytes: resume.size })
  return NextResponse.json({ ok: true }, { status: 201 })
}
