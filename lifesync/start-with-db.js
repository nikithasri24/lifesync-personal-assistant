// Simple wrapper to run the API server with database connectivity using Docker exec
import { spawn, exec } from 'child_process';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 LifeSync API server with Docker PostgreSQL starting...');

// Utility function to execute PostgreSQL queries via Docker
async function queryDatabase(query, params = []) {
  return new Promise((resolve, reject) => {
    // Escape single quotes in the query for shell
    const escapedQuery = query.replace(/'/g, "''");
    let parameterizedQuery = escapedQuery;
    
    // Simple parameter substitution (basic implementation)
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let escapedParam;
        if (typeof param === 'string') {
          escapedParam = `'${param.replace(/'/g, "''")}'`;
        } else if (Array.isArray(param)) {
          escapedParam = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
        } else if (param === null || param === undefined) {
          escapedParam = 'NULL';
        } else {
          escapedParam = param;
        }
        parameterizedQuery = parameterizedQuery.replace(placeholder, escapedParam);
      });
    }

    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -t -c "${parameterizedQuery}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Database query error:', error);
        reject(error);
        return;
      }
      if (stderr) {
        console.error('Database stderr:', stderr);
        reject(new Error(stderr));
        return;
      }
      
      // Parse the result
      try {
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          resolve({ rows: [] });
          return;
        }
        
        // For simple queries, just return the raw result
        resolve({ rows: lines.map(line => ({ result: line.trim() })) });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Test database connection
async function testConnection() {
  try {
    const result = await queryDatabase('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database via Docker');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    return false;
  }
}

// Initialize connection
testConnection();

// Generic error handler
const handleError = (res, error, operation) => {
  console.error(`Error ${operation}:`, error);
  res.status(500).json({ error: `Failed to ${operation}` });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple implementation for getting tasks
app.get('/api/tasks', async (req, res) => {
  try {
    // Use JSON output format for better parsing
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM tasks WHERE deleted = false ORDER BY created_at DESC) t"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch tasks');
        return;
      }
      
      try {
        // Parse the JSON result
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const tasks = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`📋 Returning ${tasks.length} tasks`);
        res.json(tasks || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch tasks');
  }
});

// Simple implementation for getting habits
app.get('/api/habits', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(h)) FROM (SELECT * FROM habits WHERE is_active = true ORDER BY created_at DESC) h"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch habits');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const habits = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`🎯 Returning ${habits.length} habits`);
        res.json(habits || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch habits');
  }
});

// Add habit entry
app.post('/api/habits/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, value, notes, mood } = req.body;
    
    const entryDate = date || new Date().toISOString().split('T')[0];
    const entryValue = value || 1;
    
    // Insert habit entry
    const insertCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
      INSERT INTO habit_entries (habit_id, date, value, notes, mood)
      VALUES ('${id}', '${entryDate}', ${entryValue}, ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, ${mood ? `'${mood.replace(/'/g, "''")}'` : 'NULL'})
      ON CONFLICT (habit_id, date) 
      DO UPDATE SET value = EXCLUDED.value, notes = EXCLUDED.notes, mood = EXCLUDED.mood"`;
    
    exec(insertCmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'create habit entry');
        return;
      }
      
      // Update habit progress
      const updateCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
        UPDATE habits SET 
          current_progress = current_progress + ${entryValue},
          updated_at = NOW()
        WHERE id = '${id}' AND (goal_mode = 'total-goal' OR goal_mode = 'course-completion')"`;
      
      exec(updateCmd, (updateError) => {
        if (updateError) {
          console.error('Error updating habit progress:', updateError);
        } else {
          console.log(`📈 Updated habit progress for ${id}`);
        }
        
        console.log('✅ Added habit entry for habit:', id);
        res.status(201).json({
          id: `entry-${Date.now()}`,
          habit_id: id,
          date: entryDate,
          value: entryValue,
          notes,
          mood,
          created_at: new Date().toISOString()
        });
      });
    });
  } catch (err) {
    handleError(res, err, 'create habit entry');
  }
});

// Simple implementations for other endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(p)) FROM (SELECT * FROM projects ORDER BY created_at DESC) p"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch projects');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const projects = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`📁 Returning ${projects.length} projects`);
        res.json(projects || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch projects');
  }
});

app.get('/api/financial/transactions', (req, res) => {
  console.log(`💰 Returning 0 transactions (simplified)`);
  res.json([]);
});

app.get('/api/shopping/lists', (req, res) => {
  console.log(`🛒 Returning 0 shopping lists (simplified)`);
  res.json([]);
});

app.get('/api/focus/sessions', (req, res) => {
  console.log(`🧘 Returning 0 focus sessions (simplified)`);
  res.json([]);
});

app.get('/api/recipes', (req, res) => {
  console.log(`🍳 Returning 0 recipes (simplified)`);
  res.json([]);
});

// Analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    tasks: { total: '0', completed: '0' },
    habits: { total: '0' },
    finance: { total: '0', total_expenses: '0' },
    focus: { total: '0', total_focus_time: '0' }
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`💾 Using PostgreSQL via Docker exec`);
});

export default app;