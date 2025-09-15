// LifeSync Database Server
// Complete PostgreSQL integration with real database connections

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'lifesync_user',
  host: '127.0.0.1',
  database: 'lifesync_db',
  password: 'lifesync_password',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log(`📊 Database: ${result.rows[0].current_database}, User: ${result.rows[0].current_user}`);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    return false;
  }
}

// Utility function to execute queries with Docker fallback
async function queryDatabase(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
}

// Utility functions
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// ==================== SEED DATA ====================
async function seedDatabase() {
  try {
    // Check if data already exists
    const userCheck = await queryDatabase('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('📊 Database already has data, skipping seed');
      return;
    }

    console.log('🌱 Database is empty - data should be seeded manually via Docker exec');
    console.log('💡 Run: docker exec lifesync-postgres psql -U lifesync_user -d lifesync_db');
    console.log('✅ Database check completed');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
  }
}

// ==================== TASK ROUTES ====================

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await queryDatabase(`
      SELECT t.*, p.name as project_name, p.color as project_color, p.icon as project_icon
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deleted = false
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await queryDatabase('SELECT * FROM projects ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const result = await queryDatabase(`
      INSERT INTO tasks (
        user_id, title, description, project_id, status, priority, 
        estimated_time, actual_time, due_date, tags, category, notes
      ) VALUES (
        (SELECT id FROM users LIMIT 1), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `, [
      req.body.title,
      req.body.description || '',
      req.body.project_id || null,
      req.body.status || 'todo',
      req.body.priority || 'medium',
      req.body.estimated_time || 25,
      req.body.actual_time || 0,
      req.body.due_date || null,
      req.body.tags || [],
      req.body.category || 'work',
      req.body.notes || ''
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    const result = await queryDatabase(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (soft delete)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await queryDatabase(`
      UPDATE tasks SET deleted = true, deleted_at = $1, updated_at = $1 
      WHERE id = $2 RETURNING *
    `, [new Date(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Restore task
app.post('/api/tasks/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await queryDatabase(`
      UPDATE tasks SET deleted = false, deleted_at = null, updated_at = $1 
      WHERE id = $2 RETURNING *
    `, [new Date(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error restoring task:', err);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

// Permanently delete task
app.delete('/api/tasks/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await queryDatabase('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task permanently deleted', task: result.rows[0] });
  } catch (err) {
    console.error('Error permanently deleting task:', err);
    res.status(500).json({ error: 'Failed to permanently delete task' });
  }
});

// ==================== PROJECT ROUTES ====================

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    const result = await queryDatabase(`
      INSERT INTO projects (user_id, name, description, color, icon, status) 
      VALUES ((SELECT id FROM users LIMIT 1), $1, $2, $3, $4, $5) 
      RETURNING *
    `, [
      req.body.name,
      req.body.description || '',
      req.body.color || '#6366f1',
      req.body.icon || '📁',
      req.body.status || 'active'
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    const result = await queryDatabase(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update tasks to remove project reference
    await queryDatabase(`
      UPDATE tasks SET project_id = null, updated_at = $1 
      WHERE project_id = $2
    `, [new Date(), id]);
    
    const result = await queryDatabase('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ==================== FOCUS ROUTES ====================

// Get user profile
app.get('/api/focus/profile', async (req, res) => {
  try {
    const result = await queryDatabase(`
      SELECT u.username, up.* 
      FROM user_profiles up 
      JOIN users u ON up.user_id = u.id 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Calculate XP to next level
    const profile = result.rows[0];
    profile.xpToNextLevel = 1000 - (profile.xp % 1000);
    
    res.json(profile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
app.put('/api/focus/profile', async (req, res) => {
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id' && key !== 'user_id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    const query = `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = (SELECT id FROM users LIMIT 1) RETURNING *`;
    const result = await queryDatabase(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get achievements
app.get('/api/focus/achievements', async (req, res) => {
  try {
    const result = await queryDatabase(`
      SELECT a.*, ua.progress, ua.unlocked_at, 
             CASE WHEN ua.unlocked_at IS NOT NULL THEN true ELSE false END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
        AND ua.user_id = (SELECT id FROM users LIMIT 1)
      ORDER BY a.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get analytics
app.get('/api/focus/analytics', async (req, res) => {
  try {
    // Get focus session stats
    const sessionStats = await queryDatabase(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(actual_duration) as total_focus_time,
        AVG(productivity_score) as avg_productivity,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions
      FROM focus_sessions 
      WHERE user_id = (SELECT id FROM users LIMIT 1)
    `);

    const stats = sessionStats.rows[0];
    const totalSessions = parseInt(stats.total_sessions);
    const completedSessions = parseInt(stats.completed_sessions);
    
    // Calculate weekly stats
    const weeklyStats = await queryDatabase(`
      SELECT 
        EXTRACT(DOW FROM start_time) as day_of_week,
        COUNT(*) as sessions,
        AVG(productivity_score) as productivity,
        SUM(actual_duration) as total_time
      FROM focus_sessions 
      WHERE user_id = (SELECT id FROM users LIMIT 1)
        AND start_time >= CURRENT_DATE - INTERVAL '7 days'
        AND status = 'completed'
      GROUP BY EXTRACT(DOW FROM start_time)
      ORDER BY day_of_week
    `);

    // Format weekly stats
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const dayData = weeklyStats.rows.find(row => parseInt(row.day_of_week) === i);
      return {
        day: dayNames[i],
        sessions: dayData ? parseInt(dayData.sessions) : 0,
        productivity: dayData ? Math.round(dayData.productivity) : 0,
        totalTime: dayData ? parseInt(dayData.total_time) : 0
      };
    });

    const analytics = {
      totalSessions,
      totalFocusTime: parseInt(stats.total_focus_time) || 0,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      productivityScore: Math.round(stats.avg_productivity) || 0,
      weeklyStats: weeklyData
    };

    res.json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get focus sessions
app.get('/api/focus/sessions', async (req, res) => {
  try {
    const result = await queryDatabase(`
      SELECT fs.*, t.title as task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON fs.task_id = t.id
      WHERE fs.user_id = (SELECT id FROM users LIMIT 1)
      ORDER BY fs.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching focus sessions:', err);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// Create focus session
app.post('/api/focus/sessions', async (req, res) => {
  try {
    const result = await queryDatabase(`
      INSERT INTO focus_sessions (
        user_id, task_id, preset, duration, actual_duration, start_time, 
        end_time, status, breaks_taken, distractions, mood_before, 
        mood_after, productivity_score, notes
      ) VALUES (
        (SELECT id FROM users LIMIT 1), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `, [
      req.body.task_id || null,
      req.body.preset,
      req.body.duration,
      req.body.actual_duration || req.body.duration,
      req.body.start_time || new Date(),
      req.body.end_time || null,
      req.body.status || 'active',
      req.body.breaks_taken || 0,
      req.body.distractions || 0,
      req.body.mood_before || 'neutral',
      req.body.mood_after || null,
      req.body.productivity_score || 50,
      req.body.notes || ''
    ]);

    // Update user profile stats if session completed
    if (req.body.status === 'completed') {
      await updateUserStatsFromSession(result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating focus session:', err);
    res.status(500).json({ error: 'Failed to create focus session' });
  }
});

// Update focus session
app.put('/api/focus/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE focus_sessions SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    const result = await queryDatabase(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Focus session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating focus session:', err);
    res.status(500).json({ error: 'Failed to update focus session' });
  }
});

// Helper function to update user stats
async function updateUserStatsFromSession(session) {
  try {
    const stats = await queryDatabase(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(actual_duration) as total_focus_time,
        AVG(productivity_score) as avg_productivity
      FROM focus_sessions 
      WHERE user_id = (SELECT id FROM users LIMIT 1) AND status = 'completed'
    `);

    const xpGained = Math.round(session.actual_duration * (session.productivity_score / 100) * 10);
    
    await queryDatabase(`
      UPDATE user_profiles SET 
        total_focus_time = $1,
        xp = xp + $2,
        updated_at = $3
      WHERE user_id = (SELECT id FROM users LIMIT 1)
    `, [
      parseInt(stats.rows[0].total_focus_time) || 0,
      xpGained,
      new Date()
    ]);

  } catch (err) {
    console.error('Error updating user stats:', err);
  }
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const taskCount = await queryDatabase('SELECT COUNT(*) FROM tasks WHERE deleted = false');
    const projectCount = await queryDatabase('SELECT COUNT(*) FROM projects');
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      tasks: parseInt(taskCount.rows[0].count),
      projects: parseInt(projectCount.rows[0].count)
    });
  } catch (err) {
    res.json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: err.message 
    });
  }
});

// Start server and seed database
async function startServer() {
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();
  
  if (connected) {
    await seedDatabase();
  } else {
    console.log('⚠️  Starting server without database connection. Some features may not work.');
  }
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 LifeSync Database API server running at:`);
    console.log(`   Local:    http://localhost:${port}`);
    console.log(`   Network:  http://10.247.209.223:${port}`);
    console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
    console.log(`💾 Database: PostgreSQL ${connected ? '(Connected)' : '(Connection Failed)'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;