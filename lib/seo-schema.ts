import { SITE_URL } from './site';

/**
 * Standard WebSite schema with Sitelinks Searchbox integration.
 * Informs search engines to render an interactive search box directly in search results.
 */
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'N2P Systems',
    alternateName: ['N2P Systems Inc.', 'N2P Tech Recruitment'],
    description:
      'Connecting elite technology professionals with leading enterprises across Canada, the United States, and India.',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };
}

/**
 * Multi-entity Organization, EmploymentAgency, and multi-location business schema.
 * Provides deep entity linking for Google Knowledge Graph, Perplexity, ChatGPT, and Gemini.
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'EmploymentAgency'],
    '@id': `${SITE_URL}/#organization`,
    name: 'N2P Systems',
    legalName: 'N2P Systems Inc.',
    url: SITE_URL,
    logo: `${SITE_URL}/images/n2p-logo-light.png`,
    image: `${SITE_URL}/images/n2p-logo-light.png`,
    description:
      'Connecting elite technology professionals with leading enterprises across Canada, the United States, and India. Precision-driven hiring for Software Engineering, Data Science, DevOps, AI/ML, Cybersecurity, and Product Leadership.',
    sameAs: [
      'https://www.linkedin.com/company/n2p-systems/',
      'https://ops.n2psystems.com',
    ],
    knowsAbout: [
      'Software Engineering Recruitment',
      'Artificial Intelligence & Machine Learning Staffing',
      'Cloud Architecture & DevOps Placement',
      'Cybersecurity & InfoSec Talent',
      'Executive & Technical Leadership Hiring',
      'Contract-to-Hire Staffing Solutions',
      'Global Delivery & Offshore Engineering Augmentation',
    ],
    areaServed: [
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'India' },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'recruitment',
        email: 'info@n2psystems.ca',
        telephone: '+91 97760 47567',
        availableLanguage: ['English', 'Hindi'],
        areaServed: ['IN', 'CA', 'US'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'info@n2psystems.ca',
        telephone: '+1 (437) 335-9390',
        availableLanguage: ['English'],
        areaServed: ['CA', 'US'],
      },
    ],
    location: [
      {
        '@type': 'Place',
        name: 'N2P Systems — Canada Office',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Toronto',
          addressRegion: 'ON',
          addressCountry: 'CA',
        },
      },
      {
        '@type': 'Place',
        name: 'N2P Systems — USA Hub',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Austin',
          addressRegion: 'TX',
          addressCountry: 'US',
        },
      },
      {
        '@type': 'Place',
        name: 'N2P Systems — India Operations',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Airoli, Navi Mumbai',
          addressRegion: 'MH',
          addressCountry: 'IN',
        },
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Technology Recruitment Solutions',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Contract Staffing',
            description:
              'Rapid deployment of pre-vetted senior software engineers, cloud architects, and data engineers for time-critical initiatives.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Permanent Direct Placement',
            description:
              'Full-lifecycle talent sourcing, cultural calibration, and technical screening for core full-time engineering teams.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Contract-to-Hire Solutions',
            description:
              'Low-risk trial engagements allowing enterprise clients to evaluate on-the-job technical performance before permanent hire.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Executive & Leadership Search',
            description:
              'Discreet, targeted executive recruitment for CTOs, VPs of Engineering, and Heads of Product.',
          },
        },
      ],
    },
  };
}

/**
 * FAQPage schema for Answer Engine Optimization (AEO) and Google Rich Snippets.
 * Used by Perplexity, SearchGPT, Gemini, and Claude for direct factual citations.
 */
export function buildFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What recruitment services does N2P Systems provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'N2P Systems provides enterprise technology recruitment services including Contract Staffing, Permanent Placement, Contract-to-Hire, Executive Search, and Managed Engineering Teams across Software Engineering, Cloud/DevOps, AI/ML, Data Science, and Cybersecurity.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which geographical regions does N2P Systems recruit in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'N2P Systems operates across Canada (Toronto, Vancouver, Ottawa, Montreal, Calgary), the United States (San Francisco, New York, Austin, Seattle, Boston), and India (Mumbai, Navi Mumbai, Bengaluru, Hyderabad, Pune).',
        },
      },
      {
        '@type': 'Question',
        name: 'How does N2P Systems screen and vet technical talent?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'N2P Systems combines automated AI-assisted technical screening (powered by REAPDAT AI) with in-depth evaluation by domain-specialized technical recruiters to assess architecture fundamentals, code quality, and cultural alignment.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can candidates apply for open roles or submit resumes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Candidates can browse verified technology openings at https://n2psystems.com/jobs and apply directly, or submit general candidate profiles at https://n2psystems.com/resume for proactive matchmaking.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can employers partner with N2P Systems to hire talent?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hiring managers and enterprises can submit their talent requirements or request a custom recruitment consultation at https://n2psystems.com/clients. The N2P advisory team responds within one business day.',
        },
      },
    ],
  };
}

/**
 * Helper to build schema.org BreadcrumbList for subpages.
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

