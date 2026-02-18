/**
 * Script to fix task times by parsing titles (with proper timezone handling)
 */

import { createClient } from '@supabase/supabase-js';
import { parseQuickAdd } from '../todos/services/taskHelpers';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTaskTimes() {
  console.log('🔍 Fetching tasks...\n');

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching tasks:', error);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log('No tasks found.');
    return;
  }

  console.log(`Found ${tasks.length} tasks. Checking for times in titles...\n`);

  let updatedCount = 0;

  for (const task of tasks) {
    const parsed = parseQuickAdd(task.title, []);

    if (parsed.dueTime) {
      const currentDueDate = new Date(task.due_date);
      const dateStr = currentDueDate.toISOString().split('T')[0];
      
      // Create a local date/time string without timezone conversion
      // This ensures 18:00 means 6 PM in the user's local timezone
      const localDateTime = `${dateStr}T${parsed.dueTime}:00`;
      
      // Convert to ISO string in local timezone (not UTC)
      const [hours, minutes] = parsed.dueTime.split(':').map(Number);
      const localDate = new Date(currentDueDate);
      localDate.setHours(hours, minutes, 0, 0);
      
      const newDueDate = localDate.toISOString();

      console.log(`📝 Task: "${task.title}"`);
      console.log(`   Old: ${new Date(task.due_date).toLocaleString()}`);
      console.log(`   New: ${localDate.toLocaleString()}`);
      console.log(`   Stored as: ${newDueDate}`);
      console.log(`   Clean title: "${parsed.title}"\n`);

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: parsed.title,
          due_date: newDueDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}\n`);
      } else {
        console.log(`   ✅ Updated!\n`);
        updatedCount++;
      }
    }
  }

  console.log(`\n✨ Done! Updated ${updatedCount} tasks.`);
}

fixTaskTimes().catch(console.error);
