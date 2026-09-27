/**
 * Renders schema.org structured data.
 *
 * Plain JSON.stringify is not safe inside a <script> element: job
 * descriptions are recruiter-entered text, and a literal "</script>" (or
 * "<!--") in one ends the tag early — the rest of the JSON spills into the
 * page as markup and the whole JobPosting is dropped by Google. Escaping
 * `<`, `>` and `&` as \u sequences keeps the JSON identical once parsed.
 * U+2028/U+2029 are escaped too; they are valid in JSON but not in older JS
 * parsers some crawlers still use.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
