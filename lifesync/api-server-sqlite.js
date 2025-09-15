import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Initialize SQLite database
const dbPath = join(__dirname, 'lifesync.db');
const db = new Database(dbPath);

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 LifeSync SQLite API server starting...');
console.log('📁 Database path:', dbPath);

// Initialize database schema
function initializeDatabase() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'other',
      estimated_time INTEGER DEFAULT 25,
      actual_time INTEGER DEFAULT 0,
      due_date TEXT,
      tags TEXT,
      notes TEXT,
      starred BOOLEAN DEFAULT false,
      archived BOOLEAN DEFAULT false,
      deleted BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      status TEXT DEFAULT 'active',
      icon TEXT DEFAULT '📁',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      frequency TEXT DEFAULT 'daily',
      target_value INTEGER DEFAULT 1,
      unit TEXT,
      goal_mode TEXT DEFAULT 'daily-target',
      goal_target INTEGER,
      goal_unit TEXT,
      current_progress INTEGER DEFAULT 0,
      color TEXT DEFAULT '#10b981',
      icon TEXT DEFAULT '✅',
      streak_count INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      reminder_time TEXT,
      reminder_enabled BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_entries (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      value INTEGER DEFAULT 1,
      notes TEXT,
      mood TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS financial_transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      payee TEXT,
      date TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shopping_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      store TEXT,
      shopping_date TEXT,
      total_estimated_cost REAL DEFAULT 0,
      total_actual_cost REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      shopping_list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT,
      estimated_price REAL,
      actual_price REAL,
      category TEXT,
      brand TEXT,
      notes TEXT,
      is_purchased BOOLEAN DEFAULT false,
      purchased_at TEXT,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id)
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      preset TEXT NOT NULL,
      duration INTEGER NOT NULL,
      actual_duration INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT DEFAULT 'active',
      breaks_taken INTEGER DEFAULT 0,
      distractions INTEGER DEFAULT 0,
      mood_before TEXT,
      mood_after TEXT,
      productivity_score INTEGER,
      notes TEXT,
      environment_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cuisine TEXT,
      difficulty TEXT DEFAULT 'medium',
      prep_time INTEGER,
      cook_time INTEGER,
      servings INTEGER DEFAULT 4,
      calories_per_serving INTEGER,
      instructions TEXT,
      tags TEXT,
      is_favorite BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert sample data if tables are empty
  const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
  if (taskCount.count === 0) {
    console.log('📊 Initializing database with sample data...');
    
    db.prepare(`INSERT INTO tasks (id, title, description, status, priority) VALUES 
      ('task-1', 'Sample Task', 'This is a sample task from the database', 'todo', 'medium')`).run();
    
    db.prepare(`INSERT INTO projects (id, name, description, color, status) VALUES 
      ('project-1', 'Sample Project', 'This is a sample project', '#6366f1', 'active')`).run();
    
    db.prepare(`INSERT INTO habits (id, name, description, category, frequency, target_value, goal_mode, current_progress, streak_count) VALUES 
      ('habit-1', 'Sample Habit', 'This is a sample habit', 'general', 'daily', 1, 'daily-target', 0, 5)`).run();
    
    db.prepare(`INSERT INTO financial_transactions (id, type, amount, description, date) VALUES 
      ('transaction-1', 'expense', 25.99, 'Sample Transaction', '2025-09-15')`).run();
    
    db.prepare(`INSERT INTO shopping_lists (id, name, status) VALUES 
      ('list-1', 'Sample Shopping List', 'active')`).run();
    
    db.prepare(`INSERT INTO focus_sessions (id, duration, start_time, status, preset) VALUES 
      ('session-1', 25, '2025-09-15T22:00:00Z', 'completed', 'pomodoro')`).run();
    
    db.prepare(`INSERT INTO recipes (id, name, difficulty, prep_time, cook_time) VALUES 
      ('recipe-1', 'Sample Recipe', 'medium', 15, 30)`).run();
    
    console.log('✅ Sample data inserted successfully');
  }
}

// Initialize the database
initializeDatabase();

// Generic error handler
const handleError = (res, error, operation) => {
  console.error(`Error ${operation}:`, error);
  res.status(500).json({ error: `Failed to ${operation}` });
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== TASKS API ====================

app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare("SELECT * FROM tasks WHERE deleted = false ORDER BY created_at DESC").all();
    console.log(`📋 Returning ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    handleError(res, error, 'fetch tasks');
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const {
      title, description, status, priority, category, estimated_time,
      actual_time, due_date, tags, notes, starred, archived
    } = req.body;

    const id = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, title, description, status, priority, category, estimated_time,
        actual_time, due_date, tags, notes, starred, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([
      id, title, description, status || 'todo', priority || 'medium',
      category || 'other', estimated_time || 25, actual_time || 0,
      due_date, JSON.stringify(tags || []), notes, starred || false,
      archived || false, now, now
    ]);

    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    console.log('✅ Created new task:', newTask.title);
    res.status(201).json(newTask);
  } catch (error) {
    handleError(res, error, 'create task');
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.prepare(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`)
      .run([...values, new Date().toISOString(), id]);

    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Updated task:', id);
    res.json(updatedTask);
  } catch (error) {
    handleError(res, error, 'update task');
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    db.prepare("UPDATE tasks SET deleted = true, updated_at = ? WHERE id = ?")
      .run([new Date().toISOString(), id]);

    const deletedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Deleted task:', id);
    res.json(deletedTask);
  } catch (error) {
    handleError(res, error, 'delete task');
  }
});

// ==================== PROJECTS API ====================

app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    console.log(`📁 Returning ${projects.length} projects`);
    res.json(projects);
  } catch (error) {
    handleError(res, error, 'fetch projects');
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, description, color, status, icon } = req.body;
    const id = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, description, color, status, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run([id, name, description, color || '#6366f1', status || 'active', icon || '📁', now, now]);

    const newProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    console.log('✅ Created new project:', newProject.name);
    res.status(201).json(newProject);
  } catch (error) {
    handleError(res, error, 'create project');
  }
});

// ==================== HABITS API ====================

app.get('/api/habits', (req, res) => {
  try {
    const habits = db.prepare("SELECT * FROM habits WHERE is_active = true ORDER BY created_at DESC").all();
    console.log(`🎯 Returning ${habits.length} habits`);
    res.json(habits);
  } catch (error) {
    handleError(res, error, 'fetch habits');
  }
});

app.post('/api/habits', (req, res) => {
  try {
    const { 
      name, description, category, frequency, target_value, unit, 
      goal_mode, goal_target, goal_unit, color, icon 
    } = req.body;
    
    const id = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO habits (
        id, name, description, category, frequency, target_value, unit,
        goal_mode, goal_target, goal_unit, color, icon, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([
      id, name, description, category || 'general', frequency || 'daily',
      target_value || 1, unit, goal_mode || 'daily-target', goal_target,
      goal_unit, color || '#10b981', icon || '✅', now, now
    ]);

    const newHabit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
    console.log('✅ Created new habit:', newHabit.name);
    res.status(201).json(newHabit);
  } catch (error) {
    handleError(res, error, 'create habit');
  }
});

app.post('/api/habits/:id/entries', (req, res) => {
  try {
    const { id } = req.params;
    const { date, value, notes, mood } = req.body;

    const entryId = generateId();
    const entryDate = date || new Date().toISOString().split('T')[0];
    const entryValue = value || 1;

    // Insert or update habit entry
    db.prepare(`
      INSERT OR REPLACE INTO habit_entries (id, habit_id, date, value, notes, mood, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run([entryId, id, entryDate, entryValue, notes, mood, new Date().toISOString()]);

    // Update habit progress for goal-based habits
    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
    if (habit && (habit.goal_mode === 'total-goal' || habit.goal_mode === 'course-completion')) {
      const newProgress = (habit.current_progress || 0) + entryValue;
      db.prepare("UPDATE habits SET current_progress = ?, updated_at = ? WHERE id = ?")
        .run([newProgress, new Date().toISOString(), id]);
      
      console.log(`📈 Updated habit progress: ${habit.name} - ${newProgress}/${habit.goal_target} ${habit.goal_unit}`);
    }

    const entry = db.prepare("SELECT * FROM habit_entries WHERE id = ?").get(entryId);
    console.log('✅ Added habit entry for habit:', id);
    res.status(201).json(entry);
  } catch (error) {
    handleError(res, error, 'create habit entry');
  }
});

app.put('/api/habits/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.prepare(`UPDATE habits SET ${setClause}, updated_at = ? WHERE id = ?`)
      .run([...values, new Date().toISOString(), id]);

    const updatedHabit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
    if (!updatedHabit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    console.log('✅ Updated habit:', id);
    res.json(updatedHabit);
  } catch (error) {
    handleError(res, error, 'update habit');
  }
});

// ==================== OTHER ENDPOINTS ====================

app.get('/api/financial/transactions', (req, res) => {
  try {
    const transactions = db.prepare("SELECT * FROM financial_transactions ORDER BY date DESC, created_at DESC").all();
    console.log(`💰 Returning ${transactions.length} transactions`);
    res.json(transactions);
  } catch (error) {
    handleError(res, error, 'fetch financial transactions');
  }
});

app.get('/api/shopping/lists', (req, res) => {
  try {
    const lists = db.prepare("SELECT * FROM shopping_lists WHERE status != 'archived' ORDER BY created_at DESC").all();
    console.log(`🛒 Returning ${lists.length} shopping lists`);
    res.json(lists);
  } catch (error) {
    handleError(res, error, 'fetch shopping lists');
  }
});

app.get('/api/focus/sessions', (req, res) => {
  try {
    const sessions = db.prepare("SELECT * FROM focus_sessions ORDER BY start_time DESC LIMIT 50").all();
    console.log(`🧘 Returning ${sessions.length} focus sessions`);
    res.json(sessions);
  } catch (error) {
    handleError(res, error, 'fetch focus sessions');
  }
});

app.get('/api/recipes', (req, res) => {
  try {
    const recipes = db.prepare("SELECT * FROM recipes ORDER BY created_at DESC").all();
    console.log(`🍳 Returning ${recipes.length} recipes`);
    res.json(recipes);
  } catch (error) {
    handleError(res, error, 'fetch recipes');
  }
});

// Analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const tasks = db.prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'done' THEN 1 END) as completed FROM tasks WHERE deleted = false").get();
    const habits = db.prepare("SELECT COUNT(*) as total FROM habits WHERE is_active = true").get();
    const transactions = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses FROM financial_transactions WHERE date >= date('now', '-30 days')").get();
    const sessions = db.prepare("SELECT COUNT(*) as total, SUM(actual_duration) as total_focus_time FROM focus_sessions WHERE start_time >= date('now', '-30 days')").get();

    res.json({
      tasks: { total: String(tasks.total), completed: String(tasks.completed) },
      habits: { total: String(habits.total) },
      finance: { total: String(transactions.total), total_expenses: String(transactions.total_expenses || 0) },
      focus: { total: String(sessions.total), total_focus_time: String(sessions.total_focus_time || 0) }
    });
  } catch (error) {
    handleError(res, error, 'fetch analytics');
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync SQLite API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`💾 Using SQLite database: ${dbPath}`);
});

export default app;