/**
 * Route Verification Script
 * Verifies that all route components exist and are properly configured
 * 
 * Usage: npx tsx scripts/verify-routes.ts
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface RouteCheck {
  path: string;
  name: string;
  component: string;
  exists: boolean;
  error?: string;
}

const routes: Array<{ path: string; name: string; component: string }> = [
  // Core Routes
  { path: '/', name: 'Dashboard', component: 'src/pages/Dashboard.tsx' },
  { path: '/assistant', name: 'AI Assistant', component: 'src/pages/Assistant.tsx' },
  { path: '/calendar', name: 'Calendar', component: 'src/pages/Calendar.tsx' },
  { path: '/scheduler', name: 'Task Scheduler', component: 'src/pages/TaskScheduler.tsx' },
  { path: '/focus', name: 'Focus Mode', component: 'src/pages/Focus.tsx' },

  // Productivity Routes
  { path: '/habits', name: 'Habits', component: 'src/pages/Habits.tsx' },
  { path: '/todos', name: 'Todos', component: 'src/pages/Todos.tsx' },
  { path: '/notes', name: 'Notes', component: 'src/pages/Notes.tsx' },
  { path: '/projects', name: 'Project Tracking', component: 'src/pages/ProjectTracking.tsx' },

  // Wellbeing Routes
  { path: '/journal', name: 'Journal', component: 'src/pages/Journal.tsx' },
  { path: '/skincare', name: 'Skincare', component: 'src/pages/Skincare.tsx' },

  // Personal Routes
  { path: '/goals', name: 'Life Goals', component: 'src/pages/LifeGoals.tsx' },
  { path: '/travel', name: 'Travel', component: 'src/pages/Travel.tsx' },
  { path: '/travel/visa', name: 'Visa Tracker', component: 'src/travel/pages/VisaPage.tsx' },
  { path: '/travel/trip-planner', name: 'Trip Planner', component: 'src/travel/components/TripPlanner.tsx' },

  // Finance Routes
  { path: '/finances', name: 'Finances', component: 'src/pages/Finances.tsx' },

  // Health Routes
  { path: '/shopping', name: 'Shopping Smart', component: 'src/pages/ShoppingSmart.tsx' },
  { path: '/meals', name: 'Meal Planning', component: 'src/pages/MealPlanning.tsx' },
  { path: '/nutrition', name: 'Nutrition Tracker', component: 'src/pages/Nutrition.tsx' },

  // Other Routes
  { path: '/shared', name: 'Shared Items', component: 'src/pages/Shared.tsx' },
];

function verifyRoutes(): RouteCheck[] {
  const results: RouteCheck[] = [];
  const rootDir = process.cwd();

  for (const route of routes) {
    const fullPath = join(rootDir, route.component);
    const exists = existsSync(fullPath);

    results.push({
      path: route.path,
      name: route.name,
      component: route.component,
      exists,
      error: exists ? undefined : 'Component file not found',
    });
  }

  return results;
}

function printResults(results: RouteCheck[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ROUTE VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const passing = results.filter(r => r.exists);
  const failing = results.filter(r => !r.exists);

  console.log(`✅ Passing: ${passing.length} / ${results.length}`);
  console.log(`❌ Failing: ${failing.length} / ${results.length}\n`);

  if (failing.length > 0) {
    console.log('❌ MISSING COMPONENTS:\n');
    failing.forEach(r => {
      console.log(`   ${r.name} (${r.path})`);
      console.log(`   Component: ${r.component}`);
      console.log(`   Error: ${r.error}\n`);
    });
  }

  console.log('✅ VERIFIED ROUTES:\n');
  passing.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} - ${r.path}`);
  });

  console.log('\n' + '='.repeat(80));

  if (failing.length === 0) {
    console.log('✅ All route components exist and are ready for testing!');
  } else {
    console.log(`⚠️  ${failing.length} route component(s) missing. Please create them.`);
  }

  console.log('='.repeat(80) + '\n');
}

function generateTestingGuide(results: RouteCheck[]): string {
  let guide = '# Manual Route Testing Guide\n\n';
  guide += '## Quick Testing Instructions\n\n';
  guide += '1. Open http://localhost:5173 in your browser\n';
  guide += '2. Open Developer Tools (F12 or Cmd+Option+I)\n';
  guide += '3. Go to Console tab\n';
  guide += '4. Go to Network tab\n';
  guide += '5. For each route below:\n';
  guide += '   - Navigate to the URL\n';
  guide += '   - Check Console for errors (should be none)\n';
  guide += '   - Check Network tab for lazy-loaded chunks\n';
  guide += '   - Verify page renders correctly\n\n';
  guide += '---\n\n';

  guide += '## Routes to Test\n\n';

  const passing = results.filter(r => r.exists);
  passing.forEach((r, i) => {
    guide += `### ${i + 1}. ${r.name}\n`;
    guide += `- **URL**: http://localhost:5173${r.path}\n`;
    guide += `- **Component**: ${r.component}\n`;
    guide += `- [ ] Loads without errors\n`;
    guide += `- [ ] Lazy loading works (check Network tab)\n`;
    guide += `- [ ] Page renders correctly\n`;
    guide += `- **Notes**: \n\n`;
  });

  guide += '---\n\n';
  guide += `## Summary\n\n`;
  guide += `- Total Routes: ${passing.length}\n`;
  guide += `- Tested: 0 / ${passing.length}\n`;
  guide += `- Passing: 0 / ${passing.length}\n`;
  guide += `- Failing: 0 / ${passing.length}\n`;

  return guide;
}

// Main execution
const results = verifyRoutes();
printResults(results);

// Generate testing guide
import { writeFileSync } from 'fs';
const guide = generateTestingGuide(results);
writeFileSync('MANUAL_TESTING_GUIDE.md', guide);
console.log('📝 Manual testing guide saved to: MANUAL_TESTING_GUIDE.md\n');

