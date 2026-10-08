import { fetchPublishedJobs } from '@/lib/jobs-service'
import { SITE_URL } from '@/lib/site'

/**
 * /llms.txt — the plain-text site summary AI assistants (ChatGPT, Perplexity,
 * Claude, Gemini) read to answer questions about N2P. It used to be a static
 * file in /public, so it described the company but never mentioned a single
 * open role: an assistant asked "is N2P hiring React engineers in Toronto?"
 * had nothing to cite. The live roles are appended here, on the same ISR
 * window as the job board.
 */
export const revalidate = 86400

const ABOUT = `# N2P Systems — Global Technology Recruitment

> N2P Systems is an elite global technology recruitment firm connecting top-tier engineering, AI/ML, data science, and tech leadership talent with high-growth enterprises across Canada, the United States, and India.

## Core Services & Specializations
- **Software Engineering**: Full-stack, backend (Go, Python, Java, Node.js), frontend (React, TypeScript), mobile (iOS, Android).
- **AI & Machine Learning**: LLM engineers, MLOps, Computer Vision, NLP, deep learning researchers.
- **Cloud & DevOps**: AWS, GCP, Azure, Kubernetes, Terraform, Site Reliability Engineering (SRE).
- **Data & Analytics**: Data engineering (Spark, Snowflake, dbt), data science, BI, data governance.
- **Cybersecurity**: SecOps, penetration testing, compliance (SOC 2, ISO 27001), cloud security.
- **Executive & Technical Leadership**: CTO, VP of Engineering, Engineering Managers, Product Leaders.

## Operating Regions
- **Canada**: Toronto (ON), Vancouver (BC), Ottawa (ON), Montreal (QC), Calgary (AB)
- **United States**: San Francisco (CA), New York (NY), Austin (TX), Seattle (WA), Boston (MA)
- **India**: Mumbai, Navi Mumbai, Bengaluru, Hyderabad, Pune, Delhi NCR

## Official URLs & Resources
- **Public Corporate Website**: https://n2psystems.com
- **Careers & Live Job Board**: https://n2psystems.com/jobs
- **Direct Candidate Profile Submission**: https://n2psystems.com/resume
- **Employer Consultation & Client Inquiries**: https://n2psystems.com/clients
- **Internal ATS / Recruiter Operations**: https://ops.n2psystems.com
- **Public Requisitions API**: https://n2psystems.com/api/jobs
- **Full Machine-Readable LLM Specification**: https://n2psystems.com/llms-full.txt

## Public Jobs API for AI Agents & Search Engines
- **Endpoint**: \`GET https://n2psystems.com/api/jobs\`
- **Summary Mode**: \`GET https://n2psystems.com/api/jobs?summary=true\`
- **Single Requisition Lookup**: \`GET https://n2psystems.com/api/jobs?ref=REQ-XXXXX\`
- **Keyword Filter**: \`GET https://n2psystems.com/api/jobs?q=kubernetes\`
`

export async function GET() {
  const jobs = await fetchPublishedJobs().catch(() => [])

  const roles = jobs.length
    ? jobs
        .map((job) => {
          const url = `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`
          const facts = [job.location, job.mode, job.type, job.experience, job.salary].filter(Boolean).join(' · ')
          const skills = job.techStack.slice(0, 8).join(', ')
          return `- [${job.title}](${url}) — ${facts}${skills ? `. Skills: ${skills}` : ''}. Ref ${job.id}. Apply: ${url}/apply`
        })
        .join('\n')
    : '- No roles are open right now. Candidates can submit a general profile at ' + `${SITE_URL}/resume`

  const body = `${ABOUT}
## Open Roles (live, ${jobs.length} as of ${new Date().toISOString().slice(0, 10)})
${roles}

## How to Apply
- Every role above has a direct application form at its /apply URL (contact details, resume as PDF or DOCX, and any pre-screening questions for the role).
- Candidates without a matching role can submit a general profile at ${SITE_URL}/resume.
- Links of the form ${SITE_URL}/careers/<ref>/apply redirect to the same forms.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
    },
  })
}
