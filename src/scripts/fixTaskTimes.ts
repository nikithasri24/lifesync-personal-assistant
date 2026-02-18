/**
 * Script to fix task times by parsing titles
 * Finds tasks with times in titles (@ 6, at 5:30, etc.) and reschedules them
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTaskTimes() {
  console.log('🔍 Fetching tasks...\n');

  // Get all tasks
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
    // Parse the title to extract time
    const parsed = parseQuickAdd(task.title, []);

    if (parsed.dueTime) {
      // Found a time in the title!
      const currentDueDate = new Date(task.due_date);
      const dateStr = currentDueDate.toISOString().split('T')[0];
      const newDueDate = `${dateStr}T${parsed.dueTime}:00`;

      console.log(`📝 Task: "${task.title}"`);
      console.log(`   Old time: ${currentDueDate.toLocaleTimeString()}`);
      console.log(`   New time: ${parsed.dueTime}`);
      console.log(`   Clean title: "${parsed.title}"\n`);

      // Update the task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: parsed.title, // Clean title without time
          due_date: newDueDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (updateError) {
        console.error(`   ❌ Error updating task: ${updateError.message}\n`);
      } else {
        console.log(`   ✅ Updated successfully!\n`);
        updatedCount++;
      }
    }
  }

  console.log(`\n✨ Done! Updated ${updatedCount} tasks.`);
}

// Run the script
fixTaskTimes().catch(console.error);
