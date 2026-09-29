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
  [/\b(india|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata|delhi|noida|gurgaon|gurugram|ahmedabad|coimbatore|navi mumbai|karnataka|maharashtra|telangana|tamil nadu)\b/i, 'IN'],
  // The province abbreviations are anchored to a comma on purpose. A bare
  // `\bon\b` in this alternation matched the "On-site" in every recruiter
  // suffix — "Austin, TX (On-site)" resolved to CA, emitting a Texas locality
  // with addressCountry "CA" and flipping applicantLocationRequirements to
  // Canada on US postings.
  [/\b(canada|toronto|vancouver|montreal|calgary|ottawa|ontario|quebec|alberta)\b|,\s*(ON|BC|QC|AB)(?![-\w])/i, 'CA'],
  // US state codes are comma-anchored for the same reason, and deliberately
  // sit *after* the Canada rule so ", CA" on a Canadian posting ("Vancouver,
  // BC, Canada") never reaches this line and resolves to California.
  [/\b(usa|united states|u\.s\.|new york|san francisco|seattle|austin|boston|chicago|denver|nashville|memphis|plano|texas|california|florida|tennessee|colorado|washington|illinois)\b|,\s*(US|USA|TX|CA|NY|WA|IL|MA|CO|FL|TN|NC|GA|VA|OH|MI|PA|NJ|AZ|MD|MO|WI|MN)(?![-\w])/i, 'US'],
  [/\b(united kingdom|\buk\b|london|manchester)\b/i, 'GB'],
];

/**
 * Tokens that name a country rather than a place inside one. They are dropped
 * before the locality/region split so "Florida, US" doesn't emit addressRegion
 * "US", and they mark a location as carrying no physical place of its own.
 */
const COUNTRY_TOKEN_RE = /^(usa?|u\.s\.a?\.?|united states|canada|india|uk|u\.k\.|united kingdom|england)$/i;

/** "Remote", "100% Remote", "Anywhere" — a work arrangement, not a place. */
const REMOTE_TOKEN_RE = /^(100%\s*)?(fully\s+)?(remote|anywhere|wfh|work from home)$/i;

/** Google needs a country on applicantLocationRequirements even when the
 *  requisition carried no location at all; the pay currency is the next-best
 *  signal for where N2P is actually hiring. */
const COUNTRY_BY_CURRENCY: Record<string, string> = {
  INR: 'IN',
  CAD: 'CA',
  GBP: 'GB',
  USD: 'US',
};

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

const REGION_MAP: Record<string, string> = {
  quebec: 'QC', qc: 'QC', qb: 'QC',
  ontario: 'ON', on: 'ON',
  'british columbia': 'BC', bc: 'BC',
  alberta: 'AB', ab: 'AB',
  co: 'CO', colorado: 'CO',
  tn: 'TN', tennessee: 'TN',
  tx: 'TX', texas: 'TX',
  fl: 'FL', florida: 'FL',
  ca: 'CA', california: 'CA',
  ny: 'NY', 'new york': 'NY',
  wa: 'WA', washington: 'WA',
  il: 'IL', illinois: 'IL',
  ma: 'MA', massachusetts: 'MA',
  nc: 'NC', 'north carolina': 'NC',
  ga: 'GA', georgia: 'GA',
  'tamil nadu': 'Tamil Nadu',
  karnataka: 'Karnataka',
  maharashtra: 'Maharashtra',
  telangana: 'Telangana',
  delhi: 'Delhi',
};

export interface ParsedPostalAddress {
  addressLocality: string;
  addressRegion?: string;
  addressCountry?: string;
}

export function parsePostalAddress(location: string): ParsedPostalAddress {
  const clean = cleanLocality(location).replace(/\s+or\s+remote/i, '').trim();
  // Infer from the *raw* string, not the cleaned one: cleanLocality strips the
  // recruiter's parenthetical suffix, and "Remote (India)" keeps its only
  // country signal in there.
  const country = inferCountry(location);
  const parts = clean.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
  // "Florida, US" must not emit addressRegion "US" — the country is already
  // carried by addressCountry.
  const placeParts = parts.filter((p) => !COUNTRY_TOKEN_RE.test(p));

  const locality = placeParts[0] || clean;
  let region: string | undefined;

  if (placeParts.length >= 2) {
    const secondPart = placeParts[1].toLowerCase();
    region = REGION_MAP[secondPart] || placeParts[1];
  }

  return {
    addressLocality: locality,
    ...(region ? { addressRegion: region } : {}),
    ...(country ? { addressCountry: country } : {}),
  };
}

/**
 * True when the free-text location names no actual place — it is only a work
 * arrangement ("Remote", "Remote (India)") or a bare country ("USA"). Google's
 * remote-job guidance forbids passing either off as a physical jobLocation.
 */
export function hasNoPhysicalPlace(location?: string): boolean {
  const clean = cleanLocality(location || '').replace(/\s+or\s+remote/i, '').trim();
  if (!clean) return true;
  return clean
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .every((p) => REMOTE_TOKEN_RE.test(p) || COUNTRY_TOKEN_RE.test(p));
}

/** The country a posting is hiring into, falling back to the pay currency. */
export function resolveCountry(location: string | undefined, salaryCurrency?: string): string {
  return (
    inferCountry(location || '') ||
    COUNTRY_BY_CURRENCY[(salaryCurrency || '').toUpperCase()] ||
    'US'
  );
}

/** The posting text is plain recruiter input; it goes into an HTML description. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const parsedAddress = parsePostalAddress(job.location);
  // Every posting that emits a location gets a country: Google treats a
  // jobLocation without an ISO country code as an invalid address.
  const effectiveCountry = resolveCountry(job.location, job.salaryCurrency);
  const placeless = hasNoPhysicalPlace(job.location);
  const telecommute = job.mode === 'Remote' || job.mode === 'Hybrid';

  const htmlParts: string[] = [];
  const cleanOverview = (job.overview || job.description || '').replace(/\*\*/g, '').trim();
  if (cleanOverview) {
    cleanOverview.split(/\n\s*\n/).filter(Boolean).forEach((para) => {
      htmlParts.push(`<p>${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`);
    });
  }
  if (job.responsibilities && job.responsibilities.length > 0) {
    htmlParts.push('<p><strong>Key Responsibilities:</strong></p>');
    htmlParts.push(`<ul>${job.responsibilities.map((r) => `<li>${escapeHtml(r.replace(/\*\*/g, ''))}</li>`).join('')}</ul>`);
  }
  if (job.requirements && job.requirements.length > 0) {
    htmlParts.push('<p><strong>Required Skills & Qualifications:</strong></p>');
    htmlParts.push(`<ul>${job.requirements.map((r) => `<li>${escapeHtml(r.replace(/\*\*/g, ''))}</li>`).join('')}</ul>`);
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
      url: SITE_URL,
      sameAs: [
        SITE_URL,
        'https://www.linkedin.com/company/n2p-systems/',
      ],
      logo: `${SITE_URL}/images/n2p-logo-light.png`,
    },
    url: `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
    },
    directApply: true,
  };

  // datePosted is required by Google for Jobs; fall back to current time if missing.
  const parsedPosted = job.datePostedISO ? new Date(job.datePostedISO).getTime() : NaN;
  const postedTimestamp = Number.isNaN(parsedPosted) ? Date.now() : parsedPosted;
  schema.datePosted = job.datePostedISO || new Date(postedTimestamp).toISOString();

  // validThrough: Google requires this to avoid stale listings. When the ATS
  // carries no closing date we give the posting a 60-day window *from the day
  // it was posted* — anchoring it to Date.now() instead made the date creep
  // forward on every ISR revalidation, so Google saw a posting that never
  // expired and re-crawled a changing payload for an unchanged job.
  schema.validThrough =
    job.validThroughISO || new Date(postedTimestamp + 60 * 24 * 60 * 60 * 1000).toISOString();

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

  // Google's rules, in order of how badly we used to break them:
  //  - 100% remote: no jobLocation at all, TELECOMMUTE + applicantLocationRequirements.
  //  - Hybrid: the office *and* TELECOMMUTE, so it shows for both searches.
  //  - Onsite: the office only — jobLocationType would make it a remote hit.
  if (!placeless) {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: parsedAddress.addressLocality,
        ...(parsedAddress.addressRegion ? { addressRegion: parsedAddress.addressRegion } : {}),
        addressCountry: parsedAddress.addressCountry || effectiveCountry,
      },
    };
  } else if (!telecommute) {
    // An onsite/unspecified role whose requisition only named a country still
    // needs *a* location; the country alone is a valid PostalAddress.
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: effectiveCountry,
      },
    };
  }

  if (telecommute) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: effectiveCountry,
    };
  }

  // Only emit a salary when the requisition actually carried numbers
  if (job.salaryMin !== undefined || job.salaryMax !== undefined) {
    // Contract roles are quoted as an hourly rate ("$50 - $65"). Emitting those
    // as unitText YEAR told Google the job paid $65 a year, which reads as
    // either spam or a data error and drops the posting from the carousel.
    const maxVal = job.salaryMax ?? job.salaryMin ?? 0;
    const isHourly = maxVal <= 500 || (job.type === 'Contract' && maxVal < 1000);
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: (job.salaryCurrency || 'USD').toUpperCase(),
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salaryMin !== undefined ? { minValue: job.salaryMin } : {}),
        ...(job.salaryMax !== undefined ? { maxValue: job.salaryMax } : {}),
        unitText: isHourly ? 'HOUR' : 'YEAR',
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
