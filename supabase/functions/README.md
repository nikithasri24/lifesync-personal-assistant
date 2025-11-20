# Supabase Edge Functions

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to your Supabase project

```bash
supabase link --project-ref rfwaiijodrowakcpayoa
```

### 3. Set up Resend API Key (Free Tier)

1. Sign up for a free account at [resend.com](https://resend.com)
   - Free tier: 3,000 emails/month, 100 emails/day
   - No credit card required

2. Create an API key in the Resend dashboard

3. Set the secret in Supabase:

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### 4. Deploy the Edge Function

```bash
supabase functions deploy send-invitation-email
```

### 5. Verify deployment

```bash
supabase functions list
```

## Testing Locally

### Run function locally:

```bash
supabase functions serve send-invitation-email --env-file ./supabase/.env.local
```

### Test with curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-invitation-email' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "fromEmail": "sender@example.com",
    "fromName": "Test User",
    "relationship": "friend",
    "message": "Let's connect!",
    "invitationUrl": "http://localhost:5173/#/shared"
  }'
```

## Email Service Alternatives

If you prefer not to use Resend, you can modify the Edge Function to use:

1. **SendGrid** (Free: 100 emails/day)
2. **Mailgun** (Free: 1,000 emails/month for 3 months)
3. **AWS SES** (62,000 emails/month free if hosted on AWS)
4. **Postmark** (Free: 100 emails/month)

Just update the `send-invitation-email/index.ts` file to use your preferred service's API.

## Environment Variables

The Edge Function needs these environment variables:

- `RESEND_API_KEY` - Your Resend API key
- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_ANON_KEY` - Automatically provided by Supabase

## Customization

### Change the "From" email address:

In `send-invitation-email/index.ts`, update:

```typescript
from: 'LifeSync <noreply@your-domain.com>'
```

Note: You'll need to verify your domain with Resend first.

### Customize the email template:

Modify the HTML in the `html` field of the email payload.

## Monitoring

View function logs:

```bash
supabase functions logs send-invitation-email
```

Or view in the Supabase Dashboard:
https://app.supabase.com/project/rfwaiijodrowakcpayoa/functions

## Cost

- **Supabase Edge Functions**: 500K invocations/month free, then $2 per 1M
- **Resend**: 3,000 emails/month free, then $10 for 10K emails

For a personal app or small user base, this will likely stay within free tiers!
