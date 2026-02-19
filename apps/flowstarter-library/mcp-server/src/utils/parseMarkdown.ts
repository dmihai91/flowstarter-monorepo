/**
 * Markdown Content Parser
 *
 * Parses YAML-like content from markdown files with ## section headers.
 * Supports nested objects, arrays, and placeholder replacement.
 */

type ParsedValue = string | number | boolean | ParsedObject | ParsedArray;
type ParsedObject = { [key: string]: ParsedValue };
type ParsedArray = ParsedValue[];

/**
 * Parse a markdown content file into structured data
 */
export function parseMarkdownContent(markdown: string): Record<string, ParsedObject> {
  const result: Record<string, ParsedObject> = {};

  // Remove HTML comments
  const cleanMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

  // Split by ## headers (section boundaries)
  const sections = cleanMarkdown.split(/^## /m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const sectionName = lines[0].trim().replace(/\s+/g, '');

    if (!sectionName || sectionName.startsWith('#')) continue;

    // Parse the YAML-like content after the header
    const yamlContent = lines.slice(1).join('\n');
    const parsed = parseYamlLike(yamlContent);

    if (Object.keys(parsed).length > 0) {
      result[sectionName] = parsed;
    }
  }

  return result;
}

/**
 * Parse YAML-like content (simplified YAML parser)
 */
function parseYamlLike(content: string): ParsedObject {
  const result: ParsedObject = {};
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
      i++;
      continue;
    }

    // Check indentation level
    const indent = getIndent(line);

    // Only process top-level keys (no indentation)
    if (indent === 0) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const valueAfterColon = trimmed.substring(colonIndex + 1).trim();

        if (valueAfterColon) {
          // Inline value
          result[key] = parseValue(valueAfterColon);
        } else {
          // Check if next lines are nested content
          const [nestedValue, consumed] = parseNestedContent(lines, i + 1, 2);
          result[key] = nestedValue;
          i += consumed;
        }
      }
    }

    i++;
  }

  return result;
}

/**
 * Check if a string looks like a valid property key (identifier)
 */
function isValidKey(str: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
}

/**
 * Parse nested content (arrays or objects)
 */
function parseNestedContent(lines: string[], startIndex: number, expectedIndent: number): [ParsedValue, number] {
  let consumed = 0;
  const items: ParsedArray = [];
  let isArray = false;
  let currentObject: ParsedObject = {};

  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      consumed++;
      continue;
    }

    const indent = getIndent(line);

    // If we hit a line with less indentation, we're done with this block
    if (indent < expectedIndent && trimmed) {
      break;
    }

    // Array item (starts with -)
    if (trimmed.startsWith('- ')) {
      isArray = true;
      const itemContent = trimmed.substring(2).trim();
      const colonIndex = itemContent.indexOf(':');

      // Only treat as key-value if key part is a valid identifier (no spaces)
      const potentialKey = colonIndex > 0 ? itemContent.substring(0, colonIndex).trim() : '';
      const isKeyValuePair = colonIndex > 0 && isValidKey(potentialKey);

      if (isKeyValuePair) {
        // Object in array: - key: value
        const key = potentialKey;
        const value = itemContent.substring(colonIndex + 1).trim();

        // Start new object
        if (items.length > 0 || Object.keys(currentObject).length > 0) {
          if (Object.keys(currentObject).length > 0) {
            items.push(currentObject);
          }
          currentObject = {};
        }

        if (value) {
          currentObject[key] = parseValue(value);
        } else {
          // Check for nested content
          const [nestedValue, nestedConsumed] = parseNestedContent(lines, i + 1, indent + 4);
          currentObject[key] = nestedValue;
          i += nestedConsumed;
          consumed += nestedConsumed;
        }
      } else {
        // Simple array item: - value (text with colons is kept as string)
        if (Object.keys(currentObject).length > 0) {
          items.push(currentObject);
          currentObject = {};
        }
        items.push(itemContent);
      }
    } else if (indent >= expectedIndent) {
      // Continuation of object properties (indented key: value)
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (value) {
          currentObject[key] = parseValue(value);
        } else {
          // Nested content
          const [nestedValue, nestedConsumed] = parseNestedContent(lines, i + 1, indent + 2);
          currentObject[key] = nestedValue;
          i += nestedConsumed;
          consumed += nestedConsumed;
        }
      }
    } else {
      break;
    }

    i++;
    consumed++;
  }

  // Push final object if exists
  if (Object.keys(currentObject).length > 0) {
    items.push(currentObject);
  }

  if (isArray) {
    return [items, consumed];
  } else if (items.length === 1 && typeof items[0] === 'object' && !Array.isArray(items[0])) {
    return [items[0] as ParsedObject, consumed];
  } else if (items.length > 0) {
    return [items, consumed];
  }

  return [currentObject, consumed];
}

/**
 * Get indentation level (number of leading spaces)
 */
function getIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

/**
 * Parse a value string into appropriate type
 */
function parseValue(value: string): ParsedValue {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Number (but keep strings that look like "4.9" as strings if they might be ratings)
  const num = Number(value);
  if (!isNaN(num) && !value.includes(',') && !/^\d+\.\d+$/.test(value)) {
    return num;
  }

  return value;
}

/**
 * Replace placeholders in content
 */
export function replacePlaceholders<T>(data: T, values: Record<string, string>): T {
  if (typeof data === 'string') {
    return data.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return values[key] ?? match;
    }) as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => replacePlaceholders(item, values)) as T;
  }

  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = replacePlaceholders(value, values);
    }
    return result as T;
  }

  return data;
}

/**
 * Load and parse markdown content file
 */
export async function loadMarkdownContent(
  markdownText: string,
  projectValues: Record<string, string>
): Promise<Record<string, ParsedObject>> {
  const parsed = parseMarkdownContent(markdownText);
  return replacePlaceholders(parsed, projectValues);
}
