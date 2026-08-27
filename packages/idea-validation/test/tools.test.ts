import { describe, expect, it } from 'vitest';

import { ToolRegistry } from '../src/tools';

describe('ToolRegistry', () => {
  it('runs a registered tool and returns a JSON string', async () => {
    const reg = new ToolRegistry();
    reg.register({
      name: 'add',
      description: 'add two numbers',
      parameters: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] },
      run: (args) => ({ ok: true, sum: (args.a as number) + (args.b as number) }),
    });
    const out = JSON.parse(await reg.call('add', { a: 2, b: 3 }));
    expect(out).toEqual({ ok: true, sum: 5 });
  });

  it('emits OpenAI-style tool definitions in the catalog', () => {
    const reg = new ToolRegistry();
    reg.register({ name: 'x', description: 'd', parameters: { type: 'object' }, run: () => ({ ok: true }) });
    const cat = reg.catalog();
    expect(cat).toHaveLength(1);
    expect(cat[0]).toEqual({ type: 'function', function: { name: 'x', description: 'd', parameters: { type: 'object' } } });
  });

  it('fails open on an unknown tool', async () => {
    const reg = new ToolRegistry();
    const out = JSON.parse(await reg.call('nope'));
    expect(out.ok).toBe(false);
  });

  it('fails open on missing required params', async () => {
    const reg = new ToolRegistry();
    reg.register({ name: 't', description: '', parameters: { type: 'object', required: ['q'] }, run: () => ({ ok: true }) });
    const out = JSON.parse(await reg.call('t', {}));
    expect(out.ok).toBe(false);
    expect(out.error).toBe('invalid parameters');
  });

  it('turns a throwing tool into an error result, not a crash', async () => {
    const reg = new ToolRegistry();
    reg.register({
      name: 'boom',
      description: '',
      parameters: { type: 'object' },
      run: () => {
        throw new Error('kaboom');
      },
    });
    const out = JSON.parse(await reg.call('boom'));
    expect(out.ok).toBe(false);
    expect(out.error).toBe('kaboom');
  });
});
