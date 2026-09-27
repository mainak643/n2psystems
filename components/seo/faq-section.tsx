import { ChevronDown } from 'lucide-react'

import { Section } from '@/components/ui/section'
import { JsonLd } from '@/components/seo/json-ld'
import { buildFaqSchema, type FaqItem } from '@/lib/seo-schema'

/**
 * Visible FAQ with its matching FAQPage markup. Built on <details> so every
 * answer is in the server-rendered HTML (crawlers and answer engines read it
 * without running JS) and the accordion works with no client code at all.
 */
export function FaqSection({
  id = 'faq',
  eyebrow = 'FAQ',
  title = 'Frequently asked questions',
  items,
  tone = 'card',
}: {
  id?: string
  eyebrow?: string
  title?: string
  items: FaqItem[]
  tone?: 'card' | 'frost'
}) {
  return (
    <Section tone={tone} className="border-t border-border" aria-labelledby={`${id}-heading`} id={id}>
      <JsonLd data={buildFaqSchema(items)} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 id={`${id}-heading`} className="text-heading text-balance text-foreground">
            {title}
          </h2>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <h3 className="text-subtitle text-foreground transition-colors group-hover:text-primary">
                  {item.question}
                </h3>
                <ChevronDown
                  className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="measure pb-6 text-body text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}
