import { Router } from 'express'

export const systemRouter = Router()

systemRouter.get('/capabilities', (_req, res) => {
  // Keep this in sync with implemented routers
  const capabilities = {
    auth: {
      supabaseJwt: true,
    },
    modules: {
      tasks: true,
      projects: true,
      habits: {
        list: true,
        create: true,
        update: true,
        delete: true,
        entries: { upsert: true },
      },
      finance: { accounts: true, transactions: { list: true, create: true } },
      shopping: false,
      pantry: false,
      mealPlans: false,
      focus: false,
      recipes: false,
      analytics: false,
    },
    utilities: {
      youtubeSnippet: true,
      youtubeTranscript: true,
      barcodeLookup: true,
      ocrReceipt: Boolean(process.env.OCR_SPACE_API_KEY),
    },
    version: {
      api: '1.0.0',
    },
  }
  res.json(capabilities)
})

