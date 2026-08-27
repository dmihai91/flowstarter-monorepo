/**
 * Tool registry + wrapper — ported from ask-sage's `tools/registry.py` and
 * `tools/tool_wrapper.py`. A tool declares a name, description, a JSON-schema
 * for its params, and a `run` function. `catalog()` emits OpenAI-style tool
 * definitions for the model; `call()` validates required params, runs the tool,
 * and returns a JSON string — it NEVER throws, so a tool error becomes an
 * observation the loop can react to (fail-open is load-bearing for the ReAct
 * loop's robustness).
 */

export interface JsonSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface ToolDef<A extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  description: string;
  parameters: JsonSchema;
  run: (args: A) => unknown | Promise<unknown>;
}

export interface OpenAiToolDef {
  type: 'function';
  function: { name: string; description: string; parameters: JsonSchema };
}

export class ToolRegistry {
  private tools = new Map<string, ToolDef>();

  register<A extends Record<string, unknown>>(tool: ToolDef<A>): this {
    this.tools.set(tool.name, tool as unknown as ToolDef);
    return this;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** OpenAI-style tool definitions for every registered tool. */
  catalog(): OpenAiToolDef[] {
    return [...this.tools.values()].map((t) => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }

  /** Validate required params, run the tool, return a JSON string. Never throws. */
  async call(name: string, args: Record<string, unknown> = {}): Promise<string> {
    const tool = this.tools.get(name);
    if (tool === undefined) {
      return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
    }
    const required = tool.parameters.required ?? [];
    const missing = required.filter((k) => !(k in args));
    if (missing.length > 0) {
      return JSON.stringify({ ok: false, error: 'invalid parameters', details: { missing } });
    }
    try {
      const result = await tool.run(args);
      return JSON.stringify(result ?? { ok: true });
    } catch (e) {
      return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
}
