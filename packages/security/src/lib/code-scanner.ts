/**
 * @fileoverview Code scanner for detecting malicious patterns in generated code.
 * @module @flowstarter/security/code-scanner
 */

import { CodeIssue, ScanResult, Severity } from './types.js';

/**
 * Pattern definition for code scanning.
 */
interface CodePattern {
  /** Regular expression to match */
  pattern: RegExp;
  /** Type of security issue */
  type: string;
  /** Severity level */
  severity: Severity;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  suggestion?: string;
  /** File extensions to check (empty = all) */
  extensions?: string[];
}

/**
 * Malicious code patterns to detect.
 */
const CODE_PATTERNS: CodePattern[] = [
  // Data exfiltration
  {
    pattern: /fetch\s*\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)[^'"`]+['"`]/gi,
    type: 'external_fetch',
    severity: Severity.HIGH,
    description: 'Fetch request to external domain detected',
    suggestion: 'Review if this external request is necessary and safe',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs'],
  },
  {
    pattern: /new\s+XMLHttpRequest\s*\(\s*\)[\s\S]{0,200}\.open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/gi,
    type: 'external_xhr',
    severity: Severity.HIGH,
    description: 'XMLHttpRequest to external domain detected',
    suggestion: 'Review if this external request is necessary and safe',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /navigator\.sendBeacon\s*\(/gi,
    type: 'beacon_api',
    severity: Severity.MEDIUM,
    description: 'sendBeacon API usage detected (potential data exfiltration)',
    suggestion: 'Verify the beacon destination is legitimate',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Cookie/storage theft
  {
    pattern: /document\.cookie/gi,
    type: 'cookie_access',
    severity: Severity.HIGH,
    description: 'Direct cookie access detected',
    suggestion: 'Use secure cookie handling methods instead',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /localStorage\.getItem|localStorage\[['"`]/gi,
    type: 'localstorage_read',
    severity: Severity.MEDIUM,
    description: 'LocalStorage read operation detected',
    suggestion: 'Ensure no sensitive data is being exfiltrated',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /sessionStorage\.getItem|sessionStorage\[['"`]/gi,
    type: 'sessionstorage_read',
    severity: Severity.MEDIUM,
    description: 'SessionStorage read operation detected',
    suggestion: 'Ensure no sensitive data is being exfiltrated',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /indexedDB\.open/gi,
    type: 'indexeddb_access',
    severity: Severity.MEDIUM,
    description: 'IndexedDB access detected',
    suggestion: 'Review database operations for data theft',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Code execution
  {
    pattern: /\beval\s*\(/gi,
    type: 'eval_usage',
    severity: Severity.CRITICAL,
    description: 'eval() function detected (code injection risk)',
    suggestion: 'Remove eval() and use safer alternatives',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs'],
  },
  {
    pattern: /new\s+Function\s*\(/gi,
    type: 'function_constructor',
    severity: Severity.CRITICAL,
    description: 'Function constructor detected (similar to eval)',
    suggestion: 'Avoid dynamic code generation',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /setTimeout\s*\(\s*['"`][^'"`]+['"`]/gi,
    type: 'settimeout_string',
    severity: Severity.HIGH,
    description: 'setTimeout with string argument (implicit eval)',
    suggestion: 'Pass a function reference instead of a string',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /setInterval\s*\(\s*['"`][^'"`]+['"`]/gi,
    type: 'setinterval_string',
    severity: Severity.HIGH,
    description: 'setInterval with string argument (implicit eval)',
    suggestion: 'Pass a function reference instead of a string',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /innerHTML\s*=|outerHTML\s*=/gi,
    type: 'innerhtml_assignment',
    severity: Severity.MEDIUM,
    description: 'innerHTML/outerHTML assignment (XSS risk)',
    suggestion: 'Use textContent or sanitize HTML input',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /document\.write\s*\(/gi,
    type: 'document_write',
    severity: Severity.MEDIUM,
    description: 'document.write usage detected',
    suggestion: 'Use modern DOM manipulation methods',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Credential harvesting
  {
    pattern: /type\s*=\s*['"`]password['"`][\s\S]{0,500}(fetch|XMLHttpRequest|\.send)/gi,
    type: 'password_exfil',
    severity: Severity.CRITICAL,
    description: 'Password field with potential data exfiltration',
    suggestion: 'Review form handling for credential theft',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.html'],
  },
  {
    pattern: /\.value[\s\S]{0,100}(password|passwd|pwd|secret|token|key|credential)/gi,
    type: 'sensitive_value_access',
    severity: Severity.HIGH,
    description: 'Access to potentially sensitive input value',
    suggestion: 'Ensure sensitive data is handled securely',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /addEventListener\s*\(\s*['"`](input|change|submit)['"`][\s\S]{0,300}(password|credit|card|ssn|social)/gi,
    type: 'keylogger_pattern',
    severity: Severity.CRITICAL,
    description: 'Event listener pattern suggesting keylogging',
    suggestion: 'Remove suspicious input event handlers',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Crypto mining
  {
    pattern: /coinhive|cryptonight|monero|coinloot|webminer|minero\.cc|crypto-loot/gi,
    type: 'crypto_miner',
    severity: Severity.CRITICAL,
    description: 'Cryptocurrency miner code detected',
    suggestion: 'Remove crypto mining code',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.html'],
  },
  {
    pattern: /WebAssembly\.instantiate[\s\S]{0,500}(mine|hash|worker)/gi,
    type: 'wasm_miner',
    severity: Severity.HIGH,
    description: 'WebAssembly potentially used for mining',
    suggestion: 'Review WebAssembly usage',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Malicious redirects
  {
    pattern: /window\.location\s*=|location\.href\s*=|location\.replace\s*\(/gi,
    type: 'redirect',
    severity: Severity.MEDIUM,
    description: 'Redirect detected (potential phishing)',
    suggestion: 'Verify redirect destination is legitimate',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /window\.open\s*\(\s*['"`]https?:\/\//gi,
    type: 'popup',
    severity: Severity.MEDIUM,
    description: 'Popup window to external URL',
    suggestion: 'Verify popup destination is legitimate',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Obfuscation
  {
    pattern: /\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}/gi,
    type: 'hex_obfuscation',
    severity: Severity.HIGH,
    description: 'Hex-encoded string obfuscation detected',
    suggestion: 'Decode and review obfuscated content',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /\\u[0-9a-f]{4}\\u[0-9a-f]{4}\\u[0-9a-f]{4}/gi,
    type: 'unicode_obfuscation',
    severity: Severity.HIGH,
    description: 'Unicode-escaped string obfuscation detected',
    suggestion: 'Decode and review obfuscated content',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /atob\s*\(\s*['"`][A-Za-z0-9+\/=]{50,}['"`]\s*\)/gi,
    type: 'base64_payload',
    severity: Severity.HIGH,
    description: 'Large base64-encoded payload being decoded',
    suggestion: 'Decode and review the base64 content',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    pattern: /String\.fromCharCode\s*\([\s\S]{20,}\)/gi,
    type: 'charcode_obfuscation',
    severity: Severity.HIGH,
    description: 'String.fromCharCode obfuscation detected',
    suggestion: 'Decode and review obfuscated content',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // Sensitive data exposure
  {
    pattern: /apikey|api_key|api-key|secret_key|secretkey|private_key|privatekey/gi,
    type: 'hardcoded_secret',
    severity: Severity.HIGH,
    description: 'Potential hardcoded API key or secret',
    suggestion: 'Use environment variables for secrets',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.env'],
  },
  {
    pattern: /['"]\s*sk-[a-zA-Z0-9]{32,}\s*['"]/gi,
    type: 'openai_key',
    severity: Severity.CRITICAL,
    description: 'Potential OpenAI API key exposed',
    suggestion: 'Remove and rotate the API key immediately',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  {
    pattern: /['"]\s*ghp_[a-zA-Z0-9]{36,}\s*['"]/gi,
    type: 'github_token',
    severity: Severity.CRITICAL,
    description: 'Potential GitHub token exposed',
    suggestion: 'Remove and rotate the token immediately',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  {
    pattern: /['"]\s*xoxb-[a-zA-Z0-9-]+\s*['"]/gi,
    type: 'slack_token',
    severity: Severity.CRITICAL,
    description: 'Potential Slack token exposed',
    suggestion: 'Remove and rotate the token immediately',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },

  // Node.js specific
  {
    pattern: /child_process|spawn|exec\s*\(|execSync|execFile/gi,
    type: 'command_execution',
    severity: Severity.CRITICAL,
    description: 'Command execution capability detected',
    suggestion: 'Review if command execution is necessary',
    extensions: ['.js', '.ts', '.mjs'],
  },
  {
    pattern: /require\s*\(\s*['"`]fs['"`]\)|from\s+['"`]fs['"`]|from\s+['"`]node:fs['"`]/gi,
    type: 'filesystem_access',
    severity: Severity.MEDIUM,
    description: 'Filesystem access detected',
    suggestion: 'Verify file operations are safe',
    extensions: ['.js', '.ts', '.mjs'],
  },
  {
    pattern: /process\.env/gi,
    type: 'env_access',
    severity: Severity.LOW,
    description: 'Environment variable access',
    suggestion: 'Ensure no sensitive env vars are exposed',
    extensions: ['.js', '.ts', '.mjs'],
  },

  // Script injection
  {
    pattern: /<script[\s>][^]*?<\/script>/gi,
    type: 'script_tag',
    severity: Severity.HIGH,
    description: 'Script tag in content',
    suggestion: 'Review script content for malicious code',
    extensions: ['.html', '.htm', '.jsx', '.tsx'],
  },
  {
    pattern: /javascript\s*:/gi,
    type: 'javascript_uri',
    severity: Severity.HIGH,
    description: 'JavaScript URI scheme detected',
    suggestion: 'Remove javascript: URIs',
    extensions: ['.html', '.htm', '.js', '.jsx', '.tsx'],
  },
  {
    pattern: /on(click|load|error|mouseover|focus|blur|change|submit)\s*=/gi,
    type: 'inline_handler',
    severity: Severity.MEDIUM,
    description: 'Inline event handler detected',
    suggestion: 'Use addEventListener instead',
    extensions: ['.html', '.htm', '.jsx', '.tsx'],
  },
];

/**
 * Scanner for detecting malicious patterns in generated code.
 * Checks for security vulnerabilities, data theft, and malware patterns.
 */
export class CodeScanner {
  private patterns: CodePattern[];
  private customPatterns: CodePattern[] = [];

  constructor() {
    this.patterns = CODE_PATTERNS;
  }

  /**
   * Scan a map of files for security issues.
   * @param files - Map of filename to file content
   * @returns Scan result with all found issues
   */
  scan(files: Map<string, string>): ScanResult {
    const startTime = performance.now();
    const issues: CodeIssue[] = [];
    const scannedFiles: string[] = [];
    
    for (const [filename, content] of files) {
      scannedFiles.push(filename);
      const fileIssues = this.scanFile(filename, content);
      issues.push(...fileIssues);
    }
    
    // Count issues by severity
    const issuesBySeverity: Record<Severity, number> = {
      [Severity.LOW]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.HIGH]: 0,
      [Severity.CRITICAL]: 0,
    };
    
    for (const issue of issues) {
      issuesBySeverity[issue.severity]++;
    }
    
    // Determine if scan passed (no critical or high issues)
    const passed = issuesBySeverity[Severity.CRITICAL] === 0 && 
                   issuesBySeverity[Severity.HIGH] === 0;
    
    const processingTimeMs = performance.now() - startTime;
    
    return {
      passed,
      totalIssues: issues.length,
      issuesBySeverity,
      issues,
      scannedFiles,
      processingTimeMs,
    };
  }

  /**
   * Scan a single file for security issues.
   * @param filename - Name of the file
   * @param content - File content
   * @returns Array of issues found in this file
   */
  scanFile(filename: string, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const extension = this.getExtension(filename);
    const lines = content.split('\n');
    
    const allPatterns = [...this.patterns, ...this.customPatterns];
    
    for (const pattern of allPatterns) {
      // Skip if pattern has extension filter and file doesn't match
      if (pattern.extensions && pattern.extensions.length > 0) {
        if (!pattern.extensions.includes(extension)) {
          continue;
        }
      }
      
      // Reset regex state
      pattern.pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        // Find line and column
        const { line, column } = this.getLineColumn(content, match.index);
        
        issues.push({
          type: pattern.type,
          severity: pattern.severity,
          file: filename,
          line,
          column,
          description: pattern.description,
          snippet: this.getSnippet(lines, line),
          suggestion: pattern.suggestion,
        });
      }
    }
    
    return issues;
  }

  /**
   * Scan code content directly (without filename).
   * @param content - Code content to scan
   * @param assumedExtension - Extension to assume for pattern filtering
   * @returns Scan result
   */
  scanContent(content: string, assumedExtension = '.js'): ScanResult {
    const files = new Map<string, string>();
    files.set(`code${assumedExtension}`, content);
    return this.scan(files);
  }

  /**
   * Quick check if code contains any critical issues.
   * @param content - Code content to check
   * @returns True if critical issues are found
   */
  hasSecurityIssues(content: string): boolean {
    for (const pattern of this.patterns) {
      if (pattern.severity === Severity.CRITICAL) {
        pattern.pattern.lastIndex = 0;
        if (pattern.pattern.test(content)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get file extension from filename.
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
  }

  /**
   * Get line and column number from character position.
   */
  private getLineColumn(content: string, position: number): { line: number; column: number } {
    const before = content.slice(0, position);
    const lines = before.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  /**
   * Get a code snippet around the given line.
   */
  private getSnippet(lines: string[], lineNumber: number): string {
    const lineIndex = lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      return '';
    }
    
    const line = lines[lineIndex];
    // Truncate long lines
    if (line.length > 100) {
      return line.slice(0, 100) + '...';
    }
    return line;
  }

  /**
   * Add a custom pattern to scan for.
   * @param pattern - Pattern definition
   */
  addPattern(pattern: CodePattern): void {
    this.customPatterns.push(pattern);
  }

  /**
   * Get all registered patterns.
   */
  getPatterns(): CodePattern[] {
    return [...this.patterns, ...this.customPatterns];
  }

  /**
   * Generate a report string from scan results.
   * @param result - Scan result to report on
   * @returns Formatted report string
   */
  generateReport(result: ScanResult): string {
    const lines: string[] = [];
    
    lines.push('=== Security Scan Report ===\n');
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Total Issues: ${result.totalIssues}`);
    lines.push(`Processing Time: ${result.processingTimeMs.toFixed(2)}ms`);
    lines.push('');
    
    lines.push('Issues by Severity:');
    lines.push(`  Critical: ${result.issuesBySeverity[Severity.CRITICAL]}`);
    lines.push(`  High: ${result.issuesBySeverity[Severity.HIGH]}`);
    lines.push(`  Medium: ${result.issuesBySeverity[Severity.MEDIUM]}`);
    lines.push(`  Low: ${result.issuesBySeverity[Severity.LOW]}`);
    lines.push('');
    
    if (result.issues.length > 0) {
      lines.push('Issues Found:\n');
      
      for (const issue of result.issues) {
        lines.push(`[${issue.severity.toUpperCase()}] ${issue.type}`);
        lines.push(`  File: ${issue.file}:${issue.line}:${issue.column}`);
        lines.push(`  Description: ${issue.description}`);
        if (issue.suggestion) {
          lines.push(`  Suggestion: ${issue.suggestion}`);
        }
        lines.push(`  Snippet: ${issue.snippet}`);
        lines.push('');
      }
    }
    
    lines.push('Scanned Files:');
    for (const file of result.scannedFiles) {
      lines.push(`  - ${file}`);
    }
    
    return lines.join('\n');
  }
}
