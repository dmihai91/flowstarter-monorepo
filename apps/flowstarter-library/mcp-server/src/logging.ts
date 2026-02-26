// Comprehensive Logging Utilities

export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const LOG_COLORS = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

export interface RequestMetrics {
	startTime: number;
	endpoint: string;
	method: string;
}

export const activeRequests = new Map<string, RequestMetrics>();

export function log(
	level: 'debug' | 'info' | 'warn' | 'error',
	scope: string,
	message: string,
	data?: Record<string, unknown>
) {
	const levels = { debug: 0, info: 1, warn: 2, error: 3 };
	if (levels[level] < (levels[LOG_LEVEL as keyof typeof levels] ?? 1)) return;

	const colors = {
		debug: LOG_COLORS.dim,
		info: LOG_COLORS.cyan,
		warn: LOG_COLORS.yellow,
		error: LOG_COLORS.red,
	};

	const timestamp = new Date().toISOString();
	const prefix = `${colors[level]}[${timestamp}] [${scope}] [${level.toUpperCase()}]${LOG_COLORS.reset}`;

	let output = `${prefix} ${message}`;
	if (data) {
		const dataStr = Object.entries(data)
			.map(([k, v]) => `${LOG_COLORS.dim}${k}=${LOG_COLORS.reset}${typeof v === 'object' ? JSON.stringify(v) : v}`)
			.join(' ');
		output += ` ${dataStr}`;
	}
	console.error(output);
}

export function logRequestStart(requestId: string, method: string, endpoint: string, clientIp: string) {
	activeRequests.set(requestId, { startTime: Date.now(), endpoint, method });
	log('info', 'HTTP', `→ ${method} ${endpoint}`, { requestId, clientIp });
}

export function logRequestEnd(requestId: string, statusCode: number, extra?: Record<string, unknown>) {
	const metrics = activeRequests.get(requestId);
	if (metrics) {
		const duration = Date.now() - metrics.startTime;
		activeRequests.delete(requestId);
		log('info', 'HTTP', `← ${metrics.method} ${metrics.endpoint}`, {
			requestId,
			statusCode,
			duration: `${duration}ms`,
			...extra
		});
	}
}
