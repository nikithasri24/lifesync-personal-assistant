/**
 * Check what times are currently stored in the database
 */

import { createClient } from '@supabase/supabase-js';
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

async function checkTasks() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, due_date, created_at')
    .eq('status', 'todo')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nCurrent tasks in database:\n');
  tasks?.forEach(task => {
    const dueDate = new Date(task.due_date);
    console.log(`Title: "${task.title}"`);
    console.log(`Due Date: ${task.due_date}`);
    console.log(`Formatted: ${dueDate.toLocaleString()}`);
    console.log(`Hour: ${dueDate.getHours()}`);
    console.log('---');
  });
}

checkTasks();
