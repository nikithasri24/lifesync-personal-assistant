// Supabase Edge Function: Send Push Notification
// Sends Web Push notifications using VAPID
// Deploy with: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push library for Deno
// Note: You may need to use a different approach for Deno
// This is a simplified implementation

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

interface SendRequest {
  user_id: string;
  payload: NotificationPayload;
}

// VAPID keys from environment
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@lifesync.app';

// Create admin client
function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
}

// Base64 URL encode
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Simple JWT creation for VAPID
async function createVapidJwt(audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  
  // Note: Full VAPID signing requires ES256 crypto
  // This is a placeholder - in production, use a proper Web Push library
  // For Deno, consider using: https://deno.land/x/web_push
  
  return `${headerB64}.${payloadB64}.signature_placeholder`;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify service role key
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!authHeader?.includes(serviceKey || '')) {
    // Also check for cron secret
    const cronSecret = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('X-Cron-Secret');
    
    if (providedSecret !== cronSecret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const { user_id, payload }: SendRequest = await req.json();
    const supabase = createAdminClient();

    // Get user's active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ 
        success: true, 
        sent: 0, 
        message: 'No active subscriptions' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Parse endpoint URL for audience
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
        
        // Create VAPID authorization
        const vapidToken = await createVapidJwt(audience);
        
        // Send push notification
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400', // 24 hours
            'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok || response.status === 201) {
          sent++;
          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } else if (response.status === 410) {
          // Subscription expired, deactivate it
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
          failed++;
          errors.push(`Subscription ${sub.id} expired`);
        } else {
          failed++;
          errors.push(`Failed to send to ${sub.id}: ${response.status}`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error sending to ${sub.id}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent, 
      failed,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

