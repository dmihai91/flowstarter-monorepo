/**
 * The running log of one build, batched into the build conversation.
 *
 * The board already carries what a build *is doing* (phases), what the agents
 * *concluded* (replies) and what an operator *said* (notes). This is the layer
 * under that: every line the agents narrate, every tool call they make, and
 * every line the machine prints while validating and publishing.
 *
 * That volume cannot go to the events table one row per line — a single build
 * produces thousands, and the operator board polls the same table. So lines
 * are buffered and written as one `log` event per batch, tagged
 * `payload.stream = true` so the chat feed can filter them out while the log
 * view reads them back. The thresholds below are the trade between "the
 * operator sees it while it happens" and "one build is not ten thousand rows".
 *
 * Nothing here may fail a build: a lost log line is a nuisance, a failed site
 * is a refund. Every append is best-effort and logged to the console instead.
 */

import type { FullSiteBuildEvent } from './workflows';

/** Who produced a line: the model, the machine running the build, or a tool. */
export type JobLogSource = 'agent' | 'machine' | 'tool';

export interface JobLogLine {
  source: JobLogSource;
  text: string;
}

/** What a process driving a build can write into the build conversation. */
export interface JobLogWriter {
  write(line: JobLogLine): void;
  flush(): Promise<void>;
}

/** Lines per batch before the buffer is written out. */
export const JOB_LOG_MAX_LINES = 25;

/** Characters per batch before the buffer is written out. */
export const JOB_LOG_MAX_CHARS = 1_500;

/** Longest a batch may wait for company, in milliseconds. */
export const JOB_LOG_FLUSH_INTERVAL_MS = 2_000;

/** Batches one job may write before the rest of its log is dropped. */
export const JOB_LOG_MAX_EVENTS = 2_000;

/**
 * Hard ceiling on one event body. The table's check constraint is 4,000
 * characters; staying under it is this sink's job, not the caller's.
 */
const BODY_MAX_CHARS = 3_900;

/** Longest single line kept verbatim; the rest is a truncation marker. */
const LINE_MAX_CHARS = 1_000;

const TRUNCATION_LINE =
  'log truncated: this build passed its log-event budget, the rest was dropped';

export interface JobLogSinkOptions {
  /** Where a batch goes. Failures are swallowed and logged, never thrown. */
  append: (event: FullSiteBuildEvent) => Promise<void>;
  maxLines?: number;
  maxChars?: number;
  flushIntervalMs?: number;
  maxEvents?: number;
  /** Named so a test can assert on it without matching worker prose. */
  label?: string;
}

export class JobLogSink implements JobLogWriter {
  private buffer: string[] = [];
  private bufferChars = 0;
  private bufferSource: JobLogSource | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private events = 0;
  private truncated = false;
  /** Appends are chained so two batches can never interleave in the table. */
  private tail: Promise<void> = Promise.resolve();

  private readonly maxLines: number;
  private readonly maxChars: number;
  private readonly flushIntervalMs: number;
  private readonly maxEvents: number;

  constructor(private readonly options: JobLogSinkOptions) {
    this.maxLines = options.maxLines ?? JOB_LOG_MAX_LINES;
    this.maxChars = options.maxChars ?? JOB_LOG_MAX_CHARS;
    this.flushIntervalMs = options.flushIntervalMs ?? JOB_LOG_FLUSH_INTERVAL_MS;
    this.maxEvents = options.maxEvents ?? JOB_LOG_MAX_EVENTS;
  }

  write(line: JobLogLine): void {
    if (this.truncated) return;
    // One batch carries one source, because the event payload names one
    // source. A source change is therefore a batch boundary.
    for (const raw of String(line.text ?? '').split('\n')) {
      const text = raw.replace(/\s+$/, '');
      if (text.trim().length === 0) continue;
      const clipped =
        text.length > LINE_MAX_CHARS
          ? `${text.slice(0, LINE_MAX_CHARS)} [line truncated]`
          : text;
      if (this.bufferSource !== null && this.bufferSource !== line.source) {
        this.enqueueFlush();
      }
      if (this.bufferChars + clipped.length + 1 > BODY_MAX_CHARS) {
        this.enqueueFlush();
      }
      this.bufferSource = line.source;
      this.buffer.push(clipped);
      this.bufferChars += clipped.length + 1;
      if (
        this.buffer.length >= this.maxLines ||
        this.bufferChars >= this.maxChars
      ) {
        this.enqueueFlush();
        continue;
      }
      this.arm();
    }
  }

  /** Writes whatever is buffered and resolves once the table has it. */
  async flush(): Promise<void> {
    this.enqueueFlush();
    await this.tail;
  }

  /** Batches written so far; the log view's budget is spent here. */
  get eventCount(): number {
    return this.events;
  }

  private arm(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.enqueueFlush();
    }, this.flushIntervalMs);
    // A pending log batch must never be the reason the process stays alive.
    this.timer.unref?.();
  }

  private disarm(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private enqueueFlush(): void {
    this.disarm();
    if (this.buffer.length === 0) return;
    const lines = this.buffer;
    const source = this.bufferSource ?? 'machine';
    this.buffer = [];
    this.bufferChars = 0;
    this.bufferSource = null;

    if (this.events >= this.maxEvents) {
      if (this.truncated) return;
      this.truncated = true;
      this.append({
        kind: 'log',
        body: TRUNCATION_LINE,
        payload: { source, lines: 1, stream: true, truncated: true },
      });
      return;
    }
    this.events += 1;
    this.append({
      kind: 'log',
      body: lines.join('\n'),
      payload: { source, lines: lines.length, stream: true },
    });
  }

  private append(event: FullSiteBuildEvent): void {
    this.tail = this.tail.then(() =>
      this.options.append(event).catch((error: unknown) => {
        console.warn(
          `[job-log] could not record ${event.payload?.source ?? 'log'} lines${
            this.options.label ? ` for ${this.options.label}` : ''
          }:`,
          error instanceof Error ? error.message : error,
        );
      }),
    );
  }
}
