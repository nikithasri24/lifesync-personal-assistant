-- Seed Life Goal Templates
-- Common goal templates users can use to quick-start their goals

INSERT INTO life_goal_templates (name, description, category, difficulty, estimated_duration_days, default_milestones, suggested_tags, tips, resources) VALUES
-- Fitness Goals
('Run a 5K', 'Complete a 5 kilometer run', 'fitness', 'medium', 60,
 '[
   {"title": "Run 1K without stopping", "orderIndex": 0, "estimatedDays": 14},
   {"title": "Run 2K without stopping", "orderIndex": 1, "estimatedDays": 14},
   {"title": "Run 3K without stopping", "orderIndex": 2, "estimatedDays": 14},
   {"title": "Run 5K without stopping", "orderIndex": 3, "estimatedDays": 18}
 ]'::jsonb,
 ARRAY['fitness', 'running', 'endurance'],
 'Follow a couch-to-5K program. Start slow and gradually increase distance. Rest days are crucial for recovery.',
 ARRAY['Couch to 5K app', 'r/C25K community', 'Nike Run Club']
),

('Lose 10kg', 'Lose 10 kilograms of weight', 'health', 'medium', 90,
 '[
   {"title": "Lose 2.5kg", "orderIndex": 0, "estimatedDays": 22},
   {"title": "Lose 5kg", "orderIndex": 1, "estimatedDays": 22},
   {"title": "Lose 7.5kg", "orderIndex": 2, "estimatedDays": 23},
   {"title": "Lose 10kg", "orderIndex": 3, "estimatedDays": 23}
 ]'::jsonb,
 ARRAY['health', 'weight-loss', 'fitness'],
 'Aim for 0.5-1kg per week. Combine calorie deficit with exercise. Track your food intake.',
 ARRAY['MyFitnessPal', 'r/loseit', 'LoseIt app']
),

-- Career Goals
('Learn a new programming language', 'Master a new programming language', 'career', 'medium', 90,
 '[
   {"title": "Complete basics tutorial", "orderIndex": 0, "estimatedDays": 14},
   {"title": "Build first project", "orderIndex": 1, "estimatedDays": 21},
   {"title": "Complete intermediate course", "orderIndex": 2, "estimatedDays": 28},
   {"title": "Build portfolio project", "orderIndex": 3, "estimatedDays": 27}
 ]'::jsonb,
 ARRAY['career', 'programming', 'learning'],
 'Practice daily. Build projects, not just tutorials. Join community forums for help.',
 ARRAY['freeCodeCamp', 'Codecademy', 'The Odin Project']
),

('Get a promotion', 'Achieve promotion at current job', 'career', 'hard', 180,
 '[
   {"title": "Document achievements and impact", "orderIndex": 0, "estimatedDays": 30},
   {"title": "Expand skills with training/certifications", "orderIndex": 1, "estimatedDays": 60},
   {"title": "Take on leadership responsibilities", "orderIndex": 2, "estimatedDays": 60},
   {"title": "Discuss promotion with manager", "orderIndex": 3, "estimatedDays": 30}
 ]'::jsonb,
 ARRAY['career', 'promotion', 'professional-development'],
 'Track measurable achievements. Seek feedback regularly. Network within your organization.',
 ARRAY['Ask a Manager blog', 'LinkedIn Learning', 'Harvard Business Review']
),

-- Financial Goals
('Save $10,000', 'Build emergency fund of $10,000', 'financial', 'medium', 365,
 '[
   {"title": "Save $2,500", "orderIndex": 0, "estimatedDays": 91},
   {"title": "Save $5,000", "orderIndex": 1, "estimatedDays": 91},
   {"title": "Save $7,500", "orderIndex": 2, "estimatedDays": 92},
   {"title": "Save $10,000", "orderIndex": 3, "estimatedDays": 91}
 ]'::jsonb,
 ARRAY['finance', 'savings', 'emergency-fund'],
 'Automate savings. Cut unnecessary expenses. Consider side income. Aim for $833/month.',
 ARRAY['YNAB', 'r/personalfinance', 'Mint app']
),

('Pay off credit card debt', 'Eliminate all credit card debt', 'financial', 'hard', 180,
 '[
   {"title": "List all debts and create payoff plan", "orderIndex": 0, "estimatedDays": 7},
   {"title": "Pay off 25% of total debt", "orderIndex": 1, "estimatedDays": 57},
   {"title": "Pay off 50% of total debt", "orderIndex": 2, "estimatedDays": 58},
   {"title": "Pay off 100% of debt", "orderIndex": 3, "estimatedDays": 58}
 ]'::jsonb,
 ARRAY['finance', 'debt', 'credit-cards'],
 'Use avalanche (highest interest first) or snowball (smallest balance first) method. Stop using cards while paying off.',
 ARRAY['Undebt.it', 'Dave Ramsey Debt Snowball', 'r/DaveRamsey']
),

-- Health Goals
('Meditate daily for 30 days', 'Build a daily meditation habit', 'health', 'easy', 30,
 '[
   {"title": "Meditate for 5 minutes daily for 1 week", "orderIndex": 0, "estimatedDays": 7},
   {"title": "Meditate for 10 minutes daily for 1 week", "orderIndex": 1, "estimatedDays": 7},
   {"title": "Meditate for 15 minutes daily for 2 weeks", "orderIndex": 2, "estimatedDays": 14},
   {"title": "Complete 30 days of meditation", "orderIndex": 3, "estimatedDays": 2}
 ]'::jsonb,
 ARRAY['health', 'mindfulness', 'meditation'],
 'Start small. Same time each day helps build habit. Don''t judge your practice.',
 ARRAY['Headspace', 'Calm app', 'Insight Timer', 'r/Meditation']
),

('Quit smoking', 'Become smoke-free', 'health', 'extreme', 90,
 '[
   {"title": "Set quit date and prepare", "orderIndex": 0, "estimatedDays": 14},
   {"title": "First week smoke-free", "orderIndex": 1, "estimatedDays": 7},
   {"title": "One month smoke-free", "orderIndex": 2, "estimatedDays": 23},
   {"title": "Three months smoke-free", "orderIndex": 3, "estimatedDays": 46}
 ]'::jsonb,
 ARRAY['health', 'quit-smoking', 'wellness'],
 'Get nicotine replacement therapy or prescription aids. Tell friends/family. Join support group.',
 ARRAY['QuitSTART app', 'r/stopsmoking', 'smokefree.gov', '1-800-QUIT-NOW']
),

-- Personal Goals
('Read 12 books in a year', 'Read one book per month', 'personal', 'easy', 365,
 '[
   {"title": "Read 3 books", "orderIndex": 0, "estimatedDays": 91},
   {"title": "Read 6 books", "orderIndex": 1, "estimatedDays": 91},
   {"title": "Read 9 books", "orderIndex": 2, "estimatedDays": 92},
   {"title": "Read 12 books", "orderIndex": 3, "estimatedDays": 91}
 ]'::jsonb,
 ARRAY['personal', 'reading', 'self-improvement'],
 'Read before bed. Always have book ready. Join book club for accountability.',
 ARRAY['Goodreads', 'Kindle', 'Libby app', 'r/books']
),

('Learn a new language', 'Achieve conversational fluency in a language', 'personal', 'hard', 365,
 '[
   {"title": "Complete beginner course", "orderIndex": 0, "estimatedDays": 90},
   {"title": "Hold basic conversation", "orderIndex": 1, "estimatedDays": 91},
   {"title": "Complete intermediate course", "orderIndex": 2, "estimatedDays": 92},
   {"title": "Pass fluency test or conversation", "orderIndex": 3, "estimatedDays": 92}
 ]'::jsonb,
 ARRAY['personal', 'language', 'learning'],
 'Practice daily, even 10 minutes. Immerse yourself (music, movies, podcasts). Speak from day 1.',
 ARRAY['Duolingo', 'Pimsleur', 'italki', 'r/languagelearning']
),

('Wake up at 5 AM for 30 days', 'Build early morning routine', 'personal', 'medium', 30,
 '[
   {"title": "Wake at 5 AM for 1 week", "orderIndex": 0, "estimatedDays": 7},
   {"title": "Wake at 5 AM for 2 weeks", "orderIndex": 1, "estimatedDays": 7},
   {"title": "Wake at 5 AM for 3 weeks", "orderIndex": 2, "estimatedDays": 7},
   {"title": "Complete 30 days", "orderIndex": 3, "estimatedDays": 9}
 ]'::jsonb,
 ARRAY['personal', 'habits', 'productivity'],
 'Go to bed earlier (8-9 hours before). Place alarm across room. Plan morning routine in advance.',
 ARRAY['r/theXeffect', 'Alarmy app', 'Sleep Cycle']
);
