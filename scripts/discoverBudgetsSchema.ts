import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rfwaiijodrowakcpayoa.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverSchema() {
  logger.info('DiscoverBudgetsSchema', '\n=== Discovering Budgets Table Schema ===\n');

  // Method 1: Get sample data to see actual columns
  logger.info('DiscoverBudgetsSchema', 'Method 1: Query sample data...');
  const { data: sampleData, error: sampleError } = await supabase
    .from('budgets')
    .select('*')
    .limit(1);

  if (sampleError) {
    logger.error('DiscoverBudgetsSchema', 'Sample data error:', sampleError);
  } else if (sampleData && sampleData.length > 0) {
    logger.info('DiscoverBudgetsSchema', '\n✅ Found existing budget! Columns present:');
    const columns = Object.keys(sampleData[0]);
    columns.forEach((col) => {
      const value = sampleData[0][col];
      const type = value === null ? 'null' : typeof value;
      logger.info('DiscoverBudgetsSchema', `  - ${col}: ${type} = ${JSON.stringify(value)}`);
    });
    logger.info('DiscoverBudgetsSchema', '\nSample data:', JSON.stringify(sampleData[0], null, 2));
  } else {
    logger.info('DiscoverBudgetsSchema', 'No existing budgets found.');
  }

  // Method 2: Try inserting with minimal data to see what's required
  logger.info('DiscoverBudgetsSchema', '\n\nMethod 2: Attempt minimal insert to discover required columns...');
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    logger.error('DiscoverBudgetsSchema', 'User auth error:', userError);
    return;
  }

  const testInsert = {
    user_id: userData.user.id,
    category_id: '00000000-0000-0000-0000-000000000000', // fake UUID
    month: '2025-11',
    amount: 100,
  };

  logger.info('DiscoverBudgetsSchema', '\nAttempting insert with:', JSON.stringify(testInsert, null, 2));
  const { data: insertData, error: insertError } = await supabase
    .from('budgets')
    .insert(testInsert)
    .select();

  if (insertError) {
    logger.error('DiscoverBudgetsSchema', '\n❌ Insert failed (expected):', insertError.message);
    logger.error('DiscoverBudgetsSchema', 'Error code:', insertError.code);
    logger.error('DiscoverBudgetsSchema', 'Error details:', insertError.details);
    logger.error('DiscoverBudgetsSchema', 'Error hint:', insertError.hint);

    // Parse error to find missing column
    if (insertError.message.includes('null value in column')) {
      const match = insertError.message.match(/column "([^"]+)"/);
      if (match) {
        logger.info('DiscoverBudgetsSchema', `\n💡 Missing required column: "${match[1]}"`);
      }
    }
  } else {
    logger.info('DiscoverBudgetsSchema', '\n✅ Insert succeeded! Data:', insertData);
    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase.from('budgets').delete().eq('id', insertData[0].id);
      logger.info('DiscoverBudgetsSchema', 'Cleaned up test data');
    }
  }

  logger.info('DiscoverBudgetsSchema', '\n=== Schema Discovery Complete ===\n');
}

discoverSchema().catch((error) => logger.error('DiscoverBudgetsSchema', error));
