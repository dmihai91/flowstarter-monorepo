import { describe, it, expect } from 'vitest';
import { parseCodeblocks } from '../codeblock-parser';

describe('parseCodeblocks', () => {
  it('parses a single fenced code block', () => {
    const text = '```html path=/index.html start=1\n<h1>Hello</h1>\n```';
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/index.html');
    expect(result[0].language).toBe('html');
    expect(result[0].content).toBe('<h1>Hello</h1>');
  });

  it('parses multiple code blocks', () => {
    const text = [
      '```html path=/index.html start=1',
      '<h1>Hello</h1>',
      '```',
      '',
      '```css path=/styles.css start=1',
      'body { color: red; }',
      '```',
    ].join('\n');
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('/index.html');
    expect(result[0].language).toBe('html');
    expect(result[1].path).toBe('/styles.css');
    expect(result[1].language).toBe('css');
  });

  it('handles multiline content', () => {
    const text = [
      '```js path=/app.js start=1',
      'const a = 1;',
      'const b = 2;',
      'console.log(a + b);',
      '```',
    ].join('\n');
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('const a = 1;\nconst b = 2;\nconsole.log(a + b);');
  });

  it('handles CRLF line endings', () => {
    const text = '```html path=/index.html start=1\r\n<h1>Hello</h1>\r\n```';
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('<h1>Hello</h1>');
  });

  it('returns empty array for empty input', () => {
    expect(parseCodeblocks('')).toEqual([]);
  });

  it('returns empty array for null/undefined input', () => {
    expect(parseCodeblocks(null as unknown as string)).toEqual([]);
    expect(parseCodeblocks(undefined as unknown as string)).toEqual([]);
  });

  it('returns empty array for text without code blocks', () => {
    expect(parseCodeblocks('Just some regular text')).toEqual([]);
  });

  it('returns empty array for malformed blocks (missing path)', () => {
    const text = '```html\n<h1>Hello</h1>\n```';
    expect(parseCodeblocks(text)).toEqual([]);
  });

  it('returns empty array for malformed blocks (missing start)', () => {
    const text = '```html path=/index.html\n<h1>Hello</h1>\n```';
    expect(parseCodeblocks(text)).toEqual([]);
  });

  it('normalizes path to have leading slash', () => {
    const text = '```html path=index.html start=1\n<h1>Hello</h1>\n```';
    const result = parseCodeblocks(text);
    expect(result[0].path).toBe('/index.html');
  });

  it('normalizes Windows backslashes to forward slashes', () => {
    const text = '```html path=src\\components\\App.tsx start=1\ncontent\n```';
    const result = parseCodeblocks(text);
    expect(result[0].path).toBe('/src/components/App.tsx');
  });

  it('preserves path with leading slash', () => {
    const text = '```html path=/src/index.html start=1\ncontent\n```';
    const result = parseCodeblocks(text);
    expect(result[0].path).toBe('/src/index.html');
  });

  it('trims trailing whitespace from content', () => {
    const text = '```html path=/index.html start=1\n<h1>Hello</h1>   \n```';
    const result = parseCodeblocks(text);
    expect(result[0].content).toBe('<h1>Hello</h1>');
  });

  it('handles various start values', () => {
    const text = '```js path=/app.js start=42\ncode\n```';
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('code');
  });

  it('handles text mixed with code blocks', () => {
    const text = [
      'Here is the first file:',
      '```html path=/index.html start=1',
      '<h1>Hello</h1>',
      '```',
      'And here is the second:',
      '```css path=/style.css start=1',
      'body {}',
      '```',
      'That is all.',
    ].join('\n');
    const result = parseCodeblocks(text);
    expect(result).toHaveLength(2);
  });
});
