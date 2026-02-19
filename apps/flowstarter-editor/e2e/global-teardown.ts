/**
 * Global Teardown for E2E Tests
 *
 * Cleans up Daytona sandboxes and test-created Convex projects after all tests run.
 * This prevents resource accumulation from repeated test runs.
 */

import type { FullConfig } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Pattern to identify test-created projects (FitPro Studio or similar test names)
const TEST_PROJECT_PATTERNS = [
  /^FitPro Studio$/i,
  /^Test Project/i,
  /^E2E Test/i,
];

async function globalTeardown(config: FullConfig) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🧹 Starting E2E Test Cleanup...');
  console.log('════════════════════════════════════════════════════════════════\n');

  // Clean up Daytona sandboxes
  await cleanupDaytona();

  // Clean up test-created Convex projects
  await cleanupConvexProjects();

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('✅ E2E Test Cleanup Complete');
  console.log('════════════════════════════════════════════════════════════════\n');
}

/**
 * Clean up ALL Daytona sandboxes created by Flowstarter
 */
async function cleanupDaytona(): Promise<void> {
  console.log('📦 Cleaning up Daytona sandboxes...');

  try {
    const response = await fetch(`${BASE_URL}/api/daytona/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanupAll: true }),
    });

    if (response.ok) {
      const result = await response.json() as { message?: string; deleted?: number; failed?: number; errors?: string[] };
      console.log(`  ✅ Daytona cleanup: ${result.message || 'Complete'}`);
      if (result.deleted !== undefined) {
        console.log(`  📊 Deleted ${result.deleted} sandboxes`);
      }
      if (result.failed && result.failed > 0) {
        console.log(`  ⚠️ Failed to delete ${result.failed} sandboxes`);
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: string) => {
            console.log(`     - ${err}`);
          });
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`  ⚠️ Daytona cleanup failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`  ⚠️ Daytona cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('     This may be normal if dev server has stopped');
  }
}

/**
 * Clean up test-created Convex projects
 * Identifies projects by name pattern or recent creation
 */
async function cleanupConvexProjects(): Promise<void> {
  console.log('📁 Cleaning up Convex test projects...');

  try {
    // First, get a list of projects via POST with action: 'list'
    const listResponse = await fetch(`${BASE_URL}/api/projectsSimple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });

    if (!listResponse.ok) {
      console.log(`  ⚠️ Could not list projects: ${listResponse.status}`);
      return;
    }

    const result = await listResponse.json() as { projects?: Array<{ name?: string; _id?: string }> };
    const projects = result.projects;

    if (!Array.isArray(projects) || projects.length === 0) {
      console.log('  📊 No projects found');
      return;
    }

    console.log(`  📊 Found ${projects.length} projects`);

    // Find test-created projects by name pattern
    const testProjects = projects.filter((p) => {
      if (!p.name) return false;
      return TEST_PROJECT_PATTERNS.some(pattern => pattern.test(p.name!));
    });

    if (testProjects.length === 0) {
      console.log('  📊 No test projects to clean up');
      return;
    }

    console.log(`  🗑️ Deleting ${testProjects.length} test project(s)...`);

    for (const project of testProjects) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/project/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project._id }),
        });

        if (deleteResponse.ok) {
          console.log(`    ✅ Deleted: ${project.name || project._id}`);
        } else {
          console.log(`    ⚠️ Failed to delete ${project.name || project._id}: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.log(`    ⚠️ Error deleting ${project.name || project._id}: ${error}`);
      }
    }
  } catch (error) {
    console.log(`  ⚠️ Convex cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('     This may be normal if dev server has stopped');
  }
}

export default globalTeardown;

