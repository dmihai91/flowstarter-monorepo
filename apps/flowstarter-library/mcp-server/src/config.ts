import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve templates directory - try multiple locations for different run contexts
function resolveTemplatesDir(): string {
	const candidates = [
		path.resolve(__dirname, '..', '..', 'templates'),
		path.resolve(process.cwd(), 'apps', 'flowstarter-library', 'templates'),
		path.resolve(process.cwd(), 'templates'),
	];
	for (const dir of candidates) {
		if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
			return dir;
		}
	}
	return candidates[0];
}

export const TEMPLATES_DIR = resolveTemplatesDir();
export const PORT = process.env.HTTP_PORT || 3001;
export const HOST = process.env.HTTP_HOST || '0.0.0.0';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const PUBLIC_DIR = path.join(__dirname, '../public');
