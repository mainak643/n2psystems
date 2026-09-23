import { NextRequest, NextResponse } from 'next/server';
import { fetchPublishedJobs } from '@/lib/jobs-service';
import { SITE_URL } from '@/lib/site';
import { parsePostalAddress } from '@/lib/job-schema';

export const revalidate = 60;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseLocation(location: string) {
  const parsed = parsePostalAddress(location);
  return {
    city: parsed.addressLocality,
    state: parsed.addressRegion || '',
    country: parsed.addressCountry || 'US',
  };
}

function mapLinkedInJobType(type: string): string {
  const lower = (type || '').toLowerCase();
  if (lower.includes('contract')) return 'CONTRACT';
  if (lower.includes('part')) return 'PART_TIME';
  return 'FULL_TIME';
}

function mapLinkedInWorkplaceType(mode: string): 'On-site' | 'Hybrid' | 'Remote' {
  const lower = (mode || '').toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function mapLinkedInExperience(exp?: string, title?: string): string {
  const text = `${exp || ''} ${title || ''}`.toLowerCase();
  if (/director|head|vp|vice president/i.test(text)) return 'DIRECTOR';
  if (/lead|senior|sr|architect|principal|manager|8\+|7\+|6\+|5\+/i.test(text)) return 'MID_SENIOR_LEVEL';
  if (/intern/i.test(text)) return 'INTERNSHIP';
  if (/junior|entry|0-2|1\+|2\+/i.test(text)) return 'ENTRY_LEVEL';
  return 'MID_SENIOR_LEVEL';
}

/**
 * Universal XML Job Feed compatible with:
 * - LinkedIn Job Wrapping / Ingestion Specification (supports ?limit=6 for 6-slot licenses)
 * - Indeed Job Feed XML standard
 * - Google for Jobs XML
 * - ZipRecruiter & Glassdoor Aggregators
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limitParam = searchParams.get('limit');
  const countryParam = searchParams.get('country')?.toUpperCase();
  const domainParam = searchParams.get('domain')?.toLowerCase();
  const channelParam = searchParams.get('channel')?.toLowerCase() || searchParams.get('source')?.toLowerCase();
  const idsParam = searchParams.get('ids');

  let jobs: any[] = [];
  try {
    jobs = await fetchPublishedJobs();
  } catch (error) {
    console.error('[Jobs Feed XML] Error fetching published jobs:', error);
  }

  if (idsParam) {
    const requestedIds = new Set(idsParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    jobs = jobs.filter((j) => requestedIds.has(j.id.toLowerCase()));
  }

  if (countryParam) {
    jobs = jobs.filter((j) => parseLocation(j.location).country === countryParam);
  }
  if (domainParam) {
    jobs = jobs.filter((j) => (j.domain || '').toLowerCase().includes(domainParam));
  }

  const isLinkedIn = channelParam === 'linkedin' || searchParams.get('linkedin') === 'true';

  if (isLinkedIn) {
    // Prioritize jobs explicitly marked for LinkedIn or Featured in skills/tags
    jobs.sort((a, b) => {
      const aFeatured = a.techStack?.some((t: string) => /linkedin|featured/i.test(t)) ? 1 : 0;
      const bFeatured = b.techStack?.some((t: string) => /linkedin|featured/i.test(t)) ? 1 : 0;
      return bFeatured - aFeatured;
    });
  }

  // LinkedIn Recruiter 6-slot license default: exactly 6 slots
  const effectiveLimit = limitParam
    ? parseInt(limitParam, 10)
    : (isLinkedIn ? 6 : undefined);

  if (effectiveLimit && !isNaN(effectiveLimit) && effectiveLimit > 0) {
    jobs = jobs.slice(0, effectiveLimit);
  }

  const nowRfc = new Date().toUTCString();

  const xmlItems = jobs
    .map((job) => {
      const { city, state, country } = parseLocation(job.location);
      const url = `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`;
      const postedDate = job.datePostedISO ? new Date(job.datePostedISO).toISOString().split('T')[0] : '';
      const validThrough = job.validThroughISO || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const workModeTag = isLinkedIn
        ? job.mode === 'Remote'
          ? '#LI-Remote'
          : job.mode === 'Hybrid'
            ? '#LI-Hybrid'
            : '#LI-Onsite'
        : '';

      const fullDescription = [
        (job.overview || '').replace(/\*\*/g, ''),
        job.responsibilities && job.responsibilities.length > 0
          ? `Key Responsibilities:\n• ${job.responsibilities.map((r: string) => r.replace(/\*\*/g, '')).join('\n• ')}`
          : '',
        job.requirements && job.requirements.length > 0
          ? `Required Skills & Qualifications:\n• ${job.requirements.map((r: string) => r.replace(/\*\*/g, '')).join('\n• ')}`
          : '',
        `Apply directly at: ${url}`,
        workModeTag,
        isLinkedIn ? '#LI-P1' : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const workplaceType = mapLinkedInWorkplaceType(job.mode);
      const linkedInJobType = mapLinkedInJobType(job.type);
      const experienceLevel = mapLinkedInExperience(job.experience, job.title);
      const locationFull = `${city}${state ? `, ${state}` : ''}, ${country}`;

      const skillsList =
        job.techStack && job.techStack.length > 0
          ? `    <skills>\n${job.techStack
              .slice(0, 10)
              .map((s: string) => `      <skill><![CDATA[${s}]]></skill>`)
              .join('\n')}\n    </skills>`
          : `    <skills><![CDATA[${job.techStack.join(', ')}]]></skills>`;

      const salaryXml =
        job.salaryMin || job.salaryMax
          ? `    <salaries>
      <salary>
        ${job.salaryMax ? `<highEnd><amount><![CDATA[${job.salaryMax}]]></amount><currencyCode>${job.salaryCurrency || 'USD'}</currencyCode></highEnd>` : ''}
        ${job.salaryMin ? `<lowEnd><amount><![CDATA[${job.salaryMin}]]></amount><currencyCode>${job.salaryCurrency || 'USD'}</currencyCode></lowEnd>` : ''}
        <period><![CDATA[YEARLY]]></period>
        <type><![CDATA[BASE_SALARY]]></type>
      </salary>
    </salaries>`
          : '';

      return `  <job>
    <partnerJobId><![CDATA[${job.id}]]></partnerJobId>
    <referencenumber><![CDATA[${job.id}]]></referencenumber>
    <company><![CDATA[${job.company || 'N2P Systems'}]]></company>
    <companyId><![CDATA[104779739]]></companyId>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${postedDate}]]></date>
    <expirationdate><![CDATA[${validThrough}]]></expirationdate>
    <url><![CDATA[${url}]]></url>
    <applyUrl><![CDATA[${url}]]></applyUrl>
    <location><![CDATA[${locationFull}]]></location>
    <city><![CDATA[${city}]]></city>
    <state><![CDATA[${state}]]></state>
    <country><![CDATA[${country}]]></country>
    <workplaceTypes><![CDATA[${workplaceType}]]></workplaceTypes>
    <jobtype><![CDATA[${linkedInJobType}]]></jobtype>
    <experienceLevel><![CDATA[${experienceLevel}]]></experienceLevel>
    <jobPostingAvailability><![CDATA[PUBLIC]]></jobPostingAvailability>
    <description><![CDATA[${fullDescription}]]></description>
    <salary><![CDATA[${job.salary || 'Competitive'}]]></salary>
    <workmode><![CDATA[${job.mode}]]></workmode>
    <category><![CDATA[${job.domain}]]></category>
    <experience><![CDATA[${job.experience}]]></experience>
${skillsList}
${salaryXml}
  </job>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>N2P Systems</publisher>
  <publisherurl>${escapeXml(SITE_URL)}</publisherurl>
  <lastBuildDate>${nowRfc}</lastBuildDate>
${xmlItems}
</source>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}

