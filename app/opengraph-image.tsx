import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'N2P Systems — Global Technology Recruitment'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/*
  Self-contained on purpose (per lib/site.ts's comment on avoiding surprise
  dependencies in metadata-generating routes): reads the brand mark straight
  off disk and inlines it as a data URI, so this never touches Supabase or
  the network at request time.
*/
export default async function OpengraphImage() {
  const markBuffer = await readFile(join(process.cwd(), 'app/icon.png'))
  const markSrc = `data:image/png;base64,${markBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#07101F',
          backgroundImage:
            'radial-gradient(ellipse 900px 600px at 82% -10%, rgba(30,99,181,0.35), transparent 60%), ' +
            'radial-gradient(ellipse 700px 500px at -5% 115%, rgba(122,201,67,0.16), transparent 60%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src={markSrc} width={72} height={72} style={{ borderRadius: 16 }} />
          <div
            style={{
              display: 'flex',
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            <span>N2P&nbsp;</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Systems</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 64, maxWidth: 920 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              color: 'rgba(255,255,255,0.95)',
            }}
          >
            Global Technology Recruitment
          </span>
          <span
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.5,
              color: 'rgba(203,213,225,0.85)',
            }}
          >
            Connecting technology professionals with leading companies
            across Canada, the United States, and India.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 56 }}>
          {['Canada', 'United States', 'India'].map((region, i) => (
            <div key={region} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && (
                <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)' }}>/</span>
              )}
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(148,163,184,0.9)',
                }}
              >
                {region}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
