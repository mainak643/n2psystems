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
import { fetchPublishedJobs, getDynamicFilterOptions, inferCountry, extractCity } from "@/lib/jobs-service"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface JobSearchClientProps {
  initialJobs?: Job[]
}

// Rendering 25+ full job cards in one unbroken list was the whole board's
// worth of scroll before a candidate reached the roles further down —
// worse on mobile than desktop. Paginate client-side rather than change how
// jobs are fetched.
const PAGE_SIZE = 10

export function JobSearchClient({ initialJobs }: JobSearchClientProps) {
  const [jobsList, setJobsList] = useState<Job[]>(initialJobs ?? [])
  const [searchQuery, setSearchQuery] = useState("")
  const [country, setCountry] = useState("All Countries")
  const [city, setCity] = useState("All Cities")
  const [domain, setDomain] = useState("All Domains")
  const [experience, setExperience] = useState("All Levels")
  const [mode, setMode] = useState("All Modes")
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Realtime Supabase updates when recruiter creates or updates requirements
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('public_jobs_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requirements' },
        () => {
          /*
            `force` skips the 60s module cache, which lives in this bundle too:
            a second change within a minute used to read straight back out of
            it and re-apply the pre-change list, so the update never appeared
            until a manual reload. The result is applied whether or not it is
            empty — the old `length > 0` guard meant closing the last open role
            left it on screen indefinitely.
          */
          fetchPublishedJobs(true).then((updated) => {
            if (updated) setJobsList(updated)
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  // Dynamic filter options based on available live jobs
  const { countries, cities: allCities, domains, experiences, modes } = useMemo(() => {
    return getDynamicFilterOptions(jobsList)
  }, [jobsList])

  // When country changes, reset city filter (cities change by country)
  const citiesForCountry = useMemo(() => {
    if (country === "All Countries") return allCities
    const filtered = jobsList
      .filter((j) => inferCountry(j.location) === country)
      .map((j) => extractCity(j.location))
      .filter((c): c is string => Boolean(c && c.trim()))
    const uniq = Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b))
    return ['All Cities', ...uniq]
  }, [country, jobsList, allCities])

  // Reset city when country changes
  useEffect(() => {
    setCity("All Cities")
  }, [country])

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

      const matchesCountry = country === "All Countries" || inferCountry(job.location) === country
      const matchesCity = city === "All Cities" || extractCity(job.location) === city
      const matchesDomain = domain === "All Domains" || job.domain === domain
      const matchesExperience = experience === "All Levels" || job.experience === experience
      const matchesMode = mode === "All Modes" || job.mode.toLowerCase() === modeLower

      return matchesSearch && matchesCountry && matchesCity && matchesDomain && matchesExperience && matchesMode
    })
  }, [jobsList, searchQuery, country, city, domain, experience, mode])

  // A new search/filter is a new result set — start back at page one rather
  // than leaving visibleCount wherever it was for the previous query.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery, country, city, domain, experience, mode])

  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const hasMore = filteredJobs.length > visibleCount

  /*
    Compared against each filter's own "unset" sentinel, not the prefix "All".
    The prefix test misread any real option starting with those letters as
    unset — pick the city "Allentown" and the Active-filters row, the mobile
    filter count and the "Clear all" button all vanished, leaving a visitor
    looking at one result with nothing on screen to say why. Keyed by filter
    name too, since two filters can legitimately hold the same value (country
    "India" and city "India" both exist) and keying on the value collided.
  */
  const activeFilters = [
    { name: "country", value: country, unset: "All Countries" },
    { name: "city", value: city, unset: "All Cities" },
    { name: "domain", value: domain, unset: "All Domains" },
    { name: "experience", value: experience, unset: "All Levels" },
    { name: "mode", value: mode, unset: "All Modes" },
  ].filter((f) => f.value !== f.unset)

  const clearFilters = () => {
    setCountry("All Countries")
    setCity("All Cities")
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
          <div className="flex gap-3 w-full lg:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full lg:w-auto lg:hidden"
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
          className={`mt-4 gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 ${
            showFilters ? "grid" : "hidden lg:grid"
          }`}
        >
          {/* Country filter — fixed to India / Canada / USA */}
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City filter — derived from jobs, scoped to selected country */}
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger size="lg" className="w-full rounded-xl">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {citiesForCountry.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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
                key={filter.name}
                variant="secondary"
                className="rounded-lg border-none bg-primary/10 px-2.5 py-1 text-xs text-primary"
              >
                {filter.value}
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
          {hasMore ? (
            <>
              Showing <span className="font-semibold text-foreground">{visibleJobs.length}</span> of{" "}
              <span className="font-semibold text-foreground">{filteredJobs.length}</span> active openings
            </>
          ) : (
            <>
              Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span>{" "}
              active {filteredJobs.length === 1 ? "opening" : "openings"}
            </>
          )}
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
          visibleJobs.map((job) => (
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
                  {job.salary ? (
                    <div className="text-body font-bold text-foreground sm:text-subtitle">
                      {job.salary}
                    </div>
                  ) : null}
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

      {/*
        Rendered whenever there is more than one page, and disabled rather than
        unmounted once everything is shown. Removing it on the final click
        destroyed the element that had focus, so a keyboard user was dropped
        back to the top of the document and had to tab past the whole header
        again to reach the roles they had just loaded.
      */}
      {filteredJobs.length > PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!hasMore}
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            {hasMore
              ? `Load ${Math.min(PAGE_SIZE, filteredJobs.length - visibleCount)} More Roles`
              : "All Roles Shown"}
          </Button>
        </div>
      )}
    </div>
  )
}
