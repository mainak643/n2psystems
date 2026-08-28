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
  [/\b(canada|toronto|vancouver|montreal|calgary|ottawa|ontario|quebec|alberta|\bon\b|\bbc\b|\bqc\b|\bab\b)\b/i, 'CA'],
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

/**
 * schema.org JobPosting — the markup Google Jobs indexes a role from. Without
 * it these pages are ordinary HTML to a crawler and never surface in the jobs
 * carousel, which for a recruitment site is the point of publishing them.
 *
 * Optional fields are omitted rather than filled with placeholders: an invented
 * salary or closing date is a structured-data violation, and Google penalises
 * postings whose markup disagrees with the visible page.
 */
export function buildJobPostingSchema(job: Job) {
  const locality = cleanLocality(job.location);
  const country = inferCountry(job.location);

  // Google wants the full posting here — responsibilities and qualifications
  // included — but these lists are usually *parsed out of* job.description, and
  // repeating them verbatim reads as keyword stuffing. Append a list only when
  // the description does not already contain it.
  const alreadyStated = (items: string[]) =>
    items.length === 0 || job.description.includes(items[0]);

  const description = [
    job.description,
    alreadyStated(job.responsibilities)
      ? ''
      : `Key Responsibilities: ${job.responsibilities.join('; ')}`,
    alreadyStated(job.requirements)
      ? ''
      : `Required Skills & Qualifications: ${job.requirements.join('; ')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

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
    employmentType: EMPLOYMENT_TYPE[job.type],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: SITE_URL,
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
    directApply: true,
  };

  if (job.datePostedISO) schema.datePosted = job.datePostedISO;
  if (job.validThroughISO) schema.validThrough = job.validThroughISO;
  if (job.techStack.length > 0) schema.skills = job.techStack.join(', ');
  if (job.domain) schema.occupationalCategory = job.domain;

  // TELECOMMUTE additionally requires applicantLocationRequirements, or Google
  // rejects the posting outright.
  if (job.mode === 'Remote') {
    schema.jobLocationType = 'TELECOMMUTE';
    if (country) {
      schema.applicantLocationRequirements = { '@type': 'Country', name: country };
    }
  }

  // Only emit a salary when the requisition actually carried numbers; the
  // display string may read "Competitive".
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
