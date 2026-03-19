import { Router } from 'express';
import * as nodePath from 'path';
import * as fs from 'fs';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { log } from '../logging.js';
import { TEMPLATES_DIR } from '../config.js';

export function createTemplatesRoutes() {
	const router = Router();

	// Template thumbnail endpoint
	router.get('/api/templates/:slug/thumbnail', (req, res) => {
		const { slug } = req.params;
		const theme = req.query.theme as string;

		let filename = 'thumbnail.png';
		if (theme === 'light') {
			filename = 'thumbnail-light.png';
		} else if (theme === 'dark') {
			filename = 'thumbnail-dark.png';
		}

		// Try specific theme file first
		let imagePath = nodePath.join(TEMPLATES_DIR, slug, filename);

		if (!fs.existsSync(imagePath)) {
			// Fallback to default thumbnail.png if specific theme not found
			imagePath = nodePath.join(TEMPLATES_DIR, slug, 'thumbnail.png');
		}

		if (fs.existsSync(imagePath)) {
			res.sendFile(imagePath);
		} else {
			res.status(404).json({ error: 'Thumbnail not found' });
		}
	});

	// Template preview endpoint
	router.get('/api/templates/:slug/preview', (req, res) => {
		const { slug } = req.params;
		const theme = req.query.theme as string;

		console.error(`[HTTP] Preview request: slug=${slug}, theme=${theme}`);
		console.error(`[HTTP] TEMPLATES_DIR: ${TEMPLATES_DIR}`);

		let filename = 'preview.png';
		if (theme === 'light') {
			filename = 'preview-light.png';
		} else if (theme === 'dark') {
			filename = 'preview-dark.png';
		}

		let imagePath = nodePath.join(TEMPLATES_DIR, slug, filename);
		console.error(`[HTTP] Checking path: ${imagePath}`);
		console.error(`[HTTP] Path exists: ${fs.existsSync(imagePath)}`);

		if (!fs.existsSync(imagePath)) {
			// Fallback
			imagePath = nodePath.join(TEMPLATES_DIR, slug, 'preview.png');
			console.error(`[HTTP] Fallback path: ${imagePath}`);
			console.error(`[HTTP] Fallback exists: ${fs.existsSync(imagePath)}`);
		}

		if (fs.existsSync(imagePath)) {
			console.error(`[HTTP] Sending file: ${imagePath}`);
			res.sendFile(imagePath);
		} else {
			console.error(`[HTTP] File not found: ${imagePath}`);
			res.status(404).json({ error: 'Preview not found' });
		}
	});

	// List all templates endpoint
	router.get('/api/templates', async (req, res) => {
		try {
			if (!fs.existsSync(TEMPLATES_DIR)) {
				log('error', 'http', 'Templates directory not found', { path: TEMPLATES_DIR });
				return res.status(500).json({ error: 'Templates directory not found', path: TEMPLATES_DIR });
			}
			const fetcher = new TemplateFetcher(TEMPLATES_DIR);
			await fetcher.initialize();
			const templates = fetcher.getAllTemplates();
			
			const templateList: Array<Record<string, unknown>> = [];
			for (const t of templates) {
				try {
					// Determine color based on category/tags just for fun/fallback
					let color = "#3b82f6";
					const cat = t.metadata.category as string;
					if (cat === 'health' || cat === 'fitness') color = "#10b981";
					if (cat === 'business' || cat === 'saas-product') color = "#6366f1";
					
					const rawFeatures = (t.config as any)?.features || [];
					const integrations = (t.config as any)?.integrations || {};
					const slug = t.metadata.slug;
					
					// Load palettes from config or palettes/ folder
					let palettes: Array<{ id: string; name: string; colors?: Record<string, string>; fonts?: { heading?: string; body?: string } }> = Array.isArray((t.config as any)?.palettes) ? (t.config as any).palettes : [];
					if (palettes.length === 0) {
						const palettesDir = nodePath.join(TEMPLATES_DIR, slug, 'palettes');
						if (fs.existsSync(palettesDir)) {
							try {
								const paletteFiles = fs.readdirSync(palettesDir)
									.filter((f: string) => f.endsWith('.json'))
									.sort();
								palettes = paletteFiles.map((file: string) => {
									const content = JSON.parse(fs.readFileSync(nodePath.join(palettesDir, file), 'utf-8'));
									const c = content.colors || {};
									return {
										id: content.id || file.replace('.json', ''),
										name: content.name || content.id || file,
										colors: {
											primary: c.primary || c['primary-dark'] || '#3b82f6',
											...(c['primary-dark'] ? { 'primary-dark': c['primary-dark'] } : {}),
											secondary: c.secondary || c.accent || '#6366f1',
											accent: c.accent || c.secondary || '#8b5cf6',
											background: c.background || '#ffffff',
											...(c.surface ? { surface: c.surface } : {}),
											text: c.text || '#1e293b',
											...(c['text-muted'] ? { 'text-muted': c['text-muted'] } : {}),
										},
										fonts: content.fonts,
									};
								});
							} catch (e) {
								log('warn', 'http', `Failed to load palettes for ${slug}`, { error: String(e) });
							}
						}
					}
					
					// Load fonts from palettes if config has none (each palette can have fonts)
					let fonts: Array<{ id: string; name: string; heading?: string; body?: string }> = (t.config as any)?.fonts || [];
					if (fonts.length === 0 && palettes.length > 0) {
						const seen = new Set<string>();
						for (const p of palettes) {
							const pf = p.fonts;
							if (pf?.heading && pf?.body && !seen.has(`${pf.heading}/${pf.body}`)) {
								seen.add(`${pf.heading}/${pf.body}`);
								fonts.push({
									id: `font-${seen.size}`,
									name: `${pf.heading} + ${pf.body}`,
									heading: pf.heading,
									body: pf.body,
								});
							}
						}
					}
					
					// Compute sensible flags for filtering
					const hasDark = rawFeatures.some((f: string) => /dark/i.test(f)) ||
						fs.existsSync(nodePath.join(TEMPLATES_DIR, slug, 'thumbnail-dark.png'));
					const hasBooking = Boolean((integrations as any)['booking']) || rawFeatures.some((f: string) => /booking/i.test(f));
					const hasNewsletter = Boolean((integrations as any)['newsletter']) || rawFeatures.some((f: string) => /newsletter/i.test(f));
					const hasContact = rawFeatures.some((f: string) => /contact\s*form/i.test(f));
					const hasPricing = rawFeatures.some((f: string) => /pricing/i.test(f));
					const hasFAQ = rawFeatures.some((f: string) => /faq/i.test(f));
					const hasGallery = rawFeatures.some((f: string) => /(gallery|portfolio)/i.test(f));
					const isMultiPage = rawFeatures.some((f: string) => /multi[- ]?page/i.test(f));
					
					templateList.push({
						slug,
						name: t.metadata.displayName,
						description: t.metadata.description,
						category: t.metadata.category || '',
						useCase: t.metadata.useCase || [],
						color,
						thumbnail: `/api/templates/${slug}/thumbnail`,
						thumbnailLight: fs.existsSync(nodePath.join(TEMPLATES_DIR, slug, 'thumbnail-light.png'))
							? `/api/templates/${slug}/thumbnail?theme=light`
							: `/api/templates/${slug}/thumbnail`,
						thumbnailDark: fs.existsSync(nodePath.join(TEMPLATES_DIR, slug, 'thumbnail-dark.png'))
							? `/api/templates/${slug}/thumbnail?theme=dark`
							: `/api/templates/${slug}/thumbnail`,
						palettes,
						fonts,
						theme: (t.config as any)?.theme || {},
						features: rawFeatures,
						flags: {
							dark: hasDark,
							booking: hasBooking,
							newsletter: hasNewsletter,
							contact: hasContact,
							pricing: hasPricing,
							faq: hasFAQ,
							gallery: hasGallery,
							multipage: isMultiPage,
						},
					});
				} catch (e) {
					log('error', 'http', `Failed to process template ${t.metadata.slug}`, { error: String(e) });
				}
			}
			
			res.json(templateList);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			const stack = error instanceof Error ? error.stack : undefined;
			console.error('Error listing templates:', msg, stack);
			res.status(500).json({ error: 'Failed to list templates', details: msg });
		}
	});

	return router;
}
