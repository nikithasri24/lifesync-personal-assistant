# LifeSync UX Audit Report
**Perspective:** Working professional, married, trying to reduce mental bandwidth from daily chores and life admin.
**Goal:** Use this app as a single system to manage the chaos — meals, money, tasks, habits, and household coordination.
**Date:** March 13, 2026
**Method:** Full Playwright walkthrough of all 16+ features as an end user.

---

## TL;DR

The app has genuinely good bones — the meal batch cook workflow, finance tracking, and shopping integration are well-thought-out. But the experience of *starting fresh* is overwhelming. There is no onboarding. The sidebar has 16 items on day one. There is no "here's what to do first." A busy professional who opens this will close it within 3 minutes and go back to their notes app.

The second problem is fragmentation. Features exist in silos. Shopping doesn't know about Meals. Tasks don't surface on the Dashboard in any useful way. Habits are disconnected from Goals. The whole point of a "personal assistant" is that it connects the dots for you — this largely doesn't.

---

## 1. Dashboard

**What I see:** Greeting, 4 stat tiles (Tasks Today: 1, Habits: 0, Notes: 5, Journal Entries: 4), a Monthly Snapshot section with Net Worth / Goals / Habits, and 4 quick-action buttons (Add Task, New Note, Journal, Focus).

**Problems:**

- **The stat tiles are useless.** "1 Tasks Today" — which task? I can't click it to see which one. It's a number with no context. Same for "0 Habits" — am I done or did I not set any up? A busy person needs to see *what* needs doing, not just counts.

- **Monthly Snapshot is the wrong thing to lead with.** Net Worth being negative ($-50,233) is the most prominent thing after the greeting. That's alarming without context. A daily dashboard should show me what's happening *today*, not my life summary.

- **Quick actions are generic.** "Add Task" and "New Note" don't reduce mental load — they just open the same forms I'd find by clicking the sidebar. The dashboard should instead show: "You have 1 task due today: Buy groceries. 3 habits pending. Dinner not planned."

- **No "what should I do right now" section.** This is the entire point of a personal assistant. If I open this at 7 AM, I want to know: what's due today, what habits I need to do, what we're eating tonight, any bills due. None of that is surfaced.

- **The CommandCenter / AI insights section** (below the fold) has potential but feels like a developer feature. "Budget overrun in Groceries" is useful — but buried.

---

## 2. Navigation / Sidebar

**Problems:**

- **16 items in the sidebar is way too many.** For a tool meant to reduce mental load, the first thing you see is a wall of 16 categories. This is the opposite of simple. Most people will use 4-5 features regularly. The rest is noise.

- **No grouping or hierarchy is visible when collapsed.** Icons only, no labels. I can't tell which icon is Shopping vs Meals without hovering. On mobile this would be unusable.

- **"Shared" and "Together" are separate sidebar items that do overlapping things.** I still don't know the difference after exploring both. This adds confusion, not clarity.

- **"Visa Calculator" is a top-level sidebar item.** This is an extremely niche feature that most users will never touch, yet it occupies the same visual weight as Tasks and Habits. It should be buried inside Travel, not a standalone nav item.

- **No "favorites" or customizable sidebar.** If I only care about Tasks, Habits, Meals, and Shopping, I can't pin those and hide the rest.

---

## 3. Tasks

**What I see:** Today / Inbox / Upcoming / List tabs. One task visible: "Buy groceries for the week" with Medium priority, Due Today.

**Problems:**

- **Two FABs (+) on screen at the same time.** There is a "+" button bottom-left AND bottom-right simultaneously. One of them does something different from the other, but it's not clear which does what.

- **"Inbox" tab is empty and unexplained.** What's the difference between Inbox and Today? GTD users will understand, but a regular person won't. There's no tooltip or explanation.

- **Task completion is hidden.** The checkbox to complete a task is a tiny circle on the left. Tapping it doesn't give enough feedback — there's no animation, no satisfying "done" moment. This matters for daily habit of checking things off.

- **No recurring task visibility on the Today view.** I can set a task to repeat daily but there's no indication on the task card that it will come back. You just have to trust it.

- **Priority labels (Medium, High) aren't actionable.** There's no way to sort by priority from the Today view without going into filters. The whole point of priority is to know what to do first.

- **Tasks page doesn't distinguish personal vs household vs work tasks.** Everything is flat. In a married household, you need to know "who owns this?" at a glance.

---

## 4. Habits

**What I see:** Today's Progress (5 Total, 5 Done, 1 Streak), list of habits: Workout 1, Morning Yoga, Water Plants, Vit C — all checked green.

**Problems:**

- **All habits are already done — but I have no idea why.** There's no time log showing when I completed them. Did I check them off this morning? Did they auto-complete? No way to tell.

- **"1 day streak" for everything is demotivating.** Streaks only show 1 because they were likely just set up. The streak display needs context — "you started this 3 days ago, current streak: 1" vs just showing "1" feels like failure.

- **The Weekly view doesn't show enough.** When I switch to Weekly, I see a grid of days but can't quickly tell which days I consistently miss. The visual needs to make patterns obvious.

- **No habit scheduling (morning vs evening).** "Workout 1" and "Morning Yoga" are both listed together with "Water Plants" (weekly). There's no time-of-day grouping so I don't know which ones are morning vs evening habits.

- **No reminder visible.** I can see the habit but nowhere does it say "reminder set for 7 AM." If there's no reminder, I'll forget.

- **14% habits completion on Dashboard** — this is shown in the Monthly Snapshot, but it's Friday the 13th and all habits are checked for today. The 14% reflects the full month which hasn't been completed yet. This reads as "you're failing" when actually you're doing fine today.

---

## 5. Shopping

**What I see:** 3 Total Items, 1 Completed, $0.00 Total Cost, $0.00 Remaining. Items: Pads (Costco, 1 pcs), Tomato (1).

**Problems:**

- **"0" shown next to items with no label.** Each item shows "1 pcs Costco 0" — what is the "0"? It's a price field that's empty, but it renders as "0" with no context. Looks like a bug.

- **Shopping and Meal Grocery lists are separate.** If I batch cook and generate a grocery list from recipes, it goes to Meals > Grocery. If I add items manually, it goes to Shopping. These are two completely separate systems and there's no way to consolidate them for a single shopping trip. This is a major gap for a couple.

- **No "add multiple items" fast entry.** Adding items one by one with a form is slow. I should be able to type "milk, eggs, bread, tomatoes" and have them parsed.

- **Cart total shows $0.00 even when items exist** because prices aren't filled in by default. The stat tiles at the top are all zeros and look like empty/broken state.

- **The Pantry tab is completely separate.** There's no connection between what's in my pantry and what's on my shopping list. I'd expect it to automatically suggest "you have Tomato in pantry, remove from list?"

---

## 6. Meals

**What I see:** Today tab with Fridge Pool (Next Week Prep session, 5 dishes), session tabs, dish rows with Link/Create recipe/Watch buttons.

**Positives:**
- The batch cook fridge pool concept is excellent. Being able to see what's available for the week and log meals from it is genuinely useful.
- YouTube link on recipes is a thoughtful addition.

**Problems:**

- **The Fridge Pool UI is information-dense.** Each dish row has: dish name, rename button, Log button, Link recipe, Create recipe, Watch button, serving bar, "all gone" button. That's 7 interactive elements per dish. For 5 dishes that's 35 things on screen. Overwhelming.

- **"Create recipe" opens the wrong form.** When you click "Create recipe" from the fridge pool, it opens a "Quick Recipe" modal — which is fine. But the form is labeled "Quick Recipe" and uses a different layout than the Recipes tab. Two different UIs for the same thing adds confusion.

- **The Grocery tab requires recipe links to work.** If a dish has no linked recipe (e.g., "Some daal"), it generates zero grocery items. But the connection between dish → recipe → grocery list is not explained anywhere. A user will add dishes, go to Grocery, see nothing, and think it's broken.

- **No way to mark "I ate out today."** The Today view assumes you either eat from your batch cook or you plan a meal. If you went out for dinner, there's no quick log for that.

- **Week view shows an empty grid by default.** No meals are planned, so it's just a blank calendar. New users see an empty grid with no guidance on what to do first.

- **Session management adds cognitive load.** "Add dish," "Delete session," "+ New," tab switcher, serving counts — this is a power-user feature that works well once you understand it, but there's zero onboarding. A new user has no idea what a "session" is.

---

## 7. Finances

**What I see:** Finance page with tab bar (Accounts, Transactions, Budgets, Goals, Credit Cards, Insurance, Timeline).

**Problems:**

- **The tab bar overflows and cuts off tabs.** "Credit Cards," "Insurance," and "Timeline" are partially cut off on a standard screen width. There's a subtle fade on the right but no obvious affordance to scroll. Tabs that aren't visible don't exist for most users.

- **Net Worth showing -$50,233 with no context.** The dashboard surfaces this prominently. For a new user with student loans or a car loan, seeing a large negative number first thing is alarming. It needs context: "Your debt (-$104k) is mostly your Tesla loan. Your assets are $53k." Without that framing, it's just anxiety-inducing.

- **Adding a transaction requires too many fields.** To log a simple expense, you need: amount, description, category, date, account. For a quick coffee purchase I don't want to fill in 5 fields. There should be a "quick add" that auto-categorizes.

- **No budget progress visible at a glance.** From the main Finances view, I can't see "you've spent $800 of your $1000 grocery budget this month" without clicking into the Budgets tab. This is the most actionable finance info for day-to-day decisions and it's buried.

- **Loans/Insurance tabs exist but feel disconnected.** I can track my Tesla loan and car insurance, but they don't roll up into any useful summary. "Your total monthly fixed expenses are $X" would be the useful output, but it's not there.

---

## 8. Goals

**What I see:** Goals page with Life Goals and Dreams tabs. Several goals listed with progress bars and categories.

**Problems:**

- **Goals have no connection to Tasks.** If I have a goal "Get fit," I can't link tasks like "Go to gym 3x this week" to it. Goals and Tasks live in completely separate worlds. The whole GTD philosophy is that goals inform tasks, but there's no such link here.

- **"1/6 on track" shown on Dashboard** — I can't tap that to see which goals are on track and which aren't. It's a dead number.

- **Progress editing is a manual slider.** To update goal progress, you drag a slider to a percentage. There's no way to say "I saved $500 this month, update my emergency fund goal automatically." Everything is manual.

- **Overdue goals don't have a clear visual warning.** Goals past their target date show an "Overdue" badge (which was fixed in a prior session), but there's still no prominent action prompt — "This goal is overdue. Do you want to update the deadline or mark it as abandoned?"

---

## 9. Notes

**What I see:** Notes page with search bar, grid view of note cards, filter buttons.

**Problems:**

- **Notes have no folder/category structure.** Everything is flat. For someone managing household notes, personal notes, and work notes, a flat list becomes unmanageable past 20 notes. No folders, no nesting, just tags.

- **Note cards in grid view show very little.** The card shows a title and a tiny snippet. I can't tell the difference between a shopping list note and a recipe note without clicking each one.

- **No quick-capture shortcut to Notes.** From the dashboard, "New Note" opens a full modal. There's no way to just jot "call plumber Tuesday" and have it go to notes quickly.

- **No pinning or starring.** Can't pin important notes to the top. Everything is sorted by date which means notes I reference frequently sink to the bottom.

---

## 10. Calendar

**What I see:** Calendar with month/week/day views, schedule blocks, task-to-calendar integration.

**Problems:**

- **The Calendar and Tasks are only loosely connected.** Tasks have due dates but they don't appear on the Calendar. I can "schedule" a task to a time slot, but this is buried and non-obvious. A busy professional's expectation is that calendar = everything happening.

- **No Google Calendar sync.** This is a dealbreaker. If my actual calendar is in Google Calendar and this is a separate calendar, I have to maintain two calendars. That doubles the mental load instead of reducing it.

- **"Schedule block" feature is unexplained.** There's a "New Block" option in the calendar but no explanation of what a schedule block is vs a calendar event vs a task.

---

## 11. Together / Shared

**What I see:** Two separate sidebar items — "Shared" and "Together." Together shows partner activity, challenges, milestones. Shared shows a connection card.

**Problems:**

- **Two separate items for "partner features" is confusing.** After exploring both, I still don't understand the difference. "Together" seems to be couple-specific activities (challenges, milestones). "Shared" seems to be viewing each other's data. This should be one section called "Partner" with sub-tabs.

- **No practical household coordination tools.** There's no shared task list ("who's picking up the kids?"), no shared calendar view, no "assign task to partner." The Together tab feels like a social/relationship feature, not a household management feature.

- **Challenges feel gamified for the sake of it.** "Complete 7 workouts this week" challenge is cute but doesn't connect to my actual habit tracking. If I log a workout in Habits, it doesn't count toward the challenge automatically.

---

## 12. Focus, Journal, Self Care, Nutrition, Travel

These features exist and work but all share the same problem: **they are isolated islands.** A Self Care routine doesn't connect to Habits. A Journal entry doesn't connect to Goals. Nutrition doesn't connect to Meals. The connections that would make this a true personal assistant system are missing.

**Focus (Pomodoro timer):** Works fine. The "Focus" page is clean. But it's just a timer app. No integration with Tasks — I can't say "start Focus session for: Buy groceries task."

**Nutrition:** Exists but completely disconnected from Meals. If I batch cook and log eating from the fridge pool, the calories don't flow into Nutrition. These should be the same feature.

**Travel:** Feels like an afterthought. Very basic. The Visa Calculator is interesting for a specific use case (immigration tracking) but is too prominent in the nav.

---

## Priority Issues Summary

| Priority | Issue | Impact |
|----------|-------|--------|
| 🔴 Critical | No onboarding — new users are completely lost | All users |
| 🔴 Critical | 16 sidebar items with no prioritization | All users |
| 🔴 Critical | Dashboard shows counts, not actionable items | Daily use |
| 🔴 Critical | Shopping and Meals grocery lists are two separate systems | Married couples |
| 🔴 Critical | No Google Calendar sync | Working professionals |
| 🟠 High | Tasks have no connection to Goals | Core workflow |
| 🟠 High | Finance tab bar cuts off on standard screen | Finance users |
| 🟠 High | Nutrition disconnected from Meal logging | Health-focused users |
| 🟠 High | "Together" and "Shared" are confusing duplicates | Couples |
| 🟡 Medium | Fridge pool dish rows have too many actions | Meals users |
| 🟡 Medium | No folder structure in Notes | Heavy notes users |
| 🟡 Medium | Habits have no time-of-day scheduling | All habit users |
| 🟡 Medium | Goal progress is always manual | Goals users |
| 🟡 Medium | Focus timer doesn't link to specific tasks | Focus users |
| 🟢 Low | "0" showing without label on Shopping items | Shopping users |
| 🟢 Low | Visa Calculator as top-level nav item | Most users |

---

## What's Actually Good

- **Batch cook / fridge pool** — genuinely clever. The idea of cooking once, tracking servings, and logging meals from a "fridge pool" throughout the week is the best feature in the app.
- **Finance tracking depth** — accounts, loans, credit cards, insurance, budgets — more comprehensive than most apps.
- **SmartQuickCapture FAB** — the intent-routing capture (type something and it figures out if it's a task, habit, note, or transaction) is great when it works.
- **Design aesthetic** — clean, warm, consistent terracotta palette. Not fatiguing to look at.
- **Together challenges** — the concept of shared couple challenges is nice, just needs to connect to actual habit/task data.

---

## Top 3 Recommendations for Maximum Impact

**1. Build a "Morning Brief" dashboard view.**
Replace the current dashboard with a single-screen "what matters today" view: Today's tasks, today's habits, tonight's dinner (from batch cook), any bills due this week, weather. Everything else is secondary. This alone would make the app worth opening every morning.

**2. Merge Shopping and Meals Grocery into one system.**
Users shouldn't have to know that "adding from a recipe" goes to Meals > Grocery while "adding manually" goes to Shopping > List. One shopping list. One view. Generate from recipes, add manually, same place.

**3. Add onboarding.**
A 3-step setup: "What do you want to track? (Pick 3-5: Tasks, Habits, Meals, Finance, Goals)" → pre-hide the rest of the sidebar → walk through adding the first habit and first task → done. Without this, the app is too complex to adopt.
