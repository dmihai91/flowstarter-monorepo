import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { getAllFiles, buildFileTree } from '../utils/file-reader.js';
import { ScaffoldData } from '../types/templates.js';

export const ScaffoldTemplateSchema = z.object({
	slug: z
		.string()
		.describe('The template slug to scaffold (e.g., local-business-pro)'),
});

export async function scaffoldTemplate(
	args: z.infer<typeof ScaffoldTemplateSchema>,
	fetcher: TemplateFetcher,
	templatesDir: string
): Promise<{ scaffold: ScaffoldData | null; error?: string }> {
	const template = fetcher.getTemplate(args.slug);

	if (!template) {
		return {
			scaffold: null,
			error: `Template not found: ${args.slug}`,
		};
	}

	try {
		// Get the template directory path
		// Support both new structure (sources in root) and legacy structure (sources in start/)
		const templatePath = path.join(templatesDir, args.slug);
		const startPath = path.join(templatePath, 'start');
		let scaffoldPath = templatePath; // Default to new structure (root)
		let fileTree: Awaited<ReturnType<typeof buildFileTree>>;

		try {
			const stats = await fs.stat(startPath);
			if (stats.isDirectory()) {
				// Legacy structure: use start/ directory
				scaffoldPath = startPath;
				fileTree = await buildFileTree(startPath);
				console.log(`📦 Scaffolding template from legacy structure: ${scaffoldPath}`);
			} else {
				// start exists but is not a directory, use root
				fileTree = await buildFileTree(templatePath);
				console.log(`📦 Scaffolding template from root: ${scaffoldPath}`);
			}
		} catch (error: unknown) {
			const isNotFound = error instanceof Error &&
				'code' in error &&
				(error as NodeJS.ErrnoException).code === 'ENOENT';

			if (isNotFound) {
				// start/ doesn't exist - use new structure (sources in root)
				try {
					fileTree = await buildFileTree(templatePath);
					console.log(`📦 Scaffolding template from new structure: ${scaffoldPath}`);
				} catch (rootError) {
					return {
						scaffold: null,
						error: `Template source not found: ${templatePath}`,
					};
				}
			} else {
				return {
					scaffold: null,
					error: `Failed to read template source: ${error}`,
				};
			}
		}

		// Get all files with their contents
		const files = await getAllFiles(scaffoldPath, fileTree);

		console.log(`📄 Found ${files.length} files to scaffold`);

		const scaffold: ScaffoldData = {
			template,
			files: files.map((f) => ({
				path: f.path,
				content: f.content,
				type: 'file' as const,
			})),
		};

		return { scaffold };
	} catch (error) {
		console.error(`❌ Scaffold error: ${error}`);
		return {
			scaffold: null,
			error: `Failed to scaffold template: ${error}`,
		};
	}
}
