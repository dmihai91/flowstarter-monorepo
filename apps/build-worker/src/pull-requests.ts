/**
 * Pushes the agent's client branch and opens the internal review PR that gates
 * HUMAN_QA.
 *
 * The GitHub token is passed to git through `GIT_CONFIG_*` environment
 * variables rather than `git -c` or a credential-bearing remote URL, so it
 * never lands in the process argv (readable via `ps`) or in the repository's
 * config/reflog.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PullRequestPublisher } from '@flowstarter/agentic-codegen';

const execFileAsync = promisify(execFile);

const SAFE_BRANCH = /^client\/flowstarter-[0-9a-f-]{36}$/;
const SAFE_REMOTE = /^[A-Za-z0-9._-]+$/;

export class PullRequestPublishError extends Error {}

export interface GitHubPullRequestPublisherOptions {
  apiBaseUrl: string;
  owner: string;
  repo: string;
  token: string;
  remote: string;
  baseRef: string;
  /** Contains `{projectId}`; resolved into the QA staging link. */
  stagingUrlTemplate: string;
  pushTimeoutMs?: number;
  requestTimeoutMs?: number;
}

interface GitHubPullRequest {
  html_url?: string;
}

export class GitHubPullRequestPublisher implements PullRequestPublisher {
  constructor(private readonly options: GitHubPullRequestPublisherOptions) {
    if (!SAFE_REMOTE.test(options.remote)) {
      throw new PullRequestPublishError('Git remote name is not a safe token');
    }
  }

  async create(input: {
    projectId: string;
    branch: string;
    worktreePath: string;
    commitSha: string;
  }): Promise<{ pullRequestUrl: string; stagingUrl: string }> {
    if (!SAFE_BRANCH.test(input.branch)) {
      throw new PullRequestPublishError(
        `Refusing to publish branch outside the Flowstarter client namespace: ${input.branch}`,
      );
    }

    await this.push(input.branch, input.worktreePath);
    const pullRequestUrl = await this.openPullRequest(input);
    return {
      pullRequestUrl,
      stagingUrl: this.options.stagingUrlTemplate.replace(
        '{projectId}',
        input.projectId.toLowerCase(),
      ),
    };
  }

  private async push(branch: string, worktreePath: string): Promise<void> {
    const basic = Buffer.from(`x-access-token:${this.options.token}`).toString(
      'base64',
    );
    try {
      await execFileAsync(
        'git',
        ['push', '--set-upstream', this.options.remote, `${branch}:${branch}`],
        {
          cwd: worktreePath,
          encoding: 'utf8',
          timeout: this.options.pushTimeoutMs ?? 180_000,
          maxBuffer: 2 * 1024 * 1024,
          windowsHide: true,
          env: {
            ...process.env,
            GIT_TERMINAL_PROMPT: '0',
            GIT_CONFIG_COUNT: '1',
            GIT_CONFIG_KEY_0: 'http.extraHeader',
            GIT_CONFIG_VALUE_0: `AUTHORIZATION: Basic ${basic}`,
          },
        },
      );
    } catch (error) {
      const failure = error as NodeJS.ErrnoException & { stderr?: string };
      throw new PullRequestPublishError(
        `git push failed: ${redact((failure.stderr ?? failure.message).slice(0, 1_000), this.options.token)}`,
      );
    }
  }

  private async openPullRequest(input: {
    projectId: string;
    branch: string;
    commitSha: string;
  }): Promise<string> {
    const created = await this.request('POST', '/pulls', {
      title: `Flowstarter site ${input.projectId}`,
      head: input.branch,
      base: this.options.baseRef,
      draft: true,
      body: [
        `Automated full-site build for workspace \`${input.projectId}\`.`,
        '',
        `Commit: \`${input.commitSha}\``,
        '',
        'Human QA gate: typography and spacing polish, then explicit approval.',
        'The balance invoice and production deploy stay blocked until this is approved.',
      ].join('\n'),
    });

    if (created.status === 201) {
      const body = (await created.json()) as GitHubPullRequest;
      if (!body.html_url) {
        throw new PullRequestPublishError('GitHub returned a PR without a URL');
      }
      return body.html_url;
    }

    // A retried build re-pushes the same branch; reuse the open PR instead of
    // failing the job on GitHub's "pull request already exists" 422.
    if (created.status === 422) {
      const existing = await this.request(
        'GET',
        `/pulls?state=open&head=${encodeURIComponent(`${this.options.owner}:${input.branch}`)}`,
      );
      if (existing.ok) {
        const list = (await existing.json()) as GitHubPullRequest[];
        const url = list[0]?.html_url;
        if (url) return url;
      }
    }

    const detail = redact(
      (await created.text()).slice(0, 1_000),
      this.options.token,
    );
    throw new PullRequestPublishError(
      `GitHub rejected the pull request with ${created.status}: ${detail}`,
    );
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<Response> {
    return fetch(
      `${this.options.apiBaseUrl}/repos/${this.options.owner}/${this.options.repo}${path}`,
      {
        method,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${this.options.token}`,
          'x-github-api-version': '2022-11-28',
          'user-agent': 'flowstarter-build-worker/0.1.0',
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.options.requestTimeoutMs ?? 20_000),
      },
    );
  }
}

/** Git and GitHub both echo credentials back in some error paths. */
function redact(text: string, token: string): string {
  return token.length >= 8 ? text.split(token).join('***') : text;
}
