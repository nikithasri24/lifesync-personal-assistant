// Simple wrapper to run the API server with database connectivity using Docker exec
import { spawn, exec } from 'child_process';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://10.247.209.223:5173', 'http://localhost:3000', 'http://10.247.209.223:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 LifeSync API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      tasks: '/api/tasks',
      projects: '/api/projects',
      habits: '/api/habits',
      focus: '/api/focus/sessions',
      financial: '/api/financial/transactions',
      shopping: '/api/shopping/lists',
      recipes: '/api/recipes',
      analytics: '/api/analytics/dashboard'
    }
  });
});

// Favicon endpoint (prevents 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No content
});

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

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, due_date, estimated_time, project_id, priority, status, category, tags, actual_time } = req.body;
    
    // Generate UUID for the task
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Prepare values with proper escaping
    const escapedTitle = title ? title.replace(/'/g, "''") : '';
    const escapedDescription = description ? description.replace(/'/g, "''") : null;
    const escapedCategory = category || 'personal';
    const escapedPriority = priority || 'medium';
    const escapedStatus = status || 'todo';
    const tagsArray = tags && tags.length > 0 ? `ARRAY[${tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]` : 'ARRAY[]::TEXT[]';
    
    const insertCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
      INSERT INTO tasks (id, title, description, due_date, estimated_time, project_id, priority, status, category, tags, actual_time, created_at, updated_at, deleted, user_id)
      VALUES (
        '${taskId}',
        '${escapedTitle}',
        ${escapedDescription ? `'${escapedDescription}'` : 'NULL'},
        ${due_date ? `'${due_date}'` : 'NULL'},
        ${estimated_time || 60},
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${escapedPriority}',
        '${escapedStatus}',
        '${escapedCategory}',
        ${tagsArray},
        ${actual_time || 0},
        '${now}',
        '${now}',
        false,
        '1ac27f3b-3c11-4457-9774-e941896da856'
      )"`;
    
    exec(insertCmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'create task');
        return;
      }
      
      console.log(`✅ Created task: ${title}`);
      res.status(201).json({ id: taskId, title, status: 'created' });
    });
  } catch (err) {
    handleError(res, err, 'create task');
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build SET clause dynamically
    const setClause = [];
    
    if (updates.title !== undefined) {
      setClause.push(`title = '${updates.title.replace(/'/g, "''")}'`);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = ${updates.description ? `'${updates.description.replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updates.due_date !== undefined) {
      setClause.push(`due_date = ${updates.due_date ? `'${updates.due_date}'` : 'NULL'}`);
    }
    if (updates.estimated_time !== undefined) {
      setClause.push(`estimated_time = ${updates.estimated_time}`);
    }
    if (updates.project_id !== undefined) {
      setClause.push(`project_id = ${updates.project_id ? `'${updates.project_id}'` : 'NULL'}`);
    }
    if (updates.priority !== undefined) {
      setClause.push(`priority = '${updates.priority}'`);
    }
    if (updates.status !== undefined) {
      setClause.push(`status = '${updates.status}'`);
    }
    if (updates.category !== undefined) {
      setClause.push(`category = '${updates.category}'`);
    }
    if (updates.tags !== undefined) {
      const tagsArray = updates.tags && updates.tags.length > 0 
        ? `ARRAY[${updates.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]` 
        : 'ARRAY[]::TEXT[]';
      setClause.push(`tags = ${tagsArray}`);
    }
    if (updates.actual_time !== undefined) {
      setClause.push(`actual_time = ${updates.actual_time}`);
    }
    if (updates.starred !== undefined) {
      setClause.push(`starred = ${updates.starred}`);
    }
    if (updates.archived !== undefined) {
      setClause.push(`archived = ${updates.archived}`);
    }
    
    // Always update the updated_at timestamp
    setClause.push(`updated_at = '${new Date().toISOString()}'`);
    
    if (setClause.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const updateCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
      UPDATE tasks 
      SET ${setClause.join(', ')}
      WHERE id = '${id}' AND deleted = false"`;
    
    exec(updateCmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'update task');
        return;
      }
      
      console.log(`📝 Updated task: ${id}`);
      res.json({ id, status: 'updated' });
    });
  } catch (err) {
    handleError(res, err, 'update task');
  }
});

// Delete a task (soft delete)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
      UPDATE tasks 
      SET deleted = true, updated_at = '${new Date().toISOString()}'
      WHERE id = '${id}'"`;
    
    exec(deleteCmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'delete task');
        return;
      }
      
      console.log(`🗑️ Deleted task: ${id}`);
      res.json({ id, status: 'deleted' });
    });
  } catch (err) {
    handleError(res, err, 'delete task');
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

app.get('/api/financial/transactions', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(t)) FROM (SELECT ft.*, fa.name as account_name, fc.name as category_name, fc.color as category_color FROM financial_transactions ft LEFT JOIN financial_accounts fa ON ft.account_id = fa.id LEFT JOIN financial_categories fc ON ft.category_id = fc.id ORDER BY ft.date DESC, ft.created_at DESC LIMIT 50) t"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch financial transactions');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const transactions = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`💰 Returning ${transactions.length} financial transactions`);
        res.json(transactions || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch financial transactions');
  }
});

app.get('/api/shopping/lists', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(t)) FROM (SELECT sl.*, COUNT(si.id) as item_count, COUNT(CASE WHEN si.is_purchased THEN 1 END) as purchased_count FROM shopping_lists sl LEFT JOIN shopping_items si ON sl.id = si.shopping_list_id WHERE sl.status != 'archived' GROUP BY sl.id ORDER BY sl.created_at DESC) t"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch shopping lists');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const shoppingLists = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`🛒 Returning ${shoppingLists.length} shopping lists`);
        res.json(shoppingLists || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch shopping lists');
  }
});

app.get('/api/focus/sessions', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(t)) FROM (SELECT fs.*, t.title as task_title FROM focus_sessions fs LEFT JOIN tasks t ON fs.task_id = t.id ORDER BY fs.start_time DESC LIMIT 50) t"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch focus sessions');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const focusSessions = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`🧘 Returning ${focusSessions.length} focus sessions`);
        res.json(focusSessions || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch focus sessions');
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const cmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT json_agg(row_to_json(t)) FROM (SELECT r.*, COUNT(ri.id) as ingredient_count FROM recipes r LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id GROUP BY r.id ORDER BY r.created_at DESC) t"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'fetch recipes');
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const recipes = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`🍳 Returning ${recipes.length} recipes`);
        res.json(recipes || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.json([]);
      }
    });
  } catch (err) {
    handleError(res, err, 'fetch recipes');
  }
});

// Analytics endpoint
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    // Get analytics data from multiple tables
    const analyticsCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
    SELECT json_build_object(
      'tasks', json_build_object(
        'total', (SELECT COUNT(*) FROM tasks WHERE deleted = false),
        'completed', (SELECT COUNT(*) FROM tasks WHERE status = 'done' AND deleted = false)
      ),
      'habits', json_build_object(
        'total', (SELECT COUNT(*) FROM habits WHERE is_active = true)
      ),
      'finance', json_build_object(
        'total', (SELECT COUNT(*) FROM financial_transactions),
        'total_expenses', COALESCE((SELECT SUM(ABS(amount)) FROM financial_transactions WHERE type = 'expense'), 0)
      ),
      'focus', json_build_object(
        'total', (SELECT COUNT(*) FROM focus_sessions),
        'total_focus_time', COALESCE((SELECT SUM(actual_duration) FROM focus_sessions WHERE actual_duration IS NOT NULL), 0)
      )
    ) as analytics;
    "`;
    
    exec(analyticsCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Analytics query error:', error);
        // Fallback to zeros if query fails
        res.json({
          tasks: { total: '0', completed: '0' },
          habits: { total: '0' },
          finance: { total: '0', total_expenses: '0' },
          focus: { total: '0', total_focus_time: '0' }
        });
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          const analytics = JSON.parse(jsonLine.trim());
          console.log('📊 Returning real analytics data');
          res.json(analytics);
        } else {
          throw new Error('No analytics data found');
        }
      } catch (parseError) {
        console.error('Analytics parse error:', parseError);
        res.json({
          tasks: { total: '0', completed: '0' },
          habits: { total: '0' },
          finance: { total: '0', total_expenses: '0' },
          focus: { total: '0', total_focus_time: '0' }
        });
      }
    });
  } catch (err) {
    console.error('Analytics endpoint error:', err);
    res.json({
      tasks: { total: '0', completed: '0' },
      habits: { total: '0' },
      finance: { total: '0', total_expenses: '0' },
      focus: { total: '0', total_focus_time: '0' }
    });
  }
});

// Focus Profile endpoint
app.get('/api/focus/profile', async (req, res) => {
  try {
    const profileCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
    SELECT json_build_object(
      'id', '1ac27f3b-3c11-4457-9774-e941896da856',
      'username', 'LifeSync User',
      'level', COALESCE((SELECT level FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 1),
      'xp', COALESCE((SELECT xp FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 0),
      'xpToNextLevel', 1000,
      'currentStreak', COALESCE((SELECT current_streak FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 0),
      'totalSessions', COALESCE((SELECT COUNT(*) FROM focus_sessions WHERE status = 'completed'), 0),
      'totalFocusTime', COALESCE((SELECT SUM(actual_duration) FROM focus_sessions WHERE actual_duration IS NOT NULL), 0),
      'completionRate', COALESCE((SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0 
          ELSE ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2)
        END 
        FROM focus_sessions), 0),
      'productivityScore', COALESCE((SELECT productivity_score FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 75)
    ) as profile;
    "`;
    
    exec(profileCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Profile query error:', error);
        // Return default profile
        res.json({
          id: '1ac27f3b-3c11-4457-9774-e941896da856',
          username: 'LifeSync User',
          level: 1,
          xp: 0,
          xpToNextLevel: 1000,
          currentStreak: 0,
          totalSessions: 0,
          totalFocusTime: 0,
          completionRate: 0,
          productivityScore: 75
        });
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          const profile = JSON.parse(jsonLine.trim());
          console.log('👤 Returning focus profile data');
          res.json(profile);
        } else {
          throw new Error('No profile data found');
        }
      } catch (parseError) {
        console.error('Profile parse error:', parseError);
        res.json({
          id: '1ac27f3b-3c11-4457-9774-e941896da856',
          username: 'LifeSync User',
          level: 1,
          xp: 0,
          xpToNextLevel: 1000,
          currentStreak: 0,
          totalSessions: 0,
          totalFocusTime: 0,
          completionRate: 0,
          productivityScore: 75
        });
      }
    });
  } catch (err) {
    console.error('Profile endpoint error:', err);
    res.json({
      id: '1ac27f3b-3c11-4457-9774-e941896da856',
      username: 'LifeSync User',
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      currentStreak: 0,
      totalSessions: 0,
      totalFocusTime: 0,
      completionRate: 0,
      productivityScore: 75
    });
  }
});

// Focus Achievements endpoint
app.get('/api/focus/achievements', async (req, res) => {
  try {
    // Return predefined achievements with calculated progress
    const achievementsCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
    SELECT json_agg(achievement) as achievements FROM (
      SELECT json_build_object(
        'id', '1',
        'name', 'First Session',
        'icon', '🎯',
        'unlocked', CASE WHEN (SELECT COUNT(*) FROM focus_sessions) >= 1 THEN true ELSE false END,
        'rarity', 'common',
        'progress', LEAST((SELECT COUNT(*) FROM focus_sessions), 1)
      ) as achievement
      UNION ALL
      SELECT json_build_object(
        'id', '2',
        'name', 'Focus Master',
        'icon', '🧘',
        'unlocked', CASE WHEN (SELECT COUNT(*) FROM focus_sessions WHERE status = 'completed') >= 10 THEN true ELSE false END,
        'rarity', 'rare',
        'progress', LEAST((SELECT COUNT(*) FROM focus_sessions WHERE status = 'completed'), 10)
      ) as achievement
      UNION ALL
      SELECT json_build_object(
        'id', '3',
        'name', 'Time Warrior',
        'icon', '⏰',
        'unlocked', CASE WHEN COALESCE((SELECT SUM(actual_duration) FROM focus_sessions WHERE actual_duration IS NOT NULL), 0) >= 3600 THEN true ELSE false END,
        'rarity', 'epic',
        'progress', LEAST(COALESCE((SELECT SUM(actual_duration) FROM focus_sessions WHERE actual_duration IS NOT NULL), 0), 3600)
      ) as achievement
      UNION ALL
      SELECT json_build_object(
        'id', '4',
        'name', 'Consistency King',
        'icon', '🔥',
        'unlocked', CASE WHEN COALESCE((SELECT current_streak FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 0) >= 7 THEN true ELSE false END,
        'rarity', 'legendary',
        'progress', LEAST(COALESCE((SELECT current_streak FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 0), 7)
      ) as achievement
    ) t;
    "`;
    
    exec(achievementsCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Achievements query error:', error);
        // Return default achievements
        res.json([
          { id: '1', name: 'First Session', icon: '🎯', unlocked: false, rarity: 'common', progress: 0 },
          { id: '2', name: 'Focus Master', icon: '🧘', unlocked: false, rarity: 'rare', progress: 0 },
          { id: '3', name: 'Time Warrior', icon: '⏰', unlocked: false, rarity: 'epic', progress: 0 },
          { id: '4', name: 'Consistency King', icon: '🔥', unlocked: false, rarity: 'legendary', progress: 0 }
        ]);
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('null'));
        const achievements = jsonLine && jsonLine.trim() !== 'null' ? JSON.parse(jsonLine.trim()) : [];
        
        console.log(`🏆 Returning ${achievements.length} achievements`);
        res.json(achievements || []);
      } catch (parseError) {
        console.error('Achievements parse error:', parseError);
        res.json([
          { id: '1', name: 'First Session', icon: '🎯', unlocked: false, rarity: 'common', progress: 0 },
          { id: '2', name: 'Focus Master', icon: '🧘', unlocked: false, rarity: 'rare', progress: 0 },
          { id: '3', name: 'Time Warrior', icon: '⏰', unlocked: false, rarity: 'epic', progress: 0 },
          { id: '4', name: 'Consistency King', icon: '🔥', unlocked: false, rarity: 'legendary', progress: 0 }
        ]);
      }
    });
  } catch (err) {
    console.error('Achievements endpoint error:', err);
    res.json([
      { id: '1', name: 'First Session', icon: '🎯', unlocked: false, rarity: 'common', progress: 0 },
      { id: '2', name: 'Focus Master', icon: '🧘', unlocked: false, rarity: 'rare', progress: 0 },
      { id: '3', name: 'Time Warrior', icon: '⏰', unlocked: false, rarity: 'epic', progress: 0 },
      { id: '4', name: 'Consistency King', icon: '🔥', unlocked: false, rarity: 'legendary', progress: 0 }
    ]);
  }
});

// Focus Analytics endpoint
app.get('/api/focus/analytics', async (req, res) => {
  try {
    const analyticsCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
    SELECT json_build_object(
      'totalSessions', COALESCE((SELECT COUNT(*) FROM focus_sessions), 0),
      'totalFocusTime', COALESCE((SELECT SUM(actual_duration) FROM focus_sessions WHERE actual_duration IS NOT NULL), 0),
      'completionRate', COALESCE((SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0 
          ELSE ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2)
        END 
        FROM focus_sessions), 0),
      'productivityScore', COALESCE((SELECT productivity_score FROM user_profiles WHERE user_id = '1ac27f3b-3c11-4457-9774-e941896da856'), 75),
      'weeklyStats', json_build_array(
        json_build_object('day', 'Mon', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Tue', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Wed', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Thu', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Fri', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Sat', 'sessions', 0, 'productivity', 75),
        json_build_object('day', 'Sun', 'sessions', 0, 'productivity', 75)
      )
    ) as analytics;
    "`;
    
    exec(analyticsCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Focus analytics query error:', error);
        // Return default analytics
        res.json({
          totalSessions: 0,
          totalFocusTime: 0,
          completionRate: 0,
          productivityScore: 75,
          weeklyStats: [
            { day: 'Mon', sessions: 0, productivity: 75 },
            { day: 'Tue', sessions: 0, productivity: 75 },
            { day: 'Wed', sessions: 0, productivity: 75 },
            { day: 'Thu', sessions: 0, productivity: 75 },
            { day: 'Fri', sessions: 0, productivity: 75 },
            { day: 'Sat', sessions: 0, productivity: 75 },
            { day: 'Sun', sessions: 0, productivity: 75 }
          ]
        });
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          const analytics = JSON.parse(jsonLine.trim());
          console.log('📈 Returning focus analytics data');
          res.json(analytics);
        } else {
          throw new Error('No analytics data found');
        }
      } catch (parseError) {
        console.error('Focus analytics parse error:', parseError);
        res.json({
          totalSessions: 0,
          totalFocusTime: 0,
          completionRate: 0,
          productivityScore: 75,
          weeklyStats: [
            { day: 'Mon', sessions: 0, productivity: 75 },
            { day: 'Tue', sessions: 0, productivity: 75 },
            { day: 'Wed', sessions: 0, productivity: 75 },
            { day: 'Thu', sessions: 0, productivity: 75 },
            { day: 'Fri', sessions: 0, productivity: 75 },
            { day: 'Sat', sessions: 0, productivity: 75 },
            { day: 'Sun', sessions: 0, productivity: 75 }
          ]
        });
      }
    });
  } catch (err) {
    console.error('Focus analytics endpoint error:', err);
    res.json({
      totalSessions: 0,
      totalFocusTime: 0,
      completionRate: 0,
      productivityScore: 75,
      weeklyStats: [
        { day: 'Mon', sessions: 0, productivity: 75 },
        { day: 'Tue', sessions: 0, productivity: 75 },
        { day: 'Wed', sessions: 0, productivity: 75 },
        { day: 'Thu', sessions: 0, productivity: 75 },
        { day: 'Fri', sessions: 0, productivity: 75 },
        { day: 'Sat', sessions: 0, productivity: 75 },
        { day: 'Sun', sessions: 0, productivity: 75 }
      ]
    });
  }
});

// Update Focus Profile endpoint
app.put('/api/focus/profile', async (req, res) => {
  try {
    const updates = req.body;
    const userId = '1ac27f3b-3c11-4457-9774-e941896da856';
    
    // Create user profile if it doesn't exist, then update
    const upsertCmd = `docker exec lifesync-postgres psql -U postgres -d lifesync -c "
    INSERT INTO user_profiles (user_id, level, xp, current_streak, productivity_score, created_at, updated_at)
    VALUES ('${userId}', ${updates.level || 1}, ${updates.xp || 0}, ${updates.currentStreak || 0}, ${updates.productivityScore || 75}, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      level = COALESCE(${updates.level || 'user_profiles.level'}),
      xp = COALESCE(${updates.xp || 'user_profiles.xp'}),
      current_streak = COALESCE(${updates.currentStreak || 'user_profiles.current_streak'}),
      productivity_score = COALESCE(${updates.productivityScore || 'user_profiles.productivity_score'}),
      updated_at = NOW()
    RETURNING *;"`;
    
    exec(upsertCmd, (error, stdout, stderr) => {
      if (error) {
        handleError(res, error, 'update focus profile');
        return;
      }
      
      console.log('👤 Updated focus profile');
      res.json({ status: 'updated', ...updates });
    });
  } catch (err) {
    handleError(res, err, 'update focus profile');
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`💾 Using PostgreSQL via Docker exec`);
});

export default app;