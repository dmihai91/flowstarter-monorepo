import type { ExtractedSignals, RouterContextHints } from "./types.ts";

const MULTI_FILE_KEYWORDS = [
  "across the repo",
  "across the codebase",
  "repo-wide",
  "repo wide",
  "all files",
  "every file",
  "rename everywhere",
  "codemod",
  "mass rename",
  "migrate",
  "migration",
  "schema change",
  "api integration",
  "infrastructure",
  "devops",
  "ci/cd",
  "pipeline",
  "multi-file",
  "multi file",
  "generate tests",
  "test generation",
  "performance optimization",
  "perf optimization",
  "backend architecture",
];

const CLAUDE_TASK_KEYWORDS = [
  "explain",
  "review",
  "brainstorm",
  "design critique",
  "critique",
  "what do you think",
  "should we",
  "trade-off",
  "tradeoff",
  "thoughts on",
  "feedback on",
  "polish",
  "copywriting",
  "tone",
  "rewrite the copy",
  "ux",
  "u/x",
  "aesthetic",
  "frontend polish",
  "conceptual",
  "hypothesis",
];

const COMPLEXITY_KEYWORDS = [
  "architecture",
  "design pattern",
  "race condition",
  "deadlock",
  "distributed",
  "thread safety",
  "concurrency",
  "memory leak",
  "security audit",
  "subtle bug",
  "intermittent",
  "flaky",
  "non-deterministic",
  "deep refactor",
];

const SIMPLE_TASK_KEYWORDS = [
  "fix typo",
  "rename variable",
  "rename this",
  "format",
  "lint fix",
  "add comment",
  "add log",
  "tiny",
  "trivial",
  "one-liner",
  "one liner",
  "small fix",
  "quick fix",
];

const AMBIGUITY_KEYWORDS = [
  "what do you think",
  "thoughts",
  "should we",
  "how should",
  "any ideas",
  "not sure",
  "i'm stuck",
  "open-ended",
  "explore",
  "options",
];

function countMatches(haystack: string, needles: ReadonlyArray<string>): number {
  let count = 0;
  for (const needle of needles) {
    if (haystack.includes(needle)) count += 1;
  }
  return count;
}

const PATH_LIKE = /(?:[a-z0-9_-]+\/){1,}[a-z0-9_.-]+\.[a-z]{1,5}\b/gi;

export function extractSignals(prompt: string, hints?: RouterContextHints): ExtractedSignals {
  const lower = prompt.toLowerCase();
  const words = prompt.trim().length === 0 ? 0 : prompt.trim().split(/\s+/).length;
  const pathMentions = (prompt.match(PATH_LIKE) ?? []).length;

  const multiFileHits = countMatches(lower, MULTI_FILE_KEYWORDS);
  const claudeTaskHits = countMatches(lower, CLAUDE_TASK_KEYWORDS);
  const complexityHits = countMatches(lower, COMPLEXITY_KEYWORDS);
  const simpleTaskHits = countMatches(lower, SIMPLE_TASK_KEYWORDS);
  const ambiguityHits = countMatches(lower, AMBIGUITY_KEYWORDS);

  // Ambiguity: short prompt + question-ish + ambiguity keywords.
  const isQuestion = /[?]/.test(prompt) || /^(how|what|why|should|could|would)\b/i.test(prompt);
  const ambiguity = Math.min(
    1,
    (ambiguityHits * 0.3) + (isQuestion ? 0.25 : 0) + (words > 0 && words < 12 ? 0.2 : 0),
  );

  return {
    promptChars: prompt.length,
    promptWords: words,
    pathMentions: pathMentions + (hints?.fileCount ?? 0),
    multiFileHits,
    claudeTaskHits,
    complexityHits,
    simpleTaskHits,
    ambiguity,
  };
}
