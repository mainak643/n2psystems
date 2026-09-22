import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_xxxxxxxxx') {
      console.error('[Resend Error] Missing or placeholder RESEND_API_KEY in environment variables.');
      return NextResponse.json(
        { error: 'Email service is not configured. Please set RESEND_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const destinationEmail = process.env.CONTACT_EMAIL || 'mainak@n2psystems.ca';
    const bccEmail = process.env.CONTACT_BCC_EMAIL;
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'N2P Systems <onboarding@resend.dev>';

    // Parse body (supports JSON or FormData)
    let body: Record<string, any> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    }

    const isConsultation = Boolean(body.serviceInterest || body.companyName);

    let emailSubject = '';
    let emailHtml = '';
    let replyToEmail = body.email ? String(body.email) : undefined;

    if (isConsultation) {
      // Employer Consultation Form
      const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim() || 'Prospective Client';
      emailSubject = `[Consultation Request] ${body.companyName || fullName} - ${body.serviceInterest || 'General Inquiry'}`;

      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #1E63B5; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px;">New Employer Consultation Request</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Submitted via N2P Systems Website</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; width: 140px; border-bottom: 1px solid #f1f5f9;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${body.email}" style="color: #1E63B5; text-decoration: none;">${body.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Company:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.companyName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Job Title:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.jobTitle || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Service Interest:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.serviceInterest || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Budget:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.budget || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Timeline:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.timeline || 'N/A'}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Project Details / Message:</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${body.details || body.message || 'No additional details provided.'}</p>
          </div>
        </div>
      `;
    } else {
      // General Contact Form
      const senderName = body.name || 'Anonymous Inquiry';
      emailSubject = `[Website Contact] ${body.subject || 'New Message from ' + senderName}`;

      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #1E63B5; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px;">New Contact Form Message</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Submitted via N2P Systems Website</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Email:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${body.email}" style="color: #1E63B5; text-decoration: none;">${body.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;"><strong>Subject:</strong></td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${body.subject || 'N/A'}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Message Content:</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${body.message || 'No message content.'}</p>
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
      replyTo: replyToEmail,
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

