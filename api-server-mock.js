import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 LifeSync Mock API server starting...');

// In-memory storage for created data
const storage = {
  tasks: [
    {
      id: 'task-1',
      title: 'Sample Task',
      description: 'This is a sample task from the database',
      status: 'todo',
      priority: 'medium',
      created_at: new Date().toISOString()
    },
    {
      id: 'task-deleted-1',
      title: 'Deleted Task Example',
      description: 'This task was deleted and should appear in trash',
      status: 'done',
      priority: 'low',
      deleted: true,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: 'project-1',
      name: 'Sample Project',
      description: 'This is a sample project',
      color: '#6366f1',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  habits: [
    {
      id: 'habit-1',
      name: 'Sample Habit',
      description: 'This is a sample habit',
      category: 'general',
      frequency: 'daily',
      target_value: 1,
      goal_mode: 'daily-target',
      goal_target: null,
      goal_unit: null,
      current_progress: 0,
      streak_count: 5,
      created_at: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: 'transaction-1',
      type: 'expense',
      amount: 25.99,
      description: 'Sample Transaction',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }
  ],
  shoppingLists: [
    {
      id: 'list-1',
      name: 'Sample Shopping List',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  focusProfiles: [
    {
      id: 'profile-1',
      name: 'Deep Work',
      description: 'Profile for deep focus work sessions',
      work_duration: 50,
      short_break: 10,
      long_break: 20,
      sessions_until_long_break: 3,
      background_sounds: ['nature', 'white-noise'],
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'profile-2', 
      name: 'Quick Tasks',
      description: 'Profile for short bursts of focused work',
      work_duration: 25,
      short_break: 5,
      long_break: 15,
      sessions_until_long_break: 4,
      background_sounds: ['lofi'],
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  focusSessions: [
    {
      id: 'session-1',
      duration: 25,
      start_time: new Date().toISOString(),
      status: 'completed',
      created_at: new Date().toISOString()
    }
  ],
  financialAccounts: [
    {
      id: 'account-1',
      name: 'Primary Checking',
      type: 'checking',
      bank: 'Chase Bank',
      balance: 2500.75,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'account-2', 
      name: 'High Yield Savings',
      type: 'savings',
      bank: 'Ally Bank',
      balance: 15000.00,
      currency: 'USD', 
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'account-3',
      name: 'Investment Portfolio',
      type: 'investment',
      bank: 'Vanguard',
      balance: 45000.25,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: 'txn-1',
      account_id: 'account-1',
      amount: -125.50,
      description: 'Grocery Store Purchase',
      category: 'Food & Dining',
      date: new Date().toISOString(),
      type: 'expense'
    },
    {
      id: 'txn-2',
      account_id: 'account-1', 
      amount: 2500.00,
      description: 'Salary Deposit',
      category: 'Income',
      date: new Date(Date.now() - 86400000).toISOString(),
      type: 'income'
    }
  ],
  recipes: [
    {
      id: 'recipe-1',
      name: 'Sample Recipe',
      difficulty: 'medium',
      prep_time: 15,
      cook_time: 30,
      created_at: new Date().toISOString()
    }
  ]
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET endpoints - return data from storage
app.get('/api/tasks', (req, res) => {
  // Filter out deleted tasks by default
  const activeTasks = storage.tasks.filter(task => !task.deleted);
  console.log(`📋 Returning ${activeTasks.length} active tasks (${storage.tasks.length} total)`);
  res.json(activeTasks);
});

app.get('/api/tasks/deleted', (req, res) => {
  const deletedTasks = storage.tasks.filter(task => task.deleted === true);
  console.log(`🗑️ Returning ${deletedTasks.length} deleted tasks`);
  res.json(deletedTasks);
});

app.get('/api/projects', (req, res) => {
  console.log(`📁 Returning ${storage.projects.length} projects`);
  res.json(storage.projects);
});

app.get('/api/habits', (req, res) => {
  console.log(`🎯 Returning ${storage.habits.length} habits`);
  res.json(storage.habits);
});

app.get('/api/financial/transactions', (req, res) => {
  console.log(`💰 Returning ${storage.transactions.length} transactions`);
  res.json(storage.transactions);
});

app.get('/api/shopping/lists', (req, res) => {
  console.log(`🛒 Returning ${storage.shoppingLists.length} shopping lists`);
  res.json(storage.shoppingLists);
});

app.get('/api/focus/sessions', (req, res) => {
  console.log(`🧘 Returning ${storage.focusSessions.length} focus sessions`);
  res.json(storage.focusSessions);
});

app.get('/api/focus/profiles', (req, res) => {
  console.log(`🎯 Returning ${storage.focusProfiles.length} focus profiles`);
  res.json(storage.focusProfiles);
});

app.get('/api/focus/achievements', (req, res) => {
  const achievements = [
    {
      id: 'achievement-1',
      title: 'Focus Master',
      description: 'Complete 10 focus sessions',
      icon: '🎯',
      progress: 7,
      target: 10,
      unlocked: false,
      category: 'sessions'
    },
    {
      id: 'achievement-2', 
      title: 'Deep Work Hero',
      description: 'Complete 5 sessions over 45 minutes',
      icon: '🧠',
      progress: 3,
      target: 5,
      unlocked: false,
      category: 'duration'
    },
    {
      id: 'achievement-3',
      title: 'Consistency Champion',
      description: 'Complete sessions 7 days in a row',
      icon: '🔥',
      progress: 5,
      target: 7,
      unlocked: false,
      category: 'streak'
    }
  ];
  console.log(`🏆 Returning ${achievements.length} focus achievements`);
  res.json(achievements);
});

app.get('/api/focus/analytics', (req, res) => {
  const analytics = {
    totalSessions: 24,
    totalFocusTime: 980, // minutes
    averageSessionLength: 41,
    streakDays: 5,
    thisWeek: {
      sessions: 8,
      focusTime: 320,
      bestDay: 'Wednesday'
    },
    thisMonth: {
      sessions: 24,
      focusTime: 980,
      improvementRate: 15 // percentage
    },
    productivity: {
      score: 85,
      trend: 'up',
      factors: ['consistency', 'session_length', 'completion_rate']
    },
    topProfiles: [
      { name: 'Deep Work', usage: 60 },
      { name: 'Quick Tasks', usage: 40 }
    ]
  };
  console.log('📊 Returning focus analytics data');
  res.json(analytics);
});

app.get('/api/recipes', (req, res) => {
  console.log(`🍳 Returning ${storage.recipes.length} recipes`);
  res.json(storage.recipes);
});

app.get('/api/finances/accounts', (req, res) => {
  console.log(`💰 Returning ${storage.financialAccounts.length} financial accounts`);
  res.json(storage.financialAccounts);
});

app.get('/api/finances/transactions', (req, res) => {
  console.log(`💳 Returning ${storage.transactions.length} transactions`);
  res.json(storage.transactions);
});

// POST endpoints for creating new data
app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: `task-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.tasks.push(newTask);
  console.log('✅ Created new task:', newTask.title, `(Total: ${storage.tasks.length})`);
  res.status(201).json(newTask);
});

app.post('/api/tasks/:id/restore', (req, res) => {
  const taskIndex = storage.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    storage.tasks[taskIndex] = {
      ...storage.tasks[taskIndex],
      deleted: false,
      updated_at: new Date().toISOString()
    };
    console.log('🔄 Restored task:', req.params.id);
    res.json(storage.tasks[taskIndex]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: `project-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.projects.push(newProject);
  console.log('✅ Created new project:', newProject.name, `(Total: ${storage.projects.length})`);
  res.status(201).json(newProject);
});

app.post('/api/habits', (req, res) => {
  const newHabit = {
    id: `habit-${Date.now()}`,
    ...req.body,
    current_progress: req.body.current_progress || 0,
    streak_count: 0,
    best_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.habits.push(newHabit);
  console.log('✅ Created new habit:', newHabit.name, `(Total: ${storage.habits.length})`);
  res.status(201).json(newHabit);
});

app.post('/api/habits/:id/entries', (req, res) => {
  const habitEntry = {
    id: `entry-${Date.now()}`,
    habit_id: req.params.id,
    ...req.body,
    created_at: new Date().toISOString()
  };
  
  // Update habit progress for goal-based habits
  const habitIndex = storage.habits.findIndex(h => h.id === req.params.id);
  if (habitIndex !== -1) {
    const habit = storage.habits[habitIndex];
    if (habit.goal_mode === 'total-goal' || habit.goal_mode === 'course-completion') {
      habit.current_progress = (habit.current_progress || 0) + (req.body.value || 1);
      habit.updated_at = new Date().toISOString();
      console.log(`📈 Updated habit progress: ${habit.name} - ${habit.current_progress}/${habit.goal_target} ${habit.goal_unit}`);
    }
  }
  
  console.log('✅ Added habit entry for habit:', req.params.id);
  res.status(201).json(habitEntry);
});

app.post('/api/financial/transactions', (req, res) => {
  const newTransaction = {
    id: `transaction-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.transactions.push(newTransaction);
  console.log('✅ Created new financial transaction:', newTransaction.description, `(Total: ${storage.transactions.length})`);
  res.status(201).json(newTransaction);
});

app.post('/api/shopping/lists', (req, res) => {
  const newList = {
    id: `list-${Date.now()}`,
    ...req.body,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('✅ Created new shopping list:', newList.name);
  res.status(201).json(newList);
});

app.post('/api/focus/profiles', (req, res) => {
  const newProfile = {
    id: `profile-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.focusProfiles.push(newProfile);
  console.log('✅ Created new focus profile:', newProfile.name, `(Total: ${storage.focusProfiles.length})`);
  res.status(201).json(newProfile);
});

app.post('/api/finances/accounts', (req, res) => {
  const newAccount = {
    id: `account-${Date.now()}`,
    ...req.body,
    balance: req.body.balance || 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  storage.financialAccounts.push(newAccount);
  console.log('✅ Created new financial account:', newAccount.name, `(Total: ${storage.financialAccounts.length})`);
  res.status(201).json(newAccount);
});

app.post('/api/finances/transactions', (req, res) => {
  const newTransaction = {
    id: `txn-${Date.now()}`,
    ...req.body,
    date: req.body.date || new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  storage.transactions.push(newTransaction);
  console.log('✅ Created new transaction:', newTransaction.description);
  res.status(201).json(newTransaction);
});

app.post('/api/focus/sessions', (req, res) => {
  const newSession = {
    id: `session-${Date.now()}`,
    ...req.body,
    start_time: new Date().toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('✅ Created new focus session');
  res.status(201).json(newSession);
});

app.post('/api/recipes', (req, res) => {
  const newRecipe = {
    id: `recipe-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('✅ Created new recipe:', newRecipe.name);
  res.status(201).json(newRecipe);
});

// PUT endpoints for updating data
app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = storage.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    storage.tasks[taskIndex] = {
      ...storage.tasks[taskIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    console.log('✅ Updated task:', req.params.id);
    res.json(storage.tasks[taskIndex]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.put('/api/projects/:id', (req, res) => {
  const updatedProject = {
    id: req.params.id,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  console.log('✅ Updated project:', req.params.id);
  res.json(updatedProject);
});

app.put('/api/focus/sessions/:id', (req, res) => {
  const updatedSession = {
    id: req.params.id,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  console.log('✅ Updated focus session:', req.params.id);
  res.json(updatedSession);
});

app.put('/api/focus/profiles/:id', (req, res) => {
  const profileIndex = storage.focusProfiles.findIndex(p => p.id === req.params.id);
  if (profileIndex !== -1) {
    storage.focusProfiles[profileIndex] = {
      ...storage.focusProfiles[profileIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    console.log('✅ Updated focus profile:', req.params.id);
    res.json(storage.focusProfiles[profileIndex]);
  } else {
    res.status(404).json({ error: 'Focus profile not found' });
  }
});

app.put('/api/finances/accounts/:id', (req, res) => {
  const accountIndex = storage.financialAccounts.findIndex(a => a.id === req.params.id);
  if (accountIndex !== -1) {
    storage.financialAccounts[accountIndex] = {
      ...storage.financialAccounts[accountIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    console.log('✅ Updated financial account:', req.params.id);
    res.json(storage.financialAccounts[accountIndex]);
  } else {
    res.status(404).json({ error: 'Financial account not found' });
  }
});

app.put('/api/habits/:id', (req, res) => {
  console.log('🔄 PUT request for habit:', req.params.id);
  console.log('📋 Current habits in storage:', storage.habits.map(h => ({ id: h.id, name: h.name })));
  
  const habitIndex = storage.habits.findIndex(h => h.id === req.params.id);
  if (habitIndex !== -1) {
    const updatedHabit = {
      ...storage.habits[habitIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    storage.habits[habitIndex] = updatedHabit;
    console.log('✅ Updated habit:', req.params.id);
    res.json(updatedHabit);
  } else {
    console.log('❌ Habit not found for update:', req.params.id);
    console.log('📋 Available habit IDs:', storage.habits.map(h => h.id));
    res.status(404).json({ error: 'Habit not found' });
  }
});

// DELETE endpoints
app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = storage.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    // Soft delete - mark as deleted instead of removing
    storage.tasks[taskIndex] = {
      ...storage.tasks[taskIndex],
      deleted: true,
      updated_at: new Date().toISOString()
    };
    console.log('🗑️ Soft deleted task:', req.params.id);
    res.json({ message: 'Task deleted', task: storage.tasks[taskIndex] });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/tasks/:id/permanent', (req, res) => {
  const taskIndex = storage.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    const deletedTask = storage.tasks.splice(taskIndex, 1)[0];
    console.log('✅ Permanently deleted task:', req.params.id, `(Remaining: ${storage.tasks.length})`);
    res.json({ message: 'Task permanently deleted', task: deletedTask });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const projectIndex = storage.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex !== -1) {
    const deletedProject = storage.projects.splice(projectIndex, 1)[0];
    console.log('✅ Deleted project:', req.params.id, `(Remaining: ${storage.projects.length})`);
    res.json({ message: 'Project deleted', project: deletedProject });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  const habitIndex = storage.habits.findIndex(h => h.id === req.params.id);
  if (habitIndex !== -1) {
    const deletedHabit = storage.habits.splice(habitIndex, 1)[0];
    console.log('✅ Deleted habit:', deletedHabit.name, `(Remaining: ${storage.habits.length})`);
    res.json({ message: 'Habit deleted', habit: deletedHabit });
  } else {
    res.status(404).json({ error: 'Habit not found' });
  }
});

app.delete('/api/focus/profiles/:id', (req, res) => {
  const profileIndex = storage.focusProfiles.findIndex(p => p.id === req.params.id);
  if (profileIndex !== -1) {
    const deletedProfile = storage.focusProfiles.splice(profileIndex, 1)[0];
    console.log('✅ Deleted focus profile:', deletedProfile.name, `(Remaining: ${storage.focusProfiles.length})`);
    res.json({ message: 'Focus profile deleted', profile: deletedProfile });
  } else {
    res.status(404).json({ error: 'Focus profile not found' });
  }
});

// Analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    tasks: { total: '10', completed: '7' },
    habits: { total: '5' },
    finance: { total: '25', total_expenses: '150.00' },
    focus: { total: '8', total_focus_time: '240' }
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 LifeSync Mock API server running at http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://10.247.209.223:${port}/api/health`);
  console.log(`💡 All endpoints returning sample data for demonstration`);
});

export default app;
