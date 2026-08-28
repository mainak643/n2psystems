"use client"

import { useRef, useState } from "react"
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
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

export function ContactFormClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [inquiryType, setInquiryType] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  if (status === "success") {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    const data = new FormData(formRef.current)
    data.set("inquiryType", inquiryType)

    setStatus("loading")

    try {
      const res = await fetch("https://formspree.io/f/xqazpory", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })

      if (res.ok) {
        setStatus("success")
        formRef.current.reset()
        setInquiryType("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {status === "error" && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Something went wrong. Please email us directly at{" "}
            <a href="mailto:info@n2psystems.ca" className="font-semibold underline">
              info@n2psystems.ca
            </a>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-foreground">
            Full Name *
          </label>
          <Input id="name" name="name" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email *
          </label>
          <Input id="email" name="email" type="email" required placeholder="jane@company.com" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="inquiryType" className="text-sm font-semibold text-foreground">
          Inquiry Type *
        </label>
        <Select required value={inquiryType} onValueChange={setInquiryType}>
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
        <Input id="subject" name="subject" required placeholder="How can we help?" />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-foreground">
          Message *
        </label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us more about your inquiry..."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status === "loading" || !inquiryType}
        className="w-full bg-[#1E63B5] text-white hover:bg-[#174f94] disabled:opacity-70"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  )
}
