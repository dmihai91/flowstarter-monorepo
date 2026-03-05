/**
 * Error pattern database and CSS class replacement map.
 * Used by errorSearch for instant fixes without LLM calls.
 */

import type { ErrorContext } from './errorSearch';

export interface ErrorPattern {
  pattern: RegExp;
  type: ErrorContext['type'];
  solution: {
    description: string;
    fix: string | ((content: string, error: ErrorContext, match: RegExpMatchArray) => string);
    confidence: number;
  };
}

/** Map of hallucinated CSS classes to valid Tailwind equivalents. */
export const CSS_CLASS_REPLACEMENTS: Record<string, string> = {
  'font-display': 'font-sans',
  'font-heading': 'font-serif',
  'font-body': 'font-sans',
  'bg-dark': 'bg-gray-900',
  'bg-light': 'bg-gray-100',
  'bg-cream': 'bg-stone-100',
  'bg-lime': 'bg-lime-400',
  'bg-primary': 'bg-blue-600',
  'bg-secondary': 'bg-gray-600',
  'bg-accent': 'bg-amber-500',
  'bg-dark-50': 'bg-gray-800',
  'bg-dark-100': 'bg-gray-800',
  'bg-dark-200': 'bg-gray-700',
  'bg-dark-300': 'bg-gray-600',
  'text-dark': 'text-gray-900',
  'text-light': 'text-gray-100',
  'text-cream': 'text-stone-100',
  'text-lime': 'text-lime-400',
  'text-primary': 'text-blue-600',
  'text-secondary': 'text-gray-600',
  'text-accent': 'text-amber-500',
  'border-dark': 'border-gray-900',
  'border-light': 'border-gray-100',
  'border-primary': 'border-blue-600',
  'hover:bg-primary-dark': 'hover:bg-blue-700',
  'hover:bg-primary-light': 'hover:bg-blue-500',
  'hover:bg-lime-dark': 'hover:bg-lime-500',
  'hover:bg-lime-light': 'hover:bg-lime-300',
  'hover:bg-dark': 'hover:bg-gray-800',
  'hover:bg-light': 'hover:bg-gray-200',
  'hover:text-dark': 'hover:text-gray-900',
  'hover:text-light': 'hover:text-gray-100',
  'hover:text-primary': 'hover:text-blue-600',
  'hover:border-primary': 'hover:border-blue-600',
  'focus:ring-primary': 'focus:ring-blue-500',
  'focus:border-primary': 'focus:border-blue-500',
  'from-dark': 'from-gray-900',
  'to-dark': 'to-gray-900',
  'via-dark': 'via-gray-900',
  'from-primary': 'from-blue-600',
  'to-primary': 'to-blue-600',
  'via-primary': 'via-blue-600',
  'ring-primary': 'ring-blue-500',
  'ring-dark': 'ring-gray-700',
  'divide-dark': 'divide-gray-700',
  'divide-primary': 'divide-blue-500',
};

/** Database of known error patterns and their fixes. */
export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /The [`']([a-z-]+)[`'] class does not exist/i,
    type: 'css',
    solution: {
      description: 'Replace invalid Tailwind class with standard equivalent',
      fix: (content, _error, match) => {
        const invalidClass = match[1];
        const replacement = CSS_CLASS_REPLACEMENTS[invalidClass];
        if (replacement) {
          return content.replace(new RegExp(`\\b${invalidClass}\\b`, 'g'), replacement);
        }
        return content.replace(new RegExp(`\\s*${invalidClass}`, 'g'), '');
      },
      confidence: 0.95,
    },
  },
  {
    pattern: /ReferenceError: Icon is not defined/i,
    type: 'runtime',
    solution: {
      description: 'Add missing Icon import from astro-icon',
      fix: (content) => {
        if (content.includes("from 'astro-icon")) return content;
        return content.replace(/^---\n/m, "---\nimport { Icon } from 'astro-icon/components';\n");
      },
      confidence: 0.98,
    },
  },
  {
    pattern: /ReferenceError: Image is not defined/i,
    type: 'runtime',
    solution: {
      description: 'Add missing Image import from astro:assets',
      fix: (content) => {
        if (content.includes("from 'astro:assets'")) return content;
        return content.replace(/^---\n/m, "---\nimport { Image } from 'astro:assets';\n");
      },
      confidence: 0.98,
    },
  },
  {
    pattern: /Unexpected end of input|Expected [}\])] but found/i,
    type: 'syntax',
    solution: {
      description: 'Add missing closing bracket/brace',
      fix: (content) => {
        const opens = (content.match(/[{[(]/g) || []).length;
        const closes = (content.match(/[}\])]/g) || []).length;
        if (opens > closes) {
          const ob = (content.match(/{/g) || []).length;
          const cb = (content.match(/}/g) || []).length;
          const op = (content.match(/\(/g) || []).length;
          const cp = (content.match(/\)/g) || []).length;
          const obk = (content.match(/\[/g) || []).length;
          const cbk = (content.match(/\]/g) || []).length;
          let suffix = '';
          if (ob > cb) suffix += '}'.repeat(ob - cb);
          if (op > cp) suffix += ')'.repeat(op - cp);
          if (obk > cbk) suffix += ']'.repeat(obk - cbk);
          return content + '\n' + suffix;
        }
        return content;
      },
      confidence: 0.7,
    },
  },
  {
    pattern: /Expected [,}] but found (\w+)/i,
    type: 'syntax',
    solution: {
      description: 'Add missing comma before property',
      fix: (content, _error, match) => {
        const nextToken = match[1];
        const pattern = new RegExp(`([^,\\s])(\\s*\\n\\s*)(${nextToken})`, 'g');
        return content.replace(pattern, '$1,$2$3');
      },
      confidence: 0.8,
    },
  },
  {
    pattern: /Cannot find module ['"](@\/|\.\.\/?\/)/i,
    type: 'dependency',
    solution: {
      description: 'Fix internal import path',
      fix: 'Check that the file exists and the path is correct. Common fixes: use .js extension, check case sensitivity.',
      confidence: 0.5,
    },
  },
  {
    pattern: /@apply.+?([a-z-]+).+?does not exist/i,
    type: 'css',
    solution: {
      description: 'Replace invalid class in @apply directive',
      fix: (content, _error, match) => {
        const invalidClass = match[1];
        const replacement = CSS_CLASS_REPLACEMENTS[invalidClass];
        if (replacement) {
          return content.replace(new RegExp(`@apply([^;]*?)\\b${invalidClass}\\b`, 'g'), `@apply$1${replacement}`);
        }
        return content.replace(new RegExp(`@apply([^;]*?)\\s*${invalidClass}`, 'g'), '@apply$1');
      },
      confidence: 0.9,
    },
  },
  {
    pattern: /Unexpected token .+ in JSON/i,
    type: 'syntax',
    solution: {
      description: 'Fix JSON syntax error - likely trailing comma or missing quote',
      fix: (content) => {
        return content
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      },
      confidence: 0.75,
    },
  },
  {
    pattern: /CssSyntaxError.*?Unknown word/i,
    type: 'css',
    solution: {
      description: 'Fix CSS syntax - possibly missing semicolon or invalid property',
      fix: 'Check for missing semicolons, invalid CSS properties, or unclosed blocks',
      confidence: 0.5,
    },
  },
];
