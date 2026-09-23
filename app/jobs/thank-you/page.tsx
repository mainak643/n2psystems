import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

export const metadata: Metadata = {
  title: "Application Received | N2P Systems",
  description: "Thank you for submitting your application to N2P Systems.",
  robots: { index: false, follow: false },
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; role?: string; name?: string }>
}) {
  const { ref, role, name } = await searchParams
  const firstName = name ? name.trim().split(" ")[0] : ""

  return (
    <main>
      <PageHero
        align="center"
        eyebrow="Application Status"
        title="Application Received Successfully"
        description={
          firstName
            ? `Thank you, ${firstName}. Your application has been filed directly with our recruitment lead.`
            : "Thank you. Your application has been filed directly with our recruitment lead."
        }
      />
      <Section tone="frost" pad="default">
        <div className="surface mx-auto max-w-lg p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-tech-green/10 text-tech-green">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>
          <h2 className="text-title text-foreground">Dossier Under Review</h2>
          {role && (
            <p className="mt-2 text-body font-medium text-foreground">
              Position: <span className="font-semibold text-primary">{role}</span>
            </p>
          )}
          {ref && (
            <p className="mt-1 font-mono text-caption text-muted-foreground">
              Requisition Reference: {ref}
            </p>
          )}
          <p className="mt-4 text-body text-muted-foreground">
            Our talent acquisition team will review your qualifications against client requirements. If your profile is shortlisted, our recruiting specialist will connect with you via email or phone.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="brand" size="lg">
              <Link href="/jobs">
                Browse More Opportunities
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </Section>
    </main>
  )
}
