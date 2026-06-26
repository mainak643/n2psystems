"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, MapPin, Briefcase, Clock, ArrowRight, Filter, X } from "lucide-react"
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
import { jobs } from "@/lib/jobs-data"

const locations = ["All Locations", "Toronto, Canada", "New York, USA", "Bangalore, India"]
const domains = [
  "All Domains",
  "Software Engineering",
  "Data Science",
  "DevOps & Cloud",
  "AI / Machine Learning",
  "Cybersecurity",
  "Product Leadership",
]
const experiences = ["All Levels", "3+ years", "4+ years", "5+ years", "7+ years", "8+ years"]
const modes = ["All Modes", "Remote", "Onsite", "Hybrid"]

export function JobSearchClient() {
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("All Locations")
  const [domain, setDomain] = useState("All Domains")
  const [experience, setExperience] = useState("All Levels")
  const [mode, setMode] = useState("All Modes")
  const [showFilters, setShowFilters] = useState(false)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.techStack.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      )
    const matchesLocation =
      location === "All Locations" || job.location === location
    const matchesDomain = domain === "All Domains" || job.domain === domain
    const matchesExperience =
      experience === "All Levels" || job.experience === experience
    const matchesMode = mode === "All Modes" || job.mode === mode
    return (
      matchesSearch &&
      matchesLocation &&
      matchesDomain &&
      matchesExperience &&
      matchesMode
    )
  })

  const activeFilters = [location, domain, experience, mode].filter(
    (f) => !f.startsWith("All")
  )

  const clearFilters = () => {
    setLocation("All Locations")
    setDomain("All Domains")
    setExperience("All Levels")
    setMode("All Modes")
    setSearchQuery("")
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, skill, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-border rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden rounded-xl"
            >
              <Filter className="size-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge className="ml-2 bg-signature-blue text-primary-foreground text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div
          className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
            showFilters ? "block" : "hidden lg:grid"
          }`}
        >
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full h-10 rounded-xl">
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
            <SelectTrigger className="w-full h-10 rounded-xl">
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
            <SelectTrigger className="w-full h-10 rounded-xl">
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
            <SelectTrigger className="w-full h-10 rounded-xl">
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

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="text-xs bg-signature-blue/8 text-signature-blue border-none rounded-lg"
              >
                {filter}
              </Badge>
            ))}
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-serif">
          <span className="font-sans font-semibold text-foreground">
            {filteredJobs.length}
          </span>{" "}
          {filteredJobs.length === 1 ? "position" : "positions"} found
        </p>
      </div>

      {/* Job Listings */}
      <div className="flex flex-col gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group rounded-2xl border border-border bg-card p-6 transition-all card-lift hover:border-signature-blue/15"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-signature-blue/8 text-signature-blue border-none font-sans rounded-lg"
                    >
                      {job.domain}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs rounded-lg"
                    >
                      {job.mode}
                    </Badge>
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-foreground group-hover:text-signature-blue transition-colors">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground font-serif">
                    {job.company}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground font-serif">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground/80" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-muted-foreground/80" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground/80" />
                      {job.postedDate}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.techStack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex rounded-lg bg-frost px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border"
                      >
                        {tech}
                      </span>
                    ))}
                    {job.techStack.length > 4 && (
                      <span className="inline-flex rounded-lg bg-frost px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border">
                        +{job.techStack.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:gap-2">
                  <div className="text-sm font-sans font-semibold text-foreground">
                    {job.salary}
                  </div>
                  <span className="text-sm text-signature-blue font-sans font-medium flex items-center gap-1 transition-transform group-hover:translate-x-1">
                    View Details
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-border bg-card p-14 text-center">
            <p className="font-sans font-semibold text-foreground">
              No positions match your criteria
            </p>
            <p className="mt-2 text-sm text-muted-foreground font-serif">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4 rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
