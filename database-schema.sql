-- LifeSync Complete Database Schema
-- Comprehensive schema for all LifeSync features: Tasks, Focus, Habits, Finances, Shopping, Meal Planning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS & AUTHENTICATION ====================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- User settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'notifications', 'privacy', 'focus', etc.
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, key)
);

-- ==================== PROJECTS ====================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    icon VARCHAR(10) DEFAULT '📁',
    status VARCHAR(20) DEFAULT 'active', -- active, completed, on_hold, archived
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    priority INTEGER DEFAULT 3, -- 1-5 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TASKS & TODOS ====================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo', -- todo, in_progress, waiting, scheduled, done
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    category VARCHAR(50) DEFAULT 'work', -- work, personal, learning, creative, health, other
    estimated_time INTEGER, -- minutes
    actual_time INTEGER DEFAULT 0, -- minutes
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[], -- Array of tags
    notes TEXT,
    position INTEGER, -- For manual ordering
    starred BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks', -- blocks, related
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id)
);

-- Task comments/notes
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FOCUS & PRODUCTIVITY ====================

-- Focus sessions
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    preset VARCHAR(50) NOT NULL, -- pomodoro, deep-work, creative, etc.
    duration INTEGER NOT NULL, -- planned duration in minutes
    actual_duration INTEGER, -- actual duration in minutes
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled, paused
    breaks_taken INTEGER DEFAULT 0,
    distractions INTEGER DEFAULT 0,
    mood_before VARCHAR(20), -- neutral, excited, tired, stressed, etc.
    mood_after VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
    notes TEXT,
    environment_data JSONB, -- For storing environment settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profile & gamification
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0, -- minutes
    preferred_session_length INTEGER DEFAULT 25, -- minutes
    avatar_emoji VARCHAR(10) DEFAULT '🧠',
    title VARCHAR(100) DEFAULT 'Beginner',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    xp_reward INTEGER DEFAULT 0,
    requirements JSONB, -- Conditions for unlocking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements (unlocked)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ==================== HABITS ====================

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- health, productivity, learning, etc.
    frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    target_value INTEGER DEFAULT 1, -- How many times per frequency
    unit VARCHAR(50), -- minutes, pages, glasses, etc.
    color VARCHAR(7) DEFAULT '#10b981',
    icon VARCHAR(10) DEFAULT '✅',
    streak_count INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    reminder_time TIME,
    reminder_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habit tracking entries
CREATE TABLE habit_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value INTEGER DEFAULT 1, -- Number of times completed
    notes TEXT,
    mood VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(habit_id, date)
);

-- ==================== FINANCES ====================

-- Accounts (bank accounts, credit cards, etc.)
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- checking, savings, credit_card, investment, etc.
    institution VARCHAR(255),
    account_number VARCHAR(100), -- Encrypted
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    color VARCHAR(7) DEFAULT '#059669',
    icon VARCHAR(10) DEFAULT '💳',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories for income/expenses
CREATE TABLE financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- income, expense
    parent_category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(10) DEFAULT '📊',
    budget_amount DECIMAL(12,2), -- Monthly budget for this category
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- income, expense, transfer
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    payee VARCHAR(255),
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, cancelled
    tags TEXT[],
    receipt_url TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB, -- For recurring transactions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, yearly
    start_date DATE NOT NULL,
    end_date DATE,
    categories UUID[], -- Array of category IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SHOPPING ====================

-- Shopping lists
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, archived
    total_estimated_cost DECIMAL(10,2) DEFAULT 0,
    total_actual_cost DECIMAL(10,2) DEFAULT 0,
    store VARCHAR(255),
    shopping_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shopping list items
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50), -- kg, lbs, pieces, etc.
    estimated_price DECIMAL(8,2),
    actual_price DECIMAL(8,2),
    category VARCHAR(100), -- groceries, electronics, clothing, etc.
    brand VARCHAR(100),
    notes TEXT,
    is_purchased BOOLEAN DEFAULT false,
    purchased_at TIMESTAMP WITH TIME ZONE,
    position INTEGER, -- For ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product catalog (for suggestions and price tracking)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    barcode VARCHAR(50),
    average_price DECIMAL(8,2),
    unit VARCHAR(50),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== MEAL PLANNING ====================

-- Recipes
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    servings INTEGER DEFAULT 4,
    calories_per_serving INTEGER,
    instructions TEXT,
    image_url TEXT,
    source_url TEXT,
    tags TEXT[],
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recipe ingredients
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(8,2),
    unit VARCHAR(50),
    notes TEXT,
    position INTEGER, -- For ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal plans
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    week_start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Planned meals
CREATE TABLE planned_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
    date DATE NOT NULL,
    servings INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Tasks
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- Focus sessions
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX idx_focus_sessions_status ON focus_sessions(status);

-- Habits
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_entries_habit_id ON habit_entries(habit_id);
CREATE INDEX idx_habit_entries_date ON habit_entries(date);

-- Financial transactions
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_account_id ON financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_financial_transactions_category_id ON financial_transactions(category_id);

-- Shopping
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_items_list_id ON shopping_items(shopping_list_id);

-- Meal planning
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_planned_meals_meal_plan_id ON planned_meals(meal_plan_id);
CREATE INDEX idx_planned_meals_date ON planned_meals(date);

-- ==================== SEED DATA ====================

-- Insert default achievements
INSERT INTO achievements (name, description, icon, rarity, xp_reward, requirements) VALUES
('First Steps', 'Complete your first focus session', '🎯', 'common', 100, '{"sessions_completed": 1}'),
('Focus Master', 'Complete 25 focus sessions', '🧠', 'rare', 500, '{"sessions_completed": 25}'),
('Streak Champion', 'Maintain a 30-day focus streak', '🔥', 'epic', 1000, '{"streak_days": 30}'),
('Deep Diver', 'Complete a 2-hour deep work session', '🌊', 'rare', 750, '{"session_duration_minutes": 120}'),
('Early Bird', 'Complete 10 sessions before 8 AM', '🌅', 'uncommon', 300, '{"early_sessions": 10}'),
('Night Owl', 'Complete 10 sessions after 10 PM', '🦉', 'uncommon', 300, '{"late_sessions": 10}'),
('Productivity Guru', 'Achieve 95%+ productivity score for 7 days', '⚡', 'legendary', 2000, '{"high_productivity_days": 7}'),
('Task Slayer', 'Complete 100 tasks', '⚔️', 'epic', 1500, '{"tasks_completed": 100}'),
('Habit Builder', 'Maintain a 21-day habit streak', '🏗️', 'rare', 800, '{"habit_streak": 21}'),
('Budget Master', 'Stay within budget for 3 months', '💰', 'epic', 1200, '{"budget_months": 3}');

-- Insert default financial categories
INSERT INTO financial_categories (name, type, color, icon) VALUES
-- Expense categories
('Food & Dining', 'expense', '#ef4444', '🍽️'),
('Transportation', 'expense', '#3b82f6', '🚗'),
('Shopping', 'expense', '#8b5cf6', '🛍️'),
('Entertainment', 'expense', '#06b6d4', '🎬'),
('Bills & Utilities', 'expense', '#f59e0b', '💡'),
('Healthcare', 'expense', '#10b981', '🏥'),
('Education', 'expense', '#6366f1', '📚'),
('Travel', 'expense', '#84cc16', '✈️'),
-- Income categories
('Salary', 'income', '#059669', '💼'),
('Freelance', 'income', '#0ea5e9', '💻'),
('Investments', 'income', '#7c3aed', '📈'),
('Other Income', 'income', '#dc2626', '💵');

-- Create initial admin user (password: 'admin123')
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('admin', 'admin@lifesync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/9E5Q8dKWv4K2nP5Qu', 'Admin', 'User');

-- Get the admin user ID for subsequent inserts
-- Note: In a real application, this would be handled by the application layer