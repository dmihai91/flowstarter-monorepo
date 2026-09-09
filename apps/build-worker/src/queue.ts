/**
 * Bounded in-process build queue.
 *
 * `dispatchBuildJob` in flowstarter-main gives this service an 8s timeout, so
 * the HTTP handler must accept and return immediately while the build itself
 * runs for minutes. The queue keeps the host from running more concurrent Pi
 * sessions and site builds than it was sized for, and collapses duplicate
 * dispatches of the same job.
 */

export type EnqueueOutcome = 'accepted' | 'duplicate' | 'full';

export interface BuildQueueOptions {
  concurrency: number;
  queueLimit: number;
  run: (jobId: string) => Promise<void>;
  onError?: (jobId: string, error: unknown) => void;
  onSettled?: (jobId: string) => void;
}

export class BuildQueue {
  private readonly waiting: string[] = [];
  private readonly known = new Set<string>();
  private active = 0;

  constructor(private readonly options: BuildQueueOptions) {}

  get stats(): { active: number; waiting: number } {
    return { active: this.active, waiting: this.waiting.length };
  }

  enqueue(jobId: string): EnqueueOutcome {
    if (this.known.has(jobId)) return 'duplicate';
    if (this.waiting.length >= this.options.queueLimit) return 'full';
    this.known.add(jobId);
    this.waiting.push(jobId);
    this.pump();
    return 'accepted';
  }

  /** Resolves once every queued and running build has settled. */
  async drain(): Promise<void> {
    while (this.active > 0 || this.waiting.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  private pump(): void {
    while (this.active < this.options.concurrency && this.waiting.length > 0) {
      const jobId = this.waiting.shift() as string;
      this.active++;
      void this.options
        .run(jobId)
        .catch((error: unknown) => this.options.onError?.(jobId, error))
        .finally(() => {
          this.active--;
          this.known.delete(jobId);
          this.options.onSettled?.(jobId);
          this.pump();
        });
    }
  }
}
