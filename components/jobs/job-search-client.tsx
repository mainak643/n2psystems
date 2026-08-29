"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search, MapPin, Briefcase, Clock, ArrowRight, Filter, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Job } from "@/lib/jobs-data"
import { fetchPublishedJobs, getDynamicFilterOptions } from "@/lib/jobs-service"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface JobSearchClientProps {
  initialJobs?: Job[]
}

export function JobSearchClient({ initialJobs }: JobSearchClientProps) {
  const [jobsList, setJobsList] = useState<Job[]>(initialJobs ?? [])
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("All Locations")
  const [domain, setDomain] = useState("All Domains")
  const [experience, setExperience] = useState("All Levels")
  const [mode, setMode] = useState("All Modes")
  const [showFilters, setShowFilters] = useState(false)

  // Realtime Supabase updates when recruiter creates or updates requirements
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('public_jobs_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requirements' },
        () => {
          fetchPublishedJobs().then((updated) => {
            if (updated && updated.length > 0) {
              setJobsList(updated)
            }
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  // Dynamic filter options based on available live jobs
  const { locations, domains, experiences, modes } = useMemo(() => {
    return getDynamicFilterOptions(jobsList)
  }, [jobsList])

  const filteredJobs = useMemo(() => {
    // Normalised once for the whole pass, not once per job per keystroke.
    const q = searchQuery.toLowerCase().trim()
    const modeLower = mode.toLowerCase()

    return jobsList.filter((job) => {
      const matchesSearch =
        q === "" ||
        job.title.toLowerCase().includes(q) ||
        job.domain.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.techStack.some((t) => t.toLowerCase().includes(q))

      const matchesLocation = location === "All Locations" || job.location === location
      const matchesDomain = domain === "All Domains" || job.domain === domain
      const matchesExperience = experience === "All Levels" || job.experience === experience
      const matchesMode = mode === "All Modes" || job.mode.toLowerCase() === modeLower

      return matchesSearch && matchesLocation && matchesDomain && matchesExperience && matchesMode
    })
  }, [jobsList, searchQuery, location, domain, experience, mode])

  const activeFilters = [location, domain, experience, mode].filter((f) => !f.startsWith("All"))

  const clearFilters = () => {
    setLocation("All Locations")
    setDomain("All Domains")
    setExperience("All Levels")
    setMode("All Modes")
    setSearchQuery("")
  }

  return (
    <div className="space-y-6">
      {/* Search and filters bar */}
      <div className="surface p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search jobs by title, technology stack, keyword, or company"
              placeholder="Search by title, technology stack, keyword, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
              Filters
              {activeFilters.length > 0 && (
                <Badge className="ml-1 bg-primary text-xs text-primary-foreground">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div
          className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
            showFilters ? "block" : "hidden lg:grid"
          }`}
        >
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              {experiences.map((exp) => (
                <SelectItem key={exp} value={exp}>
                  {exp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              {modes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter badges */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-caption font-semibold text-muted-foreground">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="rounded-lg border-none bg-primary/10 px-2.5 py-1 text-xs text-primary"
              >
                {filter}
              </Badge>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 flex items-center gap-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results count & match indicator */}
      <div className="flex items-center justify-between px-1">
        <p aria-live="polite" className="text-body text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span>{" "}
          active {filteredJobs.length === 1 ? "opening" : "openings"}
        </p>
        <Link
          href="/resume"
          className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Don&apos;t see your role? Submit Resume
        </Link>
      </div>

      {/* Job listings */}
      <div className="flex flex-col gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              // Reference codes are recruiter-entered free text, so a code with
              // a slash or space would otherwise build a broken multi-segment
              // path instead of one `[id]` segment.
              href={`/jobs/${encodeURIComponent(job.id)}`}
              className="surface surface-interactive group block p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-md border-none bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {job.domain}
                    </Badge>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs">
                      {job.mode}
                    </Badge>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs">
                      {job.type}
                    </Badge>
                  </div>
                  <h3 className="text-subtitle text-foreground transition-colors group-hover:text-primary">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-body text-muted-foreground">{job.company}</p>

                  <div className="mt-3 flex flex-wrap gap-4 text-caption text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
                      {job.postedDate}
                    </span>
                  </div>

                  {job.techStack && job.techStack.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {job.techStack.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex rounded-lg border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                      {job.techStack.length > 5 && (
                        <span className="inline-flex rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                          +{job.techStack.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-3 lg:flex-col lg:items-end lg:justify-end lg:gap-3 lg:border-t-0 lg:pt-0">
                  <div className="text-body font-bold text-foreground sm:text-subtitle">
                    {job.salary}
                  </div>
                  <span className="flex items-center gap-1 text-body font-semibold text-primary transition-transform group-hover:translate-x-1">
                    View Details
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="surface p-12 text-center">
            <p className="text-subtitle text-foreground">No positions currently match your criteria</p>
            <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
              Try adjusting your filters or search keywords. You can also submit your resume for direct review by our talent advisory team.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button asChild variant="brand">
                <Link href="/resume">Submit Resume</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
