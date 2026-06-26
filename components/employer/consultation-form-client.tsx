"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

export function ConsultationFormClient() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7AC943]/10 mb-6">
          <CheckCircle2 className="h-8 w-8 text-[#7AC943]" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">
          Quote Request Received
        </h3>
        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
          Thank you for your interest. A member of our team will review your
          requirements and respond within one business day with a tailored proposal.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First Name *
          </label>
          <Input id="firstName" required placeholder="Jane" />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last Name *
          </label>
          <Input id="lastName" required placeholder="Smith" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium text-foreground">
            Company / Organization *
          </label>
          <Input id="companyName" required placeholder="Acme Corporation" />
        </div>
        <div className="space-y-2">
          <label htmlFor="jobTitle" className="text-sm font-medium text-foreground">
            Your Role / Title
          </label>
          <Input id="jobTitle" placeholder="CTO, Founder, IT Director..." />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work Email *
          </label>
          <Input id="email" type="email" required placeholder="jane@acme.com" />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone Number
          </label>
          <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="serviceInterest" className="text-sm font-medium text-foreground">
          Service You're Interested In *
        </label>
        <Select required>
          <SelectTrigger id="serviceInterest">
            <SelectValue placeholder="Select a service area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consulting">Consulting & Strategy Advisory</SelectItem>
            <SelectItem value="digital-transformation">Digital Transformation</SelectItem>
            <SelectItem value="ai-integration">AI Integration & Automation</SelectItem>
            <SelectItem value="program-management">Program Management & Delivery</SelectItem>
            <SelectItem value="hosting">Hosting & Cloud Infrastructure</SelectItem>
            <SelectItem value="learning">Learning & Enablement</SelectItem>
            <SelectItem value="partnerships">Strategic Partnerships</SelectItem>
            <SelectItem value="multiple">Multiple Services / Not Sure Yet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="budget" className="text-sm font-medium text-foreground">
            Estimated Budget
          </label>
          <Select>
            <SelectTrigger id="budget">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-10k">Under $10,000</SelectItem>
              <SelectItem value="10k-25k">$10,000 – $25,000</SelectItem>
              <SelectItem value="25k-50k">$25,000 – $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 – $100,000</SelectItem>
              <SelectItem value="100k-plus">$100,000+</SelectItem>
              <SelectItem value="tbd">To Be Discussed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="timeline" className="text-sm font-medium text-foreground">
            Expected Timeline
          </label>
          <Select>
            <SelectTrigger id="timeline">
              <SelectValue placeholder="Select a timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">As Soon As Possible</SelectItem>
              <SelectItem value="1-month">Within 1 Month</SelectItem>
              <SelectItem value="1-3-months">1 – 3 Months</SelectItem>
              <SelectItem value="3-6-months">3 – 6 Months</SelectItem>
              <SelectItem value="flexible">Flexible / Ongoing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="details" className="text-sm font-medium text-foreground">
          Project Details
        </label>
        <Textarea
          id="details"
          rows={5}
          placeholder="Describe your goals, challenges, or the scope of work you need help with. The more detail you provide, the more accurate our quote will be."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#1E63B5] text-white hover:bg-[#174f94]"
      >
        Submit Quote Request
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your information is kept confidential and will only be used to prepare
        your personalized quote.
      </p>
    </form>
  )
}
