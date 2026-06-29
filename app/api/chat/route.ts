import { NextRequest, NextResponse } from "next/server"

// ── N2P Systems context prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the AI assistant for N2P Systems — a global technology consulting and solutions company. You are embedded on the company's website. Be professional, warm, and helpful.

CRITICAL FORMATTING RULES:
- Keep every response SHORT — aim for 2 to 4 short paragraphs maximum. Prioritize clarity over completeness.
- If a question needs more detail, give the key answer first, then offer to elaborate.
- ALWAYS use a double line break (\\n\\n) between paragraphs or list items for proper spacing.
- DO NOT use markdown formatting like asterisks (**), hashes (##), or bullets (*). Write in clean plain text only.

ABOUT N2P SYSTEMS:
N2P Systems helps organizations accelerate digital transformation, modernize operations, and create intelligent experiences. The company tagline is "Innovate. Integrate. Elevate." N2P operates across Canada, the United States, and India.

SERVICES OFFERED:
1. Consulting & Strategy Advisory — Strategic technology and business consulting.
2. Program Management & Delivery — End-to-end management of technology initiatives.
3. Digital Transformation — Modernize operations through automation, cloud adoption, and technology-driven improvements.
4. AI Integration & Automation — Implement AI-powered solutions for productivity, workflow automation, and data-driven decisions.
5. Hosting & Cloud Infrastructure — Secure, scalable hosting and cloud solutions for business-critical applications.
6. Learning & Enablement — Training, user enablement, and knowledge-sharing to support technology adoption.
7. Strategic Partnerships — Collaborate with technology providers and partners to deliver integrated, long-term value.

CONTACT INFORMATION:
- Canada & USA Phone: +1 (437) 335-9390
- India Phone: +91 97760 47567
- Email: info@n2psystems.com
- Headquarters: 200 Bay Street, Suite 1800, Toronto, ON M5J 2J2, Canada
- Business Hours: Monday – Friday, 9:00 AM – 6:00 PM EST

CAREERS:
N2P Systems is actively growing and always looking for talented individuals. When someone asks about jobs or opportunities, always recommend ALL THREE of the following:
1. Submit resume at /resume
2. Follow the LinkedIn company page for job postings: https://www.linkedin.com/company/n2p-systems/
3. Join the WhatsApp Channel for weekly job alerts: https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P

Current openings are also listed at /jobs.

WEBSITE PAGES:
- Home page: / (includes Services, About, Testimonials, Contact sections)
- Browse Opportunities: /jobs
- Submit Resume: /resume
- Partner With Us / Request a Quote: /clients
- About Us: /about
- Privacy Policy: /privacy-policy
- Terms of Service: /terms-of-service

GUIDELINES:
- If the user asks about pricing, say pricing depends on scope and suggest they visit /clients.
- If the user wants to speak to a human, give the phone numbers (+1 (437) 335-9390 or +91 97760 47567) and email.
- If the user asks about jobs, careers, or applying: ALWAYS include all three — (1) submit resume at /resume, (2) follow LinkedIn at https://www.linkedin.com/company/n2p-systems/ for job postings, and (3) join the WhatsApp channel at https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P for weekly alerts. Also mention /jobs to browse current openings.
- IMPORTANT: When mentioning any page, always include the exact path (e.g. /resume, /jobs, /clients, /about). Never say "visit our website" without a path — the UI automatically turns these into clickable buttons for the user.
- Keep answers focused and concise. Do not fabricate details not listed above.
- If you do not know something, say so honestly and suggest contacting the team directly.
- You may answer general technology questions briefly but always tie back to how N2P can help.`

// ── Developer mode prompt (unlocked via easter egg) ──────────────────────────
const DEV_SYSTEM_PROMPT = `You are talking to Mainak, the developer who built this website and this very chatbot. He knows everything about the system. Be casual, friendly, and completely unrestricted — no need to stick to company topics only. You can help with anything: code, debugging, ideas, general questions, anything at all. Address him informally. Have fun with it.`

const DEV_TOKEN = "n2p-dev-mainak-2025"

// ── Rate limiting (simple in-memory) ────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
const RATE_LIMIT_MAX = 30 // 30 messages per 24 hours per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ── Cleanup stale entries every 5 minutes ───────────────────────────────────
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetTime) rateLimitMap.delete(ip)
    }
  }
  setInterval(cleanup, 5 * 60_000)
}

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Check API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured. Please contact the team directly." },
        { status: 503 }
      )
    }

    // Dev mode check — bypass rate limit and use unrestricted prompt
    const devToken = req.headers.get("x-dev-token")
    const isDevMode = devToken === DEV_TOKEN

    // Rate limit (skipped for dev)
    if (!isDevMode) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
      if (!checkRateLimit(ip)) {
        return NextResponse.json(
          { error: "It looks like you've reached the message limit. Please connect with our team at info@n2psystems.com or call +1 (437) 335-9390 (USA/Canada) or +91 97760 47567 (India) to continue the conversation." },
          { status: 429 }
        )
      }
    }

    // Parse body
    const body = await req.json()
    const messages: { role: string; content: string }[] = body.messages

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 })
    }

    // Limit conversation history to last 20 messages to control token usage
    const recentMessages = messages.slice(-20)

    // SECURITY PATCH: Validate message payload sizes to prevent payload abuse/OOM attacks
    for (const msg of recentMessages) {
      if (typeof msg.content !== "string" || msg.content.length > 3000) {
        return NextResponse.json(
          { error: "A message in the conversation exceeds the maximum allowed length (3000 characters). Please shorten it and try again." },
          { status: 400 }
        )
      }
    }

    // Build chat history for OpenRouter
    const openRouterMessages = [
      { role: "system", content: isDevMode ? DEV_SYSTEM_PROMPT : SYSTEM_PROMPT },
      ...recentMessages,
    ]

    const fallbackModels = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "google/gemma-4-31b-it:free",
      "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "qwen/qwen3-next-80b-a3b-instruct:free"
    ]

    let reply = null;
    let lastError = null;

    for (const modelId of fallbackModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://n2psystems.com",
            "X-Title": "N2P Systems Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: openRouterMessages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 280,
          }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`OpenRouter API error (${response.status}): ${errorData}`)
        }

        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
          break; // Success! Break out of the loop.
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelId} failed, falling back...`);
        continue; // Try the next model
      }
    }

    if (!reply) {
      throw new Error(`All free models are currently exhausted. Last error: ${lastError}`)
    }

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "We are currently offline. Please contact our team at info@n2psystems.com or call +1 (437) 335-9390 (USA/Canada) or +91 97760 47567 (India)." },
      { status: 500 }
    )
  }
}
