-- Seed data for LifeSync Database

-- Insert default user
INSERT INTO users (username, email, first_name, last_name) VALUES
('lifesync_user', 'user@lifesync.com', 'LifeSync', 'User');

-- Get user ID for subsequent inserts
DO $$
DECLARE
    user_uuid UUID;
    work_project_id UUID;
    learning_project_id UUID;
    health_project_id UUID;
    personal_project_id UUID;
    task1_id UUID;
    task2_id UUID;
    achievement1_id UUID;
    achievement2_id UUID;
    achievement3_id UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE username = 'lifesync_user';
    
    -- Create user profile
    INSERT INTO user_profiles (user_id, level, xp, current_streak, total_focus_time) VALUES
    (user_uuid, 12, 8450, 7, 1240);
    
    -- Create default projects
    INSERT INTO projects (user_id, name, description, color, icon, status) VALUES
    (user_uuid, 'Personal', 'Personal tasks and goals', '#6366f1', '👤', 'active') RETURNING id INTO personal_project_id;
    
    INSERT INTO projects (user_id, name, description, color, icon, status) VALUES
    (user_uuid, 'Work', 'Work-related tasks', '#10b981', '💼', 'active') RETURNING id INTO work_project_id;
    
    INSERT INTO projects (user_id, name, description, color, icon, status) VALUES
    (user_uuid, 'Learning', 'Learning and development', '#f59e0b', '📚', 'active') RETURNING id INTO learning_project_id;
    
    INSERT INTO projects (user_id, name, description, color, icon, status) VALUES
    (user_uuid, 'Health', 'Health and wellness', '#ef4444', '❤️', 'active') RETURNING id INTO health_project_id;
    
    -- Create sample tasks
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, estimated_time, tags, category, due_date) VALUES
    (user_uuid, work_project_id, 'Setup development environment', 'Configure all tools and dependencies for the project', 'done', 'high', 60, ARRAY['setup', 'development'], 'work', NOW() - INTERVAL '1 day') RETURNING id INTO task1_id;
    
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, estimated_time, tags, category, due_date) VALUES
    (user_uuid, work_project_id, 'Review project requirements', 'Go through all requirements and create task breakdown', 'todo', 'medium', 45, ARRAY['planning', 'requirements'], 'work', NOW() + INTERVAL '2 days');
    
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, estimated_time, tags, category, due_date) VALUES
    (user_uuid, health_project_id, 'Morning workout', '30 minute cardio session', 'todo', 'low', 30, ARRAY['exercise', 'morning'], 'health', NOW());
    
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, estimated_time, tags, category, due_date) VALUES
    (user_uuid, learning_project_id, 'Read React documentation', 'Study new React 18 features and concurrent rendering', 'in_progress', 'medium', 90, ARRAY['react', 'documentation'], 'learning', NOW() + INTERVAL '3 days') RETURNING id INTO task2_id;
    
    -- Create achievements
    INSERT INTO achievements (name, description, icon, rarity, xp_reward) VALUES
    ('First Steps', 'Complete your first focus session', '🎯', 'common', 100) RETURNING id INTO achievement1_id;
    
    INSERT INTO achievements (name, description, icon, rarity, xp_reward) VALUES
    ('Focus Master', 'Complete 25 focus sessions', '🧠', 'rare', 500) RETURNING id INTO achievement2_id;
    
    INSERT INTO achievements (name, description, icon, rarity, xp_reward) VALUES
    ('Streak Champion', 'Maintain a 30-day focus streak', '🔥', 'epic', 1000) RETURNING id INTO achievement3_id;
    
    INSERT INTO achievements (name, description, icon, rarity, xp_reward) VALUES
    ('Deep Diver', 'Complete a 2-hour deep work session', '🌊', 'rare', 750);
    
    -- Unlock some achievements for the user
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at) VALUES
    (user_uuid, achievement1_id, 100, NOW() - INTERVAL '30 days');
    
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at) VALUES
    (user_uuid, achievement2_id, 100, NOW() - INTERVAL '15 days');
    
    INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES
    (user_uuid, achievement3_id, 60);
    
    -- Create sample focus sessions
    INSERT INTO focus_sessions (user_id, task_id, preset, duration, actual_duration, start_time, end_time, status, productivity_score, notes) VALUES
    (user_uuid, task1_id, 'pomodoro', 25, 25, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '95 minutes', 'completed', 85, 'Good session, minimal distractions');
    
    INSERT INTO focus_sessions (user_id, task_id, preset, duration, actual_duration, start_time, end_time, status, productivity_score, notes) VALUES
    (user_uuid, task2_id, 'deep-work', 90, 75, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '15 minutes', 'completed', 92, 'Deep work session, excellent focus');
    
END $$;