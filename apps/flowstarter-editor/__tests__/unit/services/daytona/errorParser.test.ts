/**
 * Error Parser Unit Tests
 *
 * Tests for parsing build errors from dev server output.
 */

import { describe, it, expect } from 'vitest';
import {
  parseErrorDetails,
  hasFatalError,
  checkServerStarted,
  extractPort,
  createBuildError,
} from '~/lib/services/daytona/errorParser';

describe('errorParser', () => {
  describe('parseErrorDetails', () => {
    it('should parse Astro ReferenceError with file path', () => {
      const output = `ReferenceError: Button is not defined
src/components/Header.astro:15:8
    at Module.Header (file:///home/daytona/src/components/Header.astro:15:8)`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.file).toBe('src/components/Header.astro');
      expect(result?.line).toBe('15');
      expect(result?.message).toContain('Button is not defined');
    });

    it('should parse SyntaxError with file path', () => {
      const output = `SyntaxError: Unexpected token '}'
src/pages/index.tsx:42`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.file).toBe('src/pages/index.tsx');
    });

    it('should parse TypeError with file path', () => {
      // The actual error parser requires a specific format for TypeErrors
      // matching the patterns in errorParser.ts
      const output = `TypeError: Cannot read property 'map' of undefined
src/components/List.jsx:10:5`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.message).toContain('Cannot read property');
    });

    it('should parse [ERROR] style vite/esbuild errors', () => {
      const output = `[ERROR] Could not resolve "missing-module"

    src/utils/helper.ts:5:0:
      5 │ import { something } from "missing-module"`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
    });

    it('should parse CSS syntax errors with valid source file extension', () => {
      // Note: The current implementation only recognizes .astro, .tsx, .ts, .jsx, .js, .json extensions
      // CSS errors that reference a source file will be parsed
      const output = `Error: CssSyntaxError in build
    at transform (/home/daytona/src/styles/index.ts:25:3)`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.file).toBe('src/styles/index.ts');
      expect(result?.line).toBe('25');
    });

    it('should parse Node.js stack trace errors', () => {
      const output = `Error: Module not found
    at require (/home/daytona/src/lib/config.ts:10:15)
    at Object.<anonymous> (/home/daytona/src/index.ts:5:1)`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.file).toBe('src/lib/config.ts');
      expect(result?.line).toBe('10');
    });

    it('should normalize paths without src/ prefix', () => {
      const output = `ReferenceError: Component is not defined
pages/about.astro:5:1`;

      const result = parseErrorDetails(output);

      expect(result).not.toBeNull();
      expect(result?.file).toBe('src/pages/about.astro');
    });

    it('should handle layouts/ prefix normalization', () => {
      const output = `ReferenceError: Layout is not defined
layouts/Base.astro:10:1`;

      const result = parseErrorDetails(output);

      expect(result?.file).toBe('src/layouts/Base.astro');
    });

    it('should handle components/ prefix normalization', () => {
      const output = `ReferenceError: Button is not defined
components/Button.tsx:3:1`;

      const result = parseErrorDetails(output);

      expect(result?.file).toBe('src/components/Button.tsx');
    });

    it('should return null for output without recognizable errors', () => {
      const output = `Server started successfully
Listening on port 4321`;

      const result = parseErrorDetails(output);

      expect(result).toBeNull();
    });

    it('should strip leading slashes from file paths', () => {
      const output = `ReferenceError: foo is not defined
/src/utils/helpers.ts:20:5`;

      const result = parseErrorDetails(output);

      expect(result?.file).toBe('src/utils/helpers.ts');
    });
  });

  describe('hasFatalError', () => {
    it('should detect SyntaxError as fatal', () => {
      expect(hasFatalError('SyntaxError: Unexpected token', false)).toBe(true);
    });

    it('should detect ReferenceError as fatal', () => {
      expect(hasFatalError('ReferenceError: x is not defined', false)).toBe(true);
    });

    it('should detect TypeError as fatal', () => {
      expect(hasFatalError('TypeError: Cannot read property', false)).toBe(true);
    });

    it('should detect "Cannot find module" as fatal', () => {
      expect(hasFatalError('Cannot find module "react"', false)).toBe(true);
    });

    it('should detect "is not defined" as fatal', () => {
      expect(hasFatalError('Component is not defined', false)).toBe(true);
    });

    it('should detect ENOENT as fatal', () => {
      expect(hasFatalError('ENOENT: no such file or directory', false)).toBe(true);
    });

    it('should detect generic Error: as fatal', () => {
      expect(hasFatalError('Error: Something went wrong', false)).toBe(true);
    });

    it('should detect [ERROR] as fatal', () => {
      expect(hasFatalError('[ERROR] Build failed', false)).toBe(true);
    });

    it('should not treat [ERROR] as fatal if server started', () => {
      expect(hasFatalError('[ERROR] Something', true)).toBe(false);
    });

    it('should not treat dependency scan failure as fatal', () => {
      expect(hasFatalError('[ERROR] Failed to scan for dependencies', false)).toBe(false);
    });

    it('should return false for clean output', () => {
      expect(hasFatalError('Server running on port 4321', false)).toBe(false);
    });
  });

  describe('checkServerStarted', () => {
    it('should detect server started with localhost', () => {
      const output = `
  VITE v5.0.0  ready in 500ms

  ➜  Local:   http://localhost:4321/
  ➜  Network: use --host to expose`;

      expect(checkServerStarted(output)).toBe(true);
    });

    it('should detect server started with Network', () => {
      const output = `
  astro  v4.0.0 ready in 1234ms

  ┃ Local    http://localhost:4321/
  ┃ Network  http://192.168.1.100:4321/`;

      expect(checkServerStarted(output)).toBe(true);
    });

    it('should return false without ready in message', () => {
      const output = `Starting server...
http://localhost:4321/`;

      expect(checkServerStarted(output)).toBe(false);
    });

    it('should return false without localhost/Network', () => {
      const output = `Server ready in 500ms`;

      expect(checkServerStarted(output)).toBe(false);
    });

    it('should return false for error output', () => {
      const output = `[ERROR] Build failed
SyntaxError: Unexpected token`;

      expect(checkServerStarted(output)).toBe(false);
    });
  });

  describe('extractPort', () => {
    it('should extract port from localhost URL', () => {
      expect(extractPort('http://localhost:4321/')).toBe(4321);
    });

    it('should extract port from localhost without protocol', () => {
      expect(extractPort('localhost:5173')).toBe(5173);
    });

    it('should extract port from mixed case', () => {
      expect(extractPort('LocalHost:3000')).toBe(3000);
    });

    it('should return null when no port found', () => {
      expect(extractPort('Server started successfully')).toBeNull();
    });

    it('should extract first port when multiple present', () => {
      expect(extractPort('localhost:4321 and localhost:5173')).toBe(4321);
    });
  });

  describe('createBuildError', () => {
    it('should create BuildErrorInfo from error details', () => {
      const errorDetails = {
        file: 'src/index.ts',
        line: '10',
        message: 'Syntax error',
      };
      const output = 'Full error output here';

      const result = createBuildError(errorDetails, output);

      expect(result).toEqual({
        file: 'src/index.ts',
        line: '10',
        message: 'Syntax error',
        fullOutput: 'Full error output here',
      });
    });

    it('should return undefined when errorDetails is null', () => {
      const result = createBuildError(null, 'some output');

      expect(result).toBeUndefined();
    });

    it('should use default message when message is empty', () => {
      const errorDetails = {
        file: 'src/index.ts',
        line: '10',
        message: '',
      };

      const result = createBuildError(errorDetails, 'output');

      expect(result?.message).toBe('Unknown build error');
    });
  });
});

