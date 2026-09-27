import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the apply page's form + role-summary layout so nothing jumps on load. */
export default function ApplyLoading() {
  return (
    <main>
      <PageHero
        align="start"
        pad="compact"
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

      <Section tone="frost" pad="compact">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="surface flex flex-col gap-6 p-5 sm:p-8 lg:p-10">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="flex justify-end border-t border-border pt-6">
              <Skeleton className="h-11 w-48 rounded-xl" />
            </div>
          </div>
          <div className="surface hidden flex-col gap-4 p-6 lg:flex">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      </Section>
    </main>
  )
}
