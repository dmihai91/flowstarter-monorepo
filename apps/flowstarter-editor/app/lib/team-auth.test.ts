import { describe, expect, it } from 'vitest';
import { getModeCapabilities } from './team-auth';

describe('team-auth capabilities', () => {
  it('does not let client mode publish, edit code, or use the terminal', () => {
    const clientCapabilities = getModeCapabilities('client');

    expect(clientCapabilities.canPublish).toBe(false);
    expect(clientCapabilities.canEditCode).toBe(false);
    expect(clientCapabilities.canUseTerminal).toBe(false);
  });

  it('keeps full editor capabilities for team mode', () => {
    const teamCapabilities = getModeCapabilities('team');

    expect(teamCapabilities.canPublish).toBe(true);
    expect(teamCapabilities.canEditCode).toBe(true);
    expect(teamCapabilities.canUseTerminal).toBe(true);
  });
});
