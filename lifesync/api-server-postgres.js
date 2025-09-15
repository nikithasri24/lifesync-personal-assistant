import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

// Database connection using the Docker PostgreSQL container
const pool = new Pool({
  user: 'postgres',
  host: '10.247.209.223',  // Use host IP with mapped port
  database: 'lifesync',
  password: 'lifesync123',
  port: 5433,  // Mapped port from Docker
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
  statement_timeout: 10000,
  query_timeout: 10000,
});

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 LifeSync PostgreSQL API server starting...');

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database at:', res.rows[0].now);
  }
});

// Generic error handler
const handleError = (res, error, operation) => {
  console.error(`Error ${operation}:`, error);
  res.status(500).json({ error: `Failed to ${operation}` });
};

// Generate unique ID (let PostgreSQL handle UUID generation)
const generateId = () => null; // PostgreSQL will auto-generate UUIDs

// ==================== TASKS API ====================

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, p.name as project_name, p.color as project_color, p.icon as project_icon
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deleted = false
      ORDER BY t.created_at DESC
    `);
    console.log(`📋 Returning ${result.rows.length} tasks`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch tasks');
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const {
      title, description, project_id, status, priority, estimated_time,
      actual_time, due_date, tags, category, notes, starred, archived
    } = req.body;

    const result = await pool.query(`
      INSERT INTO tasks (
        title, description, project_id, status, priority, estimated_time,
        actual_time, due_date, tags, category, notes, starred, archived
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, description, project_id, status || 'todo', priority || 'medium',
      estimated_time || 25, actual_time || 0, due_date, tags || [],
      category || 'other', notes, starred || false, archived || false
    ]);

    console.log('✅ Created new task:', result.rows[0].title);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create task');
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE tasks SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Updated task:', id);
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'update task');
  }
});

// Delete task (soft delete)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE tasks SET deleted = true, deleted_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Deleted task:', id);
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'delete task');
  }
});

// ==================== PROJECTS API ====================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);
    console.log(`📁 Returning ${result.rows.length} projects`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch projects');
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, color, status, icon } = req.body;

    const result = await pool.query(`
      INSERT INTO projects (name, description, color, status, icon)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, color || '#6366f1', status || 'active', icon || '📁']);

    console.log('✅ Created new project:', result.rows[0].name);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create project');
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE projects SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('✅ Updated project:', id);
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'update project');
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('UPDATE tasks SET project_id = NULL WHERE project_id = $1', [id]);
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('✅ Deleted project:', result.rows[0].name);
    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (err) {
    handleError(res, err, 'delete project');
  }
});

// ==================== HABITS API ====================

// Get all habits
app.get('/api/habits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, 
             COUNT(he.id) as total_entries,
             MAX(he.date) as last_entry_date
      FROM habits h
      LEFT JOIN habit_entries he ON h.id = he.habit_id
      WHERE h.is_active = true
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    console.log(`🎯 Returning ${result.rows.length} habits`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch habits');
  }
});

// Create habit
app.post('/api/habits', async (req, res) => {
  try {
    const { 
      name, description, category, frequency, target_value, unit, 
      goal_mode, goal_target, goal_unit, color, icon, reminder_time, reminder_enabled 
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO habits (
        name, description, category, frequency, target_value, unit,
        goal_mode, goal_target, goal_unit, color, icon, reminder_time, reminder_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name, description, category || 'general', frequency || 'daily',
      target_value || 1, unit, goal_mode || 'daily-target', goal_target,
      goal_unit, color || '#10b981', icon || '✅', reminder_time, reminder_enabled || false
    ]);

    console.log('✅ Created new habit:', result.rows[0].name);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create habit');
  }
});

// Add habit entry
app.post('/api/habits/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, value, notes, mood } = req.body;

    const entryDate = date || new Date().toISOString().split('T')[0];
    const entryValue = value || 1;

    const result = await pool.query(`
      INSERT INTO habit_entries (habit_id, date, value, notes, mood)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (habit_id, date) 
      DO UPDATE SET value = EXCLUDED.value, notes = EXCLUDED.notes, mood = EXCLUDED.mood
      RETURNING *
    `, [id, entryDate, entryValue, notes, mood]);

    // Update habit progress for goal-based habits
    const habitResult = await pool.query('SELECT * FROM habits WHERE id = $1', [id]);
    if (habitResult.rows.length > 0) {
      const habit = habitResult.rows[0];
      if (habit.goal_mode === 'total-goal' || habit.goal_mode === 'course-completion') {
        const newProgress = (habit.current_progress || 0) + entryValue;
        await pool.query('UPDATE habits SET current_progress = $1, updated_at = NOW() WHERE id = $2', [newProgress, id]);
        console.log(`📈 Updated habit progress: ${habit.name} - ${newProgress}/${habit.goal_target} ${habit.goal_unit}`);
      }
    }

    console.log('✅ Added habit entry for habit:', id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create habit entry');
  }
});

// Update habit
app.put('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE habits SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    console.log('✅ Updated habit:', id);
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'update habit');
  }
});

// Delete habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM habits WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    console.log('✅ Deleted habit:', result.rows[0].name);
    res.json({ message: 'Habit deleted', habit: result.rows[0] });
  } catch (err) {
    handleError(res, err, 'delete habit');
  }
});

// ==================== OTHER ENDPOINTS ====================

// Financial transactions
app.get('/api/financial/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM financial_transactions
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `);
    console.log(`💰 Returning ${result.rows.length} transactions`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch financial transactions');
  }
});

app.post('/api/financial/transactions', async (req, res) => {
  try {
    const { type, amount, description, payee, date, tags, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO financial_transactions (type, amount, description, payee, date, tags, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [type, amount, description, payee, date, tags || [], notes]);

    console.log('✅ Created financial transaction:', result.rows[0].description);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create financial transaction');
  }
});

// Shopping lists
app.get('/api/shopping/lists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM shopping_lists
      WHERE status != 'archived'
      ORDER BY created_at DESC
    `);
    console.log(`🛒 Returning ${result.rows.length} shopping lists`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch shopping lists');
  }
});

// Focus sessions
app.get('/api/focus/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fs.*, t.title as task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON fs.task_id = t.id
      ORDER BY fs.start_time DESC
      LIMIT 50
    `);
    console.log(`🧘 Returning ${result.rows.length} focus sessions`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch focus sessions');
  }
});

app.post('/api/focus/sessions', async (req, res) => {
  try {
    const { task_id, preset, duration, start_time, mood_before, notes, environment_data } = req.body;

    const result = await pool.query(`
      INSERT INTO focus_sessions (task_id, preset, duration, start_time, mood_before, notes, environment_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [task_id, preset, duration, start_time || new Date(), mood_before, notes, environment_data]);

    console.log('✅ Created focus session');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create focus session');
  }
});

// Update focus session
app.put('/api/focus/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE focus_sessions SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Focus session not found' });
    }

    console.log('✅ Updated focus session:', id);
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'update focus session');
  }
});

// Recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM recipes
      ORDER BY created_at DESC
    `);
    console.log(`🍳 Returning ${result.rows.length} recipes`);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch recipes');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Analytics endpoint
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const [tasks, habits, transactions, sessions] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'done\' THEN 1 END) as completed FROM tasks WHERE deleted = false'),
      pool.query('SELECT COUNT(*) as total FROM habits WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN type = \'expense\' THEN amount ELSE 0 END) as total_expenses FROM financial_transactions WHERE date >= CURRENT_DATE - INTERVAL \'30 days\''),
      pool.query('SELECT COUNT(*) as total, SUM(actual_duration) as total_focus_time FROM focus_sessions WHERE start_time >= CURRENT_DATE - INTERVAL \'30 days\'')
    ]);

    res.json({
      tasks: tasks.rows[0],
      habits: habits.rows[0],
      finance: transactions.rows[0],
      focus: sessions.rows[0]
    });
  } catch (err) {
    handleError(res, err, 'fetch analytics');
  }
});

// Start server on all interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync PostgreSQL API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`💾 Using PostgreSQL database at 10.247.209.223:5433`);
});

export default app;