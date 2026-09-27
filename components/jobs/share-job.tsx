"use client"

import { useEffect, useState } from "react"
import { Check, Link2, Linkedin, Mail, MessageCircle, Share2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Share a posting to the channels candidates actually pass roles around on.
 * Each link carries utm_source so shares show up as their own channel in
 * analytics; the posting's canonical URL keeps search engines on the clean one.
 */
export function ShareJob({
  url,
  title,
  location,
  className,
}: {
  url: string
  title: string
  location?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  const tagged = (source: string) => `${url}?utm_source=${source}&utm_medium=share&utm_campaign=job`
  const text = `${title}${location ? ` — ${location}` : ""} · Hiring now at N2P Systems`

  const channels = [
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tagged("linkedin"))}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${tagged("whatsapp")}`)}`,
    },
    {
      name: "X",
      icon: XLogo,
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(tagged("x"))}`,
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(`Job opening: ${title}`)}&body=${encodeURIComponent(`${text}\n\n${tagged("email")}`)}`,
    },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tagged("copy"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Nothing to
      // recover — the address bar still has the URL.
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url: tagged("native") })
    } catch {
      // Dismissing the share sheet rejects; that is not an error to surface.
    }
  }

  const button =
    "tap-target inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={cn(button, "w-auto gap-1.5 px-3 text-xs font-semibold")}>
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </button>
      )}
      {channels.map((c) => (
        <a
          key={c.name}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${c.name}`}
          title={`Share on ${c.name}`}
          className={button}
        >
          <c.icon className="size-4" aria-hidden="true" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title="Copy link"
        className={cn(button, copied && "border-tech-green/40 text-tech-green")}
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  )
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
