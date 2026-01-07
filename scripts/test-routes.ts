/**
 * Route Testing Script
 * Tests all routes to ensure they load without errors
 * 
 * Usage: npx tsx scripts/test-routes.ts
 */

interface RouteTest {
  path: string;
  name: string;
  category: string;
}

const routes: RouteTest[] = [
  // Main Routes
  { path: '/', name: 'Dashboard', category: 'Core' },
  { path: '/assistant', name: 'AI Assistant', category: 'Core' },
  { path: '/calendar', name: 'Calendar', category: 'Core' },
  { path: '/scheduler', name: 'Task Scheduler', category: 'Core' },
  { path: '/focus', name: 'Focus Mode', category: 'Core' },

  // Productivity Routes
  { path: '/habits', name: 'Habits', category: 'Productivity' },
  { path: '/todos', name: 'Todos', category: 'Productivity' },
  { path: '/notes', name: 'Notes', category: 'Productivity' },
  { path: '/projects', name: 'Project Tracking', category: 'Productivity' },

  // Wellbeing Routes
  { path: '/journal', name: 'Journal', category: 'Wellbeing' },
  { path: '/skincare', name: 'Skincare', category: 'Wellbeing' },

  // Personal Routes
  { path: '/goals', name: 'Life Goals', category: 'Personal' },
  { path: '/travel', name: 'Travel', category: 'Personal' },
  { path: '/travel/visa', name: 'Visa Tracker', category: 'Personal' },
  { path: '/travel/trip-planner', name: 'Trip Planner', category: 'Personal' },

  // Finance Routes (nested under /finances/*)
  { path: '/finances', name: 'Finances Overview', category: 'Finance' },
  { path: '/finances/budget', name: 'Budget', category: 'Finance' },
  { path: '/finances/transactions', name: 'Transactions', category: 'Finance' },
  { path: '/finances/credit-cards', name: 'Credit Cards', category: 'Finance' },
  { path: '/finances/bills', name: 'Bills', category: 'Finance' },
  { path: '/finances/goals', name: 'Financial Goals', category: 'Finance' },
  { path: '/finances/accounts', name: 'Accounts', category: 'Finance' },

  // Health & Nutrition Routes
  { path: '/shopping', name: 'Shopping Smart', category: 'Health' },
  { path: '/meals', name: 'Meal Planning', category: 'Health' },
  { path: '/nutrition', name: 'Nutrition Tracker', category: 'Health' },

  // Shared Routes
  { path: '/shared', name: 'Shared Items', category: 'Other' },

  // Error Routes
  { path: '/this-does-not-exist', name: '404 Test', category: 'Error' },
];

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 ROUTE TESTING CHECKLIST');
  console.log('='.repeat(80) + '\n');

  const categories = [...new Set(routes.map(r => r.category))];

  categories.forEach(category => {
    const categoryRoutes = routes.filter(r => r.category === category);
    console.log(`\n## ${category} Routes (${categoryRoutes.length})`);
    console.log('-'.repeat(80));

    categoryRoutes.forEach((route, index) => {
      const num = routes.indexOf(route) + 1;
      console.log(`\n${num}. ${route.name}`);
      console.log(`   Path: ${route.path}`);
      console.log(`   URL:  http://localhost:5173${route.path}`);
      console.log(`   [ ] Loads without errors`);
      console.log(`   [ ] Lazy loading works`);
      console.log(`   [ ] Navigation works`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Total Routes: ${routes.length}`);
  console.log('\n✅ Testing Instructions:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open each URL in browser');
  console.log('   3. Check console for errors');
  console.log('   4. Verify page loads correctly');
  console.log('   5. Check Network tab for lazy loading');
  console.log('\n' + '='.repeat(80) + '\n');
}

// Generate markdown checklist
function generateMarkdown(): string {
  let md = '# Phase 3 - Route Testing Results\n\n';
  md += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Routes**: ${routes.length}\n\n`;
  md += '---\n\n';

  const categories = [...new Set(routes.map(r => r.category))];

  categories.forEach(category => {
    const categoryRoutes = routes.filter(r => r.category === category);
    md += `## ${category} Routes (${categoryRoutes.length})\n\n`;

    categoryRoutes.forEach((route) => {
      const num = routes.indexOf(route) + 1;
      md += `### ${num}. ${route.name}\n`;
      md += `- **Path**: \`${route.path}\`\n`;
      md += `- **URL**: http://localhost:5173${route.path}\n`;
      md += `- [ ] Loads without errors\n`;
      md += `- [ ] Lazy loading works\n`;
      md += `- [ ] Navigation works\n`;
      md += `- **Status**: ⏳ Not tested\n\n`;
    });
  });

  md += '---\n\n';
  md += '## Summary\n\n';
  md += `- **Total Routes**: ${routes.length}\n`;
  md += `- **Tested**: 0 / ${routes.length}\n`;
  md += `- **Passing**: 0 / ${routes.length}\n`;
  md += `- **Failing**: 0 / ${routes.length}\n`;

  return md;
}

// Main execution
import { writeFileSync } from 'fs';

printResults();

// Write to file
const markdown = generateMarkdown();
writeFileSync('ROUTE_TESTING_RESULTS.md', markdown);
console.log('✅ Markdown checklist saved to: ROUTE_TESTING_RESULTS.md\n');

export { routes, type RouteTest };

