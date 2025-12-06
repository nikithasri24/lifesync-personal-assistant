const logger = {
  debug: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  info: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(`[${domain}] ${msg}`, ctx || ''),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

// Run this in your browser console while logged in to add Travel category
// Copy and paste this entire code block into the browser console and press Enter

(async function addTravelCategory() {
  try {
    // Get the Supabase client from the window (it should be available from your app)
    const response = await fetch('https://rfwaiijodrowakcpayoa.supabase.co/rest/v1/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs',
        'Authorization': 'Bearer ' + localStorage.getItem('sb-rfwaiijodrowakcpayoa-auth-token').match(/"access_token":"([^"]+)"/)[1],
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Travel',
        icon: '✈️',
        color: '#06b6d4'
      })
    });

    if (response.ok) {
      const data = await response.json();
      logger.info('AddTravelCategory', '✅ Successfully added Travel category:', data);
      // Refresh the page to see the new category
      window.location.reload();
    } else {
      const error = await response.text();
      logger.error('AddTravelCategory', '❌ Failed to add category:', error);
    }
  } catch (err) {
    logger.error('AddTravelCategory', '❌ Error:', err);
  }
})();
