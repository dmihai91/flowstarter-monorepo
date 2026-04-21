import Buffer from 'vite-plugin-node-polyfills/shims/buffer';

/**
 * Cloudflare Pages Integration
 *
 * Deploy built files to Cloudflare Pages via Direct Upload API.
 */
/**
 * Create a Cloudflare Pages project if it doesn't exist.
 */
async function createPagesProject(projectName, config) {
    const sanitizedName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 63);
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: sanitizedName,
            production_branch: 'main',
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        // 409 = project already exists, which is fine
        if (response.status !== 409) {
            throw new Error(`Failed to create Pages project: ${JSON.stringify(error)}`);
        }
    }
    return {
        name: sanitizedName,
        subdomain: `${sanitizedName}.pages.dev`,
    };
}
/**
 * Deploy files to Cloudflare Pages via Direct Upload.
 */
async function deployToPages(projectName, files, config) {
    // Create form data with file entries
    const formData = new FormData();
    for (const file of files) {
        const blob = new Blob([new Uint8Array(file.content)]);
        formData.append(file.path, blob, file.path);
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${projectName}/deployments`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Deployment failed: ${JSON.stringify(error)}`);
    }
    const data = await response.json();
    const deployment = data.result;
    return {
        id: deployment.id,
        url: deployment.url,
        environment: deployment.environment,
    };
}
/**
 * Attach a custom domain to a Cloudflare Pages project.
 * This enables TLS automatically via Cloudflare.
 */
async function attachCustomDomain(pagesProjectName, domain, config) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${pagesProjectName}/domains`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to attach domain: ${JSON.stringify(error)}`);
    }
    const data = await response.json();
    return { domain: data.result.name, status: data.result.status };
}
/**
 * Get custom domains attached to a Cloudflare Pages project.
 */
async function getCustomDomains(pagesProjectName, config) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${pagesProjectName}/domains`, {
        headers: { Authorization: `Bearer ${config.apiToken}` },
    });
    if (!response.ok)
        throw new Error('Failed to get domains');
    const data = await response.json();
    return data.result.map(d => ({ domain: d.name, status: d.status }));
}
/**
 * Get deployment status.
 */
async function getDeploymentStatus(projectName, deploymentId, config) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${projectName}/deployments/${deploymentId}`, {
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to get deployment status');
    }
    const data = await response.json();
    return {
        status: data.result.latest_stage?.status || 'unknown',
        url: data.result.url,
    };
}

/**
 * Bundle Builder
 *
 * Build the site in a sandbox and prepare for deployment.
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file (CF Pages limit)
const MAX_FILE_COUNT = 20_000; // CF Pages limit
/**
 * Run the build command in the sandbox.
 */
async function buildProject(sandbox) {
    const workDir = '/workspace';
    const result = await sandbox.process.executeCommand('npm run build', workDir);
    if (result.exitCode !== 0) {
        return {
            success: false,
            outputDir: '',
            error: result.result || 'Build failed',
        };
    }
    // Detect output directory (Astro uses dist/ by default)
    const distCheck = await sandbox.process.executeCommand('ls -d dist/ 2>/dev/null || ls -d build/ 2>/dev/null || ls -d .output/public/ 2>/dev/null || echo "dist"', workDir);
    const outputDir = distCheck.result.trim().split('\n')[0] || 'dist';
    return {
        success: true,
        outputDir: `${workDir}/${outputDir}`,
    };
}
/**
 * Download built files from sandbox.
 */
async function downloadBundle(sandbox, outputDir) {
    const workDir = '/workspace';
    // List all files in the output directory
    const listResult = await sandbox.process.executeCommand(`find ${outputDir} -type f | head -${MAX_FILE_COUNT}`, workDir);
    const filePaths = listResult.result
        .trim()
        .split('\n')
        .filter((p) => p.length > 0);
    const files = [];
    for (const filePath of filePaths) {
        try {
            const blob = await sandbox.fs.downloadFile(filePath);
            if (blob.size > MAX_FILE_SIZE) {
                continue; // Skip files over 25MB
            }
            // Convert Blob to Buffer
            const arrayBuffer = await blob.arrayBuffer();
            const content = Buffer.from(arrayBuffer);
            // Convert to relative path (remove outputDir prefix)
            const relativePath = filePath.replace(outputDir, '').replace(/^\//, '');
            files.push({ path: relativePath, content });
        }
        catch {
            // Skip unreadable files
        }
    }
    return files;
}
/**
 * Validate a bundle before deployment.
 */
function validateBundle(files) {
    const errors = [];
    if (files.length === 0) {
        errors.push('No files in bundle');
    }
    if (files.length > MAX_FILE_COUNT) {
        errors.push(`Too many files: ${files.length} (max ${MAX_FILE_COUNT})`);
    }
    for (const file of files) {
        if (file.content.length > MAX_FILE_SIZE) {
            errors.push(`File too large: ${file.path} (${file.content.length} bytes)`);
        }
    }
    // Check for index.html
    const hasIndex = files.some((f) => f.path === 'index.html' || f.path === '/index.html');
    if (!hasIndex) {
        errors.push('Missing index.html');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * name.com Core v1 REST API wrapper for domain provisioning (Tier 2).
 *
 * Auth: HTTP Basic Auth (username:token).
 * Sandbox: append '-test' to username, use api.dev.name.com.
 */
// ── Internals ────────────────────────────────────────────────────────────────
function baseUrl(config) {
    return config.sandbox
        ? 'https://api.dev.name.com'
        : 'https://api.name.com';
}
function authHeader(config) {
    const user = config.sandbox
        ? `${config.username}-test`
        : config.username;
    return `Basic ${Buffer.from(`${user}:${config.token}`).toString('base64')}`;
}
async function namecomFetch(path, config, init = {}) {
    const url = `${baseUrl(config)}${path}`;
    const res = await fetch(url, {
        ...init,
        headers: {
            Authorization: authHeader(config),
            'Content-Type': 'application/json',
            ...init.headers,
        },
    });
    return res;
}
// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Search domain availability + suggestions for a keyword.
 * POST /core/v1/domains/search
 */
async function searchDomains(keyword, config) {
    const res = await namecomFetch('/core/v1/domains/search', config, {
        method: 'POST',
        body: JSON.stringify({
            keyword,
            tlds: ['.com', '.co', '.io', '.dev'],
        }),
    });
    if (!res.ok) {
        throw new Error(`name.com search failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json());
    return (data.results ?? []).map((r) => ({
        domain: r.domainName,
        available: r.purchasable,
        price: r.purchasePrice ? Math.round(r.purchasePrice * 100) : undefined,
        currency: r.purchasePrice ? 'USD' : undefined,
    }));
}
/**
 * Register a domain.
 * POST /core/v1/domains
 */
async function registerDomain(domain, config) {
    // First look up the price via search so we can pass purchasePrice
    const results = await searchDomains(domain.split('.')[0], config);
    const match = results.find((r) => r.domain.toLowerCase() === domain.toLowerCase());
    const purchasePrice = match?.price
        ? match.price / 100 // API expects dollars
        : undefined;
    const res = await namecomFetch('/core/v1/domains', config, {
        method: 'POST',
        body: JSON.stringify({
            domainName: domain,
            purchasePrice,
            purchaseType: 'registration',
            years: 1,
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`name.com registration failed: ${res.status} ${res.statusText} — ${body}`);
    }
    const data = (await res.json());
    return {
        domain: data.domainName,
        expireDate: data.expireDate,
        locked: data.locked,
    };
}
/**
 * Update nameservers for a domain to point to Cloudflare.
 * PUT /core/v1/domains/{domainName}/nameservers
 */
async function setNameservers(domain, nameservers, config) {
    const res = await namecomFetch(`/core/v1/domains/${encodeURIComponent(domain)}/nameservers`, config, {
        method: 'PUT',
        body: JSON.stringify({ nameservers }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`name.com setNameservers failed: ${res.status} ${res.statusText} — ${body}`);
    }
}
/**
 * Get domain info (to check registration status).
 * GET /core/v1/domains/{domainName}
 */
async function getDomain(domain, config) {
    const res = await namecomFetch(`/core/v1/domains/${encodeURIComponent(domain)}`, config);
    if (res.status === 404)
        return null;
    if (!res.ok) {
        throw new Error(`name.com getDomain failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json());
    return {
        domain: data.domainName,
        expireDate: data.expireDate,
        locked: data.locked,
    };
}

export { attachCustomDomain, buildProject, createPagesProject, deployToPages, downloadBundle, getCustomDomains, getDeploymentStatus, getDomain, registerDomain, searchDomains, setNameservers, validateBundle };
