import type { Job } from './jobs-data';
import { SITE_URL } from './site';

export { SITE_URL };

const EMPLOYMENT_TYPE: Record<Job['type'], string> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Contract: 'CONTRACTOR',
};

/**
 * Google wants a two-letter country on the posting address. We only ever get a
 * free-text location off the requisition ("Airoli, Navi Mumbai, India",
 * "Toronto, ON (Hybrid)"), so infer from the tokens N2P actually recruits in
 * and omit the field entirely rather than guess wrong — a wrong country is a
 * structured-data error, a missing one is only a missing recommended field.
 */
const COUNTRY_HINTS: [RegExp, string][] = [
  [/\b(india|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata|delhi|noida|gurgaon|navi mumbai)\b/i, 'IN'],
  // The province abbreviations are anchored to a comma on purpose. A bare
  // `\bon\b` in this alternation matched the "On-site" in every recruiter
  // suffix — "Austin, TX (On-site)" resolved to CA, emitting a Texas locality
  // with addressCountry "CA" and flipping applicantLocationRequirements to
  // Canada on US postings.
  [/\b(canada|toronto|vancouver|montreal|calgary|ottawa|ontario|quebec|alberta)\b|,\s*(ON|BC|QC|AB)(?![-\w])/i, 'CA'],
  [/\b(usa|united states|u\.s\.|new york|san francisco|seattle|austin|boston|chicago|texas|california)\b/i, 'US'],
  [/\b(united kingdom|\buk\b|london|manchester)\b/i, 'GB'],
];

function inferCountry(location: string): string | undefined {
  for (const [pattern, code] of COUNTRY_HINTS) {
    if (pattern.test(location)) return code;
  }
  return undefined;
}

/** Strips the parenthetical mode suffix recruiters append: "Toronto, ON (Hybrid)". */
function cleanLocality(location: string): string {
  return location.replace(/\s*\([^)]*\)\s*$/, '').trim() || location;
}

function parseExperienceMonths(experience?: string): number | undefined {
  if (!experience) return undefined;
  const match = experience.match(/(\d+)/);
  if (!match) return undefined;
  const years = parseInt(match[1], 10);
  if (isNaN(years) || years <= 0 || years > 40) return undefined;
  return years * 12;
}

/**
 * schema.org JobPosting — the markup Google Jobs indexes a role from. Without
 * it these pages are ordinary HTML to a crawler and never surface in the jobs
 * carousel, which for a recruitment site is the point of publishing them.
 */
export function buildJobPostingSchema(job: Job) {
  const locality = cleanLocality(job.location);
  const country = inferCountry(locality);

  const htmlParts: string[] = [];
  const cleanOverview = (job.overview || job.description || '').replace(/\*\*/g, '').trim();
  if (cleanOverview) {
    cleanOverview.split(/\n\s*\n/).filter(Boolean).forEach((para) => {
      htmlParts.push(`<p>${para.replace(/\n/g, '<br/>')}</p>`);
    });
  }
  if (job.responsibilities && job.responsibilities.length > 0) {
    htmlParts.push('<p><strong>Key Responsibilities:</strong></p>');
    htmlParts.push(`<ul>${job.responsibilities.map((r) => `<li>${r.replace(/\*\*/g, '')}</li>`).join('')}</ul>`);
  }
  if (job.requirements && job.requirements.length > 0) {
    htmlParts.push('<p><strong>Required Skills & Qualifications:</strong></p>');
    htmlParts.push(`<ul>${job.requirements.map((r) => `<li>${r.replace(/\*\*/g, '')}</li>`).join('')}</ul>`);
  }
  const description = htmlParts.join('\n');

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'N2P Systems Requisition',
      value: job.id,
    },
    employmentType: EMPLOYMENT_TYPE[job.type] || 'FULL_TIME',
    industry: 'Information Technology & Services',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company || 'N2P Systems',
      sameAs: [
        SITE_URL,
        'https://www.linkedin.com/company/n2p-systems/',
      ],
      logo: `${SITE_URL}/images/n2p-logo-light.png`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: locality,
        ...(country ? { addressCountry: country } : {}),
      },
    },
    url: `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
    },
    directApply: true,
  };

  // datePosted is required by Google for Jobs; fall back to current time if missing.
  const postedTimestamp = job.datePostedISO ? new Date(job.datePostedISO).getTime() : Date.now();
  schema.datePosted = job.datePostedISO || new Date(postedTimestamp).toISOString();

  // validThrough: Google requires this to avoid stale listings. If not set on requisition,
  // set a safe 60-day rolling forward window so active jobs stay eligible in Google for Jobs.
  if (job.validThroughISO) {
    schema.validThrough = job.validThroughISO;
  } else {
    schema.validThrough = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Structured experience requirements for Google for Jobs ranking
  const expMonths = parseExperienceMonths(job.experience);
  if (expMonths !== undefined) {
    schema.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: expMonths,
    };
  }

  if (job.techStack.length > 0) schema.skills = job.techStack.join(', ');
  if (job.domain) schema.occupationalCategory = job.domain;

  if (job.mode === 'Remote' && country) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: country,
    };
  }

  // Only emit a salary when the requisition actually carried numbers
  if (job.salaryMin !== undefined || job.salaryMax !== undefined) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: (job.salaryCurrency || 'USD').toUpperCase(),
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salaryMin !== undefined ? { minValue: job.salaryMin } : {}),
        ...(job.salaryMax !== undefined ? { maxValue: job.salaryMax } : {}),
        unitText: 'YEAR',
      },
    };
  }

  return schema;
}

/** ItemList for the board index, so crawlers see the set of open roles. */
export function buildJobListSchema(jobs: Job[]) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'ItemList',
    name: 'Open technology roles at N2P Systems',
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
      name: job.title,
    })),
  };
}
