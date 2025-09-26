// LifeSync Database Server
// Simple Express.js server to handle PostgreSQL operations from the React frontend

import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import fetch from 'node-fetch';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;
const SKIP_DB = process.env.SKIP_DB === '1';

// Database connection (optional)
let pool;
if (!SKIP_DB) {
  const dbConfig = {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'lifesync',
    password: process.env.PGPASSWORD || 'lifesync123',
    port: Number(process.env.PGPORT || 5432),
    connectionTimeoutMillis: 5000,
  };
  pool = new Pool(dbConfig);
}

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection (if enabled)
if (!SKIP_DB && pool) {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('Connected to PostgreSQL database at:', res.rows[0].now);
    }
  });
} else {
  console.log('DB disabled (SKIP_DB=1). Running proxy-only/server utility routes.');
}

// Routes
// Simple proxy for YouTube snippet to avoid CORS in browser
app.get('/api/youtube/snippet', async (req, res) => {
  try {
    const rawVideoId = String(req.query.videoId || '').trim()
    const rawUrl = String(req.query.url || '').trim()
    const extractId = (u) => {
      try {
        const parsed = new URL(u)
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
        if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2]
        const v = parsed.searchParams.get('v')
        if (v) return v
        const m = u.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/)
        return m ? (m[1] || m[2]) : null
      } catch { return null }
    }
    const videoId = rawVideoId || (rawUrl ? extractId(rawUrl) : '')
    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide ?url=...)' })

    // Primary: yt.lemnoslife snippet
    const primary = `https://yt.lemnoslife.com/videos?part=snippet&id=${encodeURIComponent(videoId)}`
    const pResp = await fetch(primary, { headers: { 'Accept': 'application/json' } })
    if (pResp.ok) {
      const data = await pResp.json()
      res.setHeader('Cache-Control', 'public, max-age=300')
      return res.json(data)
    }

    // Fallback: YouTube oEmbed (limited fields)
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    const oResp = await fetch(oembed, { headers: { 'Accept': 'application/json' } })
    if (oResp.ok) {
      const oe = await oResp.json()
      const normalized = {
        items: [
          {
            snippet: {
              title: oe.title,
              description: '',
              thumbnails: { medium: { url: oe.thumbnail_url }, default: { url: oe.thumbnail_url } },
              channelTitle: oe.author_name,
            },
          },
        ],
      }
      res.setHeader('Cache-Control', 'public, max-age=300')
      return res.json(normalized)
    }

    const text = await pResp.text().catch(() => '')
    console.error('Upstream error (both snippet and oembed failed)', pResp.status, text)
    return res.status(502).json({ error: 'Upstream error', status: pResp.status })
  } catch (e) {
    console.error('YouTube snippet proxy failed', e)
    res.status(500).json({ error: 'Failed to fetch YouTube snippet' })
  }
});

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
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
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
    const updates = req.body;
    
    // Build dynamic update query
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
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
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
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Restore task
app.post('/api/tasks/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE tasks SET deleted = false, deleted_at = NULL
      WHERE id = $1
      RETURNING *
    `, [id]);

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
    const result = await pool.query(`
      DELETE FROM tasks WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task permanently deleted', task: result.rows[0] });
  } catch (err) {
    console.error('Error permanently deleting task:', err);
    res.status(500).json({ error: 'Failed to permanently delete task' });
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
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
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
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update tasks to remove project reference
    await pool.query('UPDATE tasks SET project_id = NULL WHERE project_id = $1', [id]);
    
    // Delete project
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 LifeSync API server running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

export default app;
