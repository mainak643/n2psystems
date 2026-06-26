"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  MessageCircle,
  X,
  Send,
  ArrowUpRight,
  Loader2,
  Phone,
  FileText,
  Paperclip,
  File,
  CheckCircle2,
  AlertCircle,
  Linkedin,
} from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────
type Attachment = {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  savedAs?: string
  errorMessage?: string
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachment?: {
    name: string
    size: number
    status: "success" | "error"
  }
}

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"]
const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7 MB

const quickActions = [
  { label: "Our Services", message: "What services does N2P Systems offer?" },
  { label: "Request a Quote", message: "How can I request a quote for a project?" },
  { label: "Career Opportunities", message: "I'm looking for job opportunities. How can I apply?" },
  { label: "Contact Information", message: "How can I get in touch with N2P Systems?" },
]

type ActionLink = {
  label: string
  href: string
  icon: React.ElementType
  external?: boolean
  variant?: "blue" | "green" | "phone"
}

function ActionLinks({ content }: { content: string }) {
  const links: ActionLink[] = []
  const lower = content.toLowerCase()

  if (lower.includes("/request-consultation")) {
    links.push({ label: "Request a Quote", href: "/request-consultation", icon: ArrowUpRight, variant: "blue" })
  }
  if (lower.includes("/submit-resume")) {
    links.push({ label: "Submit Resume", href: "/submit-resume", icon: FileText, variant: "blue" })
  }
  if (lower.includes("/jobs")) {
    links.push({ label: "Browse Openings", href: "/jobs", icon: ArrowUpRight, variant: "blue" })
  }
  if (lower.includes("/about")) {
    links.push({ label: "About N2P", href: "/about", icon: ArrowUpRight, variant: "blue" })
  }
  if (lower.includes("linkedin.com/company")) {
    links.push({ label: "Follow on LinkedIn", href: "https://www.linkedin.com/company/n2p-systems/", icon: Linkedin, external: true, variant: "linkedin" })
  }
  if (lower.includes("whatsapp.com/channel")) {
    links.push({ label: "Join WhatsApp Channel", href: "https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P", icon: MessageCircle, external: true, variant: "green" })
  }
  if (lower.includes("+1 (437)") || lower.includes("+91 97760") || lower.includes("call us")) {
    links.push({ label: "Call Us", href: "tel:+14373359390", icon: Phone, variant: "phone" })
  }

  if (links.length === 0) return null

  const variantStyles: Record<string, string> = {
    blue: "border-[#1E63B5]/15 bg-[#1E63B5]/[0.05] text-[#1E63B5] hover:bg-[#1E63B5]/[0.10]",
    green: "border-[#16A34A]/20 bg-[#16A34A]/[0.06] text-[#16A34A] hover:bg-[#16A34A]/[0.12]",
    linkedin: "border-[#0A66C2]/15 bg-[#0A66C2]/[0.05] text-[#0A66C2] hover:bg-[#0A66C2]/[0.10]",
    phone: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${variantStyles[link.variant ?? "blue"]
            }`}
        >
          <link.icon className="size-3" />
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Attachment chip displayed above the input ───────────────────────────────
function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: () => void
}) {
  return (
    <div
      className="flex items-center gap-2 mx-1 mb-1 rounded-lg border"
      style={{
        padding: "8px 10px",
        background: attachment.status === "error" ? "#FEF2F2" : "#F0F7FF",
        borderColor: attachment.status === "error" ? "#FECACA" : "#BFDBFE",
      }}
    >
      <File
        className="shrink-0"
        style={{
          width: 16,
          height: 16,
          color: attachment.status === "error" ? "#EF4444" : "#1E63B5",
        }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="truncate font-medium"
          style={{ fontSize: 11.5, color: "#1F2937" }}
        >
          {attachment.file.name}
        </p>
        <p style={{ fontSize: 10, color: "#6B7280" }}>
          {formatFileSize(attachment.file.size)}
          {attachment.status === "uploading" && " · Uploading..."}
          {attachment.status === "success" && " · Uploaded"}
          {attachment.status === "error" && ` · ${attachment.errorMessage || "Failed"}`}
        </p>
      </div>
      {attachment.status === "uploading" ? (
        <Loader2
          className="shrink-0 animate-spin"
          style={{ width: 14, height: 14, color: "#1E63B5" }}
        />
      ) : attachment.status === "success" ? (
        <CheckCircle2
          className="shrink-0"
          style={{ width: 14, height: 14, color: "#10B981" }}
        />
      ) : attachment.status === "error" ? (
        <AlertCircle
          className="shrink-0"
          style={{ width: 14, height: 14, color: "#EF4444" }}
        />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          style={{ width: 20, height: 20 }}
          aria-label="Remove attachment"
        >
          <X style={{ width: 12, height: 12, color: "#6B7280" }} />
        </button>
      )}
    </div>
  )
}

// ── Inline attachment bubble inside a message ───────────────────────────────
function MessageAttachment({
  name,
  size,
  isUser,
}: {
  name: string
  size: number
  isUser: boolean
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg mt-1.5"
      style={{
        padding: "7px 10px",
        background: isUser ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.04)",
      }}
    >
      <File
        className="shrink-0"
        style={{
          width: 14,
          height: 14,
          color: isUser ? "rgba(255,255,255,0.7)" : "#1E63B5",
        }}
      />
      <div className="min-w-0 flex-1">
        <p
          className="truncate"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isUser ? "rgba(255,255,255,0.9)" : "#374151",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontSize: 9.5,
            color: isUser ? "rgba(255,255,255,0.5)" : "#9CA3AF",
          }}
        >
          {formatFileSize(size)}
        </p>
      </div>
      <CheckCircle2
        className="shrink-0"
        style={{
          width: 12,
          height: 12,
          color: isUser ? "rgba(255,255,255,0.5)" : "#10B981",
        }}
      />
    </div>
  )
}

// ── Dev auth constants (easter egg) ─────────────────────────────────────────
const DEV_TRIGGER = "mainak this side"
const DEV_PASSWORD = "Mainak@15"
const DEV_TOKEN = "n2p-dev-mainak-2025"
type DevAuthStep = "idle" | "awaiting_password" | "authenticated"

// ── Main Widget ─────────────────────────────────────────────────────────────
export function AIChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isHeroVisible, setIsHeroVisible] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [devAuthStep, setDevAuthStep] = useState<DevAuthStep>("idle")
  const [isMobile, setIsMobile] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Track viewport width for mobile full-screen chat
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
      setTimeout(() => inputRef.current?.focus(), 350)
    } else {
      setVisible(false)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const isMobile = window.innerWidth < 640
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Hide widget when Hero is in viewport on homepage
  useEffect(() => {
    if (pathname !== "/") {
      setIsHeroVisible(false)
      return
    }

    const heroEl = document.getElementById("hero")
    if (!heroEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting)
      },
      {
        threshold: 0.05, // trigger when 5% or more of the hero is visible
      }
    )

    observer.observe(heroEl)

    return () => {
      observer.disconnect()
    }
  }, [pathname])

  const isHidden = pathname === "/" && isHeroVisible

  // ── File selection handler ──────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input so the same file can be re-selected
    e.target.value = ""

    // Validate extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setAttachment({
        file,
        status: "error",
        errorMessage: "Unsupported format. Use PDF, DOC, DOCX, TXT, or RTF.",
      })
      setTimeout(() => setAttachment(null), 4000)
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setAttachment({
        file,
        status: "error",
        errorMessage: "File exceeds the 7 MB limit.",
      })
      setTimeout(() => setAttachment(null), 4000)
      return
    }

    setAttachment({ file, status: "pending" })
  }

  // ── Upload the file ─────────────────────────────────────────────────────
  const uploadFile = async (
    file: File
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      setAttachment((prev) =>
        prev ? { ...prev, status: "uploading" } : null
      )

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userName", "Chat User")

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, errorMessage: data.error || "Upload failed" }
      }

      return { success: true }
    } catch {
      return { success: false, errorMessage: "Network error during upload." }
    }
  }

  // ── Local bot reply helper (no API) ────────────────────────────────────
  const replyLocally = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, role: "assistant", content: text, timestamp: new Date() },
    ])
  }

  // ── Send message (with optional attachment) ─────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      const hasText = content.trim().length > 0
      const hasFile = attachment && attachment.status === "pending"

      if (!hasText && !hasFile) return
      if (isLoading) return

      const trimmed = content.trim()

      // ── DEV EASTER EGG: trigger detection ──────────────────────────────
      if (devAuthStep === "idle" && trimmed.toLowerCase().includes(DEV_TRIGGER)) {
        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() }
        setMessages((prev) => [...prev, userMsg])
        setInput("")
        setDevAuthStep("awaiting_password")
        setTimeout(() => replyLocally("Hey there 👀 I recognize that name. This is a restricted area.\n\nEnter the developer password to unlock full access."), 400)
        return
      }

      if (devAuthStep === "awaiting_password") {
        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() }
        setMessages((prev) => [...prev, userMsg])
        setInput("")
        if (trimmed === DEV_PASSWORD) {
          setDevMode(true)
          setDevAuthStep("authenticated")
          setTimeout(() => replyLocally("🔓 Developer mode unlocked!\n\nWelcome back, Mainak! Rate limits are off and all restrictions lifted. I'm all yours — what do you need?"), 400)
        } else {
          setDevAuthStep("idle")
          setTimeout(() => replyLocally("❌ Wrong password. Access denied."), 400)
        }
        return
      }
      // ── END DEV EASTER EGG ─────────────────────────────────────────────

      // Build the user message content
      let messageContent = trimmed
      let messageAttachment: Message["attachment"] | undefined

      setIsLoading(true)

      // Upload the file first if there is one
      if (hasFile && attachment) {
        const uploadResult = await uploadFile(attachment.file)

        if (uploadResult.success) {
          messageAttachment = {
            name: attachment.file.name,
            size: attachment.file.size,
            status: "success",
          }
          const attachNote = `[User attached a file: ${attachment.file.name} (${formatFileSize(attachment.file.size)})]`
          messageContent = messageContent
            ? `${messageContent}\n\n${attachNote}`
            : attachNote
        } else {
          setAttachment({
            ...attachment,
            status: "error",
            errorMessage: uploadResult.errorMessage,
          })
          setIsLoading(false)
          setTimeout(() => setAttachment(null), 4000)
          return
        }

        setAttachment(null)
      }

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: messageContent,
        timestamp: new Date(),
        attachment: messageAttachment,
      }

      setMessages((prev) => [...prev, userMsg])
      setInput("")

      try {
        const allMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (devMode) headers["X-Dev-Token"] = DEV_TOKEN

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: allMessages }),
        })

        const data = await res.json()

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply || data.error || "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content:
              "We are currently offline. Please contact our team at info@n2psystems.com or call +1 (437) 335-9390 (USA/Canada) or +91 97760 47567 (India).",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, attachment, devMode, devAuthStep],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (!mounted) return null

  return (
    <>
      {/* ── Chat Window ── */}
      <div
        className="fixed z-[60]"
        style={{
          ...(isMobile
            ? { inset: 0, width: '100%' }
            : { bottom: 88, right: 20, width: 'min(380px, calc(100vw - 32px))' }),
          pointerEvents: isOpen && !isHidden ? 'auto' : 'none',
        }}
      >
        <div
          className="flex flex-col overflow-hidden transition-all duration-[300ms] origin-bottom-right"
          style={{
            height: isMobile ? '100%' : 'min(520px, calc(100vh - 140px))',
            borderRadius: isMobile ? 0 : 16,
            background: "#ffffff",
            opacity: visible && !isHidden ? 1 : 0,
            transform: visible && !isHidden
              ? "scale(1) translateY(0)"
              : "scale(0.95) translateY(8px)",
            boxShadow: visible && !isHidden
              ? "0 12px 40px -10px rgba(11,31,51,0.15), 0 4px 16px -6px rgba(11,31,51,0.08), 0 0 0 1px rgba(11,31,51,0.05)"
              : "none",
          }}
        >
          {/* ── Header ── */}
          <div
            className="relative shrink-0 flex items-center justify-between"
            style={{
              padding: "16px 20px",
              background: "#0B1F33",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex size-8 items-center justify-center overflow-hidden rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <Image
                  src="/images/n2p-logo-light.png"
                  alt="N2P"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <p
                  className="font-semibold leading-none text-white"
                  style={{ fontSize: 13.5, letterSpacing: "-0.010em" }}
                >
                  N2P Assistant
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: "#10B981" }}
                  />
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>
                    Replies instantly
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex size-7 items-center justify-center rounded-md transition-colors text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: "20px",
              background: "#ffffff",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(11,31,51,0.06) transparent",
            }}
          >
            {messages.length === 0 ? (
              /* ── Welcome State ── */
              <div className="flex flex-col pt-2">
                <h3
                  className="font-sans font-bold text-foreground tracking-tight"
                  style={{ fontSize: 18, color: "#0B1F33" }}
                >
                  How can we help?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground font-serif">
                  Ask us anything about N2P Systems' technology services, opportunities, or partners.
                </p>

                <div className="mt-6 space-y-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.message)}
                      className="w-full flex items-center justify-between rounded-xl text-left transition-all border border-border bg-card hover:bg-frost hover:border-signature-blue/20"
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      <span>{action.label}</span>
                      <ArrowUpRight style={{ width: 13, height: 13, color: "var(--signature-blue)" }} className="opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Conversation ── */
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.role === "user"
                  // Strip the [User attached a file: ...] note from displayed content
                  const displayContent = msg.content.replace(/\n?\n?\[User attached a file: .*?\]/, "").trim()
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex flex-col max-w-[85%]">
                        <div
                          className="px-3.5 py-2.5"
                          style={
                            isUser
                              ? {
                                background: "#1E63B5",
                                color: "#ffffff",
                                borderRadius: "16px 16px 4px 16px",
                                fontSize: 13,
                                lineHeight: 1.6,
                              }
                              : {
                                background: "#F3F4F6",
                                color: "#1F2937",
                                borderRadius: "16px 16px 16px 4px",
                                fontSize: 13,
                                lineHeight: 1.6,
                              }
                          }
                        >
                          {displayContent && (
                            <p className="whitespace-pre-wrap">{displayContent}</p>
                          )}
                          {msg.attachment && (
                            <MessageAttachment
                              name={msg.attachment.name}
                              size={msg.attachment.size}
                              isUser={isUser}
                            />
                          )}
                          {!isUser && <ActionLinks content={msg.content} />}
                        </div>
                        <span
                          className={`mt-1 text-[9.5px] text-muted-foreground/80 px-1 ${isUser ? "text-right" : "text-left"}`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="flex items-center gap-1 bg-[#F3F4F6]"
                      style={{
                        borderRadius: "16px 16px 16px 4px",
                        padding: "12px 18px",
                      }}
                    >
                      <span
                        className="inline-block size-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="inline-block size-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="inline-block size-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input Area ── */}
          <div
            className="shrink-0"
            style={{
              padding: "10px 16px 14px",
              background: "#ffffff",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            {/* Attachment preview chip */}
            {attachment && (
              <AttachmentPreview
                attachment={attachment}
                onRemove={() => setAttachment(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Attach a file"
              />

              {/* Paperclip button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !!attachment}
                className="flex items-center justify-center shrink-0 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30"
                style={{ width: 36, height: 36 }}
                aria-label="Attach a document"
                title="Attach a resume or document (PDF, DOC, DOCX — max 7 MB)"
              >
                <Paperclip
                  style={{ width: 16, height: 16, color: "#6B7280" }}
                />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachment ? "Add a message (optional)..." : "Type your message..."}
                disabled={isLoading}
                className="flex-1 outline-none disabled:opacity-50"
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#0B1F33",
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1E63B5"
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,99,181,0.06)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !attachment) || isLoading}
                className="flex items-center justify-center transition-all disabled:opacity-25"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: (input.trim() || attachment) && !isLoading ? "#1E63B5" : "#F3F4F6",
                  color: (input.trim() || attachment) && !isLoading ? "#ffffff" : "#9CA3AF",
                }}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                ) : (
                  <Send style={{ width: 15, height: 15 }} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Chat with N2P Systems"}
        className="fixed z-[60] flex items-center justify-center rounded-full outline-none transition-all duration-300 hover:opacity-90 active:scale-[0.96]"
        style={{
          bottom: 28,
          right: 24,
          width: 52,
          height: 52,
          background: isOpen ? "#374151" : "#1E63B5",
          boxShadow: "0 2px 12px rgba(30,99,181,0.25)",
          opacity: isHidden ? 0 : 1,
          transform: isHidden ? "scale(0.8) translateY(12px)" : "scale(1) translateY(0)",
          pointerEvents: isHidden ? "none" : "auto",
        }}
      >
        <div
          className="transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          {isOpen ? (
            <X style={{ width: 20, height: 20, color: "#ffffff", strokeWidth: 2 }} />
          ) : (
            <MessageCircle style={{ width: 22, height: 22, color: "rgba(255,255,255,0.88)", strokeWidth: 1.6 }} />
          )}
        </div>
      </button>
    </>
  )
}
