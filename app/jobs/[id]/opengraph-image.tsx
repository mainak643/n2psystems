import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchJobById } from '@/lib/jobs-service';

export const alt = 'N2P Systems Career Opportunity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function JobOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let job: any = null;
  try {
    job = await fetchJobById(id);
  } catch {
    // Fall back to default branding if lookup fails
  }

  let markSrc = '';
  try {
    const markBuffer = await readFile(join(process.cwd(), 'app/icon.png'));
    markSrc = `data:image/png;base64,${markBuffer.toString('base64')}`;
  } catch {
    // If icon cannot be read, layout continues without image crash
  }

  const title = job?.title || 'Open Technology Opportunity';
  const domain = job?.domain || 'Technology Recruitment';
  const location = job?.location || 'Canada / USA / India';
  const mode = job?.mode || 'Full-time';
  const salary = job?.salary || null;
  const company = job?.company || 'N2P Systems';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          background: '#07101F',
          backgroundImage:
            'radial-gradient(ellipse 900px 600px at 85% -10%, rgba(30,99,181,0.38), transparent 60%), ' +
            'radial-gradient(ellipse 700px 500px at -5% 115%, rgba(122,201,67,0.18), transparent 60%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header: Brand + Domain Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {markSrc ? (
              <img src={markSrc} width={56} height={56} style={{ borderRadius: 12 }} />
            ) : null}
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
              <span>N2P&nbsp;</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>Systems</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              padding: '8px 20px',
              borderRadius: 30,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {domain}
          </div>
        </div>

        {/* Center: Job Title & Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
          <div
            style={{
              fontSize: title.length > 36 ? 48 : 58,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              maxHeight: 140,
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: 8,
              }}
            >
              🏢 {company}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: 8,
              }}
            >
              📍 {location}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: 8,
              }}
            >
              ⚡ {mode}
            </div>
          </div>
        </div>

        {/* Footer: Salary + Call to Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 24,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {salary ? (
              <span style={{ fontSize: 26, fontWeight: 700, color: '#4ade80' }}>
                💰 {salary}
              </span>
            ) : (
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>
                Direct Placement & Verified Role
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 20,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.02em',
            }}
          >
            n2psystems.com/jobs
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

