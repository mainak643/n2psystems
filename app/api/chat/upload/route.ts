import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ── Allowed file types ──────────────────────────────────────────────────────
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "application/rtf": ".rtf",
}

const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7 MB

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userName = (formData.get("userName") as string) || "Anonymous"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      )
    }

    // Validate file type
    const expectedExtension = ALLOWED_TYPES[file.type]
    if (!expectedExtension) {
      return NextResponse.json(
        {
          error: `Unsupported file type. We accept: PDF, DOC, DOCX, TXT, RTF.`,
        },
        { status: 400 }
      )
    }

    // SECURITY PATCH: Verify extension matches MIME type to prevent extension spoofing
    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith(expectedExtension)) {
      return NextResponse.json(
        { error: "Security risk: File extension does not match its detected content type. Upload rejected." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 7 MB." },
        { status: 400 }
      )
    }

    // Initialize Supabase admin client using the SECRET key to bypass RLS policies
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing.")
      return NextResponse.json({ error: "Storage configuration missing." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate a unique filename: timestamp_sanitizedOriginalName
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `${timestamp}_${sanitizedName}`

    // Upload file to Supabase Storage bucket named "resumes"
    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Supabase storage error:", error)
      return NextResponse.json(
        { error: "Failed to upload to remote storage. Please ensure the 'resumes' bucket exists in Supabase." },
        { status: 500 }
      )
    }

    // Log the upload for easy monitoring (visible in server console)
    console.log(
      `\n📎 [RESUME UPLOAD TO SUPABASE]\n` +
      `   Name: ${userName}\n` +
      `   File: ${file.name}\n` +
      `   Size: ${(file.size / 1024).toFixed(1)} KB\n` +
      `   Type: ${file.type}\n` +
      `   Bucket: resumes\n` +
      `   Path: ${data.path}\n` +
      `   Time: ${new Date().toLocaleString()}\n`
    )

    return NextResponse.json({
      success: true,
      filename: file.name,
      savedAs: data.path,
      size: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed. Please try again or email your resume to info@n2psystems.com." },
      { status: 500 }
    )
  }
}
