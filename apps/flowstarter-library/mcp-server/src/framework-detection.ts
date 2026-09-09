import * as path from 'path';
import * as fs from 'fs';
import { TEMPLATES_DIR } from './config.js';

export type TemplateFramework = 'astro' | 'tanstack-start' | 'unknown';

export interface TemplateConfig {
	framework: TemplateFramework;
	buildDir: string;
	srcDir: string;
}

function assertTemplateDir(templateDir: string): string {
	const resolved = path.resolve(templateDir);
	const base = path.resolve(TEMPLATES_DIR);
	if (resolved !== base && !resolved.startsWith(base + path.sep)) {
		throw new Error('Template directory escapes templates root');
	}
	return resolved;
}

/**
 * Detect the framework used by a template by reading its config.json
 * Falls back to checking for framework-specific files
 *
 * Supports two structures:
 * - New structure: sources in template root (src/, dist/)
 * - Legacy structure: sources in start/ subdirectory (start/src/, .vinxi/build/client/)
 */
export function getTemplateConfig(templateDir: string): TemplateConfig {
	const safeDir = assertTemplateDir(templateDir);
	const configPath = path.join(safeDir, 'config.json');

	// Try to read framework from config.json
	if (fs.existsSync(configPath)) {
		try {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			if (config.framework === 'astro') {
				return {
					framework: 'astro',
					buildDir: path.join(safeDir, 'dist'),
					srcDir: path.join(safeDir, 'src'),
				};
			}
		} catch {
			// Ignore JSON parse errors
		}
	}

	// Check for Astro config file (new structure - sources in root)
	if (fs.existsSync(path.join(safeDir, 'astro.config.mjs')) ||
		fs.existsSync(path.join(safeDir, 'astro.config.js'))) {
		return {
			framework: 'astro',
			buildDir: path.join(safeDir, 'dist'),
			srcDir: path.join(safeDir, 'src'),
		};
	}

	// Check for new structure with src/ in template root (not in start/)
	// This handles Astro templates that may not have config.json with framework field
	if (fs.existsSync(path.join(safeDir, 'src')) &&
		!fs.existsSync(path.join(safeDir, 'start'))) {
		return {
			framework: 'astro',
			buildDir: path.join(safeDir, 'dist'),
			srcDir: path.join(safeDir, 'src'),
		};
	}

	// Check for TanStack Start (vinxi) - legacy structure
	if (fs.existsSync(path.join(safeDir, 'start', 'app.config.ts')) ||
		fs.existsSync(path.join(safeDir, '.vinxi'))) {
		return {
			framework: 'tanstack-start',
			buildDir: path.join(safeDir, '.vinxi/build/client'),
			srcDir: path.join(safeDir, 'start', 'src'),
		};
	}

	// Default: check if src/ exists in root (new structure) or fall back to legacy
	if (fs.existsSync(path.join(safeDir, 'src'))) {
		return {
			framework: 'astro',
			buildDir: path.join(safeDir, 'dist'),
			srcDir: path.join(safeDir, 'src'),
		};
	}

	// Legacy fallback for TanStack Start
	return {
		framework: 'tanstack-start',
		buildDir: path.join(safeDir, '.vinxi/build/client'),
		srcDir: path.join(safeDir, 'start', 'src'),
	};
}
