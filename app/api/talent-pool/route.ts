import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { clampString } from '@/lib/sanitize'
import { verifyFileMagicBytes } from '@/lib/file-security'

/**
 * POST /api/talent-pool — general profile submission from /resume.
 *
 * Replaces the twelve Google Forms the page used to hand candidates. The row
 * lands in `talent_pool_submissions` (RecruitOps migration 00066), which
 * recruiters review in ATS → Talent Pool and convert into candidates.
 *
 * Same checks as /api/apply before anything is stored: body size, the file's
 * real type (PDF or DOCX by content), and field bounds matching the table's
 * CHECK constraints. Unlike /api/apply there is no anon fallback: the table
 * grants `anon` nothing, so without SUPABASE_SERVICE_ROLE_KEY this refuses
 * with a clear 503 rather than failing inside Supabase.
 *
 * One row per person (unique on lower(email)). A repeat submission refreshes
 * the existing row — new CV, new details — and puts it back in the review
 * queue, instead of leaving a recruiter two rows to reconcile.
 */

export const runtime = 'nodejs'

const MAX_BYTES = 2 * 1024 * 1024
const MAX_BODY_BYTES = MAX_BYTES + 64 * 1024

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const WORK_MODES = new Set(['Remote', 'Hybrid', 'Onsite', 'Flexible'])

const reject = (error: string, status = 400) => NextResponse.json({ error }, { status })

const log = (event: string, fields: Record<string, string | number | undefined>) =>
  console.info(
    `[talent-pool] event=${event} ` +
      Object.entries(fields)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join(' ')
  )

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rate = checkRateLimit(`talent-pool:${ip}`, 5, 600)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.reset) } }
    )
  }

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return reject('Your resume is over 2 MB. Please attach a smaller PDF or DOCX.', 413)
  }

  if (!supabaseAdmin) {
    console.error('[talent-pool] SUPABASE_SERVICE_ROLE_KEY is not set; submissions cannot be stored.')
    return reject('Profile submissions are temporarily unavailable. Please email your resume to info@n2psystems.ca.', 503)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return reject('The form could not be read. Please try again.')
  }

  // Bots fill every field; people never see this one.
  if (String(form.get('website_hp') ?? '')) return NextResponse.json({ ok: true }, { status: 201 })

  const field = (name: string, max: number) => clampString(String(form.get(name) ?? ''), max)
  const fullName = field('fullName', 120)
  const email = field('email', 254).toLowerCase()
  const phone = field('phone', 40)
  const location = field('location', 160)
  const category = field('category', 80)
  const currentTitle = field('currentTitle', 160)
  const currentCompany = field('currentCompany', 160)
  const linkedinUrl = field('linkedinUrl', 300)
  const noticePeriod = field('noticePeriod', 60)
  const workAuthorization = field('workAuthorization', 120)
  const summary = field('summary', 4000)
  const workMode = field('preferredWorkMode', 20)
  const experienceRaw = field('experienceYears', 8)
  const skills = Array.from(
    new Set(
      field('skills', 1200)
        .split(',')
        .map((s) => s.trim().slice(0, 60))
        .filter(Boolean)
    )
  ).slice(0, 40)

  if (String(form.get('consent') ?? '') !== 'yes') return reject('Please agree to the privacy policy to submit your profile.')
  if (category.length < 2) return reject('Please choose your specialisation.')
  if (fullName.length < 2) return reject('Please enter your full name.')
  if (!EMAIL_RE.test(email)) return reject('Please enter a valid email address.')
  if (phone.length < 5) return reject('Please enter your phone number.')
  if (location.length < 2) return reject('Please enter your current location.')
  if (linkedinUrl && !linkedinUrl.toLowerCase().includes('linkedin.com/')) {
    return reject('Please enter a valid LinkedIn profile URL, or leave it blank.')
  }
  if (workMode && !WORK_MODES.has(workMode)) return reject('Please choose a work mode from the list.')

  let experienceYears: number | null = null
  if (experienceRaw) {
    experienceYears = Number(experienceRaw)
    if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 60) {
      return reject('Enter a number of years between 0 and 60.')
    }
  }

  const normalizedLinkedIn = linkedinUrl && !/^https?:\/\//i.test(linkedinUrl) ? `https://${linkedinUrl}` : linkedinUrl

  const resume = form.get('resume')
  if (!(resume instanceof File) || resume.size === 0) return reject('Please upload your resume/CV.')
  if (resume.size > MAX_BYTES) return reject('Your resume is over 2 MB. Please attach a smaller PDF or DOCX.', 413)
  const check = await verifyFileMagicBytes(resume)
  if (!check.valid) {
    log('rejected', { reason: 'file_type' })
    return reject(check.reason ?? 'Please upload your resume/CV as a PDF or DOCX file.', 415)
  }
  const ext = resume.name.split('.').pop()!.toLowerCase()

  const path = `talent-pool/${randomUUID()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('applications')
    .upload(path, resume, { contentType: CONTENT_TYPES[ext], upsert: false })
  if (uploadError) {
    console.error('[talent-pool] upload failed:', uploadError.message)
    return reject('We could not upload your resume. Please try again.', 502)
  }

  const fields = {
    full_name: fullName,
    email,
    phone,
    location,
    category,
    current_title: currentTitle || null,
    current_company: currentCompany || null,
    experience_years: experienceYears,
    linkedin_url: normalizedLinkedIn || null,
    skills,
    preferred_work_mode: workMode || null,
    notice_period: noticePeriod || null,
    work_authorization: workAuthorization || null,
    summary: summary || null,
    resume_path: path,
    resume_filename: resume.name.slice(0, 260),
    consent_at: new Date().toISOString(),
    last_submitted_at: new Date().toISOString(),
  }

  // Insert, or refresh this person's existing row. Two passes cover the race
  // where the same email is inserted between our lookup and our insert.
  const like = email.replace(/[\\%_]/g, '\\$&')
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('talent_pool_submissions')
      .select('id, status, submission_count')
      .ilike('email', like)
      .maybeSingle()
    if (lookupError) {
      console.error('[talent-pool] lookup failed:', lookupError.message)
      break
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from('talent_pool_submissions')
        .update({
          ...fields,
          submission_count: (existing.submission_count ?? 1) + 1,
          // Someone already converted stays converted; everyone else goes back
          // into the queue so the new CV is actually looked at.
          ...(existing.status === 'Converted' ? {} : { status: 'New' }),
        })
        .eq('id', existing.id)
      if (!error) {
        log('profile_updated', { category, type: ext, bytes: resume.size })
        return NextResponse.json({ ok: true, updated: true }, { status: 200 })
      }
      console.error('[talent-pool] update failed:', error.message)
      break
    }

    const { error } = await supabaseAdmin.from('talent_pool_submissions').insert(fields)
    if (!error) {
      log('profile_received', { category, type: ext, bytes: resume.size })
      return NextResponse.json({ ok: true }, { status: 201 })
    }
    if (error.code !== '23505') {
      console.error('[talent-pool] insert failed:', error.message)
      break
    }
  }

  await supabaseAdmin.storage.from('applications').remove([path]).catch(() => undefined)
  return reject('We could not save your profile. Please try again.', 502)
}
