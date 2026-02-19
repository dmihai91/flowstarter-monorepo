/**
 * Integration Test Utilities
 *
 * Helper functions for testing the main platform <-> editor integration.
 * These can be imported and run from browser console or test files.
 *
 * Usage in browser console:
 * ```
 * import { testIntegration } from '~/lib/utils/integrationTestUtils';
 * testIntegration.runAll();
 * ```
 */

const MAIN_PLATFORM_URL = import.meta.env.VITE_MAIN_PLATFORM_URL || 'http://localhost:3000';

export const testIntegration = {
  /**
   * Check if handoff connection exists
   */
  checkHandoffConnection(): { connected: boolean; token?: string; projectId?: string } {
    const token = localStorage.getItem('flowstarter_handoff_token');
    const dataStr = localStorage.getItem('flowstarter_handoff_data');

    if (!token || !dataStr) {
      console.log('❌ No handoff connection found');
      return { connected: false };
    }

    try {
      const data = JSON.parse(dataStr);
      console.log('✅ Handoff connection exists');
      console.log('   Project ID:', data.projectId);
      console.log('   From Main Platform:', data.fromMainPlatform);

      // Decode token to show expiry
      const [dataB64] = token.split('.');
      const payload = JSON.parse(atob(dataB64.replace(/-/g, '+').replace(/_/g, '/')));
      const expiresAt = new Date(payload.exp * 1000);
      const isExpired = expiresAt < new Date();

      console.log('   Token expires:', expiresAt.toISOString());
      console.log('   Token expired:', isExpired ? '⚠️ YES' : '✅ NO');

      return {
        connected: true,
        token: token.substring(0, 20) + '...',
        projectId: data.projectId,
      };
    } catch (e) {
      console.error('❌ Failed to parse handoff data:', e);
      return { connected: false };
    }
  },

  /**
   * Test sync API connection
   */
  async testSyncConnection(): Promise<{ success: boolean; error?: string }> {
    const token = localStorage.getItem('flowstarter_handoff_token');

    if (!token) {
      console.log('⚠️ No handoff token - sync test skipped');
      return { success: true };
    }

    try {
      console.log('Testing sync API connection...');

      const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: 'test-connection',
          data: {},
        }),
      });

      /*
       * We expect 403 (project mismatch) or 404 (not found) - that's OK
       * 401 means token is invalid
       * 500 means server error
       */
      if (response.status === 401) {
        console.log('❌ Sync API: Token invalid or expired');
        return { success: false, error: 'Token invalid' };
      } else if (response.status === 403 || response.status === 404) {
        console.log('✅ Sync API: Connection working (expected error for test projectId)');
        return { success: true };
      } else if (response.status === 200) {
        console.log('✅ Sync API: Connection working');
        return { success: true };
      } else {
        console.log(`⚠️ Sync API: Unexpected status ${response.status}`);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (e) {
      console.error('❌ Sync API: Connection failed', e);
      return { success: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  },

  /**
   * Test fetching project data from main platform
   */
  async testFetchProject(): Promise<{ success: boolean; project?: unknown }> {
    const token = localStorage.getItem('flowstarter_handoff_token');
    const dataStr = localStorage.getItem('flowstarter_handoff_data');

    if (!token || !dataStr) {
      console.log('⚠️ No handoff connection - fetch test skipped');
      return { success: true };
    }

    const data = JSON.parse(dataStr);

    try {
      console.log('Fetching project from main platform...');

      const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/sync?projectId=${data.projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = (await response.json()) as { project?: { name?: string; status?: string; isDraft?: boolean } };
        console.log('✅ Project fetched successfully');
        console.log('   Name:', result.project?.name);
        console.log('   Status:', result.project?.status);
        console.log('   Is Draft:', result.project?.isDraft);

        return { success: true, project: result.project };
      } else {
        const error = await response.text();
        console.log(`❌ Project fetch failed: ${response.status}`, error);

        return { success: false };
      }
    } catch (e) {
      console.error('❌ Project fetch failed:', e);
      return { success: false };
    }
  },

  /**
   * Simulate a sync operation
   */
  async testSync(testData: Record<string, unknown> = { name: 'Test Sync' }): Promise<boolean> {
    const token = localStorage.getItem('flowstarter_handoff_token');
    const dataStr = localStorage.getItem('flowstarter_handoff_data');

    if (!token || !dataStr) {
      console.log('⚠️ No handoff connection - cannot test sync');
      return false;
    }

    const data = JSON.parse(dataStr);

    try {
      console.log('Testing sync with data:', testData);

      const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: data.projectId,
          data: testData,
        }),
      });

      if (response.ok) {
        console.log('✅ Sync successful');
        return true;
      } else {
        const error = await response.text();
        console.log(`❌ Sync failed: ${response.status}`, error);

        return false;
      }
    } catch (e) {
      console.error('❌ Sync failed:', e);
      return false;
    }
  },

  /**
   * Clear handoff data (for testing fresh start)
   */
  clearHandoff(): void {
    localStorage.removeItem('flowstarter_handoff_token');
    localStorage.removeItem('flowstarter_handoff_data');
    console.log('✅ Handoff data cleared');
  },

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log('=========================================');
    console.log('  Integration Test Suite');
    console.log('=========================================');
    console.log('');

    console.log('1. Checking handoff connection...');
    this.checkHandoffConnection();
    console.log('');

    console.log('2. Testing sync API connection...');
    await this.testSyncConnection();
    console.log('');

    console.log('3. Testing project fetch...');
    await this.testFetchProject();
    console.log('');

    console.log('=========================================');
    console.log('  Tests Complete');
    console.log('=========================================');
  },
};

// Make available globally in development
if (import.meta.env.DEV) {
  (window as unknown as { testIntegration: typeof testIntegration }).testIntegration = testIntegration;
}

export default testIntegration;

