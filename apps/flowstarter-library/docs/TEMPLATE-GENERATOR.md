# Template Generator

A CLI tool to generate test instances of Flowstarter Library with variable replacements for local testing.

## Quick Start

```bash
# Generate a template with default values
node generate-template.js local-business-pro my-test-restaurant

# Navigate and run
cd my-test-restaurant
bun install
bun dev
```

## Usage

```bash
node generate-template.js <template-name> [output-dir] [KEY=VALUE...]
```

### Arguments

- `<template-name>` (required): Template to generate
  - `local-business-pro`
  - `personal-brand-pro`
  - `saas-product-pro`

- `[output-dir]` (optional): Output directory name
  - Default: `test-{template-name}`
  - Example: `my-restaurant`, `my-saas`, etc.

- `[KEY=VALUE...]` (optional): Custom variable replacements
  - Override default values for template variables

## Available Variables

The generator replaces the following variables in all template files:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `PROJECT_NAME` | `my-test-project` | Project name for package.json |
| `PROJECT_DESCRIPTION` | `A test project...` | Project description |
| `AUTHOR_NAME` | `Test Author` | Author name |
| `AUTHOR_EMAIL` | `test@example.com` | Author email |
| `SITE_URL` | `https://example.com` | Website URL |
| `SITE_NAME` | `Test Site` | Site name |
| `BUSINESS_NAME` | `Test Business` | Business name |
| `BUSINESS_DESCRIPTION` | `A test business...` | Business description |

## Examples

### Basic Usage

Generate with default values:
```bash
node generate-template.js local-business-pro
# Creates: test-local-business-pro/
```

### Custom Output Directory

```bash
node generate-template.js saas-product-pro my-awesome-saas
# Creates: my-awesome-saas/
```

### With Custom Variables

```bash
node generate-template.js personal-brand-pro my-portfolio \
  PROJECT_NAME="john-doe-portfolio" \
  AUTHOR_NAME="John Doe" \
  SITE_URL="https://johndoe.com"
```

### Full Example

```bash
node generate-template.js local-business-pro bella-restaurant \
  PROJECT_NAME="bella-restaurant" \
  PROJECT_DESCRIPTION="Italian restaurant website" \
  BUSINESS_NAME="Bella Restaurant" \
  SITE_URL="https://bellarestaurant.com" \
  AUTHOR_NAME="Maria Rossi"

cd bella-restaurant
bun install
bun dev
```

## What Gets Generated

The generator:

1. ✅ Copies all template files
2. ✅ Replaces `{{VARIABLE}}` placeholders with actual values
3. ✅ Skips unnecessary files (node_modules, build artifacts, etc.)
4. ✅ Preserves directory structure
5. ✅ Creates ready-to-run project

## Excluded Files/Directories

The generator automatically skips:

**Directories:**
- `node_modules/`
- `.git/`
- `build/`
- `dist/`
- `.next/`
- `.vinxi/`

**Files:**
- `.DS_Store`
- `Thumbs.db`
- `bun.lockb`
- `package-lock.json`
- `yarn.lock`

## After Generation

Once generated, navigate to your project and:

```bash
cd your-project-name

# Install dependencies
bun install  # or npm install

# Start development server
bun dev      # or npm run dev

# Build for production
bun run build

# Start production server
bun start
```

## Testing Multiple Configurations

You can easily test different configurations:

```bash
# Test 1: Default values
node generate-template.js local-business-pro test-default

# Test 2: With custom branding
node generate-template.js local-business-pro test-branded \
  BUSINESS_NAME="Acme Corp" \
  SITE_URL="https://acme.com"

# Test 3: Different template
node generate-template.js saas-product-pro test-saas
```

## Cleanup

Generated test directories are gitignored automatically. To clean up:

```bash
# Remove a specific test
rm -rf test-local-business-pro

# Remove all test directories
rm -rf test-*
```

## Tips

1. **Always use a new directory** - The generator will fail if the output directory already exists
2. **Quote values with spaces** - Use quotes for multi-word values: `BUSINESS_NAME="Bella Restaurant"`
3. **Check the output** - The generator shows what variables were replaced
4. **Test before deployment** - Always test generated templates locally before deployment

## Troubleshooting

### "Output directory already exists"

Remove the existing directory first:
```bash
rm -rf test-local-business-pro
```

### "Template not found"

Check template name spelling. Available templates:
- `local-business-pro`
- `personal-brand-pro`
- `saas-product-pro`

### Variables not replaced

Make sure to use the correct format:
- ✅ `PROJECT_NAME="value"`
- ❌ `PROJECT-NAME="value"` (use underscore, not hyphen)
- ❌ `project_name="value"` (use UPPERCASE)

## Integration with MCP Server

The generated templates are perfect for:
1. Testing template scaffolding before deployment
2. Developing new features locally
3. Creating demo instances
4. Quality assurance testing

The MCP server's `scaffold_template` tool uses the same variable replacement logic!
