/**
 * Manually fix the two specific tasks
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function fixTasks() {
  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .or('title.ilike.%hair wash%,title.ilike.%eyebrows%');

  if (!tasks) {
    console.log('Tasks not found');
    return;
  }

  console.log('Found tasks:', tasks.map(t => ({ id: t.id, title: t.title, due: t.due_date })));

  for (const task of tasks) {
    let targetTime: string;
    
    if (task.title.toLowerCase().includes('hair')) {
      // Hair wash at 6 PM local time
      targetTime = '18:00';
      console.log('\n📝 Updating hair wash to 6 PM local...');
    } else if (task.title.toLowerCase().includes('eyebrow')) {
      // Eyebrows at 5:30 PM local time
      targetTime = '17:30';
      console.log('\n📝 Updating eyebrows to 5:30 PM local...');
    } else {
      continue;
    }

    // Get current date
    const currentDue = new Date(task.due_date);
    const year = currentDue.getFullYear();
    const month = String(currentDue.getMonth() + 1).padStart(2, '0');
    const day = String(currentDue.getDate()).padStart(2, '0');
    
    // Create local date at target time
    const [hours, minutes] = targetTime.split(':').map(Number);
    const localDate = new Date(year, currentDue.getMonth(), currentDue.getDate(), hours, minutes, 0, 0);
    
    console.log(`   Current: ${currentDue.toLocaleString()}`);
    console.log(`   New: ${localDate.toLocaleString()}`);
    console.log(`   ISO: ${localDate.toISOString()}`);
    
    // Update
    const { error } = await supabase
      .from('tasks')
      .update({ 
        due_date: localDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Updated!`);
    }
  }
}

fixTasks();
