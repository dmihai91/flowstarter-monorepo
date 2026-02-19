# Template Configuration Refactoring

## Overview
This document describes the refactoring of hardcoded template logic into a data-driven configuration system.

## Problem
Previously, template-specific data was hardcoded in multiple places:
- `src/lib/template-content-parser.ts`: Hardcoded if/else chains for template defaults
- `src/data/project-templates.ts`: Hardcoded Sets for thumbnails and category assignments

This made it difficult to:
- Add new templates (required code changes)
- Maintain consistency across templates
- Test template configurations
- Enable non-developers to manage templates

## Solution
Implemented a **configuration-based system** where each template has its own `config.json` file.

### File Structure
```
templates/
├── local-business-pro/
│   ├── config.json          # NEW: Template configuration
│   ├── content.md
│   ├── app/
│   └── ...
├── personal-brand-pro/
│   ├── config.json          # NEW: Template configuration
│   └── ...
└── saas-product-pro/
    ├── config.json          # NEW: Template configuration
    └── ...
```

### Config File Format
Each `config.json` contains:
```json
{
  "id": "local-business-pro",
  "category": "local-business",
  "defaults": {
    "projectDescription": "...",
    "targetUsers": "...",
    "businessGoals": "..."
  },
  "hasThumbnail": true
}
```

## Changes Made

### 1. New Files Created
- **`src/lib/template-config-loader.ts`**: Utility for loading template configurations
  - `loadTemplateConfig()`: Async function to load config from file
  - `getTemplateDefaults()`: Get template defaults with fallback
  - `getTemplateCategory()`: Get template category
  - `hasTemplateThumbnail()`: Check if template has thumbnail
  - `getTemplateDefaultsSync()`: Sync version for client-side use

- **`templates/*/config.json`**: Configuration files for each template

### 2. Files Modified

#### `src/lib/template-content-parser.ts`
**Before:**
```typescript
export function getTemplateDefaults(templateId: string): TemplateDefaults {
  const defaults: Record<string, TemplateDefaults> = {
    'local-business-pro': { ... },
    'personal-brand-pro': { ... },
    'saas-product-pro': { ... },
  };
  return defaults[templateId] || { ... };
}

// In loadTemplateContentFromFile:
if (templateId === 'local-business-pro') {
  projectDescription = 'Quality service you can trust';
  targetUsers = 'the community';
} else if (templateId === 'personal-brand-pro') {
  // ...
}
```

**After:**
```typescript
import { getTemplateDefaults as loadTemplateDefaults } from './template-config-loader';

export function getTemplateDefaults(templateId: string): TemplateDefaults {
  return getTemplateDefaultsSync(templateId);
}

// In loadTemplateContentFromFile:
const defaults = await loadTemplateDefaults(templateId);
let projectDescription = defaults.projectDescription;
let targetUsers = defaults.targetUsers;
let businessGoals = defaults.businessGoals;
```

#### `src/data/project-templates.ts`
**Before:**
```typescript
const availableThumbs = new Set([
  'local-business-1',
  'local-business-2',
  // ... hardcoded list
]);

// 50+ lines of if/else for category assignment
if (template.id.startsWith('personal-brand')) { ... }
else if (template.id.startsWith('local-business')) { ... }
// ...
```

**After:**
```typescript
// Simple dynamic thumbnail assignment
for (const t of projectTemplates) {
  if (t.id.includes('-pro') || ...) {
    t.thumbnailUrl = `/assets/template-thumbnails/${t.id}.png`;
  }
}

// Configuration-driven category mapping
const categoryMappings = [
  { prefix: 'personal-brand', categoryId: 'personal-brand' },
  { prefix: 'local-business', categoryId: 'local-business' },
  // ...
];

for (const template of projectTemplates) {
  const mapping = categoryMappings.find(m => template.id.startsWith(m.prefix));
  if (mapping) {
    const category = projectCategories.find(cat => cat.id === mapping.categoryId);
    // ...
  }
}
```

### 3. Cleanup
- Removed unused imports (`PreviewLoading`, unused icon constants)
- Fixed TypeScript `any` types in `usePersistedGeneration.ts`
- Removed unused variables across multiple components

## Benefits

### ✅ Maintainability
- Template configurations are now in dedicated config files
- No need to modify core application code to add templates
- Easier to spot missing or incorrect configurations

### ✅ Scalability
- Adding new templates only requires creating a new config file
- Template data is co-located with template code
- Can easily add more configuration options in the future

### ✅ Testability
- Can test configuration loading independently
- Can validate config files programmatically
- Can mock configs for testing

### ✅ Future-Ready
- Easy to migrate to database-driven templates
- Can implement template marketplace/plugins
- Can enable template versioning

## Migration Guide

### Adding a New Template
1. Create template directory: `templates/my-new-template/`
2. Create `config.json`:
   ```json
   {
     "id": "my-new-template",
     "category": "appropriate-category",
     "defaults": {
       "projectDescription": "...",
       "targetUsers": "...",
       "businessGoals": "..."
     },
     "hasThumbnail": false
   }
   ```
3. Add template to `projectTemplates` array in `src/data/project-templates.ts`
4. No other code changes needed!

### Updating Existing Templates
Simply edit the `config.json` file in the template directory.

## Performance Considerations
- Configs are cached in memory after first load
- File I/O only happens on server-side (during SSR/API routes)
- Client-side uses sync fallback with minimal overhead

## Future Enhancements
1. **Validation**: Add JSON schema validation for config files
2. **CLI Tool**: Create a CLI to generate/validate template configs
3. **Database Migration**: Move configs to database for dynamic updates
4. **API Endpoints**: Create API routes to manage templates
5. **Template Marketplace**: Enable third-party template contributions

## Breaking Changes
None - the refactoring maintains backward compatibility through the `getTemplateDefaultsSync()` fallback.

## Testing
After this refactoring:
- ✅ All existing templates work as before
- ✅ Linter passes (0 errors, warnings only)
- ✅ Template defaults load correctly from config files
- ✅ Fallback to generic defaults works when config is missing
