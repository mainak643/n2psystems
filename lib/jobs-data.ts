export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: "Full-time" | "Contract" | "Part-time"
  mode: "Remote" | "Onsite" | "Hybrid"
  experience: string
  salary: string
  techStack: string[]
  domain: string
  postedDate: string
  description: string
  /**
   * The genuinely unique intro prose from the raw JD — everything *before*
   * the first recognized "Responsibilities"/"Requirements"-style heading.
   * `description` is the full raw text (kept for JSON-LD, which wants the
   * complete posting); this is what the human-facing page renders, so a
   * candidate isn't shown the same bullets three times. Empty when the raw
   * text has no real intro (e.g. it opens straight into a heading) — the
   * page skips the "Role Overview" card entirely in that case rather than
   * render nothing under a heading.
   */
  overview: string
  responsibilities: string[]
  requirements: string[]
  /**
   * Machine-readable counterparts to the display strings above, carried through
   * from Supabase so the JobPosting JSON-LD can emit real values instead of
   * re-parsing "$150K - $190K CAD" and "2 days ago".
   */
  datePostedISO?: string
  /** `requirements.updated_at` — drives sitemap lastmod and re-indexing. */
  dateModifiedISO?: string
  validThroughISO?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  /**
   * `requirements.id`. `id` above is the human-facing reference_code, but the
   * job_applications FK needs the UUID.
   */
  requirementUuid?: string
  screeningQuestions?: string[]
  /**
   * The answer type the recruiter chose in the ATS for each question, by the
   * same index as `screeningQuestions`. `null` where the ATS stored none (older
   * requisitions saved questions as plain strings).
   */
  screeningQuestionTypes?: (ScreeningAnswerType | null)[]
}

/** The ATS's `responseType`: Yes/No, a number, or free text. */
export type ScreeningAnswerType = "yes_no" | "numeric" | "text"

export const jobs: Job[] = [];
