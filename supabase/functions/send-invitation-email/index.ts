// Supabase Edge Function to send connection invitation emails
// Deploy with: supabase functions deploy send-invitation-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') // Free tier: 3,000 emails/month

interface InvitationEmailRequest {
  to: string
  fromEmail: string
  fromName?: string
  relationship: string
  message?: string
  invitationUrl: string
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { to, fromEmail, fromName, relationship, message, invitationUrl }: InvitationEmailRequest =
      await req.json()

    // Send email using Resend (free tier available)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LifeSync <noreply@lifesync.app>', // Replace with your domain
        to: [to],
        subject: `${fromName || fromEmail} wants to connect with you on LifeSync`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Connection Invitation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">LifeSync</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Connection Invitation</p>
              </div>

              <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 18px; margin-top: 0;">Hi there! 👋</p>

                <p style="font-size: 16px; line-height: 1.8;">
                  <strong>${fromName || fromEmail}</strong> has invited you to connect on LifeSync as their <strong>${relationship}</strong>.
                </p>

                ${
                  message
                    ? `
                <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-style: italic; color: #475569;">"${message}"</p>
                </div>
                `
                    : ''
                }

                <p style="font-size: 16px; line-height: 1.8;">
                  By connecting, you'll be able to share data across different modules with granular permission controls. You decide what to share!
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                    View Invitation
                  </a>
                </div>

                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-top: 25px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>🔒 Privacy First:</strong> You have complete control over what data you share. Configure permissions for each module independently.
                  </p>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

                <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                  If you don't have a LifeSync account, you'll need to sign up first. This invitation will be waiting for you!
                </p>
              </div>

              <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
                <p style="margin: 5px 0;">LifeSync - Your Personal Life Management Platform</p>
                <p style="margin: 5px 0;">
                  <a href="https://lifesync.app" style="color: #667eea; text-decoration: none;">Visit Website</a> •
                  <a href="https://lifesync.app/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Failed to send email:', error)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const emailData = await emailResponse.json()

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
