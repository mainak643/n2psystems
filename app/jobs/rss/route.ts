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

export async function GET() {
  let jobs: any[] = [];
  try {
    jobs = await fetchPublishedJobs();
  } catch (error) {
    console.error('[Jobs RSS Feed] Error fetching published jobs:', error);
  }

  const nowRfc = new Date().toUTCString();

  const items = jobs
    .map((job) => {
      const url = `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`;
      const pubDate = job.datePostedISO ? new Date(job.datePostedISO).toUTCString() : nowRfc;
      const snippet = escapeXml(
        `${job.title} at ${job.company || 'N2P Systems'} (${job.location}) — ${job.type} (${job.mode}). ${
          (job.overview || job.description.slice(0, 200)).replace(/\*\*/g, '')
        }`
      );

      return `    <item>
      <title><![CDATA[${job.title} — ${job.location}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${snippet}</description>
      <category><![CDATA[${job.domain}]]></category>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>N2P Systems — Open Technology Jobs</title>
    <link>${SITE_URL}/jobs</link>
    <description>Active technology openings across Software Engineering, Cloud, DevOps, AI/ML, Data Science, and Cybersecurity at N2P Systems.</description>
    <language>en-us</language>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <atom:link href="${SITE_URL}/jobs/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}

