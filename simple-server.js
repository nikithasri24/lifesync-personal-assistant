// Simple LifeSync Server with Mock Data
// For demonstration purposes, using in-memory data that persists during server session

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced in-memory database-like storage
// Focus Sessions Database Table
let focusSessions = [
  {
    id: 'fs1',
    user_id: 'user1',
    preset: 'pomodoro',
    duration: 25,
    actualDuration: 25,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    status: 'completed',
    task_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    breaks_taken: 1,
    distractions: 2,
    mood_before: 'neutral',
    mood_after: 'focused',
    productivity_score: 85,
    notes: 'Good session, minimal distractions',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'fs2',
    user_id: 'user1',
    preset: 'deep-work',
    duration: 90,
    actualDuration: 75,
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
    status: 'completed',
    task_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    breaks_taken: 0,
    distractions: 0,
    mood_before: 'tired',
    mood_after: 'accomplished',
    productivity_score: 92,
    notes: 'Deep work session, excellent focus',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

// User Profile Database Table
let userProfile = {
  id: 'user1',
  username: 'FocusWarrior',
  email: 'user@example.com',
  level: 12,
  xp: 8450,
  xpToNextLevel: 1550,
  currentStreak: 7,
  longestStreak: 14,
  totalSessions: 47,
  totalFocusTime: 1240, // in minutes
  completionRate: 87,
  productivityScore: 85,
  preferredSessionLength: 25,
  timezone: 'UTC',
  avatar: '🧠',
  joinedAt: new Date('2024-01-01').toISOString(),
  lastActiveAt: new Date().toISOString(),
  settings: {
    notifications: true,
    sounds: true,
    autoBreaks: true,
    strictMode: false
  },
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date().toISOString()
};

// Achievements Database Table
let achievements = [
  { 
    id: '1', 
    name: 'First Steps', 
    description: 'Complete your first focus session',
    icon: '🎯', 
    unlocked: true, 
    rarity: 'common',
    xp_reward: 100,
    unlocked_at: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  { 
    id: '2', 
    name: 'Focus Master', 
    description: 'Complete 25 focus sessions',
    icon: '🧠', 
    unlocked: true, 
    rarity: 'rare',
    xp_reward: 500,
    unlocked_at: new Date('2024-01-15').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  { 
    id: '3', 
    name: 'Streak Champion', 
    description: 'Maintain a 30-day focus streak',
    icon: '🔥', 
    unlocked: false, 
    rarity: 'epic', 
    progress: 60,
    xp_reward: 1000,
    created_at: new Date('2024-01-01').toISOString()
  },
  { 
    id: '4', 
    name: 'Deep Diver', 
    description: 'Complete a 2-hour deep work session',
    icon: '🌊', 
    unlocked: false, 
    rarity: 'rare', 
    progress: 0,
    xp_reward: 750,
    created_at: new Date('2024-01-01').toISOString()
  }
];

// Weekly Statistics - Dynamic calculation based on focus sessions
function calculateWeeklyStats() {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const weekStats = [];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day.setHours(23, 59, 59, 999));
    
    const daySessions = focusSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= dayStart && sessionDate <= dayEnd && session.status === 'completed';
    });
    
    const avgProductivity = daySessions.length > 0 
      ? Math.round(daySessions.reduce((sum, s) => sum + s.productivity_score, 0) / daySessions.length)
      : 0;
    
    weekStats.push({
      day: dayNames[i],
      date: day.toISOString().split('T')[0],
      sessions: daySessions.length,
      productivity: avgProductivity,
      totalTime: daySessions.reduce((sum, s) => sum + s.actualDuration, 0)
    });
  }
  
  return weekStats;
}

let tasks = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Setup development environment',
    description: 'Configure all tools and dependencies for the project',
    project_id: '22222222-2222-2222-2222-222222222222',
    status: 'done',
    priority: 'high',
    estimated_time: 60,
    actual_time: 60,
    due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: ['setup', 'development'],
    category: 'work',
    starred: false,
    archived: false,
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'Review project requirements',
    description: 'Go through all requirements and create task breakdown',
    project_id: '22222222-2222-2222-2222-222222222222',
    status: 'todo',
    priority: 'medium',
    estimated_time: 45,
    actual_time: 0,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['planning', 'requirements'],
    category: 'work',
    starred: true,
    archived: false,
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'Morning workout',
    description: '30 minute cardio session',
    project_id: '44444444-4444-4444-4444-444444444444',
    status: 'todo',
    priority: 'low',
    estimated_time: 30,
    actual_time: 0,
    due_date: new Date().toISOString(),
    tags: ['exercise', 'morning'],
    category: 'health',
    starred: false,
    archived: false,
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    title: 'Read React documentation',
    description: 'Study new React 18 features and concurrent rendering',
    project_id: '33333333-3333-3333-3333-333333333333',
    status: 'in_progress',
    priority: 'medium',
    estimated_time: 90,
    actual_time: 45,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['react', 'documentation'],
    category: 'learning',
    starred: false,
    archived: false,
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let projects = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Personal',
    description: 'Personal tasks and goals',
    color: '#6366f1',
    icon: '👤',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Work',
    description: 'Work-related tasks',
    color: '#10b981',
    icon: '💼',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Learning',
    description: 'Learning and development',
    color: '#f59e0b',
    icon: '📚',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Health',
    description: 'Health and wellness',
    color: '#ef4444',
    icon: '❤️',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Utility functions
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    // Add project information to tasks
    const tasksWithProjects = tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id);
      return {
        ...task,
        project_name: project?.name,
        project_color: project?.color,
        project_icon: project?.icon
      };
    });
    res.json(tasksWithProjects);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create task
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json(tasks[taskIndex]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (soft delete)
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(tasks[taskIndex]);
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Restore task
app.post('/api/tasks/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      deleted: false,
      deleted_at: null,
      updated_at: new Date().toISOString()
    };
    
    res.json(tasks[taskIndex]);
  } catch (err) {
    console.error('Error restoring task:', err);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

// Permanently delete task
app.delete('/api/tasks/:id/permanent', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    
    res.json({ message: 'Task permanently deleted', task: deletedTask });
  } catch (err) {
    console.error('Error permanently deleting task:', err);
    res.status(500).json({ error: 'Failed to permanently delete task' });
  }
});

// Create project
app.post('/api/projects', (req, res) => {
  try {
    const newProject = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    projects.unshift(newProject);
    res.status(201).json(newProject);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json(projects[projectIndex]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update tasks to remove project reference
    tasks = tasks.map(task => 
      task.project_id === id 
        ? { ...task, project_id: null, updated_at: new Date().toISOString() }
        : task
    );
    
    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1);
    
    res.json({ message: 'Project deleted', project: deletedProject });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Focus session routes

// Get user profile
app.get('/api/focus/profile', (req, res) => {
  try {
    res.json(userProfile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
app.put('/api/focus/profile', (req, res) => {
  try {
    userProfile = {
      ...userProfile,
      ...req.body,
      updated_at: new Date().toISOString()
    };
    res.json(userProfile);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get achievements
app.get('/api/focus/achievements', (req, res) => {
  try {
    res.json(achievements);
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get analytics/weekly stats
app.get('/api/focus/analytics', (req, res) => {
  try {
    // Calculate real-time analytics from focus sessions
    const completedSessions = focusSessions.filter(s => s.status === 'completed');
    const totalSessions = completedSessions.length;
    const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.actualDuration, 0);
    const avgProductivity = totalSessions > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + s.productivity_score, 0) / totalSessions)
      : 0;
    
    // Calculate completion rate (completed vs total sessions including cancelled)
    const allSessions = focusSessions.length;
    const completionRate = allSessions > 0 ? Math.round((totalSessions / allSessions) * 100) : 0;
    
    // Calculate weekly stats dynamically
    const weeklyStats = calculateWeeklyStats();
    
    // Calculate additional insights
    const lastWeekSessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= weekAgo;
    });
    
    const analytics = {
      totalSessions,
      totalFocusTime,
      completionRate,
      productivityScore: avgProductivity,
      weeklyStats,
      insights: {
        averageSessionLength: totalSessions > 0 ? Math.round(totalFocusTime / totalSessions) : 0,
        totalBreaksTaken: completedSessions.reduce((sum, s) => sum + (s.breaks_taken || 0), 0),
        totalDistractions: completedSessions.reduce((sum, s) => sum + (s.distractions || 0), 0),
        lastWeekSessions: lastWeekSessions.length,
        mostProductiveHour: getMostProductiveHour(completedSessions),
        favoritePreset: getFavoritePreset(completedSessions)
      }
    };
    res.json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to get most productive hour
function getMostProductiveHour(sessions) {
  const hourStats = {};
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    if (!hourStats[hour]) {
      hourStats[hour] = { count: 0, totalProductivity: 0 };
    }
    hourStats[hour].count++;
    hourStats[hour].totalProductivity += session.productivity_score;
  });
  
  let bestHour = 9; // default
  let bestScore = 0;
  
  Object.keys(hourStats).forEach(hour => {
    const avgProductivity = hourStats[hour].totalProductivity / hourStats[hour].count;
    if (avgProductivity > bestScore) {
      bestScore = avgProductivity;
      bestHour = parseInt(hour);
    }
  });
  
  return bestHour;
}

// Helper function to get favorite preset
function getFavoritePreset(sessions) {
  const presetCounts = {};
  sessions.forEach(session => {
    presetCounts[session.preset] = (presetCounts[session.preset] || 0) + 1;
  });
  
  return Object.keys(presetCounts).reduce((a, b) => 
    presetCounts[a] > presetCounts[b] ? a : b, 'pomodoro'
  );
}

// Get focus sessions
app.get('/api/focus/sessions', (req, res) => {
  try {
    res.json(focusSessions);
  } catch (err) {
    console.error('Error fetching focus sessions:', err);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// Create focus session
app.post('/api/focus/sessions', (req, res) => {
  try {
    // Validate required fields
    const { preset, duration, startTime, user_id = 'user1' } = req.body;
    
    if (!preset || !duration || !startTime) {
      return res.status(400).json({ error: 'Missing required fields: preset, duration, startTime' });
    }
    
    const newSession = {
      id: generateId(),
      user_id,
      preset,
      duration,
      actualDuration: req.body.actualDuration || duration,
      startTime: req.body.startTime,
      endTime: req.body.endTime || null,
      status: req.body.status || 'active',
      task_id: req.body.task_id || null,
      breaks_taken: req.body.breaks_taken || 0,
      distractions: req.body.distractions || 0,
      mood_before: req.body.mood_before || 'neutral',
      mood_after: req.body.mood_after || null,
      productivity_score: req.body.productivity_score || 50,
      notes: req.body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    focusSessions.unshift(newSession);
    
    // Update user profile stats if session is completed
    if (newSession.status === 'completed') {
      updateUserStatsFromSession(newSession);
    }
    
    res.status(201).json(newSession);
  } catch (err) {
    console.error('Error creating focus session:', err);
    res.status(500).json({ error: 'Failed to create focus session' });
  }
});

// Helper function to update user stats from completed session
function updateUserStatsFromSession(session) {
  const completedSessions = focusSessions.filter(s => s.status === 'completed');
  const totalSessions = completedSessions.length;
  const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const avgProductivity = totalSessions > 0 
    ? Math.round(completedSessions.reduce((sum, s) => sum + s.productivity_score, 0) / totalSessions)
    : 0;
  
  // Update user profile with new stats
  userProfile.totalSessions = totalSessions;
  userProfile.totalFocusTime = totalFocusTime;
  userProfile.productivityScore = avgProductivity;
  userProfile.lastActiveAt = new Date().toISOString();
  userProfile.updated_at = new Date().toISOString();
  
  // Award XP based on session duration and productivity
  const xpGained = Math.round(session.actualDuration * (session.productivity_score / 100) * 10);
  userProfile.xp += xpGained;
  
  // Check for level up (every 1000 XP)
  const newLevel = Math.floor(userProfile.xp / 1000) + 1;
  if (newLevel > userProfile.level) {
    userProfile.level = newLevel;
    userProfile.xpToNextLevel = 1000 - (userProfile.xp % 1000);
  } else {
    userProfile.xpToNextLevel = 1000 - (userProfile.xp % 1000);
  }
  
  // Update streak (simplified - just increment for demo)
  const today = new Date().toDateString();
  const lastActive = new Date(userProfile.lastActiveAt).toDateString();
  if (today !== lastActive) {
    userProfile.currentStreak += 1;
  }
  
  // Check for achievement unlocks
  checkAndUnlockAchievements();
}

// Helper function to check and unlock achievements
function checkAndUnlockAchievements() {
  const completedSessions = focusSessions.filter(s => s.status === 'completed');
  
  achievements.forEach(achievement => {
    if (achievement.unlocked) return;
    
    let shouldUnlock = false;
    
    switch (achievement.id) {
      case '3': // Streak Champion - 30 day streak
        achievement.progress = Math.min(100, Math.round((userProfile.currentStreak / 30) * 100));
        shouldUnlock = userProfile.currentStreak >= 30;
        break;
      case '4': // Deep Diver - 2 hour session
        const longSessions = completedSessions.filter(s => s.actualDuration >= 120);
        shouldUnlock = longSessions.length > 0;
        break;
    }
    
    if (shouldUnlock) {
      achievement.unlocked = true;
      achievement.unlocked_at = new Date().toISOString();
      userProfile.xp += achievement.xp_reward;
    }
  });
}

// Update focus session
app.put('/api/focus/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sessionIndex = focusSessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Focus session not found' });
    }
    
    const wasCompleted = focusSessions[sessionIndex].status === 'completed';
    
    focusSessions[sessionIndex] = {
      ...focusSessions[sessionIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    // Update user stats if session was just completed
    if (!wasCompleted && focusSessions[sessionIndex].status === 'completed') {
      updateUserStatsFromSession(focusSessions[sessionIndex]);
    }
    
    res.json(focusSessions[sessionIndex]);
  } catch (err) {
    console.error('Error updating focus session:', err);
    res.status(500).json({ error: 'Failed to update focus session' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tasks: tasks.length,
    projects: projects.length
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync Simple API server running at:`);
  console.log(`   Local:    http://localhost:${port}`);
  console.log(`   Network:  http://10.247.209.223:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`📝 Tasks: ${tasks.length}, Projects: ${projects.length}`);
});

export default app;