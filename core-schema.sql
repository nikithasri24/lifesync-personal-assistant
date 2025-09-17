-- LifeSync Core Database Schema
-- Starting with essential tables for immediate functionality

-- ==================== USERS ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PROJECTS ====================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(10) DEFAULT '📁',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TASKS ====================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50) DEFAULT 'work',
    estimated_time INTEGER,
    actual_time INTEGER DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    notes TEXT,
    starred BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FOCUS SESSIONS ====================
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    preset VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL,
    actual_duration INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    breaks_taken INTEGER DEFAULT 0,
    distractions INTEGER DEFAULT 0,
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== USER PROFILES ====================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0,
    preferred_session_length INTEGER DEFAULT 25,
    avatar_emoji VARCHAR(10) DEFAULT '🧠',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ACHIEVEMENTS ====================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common',
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements (unlocked)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ==================== INDEXES ====================
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(start_time);

-- ==================== SEED DATA ====================

-- Create default user
INSERT INTO users (username, email, first_name, last_name) VALUES
('lifesync_user', 'user@lifesync.com', 'LifeSync', 'User');

-- Get user ID for subsequent inserts
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE username = 'lifesync_user';
    
    -- Create user profile
    INSERT INTO user_profiles (user_id, level, xp, current_streak, total_focus_time) VALUES
    (user_uuid, 12, 8450, 7, 1240);
    
    -- Create default projects
    INSERT INTO projects (user_id, name, description, color, icon, status) VALUES
    (user_uuid, 'Personal', 'Personal tasks and goals', '#6366f1', '👤', 'active'),
    (user_uuid, 'Work', 'Work-related tasks', '#10b981', '💼', 'active'),
    (user_uuid, 'Learning', 'Learning and development', '#f59e0b', '📚', 'active'),
    (user_uuid, 'Health', 'Health and wellness', '#ef4444', '❤️', 'active');
    
    -- Create sample tasks
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, estimated_time, tags, category) VALUES
    (user_uuid, (SELECT id FROM projects WHERE name = 'Work' AND user_id = user_uuid), 
     'Setup development environment', 'Configure all tools and dependencies for the project', 
     'done', 'high', 60, ARRAY['setup', 'development'], 'work'),
    (user_uuid, (SELECT id FROM projects WHERE name = 'Work' AND user_id = user_uuid), 
     'Review project requirements', 'Go through all requirements and create task breakdown', 
     'todo', 'medium', 45, ARRAY['planning', 'requirements'], 'work'),
    (user_uuid, (SELECT id FROM projects WHERE name = 'Health' AND user_id = user_uuid), 
     'Morning workout', '30 minute cardio session', 
     'todo', 'low', 30, ARRAY['exercise', 'morning'], 'health'),
    (user_uuid, (SELECT id FROM projects WHERE name = 'Learning' AND user_id = user_uuid), 
     'Read React documentation', 'Study new React 18 features and concurrent rendering', 
     'in_progress', 'medium', 90, ARRAY['react', 'documentation'], 'learning');
    
    -- Create sample focus sessions
    INSERT INTO focus_sessions (user_id, task_id, preset, duration, actual_duration, start_time, end_time, status, productivity_score, notes) VALUES
    (user_uuid, (SELECT id FROM tasks WHERE title = 'Setup development environment' AND user_id = user_uuid), 
     'pomodoro', 25, 25, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '95 minutes', 'completed', 85, 'Good session, minimal distractions'),
    (user_uuid, (SELECT id FROM tasks WHERE title = 'Read React documentation' AND user_id = user_uuid), 
     'deep-work', 90, 75, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '15 minutes', 'completed', 92, 'Deep work session, excellent focus');
    
    -- Create achievements
    INSERT INTO achievements (name, description, icon, rarity, xp_reward) VALUES
    ('First Steps', 'Complete your first focus session', '🎯', 'common', 100),
    ('Focus Master', 'Complete 25 focus sessions', '🧠', 'rare', 500),
    ('Streak Champion', 'Maintain a 30-day focus streak', '🔥', 'epic', 1000),
    ('Deep Diver', 'Complete a 2-hour deep work session', '🌊', 'rare', 750);
    
    -- Unlock some achievements for the user
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at) VALUES
    (user_uuid, (SELECT id FROM achievements WHERE name = 'First Steps'), 100, NOW() - INTERVAL '30 days'),
    (user_uuid, (SELECT id FROM achievements WHERE name = 'Focus Master'), 100, NOW() - INTERVAL '15 days'),
    (user_uuid, (SELECT id FROM achievements WHERE name = 'Streak Champion'), 60, NULL);
    
END $$;