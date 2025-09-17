import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

// Database connection using port 5433
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lifesync',
  password: 'lifesync123',
  port: 5433,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
  statement_timeout: 10000,
  query_timeout: 10000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database at:', res.rows[0].now);
  }
});

// Generic error handler
const handleError = (res, error, operation) => {
  console.error(`Error ${operation}:`, error);
  res.status(500).json({ error: `Failed to ${operation}` });
};

// ==================== TASKS API ====================

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    // Default user ID (from the admin user created in schema)
    const DEFAULT_USER_ID = '1ac27f3b-3c11-4457-9774-e941896da856';
    
    const result = await pool.query(`
      SELECT t.*, p.name as project_name, p.color as project_color, p.icon as project_icon
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deleted = false AND t.user_id = $1
      ORDER BY t.created_at DESC
    `, [DEFAULT_USER_ID]);
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

    // Default user ID (from the admin user created in schema)
    const DEFAULT_USER_ID = '1ac27f3b-3c11-4457-9774-e941896da856';

    const result = await pool.query(`
      INSERT INTO tasks (
        user_id, title, description, project_id, status, priority, estimated_time,
        actual_time, due_date, tags, category, notes, starred, archived
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      DEFAULT_USER_ID, title, description, project_id, status || 'todo', priority || 'medium',
      estimated_time || 25, actual_time || 0, due_date, tags || [],
      category || 'other', notes, starred || false, archived || false
    ]);

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
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch habits');
  }
});

// Create habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name, description, category, frequency, target_value, unit, color, icon } = req.body;

    const result = await pool.query(`
      INSERT INTO habits (name, description, category, frequency, target_value, unit, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, category, frequency || 'daily', target_value || 1, unit, color || '#10b981', icon || '✅']);

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

    const result = await pool.query(`
      INSERT INTO habit_entries (habit_id, date, value, notes, mood)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (habit_id, date) 
      DO UPDATE SET value = EXCLUDED.value, notes = EXCLUDED.notes, mood = EXCLUDED.mood
      RETURNING *
    `, [id, date || new Date().toISOString().split('T')[0], value || 1, notes, mood]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create habit entry');
  }
});

// ==================== FINANCES API ====================

// Get financial accounts
app.get('/api/financial/accounts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM financial_accounts 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch financial accounts');
  }
});

// Get financial transactions
app.get('/api/financial/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, a.name as account_name, c.name as category_name, c.color as category_color
      FROM financial_transactions t
      LEFT JOIN financial_accounts a ON t.account_id = a.id
      LEFT JOIN financial_categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch financial transactions');
  }
});

// Create financial transaction
app.post('/api/financial/transactions', async (req, res) => {
  try {
    const { account_id, category_id, type, amount, description, payee, date, tags, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO financial_transactions (account_id, category_id, type, amount, description, payee, date, tags, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [account_id, category_id, type, amount, description, payee, date, tags || [], notes]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create financial transaction');
  }
});

// ==================== SHOPPING API ====================

// Get shopping lists
app.get('/api/shopping/lists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sl.*, COUNT(si.id) as item_count,
             COUNT(CASE WHEN si.is_purchased THEN 1 END) as purchased_count
      FROM shopping_lists sl
      LEFT JOIN shopping_items si ON sl.id = si.shopping_list_id
      WHERE sl.status != 'archived'
      GROUP BY sl.id
      ORDER BY sl.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch shopping lists');
  }
});

// Create shopping list
app.post('/api/shopping/lists', async (req, res) => {
  try {
    const { name, description, store, shopping_date } = req.body;

    const result = await pool.query(`
      INSERT INTO shopping_lists (name, description, store, shopping_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, store, shopping_date]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create shopping list');
  }
});

// Get shopping items for a list
app.get('/api/shopping/lists/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM shopping_items 
      WHERE shopping_list_id = $1
      ORDER BY position, created_at
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch shopping items');
  }
});

// Add shopping item
app.post('/api/shopping/lists/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit, estimated_price, category, brand, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO shopping_items (shopping_list_id, name, quantity, unit, estimated_price, category, brand, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, name, quantity || 1, unit, estimated_price, category, brand, notes]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'add shopping item');
  }
});

// ==================== FOCUS SESSIONS API ====================

// Get focus sessions
app.get('/api/focus/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fs.*, t.title as task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON fs.task_id = t.id
      ORDER BY fs.start_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch focus sessions');
  }
});

// Create focus session
app.post('/api/focus/sessions', async (req, res) => {
  try {
    const { task_id, preset, duration, start_time, mood_before, notes, environment_data } = req.body;

    const result = await pool.query(`
      INSERT INTO focus_sessions (task_id, preset, duration, start_time, mood_before, notes, environment_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [task_id, preset, duration, start_time || new Date(), mood_before, notes, environment_data]);

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

    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'update focus session');
  }
});

// ==================== RECIPES API ====================

// Get recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             COUNT(ri.id) as ingredient_count
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'fetch recipes');
  }
});

// Create recipe
app.post('/api/recipes', async (req, res) => {
  try {
    const { 
      name, description, cuisine, difficulty, prep_time, cook_time, 
      servings, calories_per_serving, instructions, tags, is_favorite 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO recipes (
        name, description, cuisine, difficulty, prep_time, cook_time,
        servings, calories_per_serving, instructions, tags, is_favorite
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      name, description, cuisine, difficulty || 'medium', prep_time, cook_time,
      servings || 4, calories_per_serving, instructions, tags || [], is_favorite || false
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err, 'create recipe');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Analytics endpoints
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
  console.log(`🚀 LifeSync API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`📊 Local: http://localhost:${port}/api/health`);
});

export default app;