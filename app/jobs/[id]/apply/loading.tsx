import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApplyLoading() {
  return (
    <main>
      <PageHero
        align="start"
        width="narrow"
        eyebrow="Application"
        title={<Skeleton className="h-10 w-72 max-w-full bg-white/10" />}
        backLink={{ href: "/jobs", label: "Back to role details" }}
        meta={
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Skeleton className="h-5 w-28 bg-white/10" />
            <Skeleton className="h-5 w-36 bg-white/10" />
            <Skeleton className="h-5 w-24 bg-white/10" />
          </div>
        }
      />

      <Section tone="frost" pad="compact" width="narrow">
        <div className="surface p-6 sm:p-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="flex justify-end pt-5 border-t border-border">
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>
      </Section>
    </main>
  )
}
