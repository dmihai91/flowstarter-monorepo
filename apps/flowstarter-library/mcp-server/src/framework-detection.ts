import * as path from 'path';
import * as fs from 'fs';

export type TemplateFramework = 'astro' | 'tanstack-start' | 'unknown';

export interface TemplateConfig {
	framework: TemplateFramework;
	buildDir: string;
	srcDir: string;
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
	const configPath = path.join(templateDir, 'config.json');

	// Try to read framework from config.json
	if (fs.existsSync(configPath)) {
		try {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			if (config.framework === 'astro') {
				return {
					framework: 'astro',
					buildDir: path.join(templateDir, 'dist'),
					srcDir: path.join(templateDir, 'src'),
				};
			}
		} catch (e) {
			// Ignore JSON parse errors
		}
	}

	// Check for Astro config file (new structure - sources in root)
	if (fs.existsSync(path.join(templateDir, 'astro.config.mjs')) ||
	    fs.existsSync(path.join(templateDir, 'astro.config.js'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Check for new structure with src/ in template root (not in start/)
	// This handles Astro templates that may not have config.json with framework field
	if (fs.existsSync(path.join(templateDir, 'src')) &&
	    !fs.existsSync(path.join(templateDir, 'start'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Check for TanStack Start (vinxi) - legacy structure
	if (fs.existsSync(path.join(templateDir, 'start', 'app.config.ts')) ||
	    fs.existsSync(path.join(templateDir, '.vinxi'))) {
		return {
			framework: 'tanstack-start',
			buildDir: path.join(templateDir, '.vinxi/build/client'),
			srcDir: path.join(templateDir, 'start', 'src'),
		};
	}

	// Default: check if src/ exists in root (new structure) or fall back to legacy
	if (fs.existsSync(path.join(templateDir, 'src'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Legacy fallback for TanStack Start
	return {
		framework: 'tanstack-start',
		buildDir: path.join(templateDir, '.vinxi/build/client'),
		srcDir: path.join(templateDir, 'start', 'src'),
	};
}
