import { describe, expect, it } from 'vitest';
import {
  GitHubPullRequestPublisher,
  PullRequestPublishError,
} from '../src/pull-requests';

const PROJECT_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

function publisher(overrides: Record<string, unknown> = {}) {
  return new GitHubPullRequestPublisher({
    apiBaseUrl: 'https://api.github.com',
    owner: 'flowstarter',
    repo: 'sites',
    token: 'ghp_secret_token_value',
    remote: 'origin',
    baseRef: 'main',
    stagingUrlTemplate: 'https://{projectId}.staging.flowstarter.net',
    ...overrides,
  });
}

describe('GitHubPullRequestPublisher', () => {
  it('refuses to push a branch outside the client namespace', async () => {
    for (const branch of [
      'main',
      'client/flowstarter-../../evil',
      `--upload-pack=touch /tmp/pwned`,
      'client/flowstarter-not-a-uuid',
    ]) {
      await expect(
        publisher().create({
          projectId: PROJECT_ID,
          branch,
          worktreePath: '/tmp/does-not-matter',
          commitSha: 'abc123',
        }),
      ).rejects.toThrow(PullRequestPublishError);
    }
  });

  it('refuses a remote name that is not a bare token', () => {
    expect(() => publisher({ remote: 'origin; rm -rf /' })).toThrow(
      PullRequestPublishError,
    );
  });
});
