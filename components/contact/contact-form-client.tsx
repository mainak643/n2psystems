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

export function ContactFormClient() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7AC943]/10 mb-6">
          <CheckCircle2 className="h-8 w-8 text-[#7AC943]" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Message Sent</h3>
        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
          Thank you for reaching out. We will get back to you within one
          business day.
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
          <label htmlFor="name" className="text-sm font-semibold text-foreground">
            Full Name *
          </label>
          <Input id="name" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email *
          </label>
          <Input id="email" type="email" required placeholder="jane@company.com" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="inquiryType" className="text-sm font-semibold text-foreground">
          Inquiry Type *
        </label>
        <Select required>
          <SelectTrigger id="inquiryType">
            <SelectValue placeholder="What is this regarding?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="job-seeker">I am looking for a job</SelectItem>
            <SelectItem value="employer">I want to hire talent</SelectItem>
            <SelectItem value="partnership">Partnership inquiry</SelectItem>
            <SelectItem value="media">Media / Press</SelectItem>
            <SelectItem value="general">General question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-semibold text-foreground">
          Subject *
        </label>
        <Input id="subject" required placeholder="How can we help?" />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-foreground">
          Message *
        </label>
        <Textarea
          id="message"
          required
          rows={5}
          placeholder="Tell us more about your inquiry..."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#1E63B5] text-white hover:bg-[#174f94]"
      >
        Send Message
      </Button>
    </form>
  )
}
