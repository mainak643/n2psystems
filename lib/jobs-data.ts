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
  responsibilities: string[]
  requirements: string[]
  /**
   * Machine-readable counterparts to the display strings above, carried through
   * from Supabase so the JobPosting JSON-LD can emit real values instead of
   * re-parsing "$150K - $190K CAD" and "2 days ago".
   */
  datePostedISO?: string
  validThroughISO?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  /**
   * `requirements.id`. `id` above is the human-facing reference_code, but the
   * job_applications FK needs the UUID.
   */
  requirementUuid?: string
}

export const jobs: Job[] = [];
