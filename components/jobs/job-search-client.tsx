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
import { jobs as defaultJobs, type Job } from "@/lib/jobs-data"
import { fetchPublishedJobs, getDynamicFilterOptions } from "@/lib/jobs-service"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface JobSearchClientProps {
  initialJobs?: Job[]
}

export function JobSearchClient({ initialJobs }: JobSearchClientProps) {
  const [jobsList, setJobsList] = useState<Job[]>(initialJobs && initialJobs.length > 0 ? initialJobs : defaultJobs)
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
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by title, technology stack, keyword, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-signature-blue"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Filter className="size-4 mr-2 text-slate-500" />
              Filters
              {activeFilters.length > 0 && (
                <Badge className="ml-2 bg-signature-blue text-white text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div
          className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
            showFilters ? "block" : "hidden lg:grid"
          }`}
        >
          {/* Location */}
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 text-slate-700">
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

          {/* Domain / Discipline */}
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 text-slate-700">
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

          {/* Experience Level */}
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 text-slate-700">
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

          {/* Work Mode */}
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 text-slate-700">
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

        {/* Active Filter Badges */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="text-xs bg-signature-blue/10 text-signature-blue border-none rounded-lg px-2.5 py-1"
              >
                {filter}
              </Badge>
            ))}
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium ml-1"
            >
              <X className="size-3" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count & Match Indicator */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-950">{filteredJobs.length}</span>{" "}
          active {filteredJobs.length === 1 ? "opening" : "openings"}
        </p>
        <Link
          href="/resume"
          className="text-xs font-medium text-signature-blue hover:underline inline-flex items-center gap-1"
        >
          <Sparkles className="size-3.5" />
          Don&apos;t see your role? Submit Resume
        </Link>
      </div>

      {/* Job Listings List */}
      <div className="flex flex-col gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              // Reference codes are recruiter-entered free text, so a code with
              // a slash or space would otherwise build a broken multi-segment
              // path instead of one `[id]` segment.
              href={`/jobs/${encodeURIComponent(job.id)}`}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-signature-blue/30 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-signature-blue/10 text-signature-blue border-none font-sans rounded-md px-2.5 py-0.5 font-medium"
                    >
                      {job.domain}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs rounded-md border-slate-200 text-slate-600 px-2 py-0.5"
                    >
                      {job.mode}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs rounded-md border-slate-200 text-slate-600 px-2 py-0.5"
                    >
                      {job.type}
                    </Badge>
                  </div>
                  <h3 className="font-sans font-bold text-lg text-slate-900 group-hover:text-signature-blue transition-colors">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.company}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-slate-400" />
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-slate-400" />
                      {job.postedDate}
                    </span>
                  </div>

                  {job.techStack && job.techStack.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {job.techStack.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/60"
                        >
                          {tech}
                        </span>
                      ))}
                      {job.techStack.length > 5 && (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500 border border-slate-200/60">
                          +{job.techStack.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 lg:flex-col lg:items-end lg:gap-3 pt-3 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                  <div className="text-sm sm:text-base font-bold text-slate-900">
                    {job.salary}
                  </div>
                  <span className="text-sm font-semibold text-signature-blue flex items-center gap-1 transition-transform group-hover:translate-x-1">
                    View Details
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-900 text-lg">
              No positions currently match your criteria
            </p>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting your filters or search keywords. You can also submit your resume for direct review by our talent advisory team.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-xl border-slate-200"
              >
                Clear Filters
              </Button>
              <Link href="/resume">
                <Button className="rounded-xl bg-signature-blue hover:bg-[#164e93] text-white">
                  Submit Resume
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
