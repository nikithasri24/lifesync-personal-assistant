-- Seed Achievement Definitions
-- Default achievements for the gamification system

INSERT INTO achievement_definitions (name, description, icon, category, rarity, requirement_type, requirement_target, xp_reward, sort_order) VALUES

-- Streak Achievements
('First Steps', 'Complete your first activity', '🎯', 'streak', 'common', 'streak_days', 1, 50, 1),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 'common', 'streak_days', 7, 100, 2),
('Fortnight Fighter', 'Maintain a 14-day streak', '💪', 'streak', 'rare', 'streak_days', 14, 250, 3),
('Month Master', 'Maintain a 30-day streak', '🏆', 'streak', 'epic', 'streak_days', 30, 500, 4),
('Streak Legend', 'Maintain a 100-day streak', '👑', 'streak', 'legendary', 'streak_days', 100, 2000, 5),

-- Task Completion Achievements
('Task Starter', 'Complete your first task', '✅', 'completion', 'common', 'tasks_completed', 1, 25, 10),
('Task Tackler', 'Complete 10 tasks', '📋', 'completion', 'common', 'tasks_completed', 10, 75, 11),
('Productivity Pro', 'Complete 50 tasks', '⚡', 'completion', 'rare', 'tasks_completed', 50, 200, 12),
('Task Titan', 'Complete 100 tasks', '🚀', 'completion', 'rare', 'tasks_completed', 100, 400, 13),
('Task Terminator', 'Complete 500 tasks', '🤖', 'completion', 'epic', 'tasks_completed', 500, 1000, 14),
('Task God', 'Complete 1000 tasks', '⭐', 'completion', 'legendary', 'tasks_completed', 1000, 2500, 15),

-- Habit Achievements
('Habit Hatcher', 'Complete your first habit', '🌱', 'completion', 'common', 'habits_completed', 1, 25, 20),
('Habit Builder', 'Complete 25 habit entries', '🌿', 'completion', 'common', 'habits_completed', 25, 100, 21),
('Habit Hero', 'Complete 100 habit entries', '🌳', 'completion', 'rare', 'habits_completed', 100, 300, 22),
('Habit Master', 'Complete 500 habit entries', '🏔️', 'completion', 'epic', 'habits_completed', 500, 750, 23),
('Habit Legend', 'Complete 1000 habit entries', '🌟', 'completion', 'legendary', 'habits_completed', 1000, 2000, 24),

-- Goal Achievements
('Dream Starter', 'Achieve your first goal', '🎯', 'milestone', 'common', 'goals_achieved', 1, 100, 30),
('Goal Getter', 'Achieve 5 goals', '🏅', 'milestone', 'rare', 'goals_achieved', 5, 300, 31),
('Goal Crusher', 'Achieve 25 goals', '💎', 'milestone', 'epic', 'goals_achieved', 25, 750, 32),
('Life Champion', 'Achieve 100 goals', '🌈', 'milestone', 'legendary', 'goals_achieved', 100, 3000, 33),

-- Focus Time Achievements
('Focus Newbie', 'Complete 1 hour of focus time', '🧘', 'time', 'common', 'focus_minutes', 60, 50, 40),
('Focus Apprentice', 'Complete 10 hours of focus time', '📚', 'time', 'common', 'focus_minutes', 600, 150, 41),
('Focus Journeyman', 'Complete 50 hours of focus time', '🎓', 'time', 'rare', 'focus_minutes', 3000, 400, 42),
('Focus Master', 'Complete 100 hours of focus time', '🧠', 'time', 'epic', 'focus_minutes', 6000, 800, 43),
('Focus Sage', 'Complete 500 hours of focus time', '🔮', 'time', 'legendary', 'focus_minutes', 30000, 2500, 44),

-- Level Milestones
('Level 5', 'Reach level 5', '⬆️', 'milestone', 'common', 'level_reached', 5, 100, 50),
('Level 10', 'Reach level 10', '🔟', 'milestone', 'rare', 'level_reached', 10, 250, 51),
('Level 25', 'Reach level 25', '🎖️', 'milestone', 'epic', 'level_reached', 25, 500, 52),
('Level 50', 'Reach level 50', '👸', 'milestone', 'legendary', 'level_reached', 50, 1500, 53),

-- XP Milestones
('Thousand Club', 'Earn 1,000 XP', '💯', 'milestone', 'common', 'total_xp', 1000, 50, 60),
('XP Collector', 'Earn 10,000 XP', '💰', 'milestone', 'rare', 'total_xp', 10000, 200, 61),
('XP Hoarder', 'Earn 50,000 XP', '🏦', 'milestone', 'epic', 'total_xp', 50000, 500, 62),
('XP Mogul', 'Earn 100,000 XP', '💎', 'milestone', 'legendary', 'total_xp', 100000, 1000, 63);

