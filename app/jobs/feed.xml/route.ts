import { NextResponse } from 'next/server';
import { fetchPublishedJobs } from '@/lib/jobs-service';
import { SITE_URL } from '@/lib/site';

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
  const clean = location.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const parts = clean.split(',').map((p) => p.trim());
  let country = 'US';

  if (/india|mumbai|bengaluru|bangalore|pune|hyderabad|delhi|noida|kolkata|chennai/i.test(clean)) {
    country = 'IN';
  } else if (/canada|toronto|vancouver|montreal|calgary|ottawa|ontario|quebec|alberta/i.test(clean)) {
    country = 'CA';
  }

  const city = parts[0] || clean;
  const state = parts.length >= 3 ? parts[1] : (parts.length === 2 && parts[1].length <= 4 ? parts[1] : '');
  return { city, state, country };
}

/**
 * Universal XML Job Feed compatible with:
 * - LinkedIn Job Wrapping / Ingestion Specification
 * - Indeed Job Feed XML standard
 * - Google for Jobs XML
 * - ZipRecruiter & Glassdoor Aggregators
 */
export async function GET() {
  let jobs: any[] = [];
  try {
    jobs = await fetchPublishedJobs();
  } catch (error) {
    console.error('[Jobs Feed XML] Error fetching published jobs:', error);
  }

  const nowRfc = new Date().toUTCString();

  const xmlItems = jobs
    .map((job) => {
      const { city, state, country } = parseLocation(job.location);
      const url = `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`;
      const postedDate = job.datePostedISO ? new Date(job.datePostedISO).toISOString().split('T')[0] : '';
      const validThrough = job.validThroughISO || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const fullDescription = [
        job.overview || '',
        job.responsibilities && job.responsibilities.length > 0
          ? `Key Responsibilities:\n• ${job.responsibilities.join('\n• ')}`
          : '',
        job.requirements && job.requirements.length > 0
          ? `Required Skills & Qualifications:\n• ${job.requirements.join('\n• ')}`
          : '',
        `Apply directly at: ${url}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      return `  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${postedDate}]]></date>
    <expirationdate><![CDATA[${validThrough}]]></expirationdate>
    <referencenumber><![CDATA[${job.id}]]></referencenumber>
    <url><![CDATA[${url}]]></url>
    <company><![CDATA[${job.company || 'N2P Systems'}]]></company>
    <city><![CDATA[${city}]]></city>
    <state><![CDATA[${state}]]></state>
    <country><![CDATA[${country}]]></country>
    <description><![CDATA[${fullDescription}]]></description>
    <salary><![CDATA[${job.salary || 'Competitive'}]]></salary>
    <jobtype><![CDATA[${job.type}]]></jobtype>
    <workmode><![CDATA[${job.mode}]]></workmode>
    <category><![CDATA[${job.domain}]]></category>
    <experience><![CDATA[${job.experience}]]></experience>
    <skills><![CDATA[${job.techStack.join(', ')}]]></skills>
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

