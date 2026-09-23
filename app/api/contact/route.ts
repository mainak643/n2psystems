import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { escapeHtml, clampString } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    // 1. IP-Based Sliding Window Rate Limiting (Anti-Spam / Anti-Flood)
    // Limits each IP to 5 submissions per 10 minutes (600 seconds)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`contact:${clientIp}`, 5, 600);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset),
          },
        }
      );
    }

    // 2. Parse Body (Supports JSON or FormData)
    let body: Record<string, any> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => new FormData());
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    }

    // 3. Honeypot Bot Trap: Automated scrapers and spam bots fill hidden fields.
    // If filled, silently return success without dispatching email or exhausting quota.
    if (body.website_hp || body.hp_check || body._hp) {
      console.warn(`[Contact API] Honeypot triggered from ${clientIp}. Silently dropping submission.`);
      return NextResponse.json({ success: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_xxxxxxxxx') {
      console.error('[Resend Error] Missing or placeholder RESEND_API_KEY in environment variables.');
      return NextResponse.json(
        { error: 'Email service is not configured. Please set RESEND_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    // 4. Validate & Sanitize Input
    const email = clampString(body.email, 254).toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const phone = clampString(body.phone, 50);
    const rawMessage = clampString(body.details || body.message, 5000);
    const isConsultation = Boolean(body.serviceInterest || body.companyName);

    const resend = new Resend(apiKey);
    const destinationEmail = process.env.CONTACT_EMAIL || 'mainak@n2psystems.ca';
    const bccEmail = process.env.CONTACT_BCC_EMAIL;
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'N2P Systems <onboarding@resend.dev>';

    let emailSubject = '';
    let emailHtml = '';

    if (isConsultation) {
      // Employer Consultation Form
      const firstName = clampString(body.firstName, 60);
      const lastName = clampString(body.lastName, 60);
      const fullName = `${firstName} ${lastName}`.trim() || 'Prospective Client';
      const companyName = clampString(body.companyName, 120, 'N/A');
      const jobTitle = clampString(body.jobTitle, 100, 'N/A');
      const serviceInterest = clampString(body.serviceInterest, 100);
      const budget = clampString(body.budget, 80);
      const timeline = clampString(body.timeline, 80);

      emailSubject = serviceInterest
        ? `[Consultation Request] ${companyName || fullName} - ${serviceInterest}`
        : `[Consultation Request] ${companyName || fullName}`;

      // All dynamic content is strictly HTML-escaped before inclusion
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #1E63B5; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px;">New Employer Consultation Request</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Submitted via N2P Systems Website</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; width: 140px; border-bottom: 1px solid #f1f5f9;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(fullName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${escapeHtml(email)}" style="color: #1E63B5; text-decoration: none;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(phone || 'Not provided')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Company:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(companyName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Job Title:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(jobTitle)}</td>
            </tr>
            ${serviceInterest ? `<tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Service Interest:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(serviceInterest)}</td>
            </tr>` : ''}
            ${budget ? `<tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Budget:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(budget)}</td>
            </tr>` : ''}
            ${timeline ? `<tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Timeline:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(timeline)}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Project Details / Message:</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(rawMessage || 'No additional details provided.')}</p>
          </div>
        </div>
      `;
    } else {
      // General Contact Form
      const senderName = clampString(body.name, 100, 'Anonymous Inquiry');
      const subject = clampString(body.subject, 150, 'New Contact Form Inquiry');
      emailSubject = `[Website Contact] ${subject}`;

      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #1E63B5; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px;">New Contact Form Message</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Submitted via N2P Systems Website</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(senderName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${escapeHtml(email)}" style="color: #1E63B5; text-decoration: none;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(phone || 'Not provided')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Subject:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(subject)}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Message Content:</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(rawMessage || 'No message content.')}</p>
          </div>
        </div>
      `;
    }

    const emailPayload: {
      from: string;
      to: string[];
      bcc?: string[];
      replyTo?: string;
      subject: string;
      html: string;
    } = {
      from: senderEmail,
      to: [destinationEmail],
      replyTo: email,
      subject: emailSubject,
      html: emailHtml,
    };

    if (bccEmail) {
      emailPayload.bcc = [bccEmail];
    }

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('[Contact API Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while sending email.' },
      { status: 500 }
    );
  }
}
