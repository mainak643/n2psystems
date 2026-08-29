import type { LucideIcon } from "lucide-react"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

export type LegalSection = {
  icon: LucideIcon
  title: string
  content: React.ReactNode
}

export type LegalPageProps = {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
  closingTitle: string
  closingContent: React.ReactNode
}

/**
 * Shared shell for /privacy-policy and /terms-of-service — previously two
 * ~150-line near-duplicate files. Using one `text-title` token for every
 * <h2> (numbered sections and the closing one alike) also removes the bug
 * where the closing section's heading dropped the `sm:` responsive step
 * its siblings had, so it rendered larger than them on mobile.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  closingTitle,
  closingContent,
}: LegalPageProps) {
  return (
    <main>
      <PageHero
        pad="compact"
        width="narrow"
        backLink={{ href: "/", label: "Back to Home" }}
        title={title}
        description={updated}
      />

      <Section tone="card" pad="compact" width="prose">
        <div className="space-y-12 text-body text-muted-foreground">
          <p className="text-lead text-foreground">{intro}</p>

          <hr className="hairline" />

          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] ring-1 ring-primary/10">
                  <section.icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h2 className="text-title text-foreground">{section.title}</h2>
              </div>
              <div className="space-y-3 pl-13 text-body text-muted-foreground">
                {section.content}
              </div>
            </div>
          ))}

          <hr className="hairline" />

          <div className="space-y-4">
            <h2 className="text-title text-foreground">{closingTitle}</h2>
            <div className="space-y-4 text-body text-muted-foreground">{closingContent}</div>
          </div>
        </div>
      </Section>
    </main>
  )
}
