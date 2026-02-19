# AGENTS.md - Flowstarter Template Library

## Template Development Rules

### TypeScript Strict Mode - MANDATORY

**All Astro components MUST pass TypeScript strict checking.** This is non-negotiable.

#### Why?
The Flowstarter build pipeline runs `astro check` which enforces TypeScript strict mode. Templates that fail type checking will cause site generation to fail, even if the code works at runtime.

#### Requirements

1. **All `.map()` callbacks must have typed parameters:**
   ```astro
   // ❌ BAD - will fail astro check
   {items.map((item) => <div>{item.name}</div>)}
   
   // ✅ GOOD - explicit types
   {items.map((item: ItemType) => <div>{item.name}</div>)}
   ```

2. **All frontmatter data must be typed:**
   ```astro
   ---
   // ❌ BAD - implicit any
   import { frontmatter as data } from '../content/page.md';
   const { title, items } = data;
   
   // ✅ GOOD - explicit type assertion
   interface PageData {
     title: string;
     items: Item[];
   }
   const { title, items } = data as PageData;
   ---
   ```

3. **Define interfaces for all data structures:**
   ```astro
   ---
   interface TimeSlot {
     day: string;
     times: string[];
   }
   
   interface BookingField {
     name: string;
     label: string;
     type: string;
     required?: boolean;
   }
   ---
   ```

### Common Problem Files

The following components are shared across templates and must maintain strict typing:

- `src/components/integrations/BookingWidget.astro` - booking slots and fields
- `src/components/integrations/Newsletter.astro` - benefit items
- `src/components/Pricing.astro` - plans and features
- `src/components/Hero.astro` - stats
- `src/components/Services.astro` - service items
- `src/layouts/Layout.astro` - navigation links

### Testing Templates

Before committing any template changes, run BOTH checks:

```bash
cd templates/<template-name>
pnpm install

# Step 1: Type checking (MANDATORY)
pnpm astro check
# Must pass with 0 errors

# Step 2: Build test (MANDATORY)  
pnpm astro build
# Must complete without errors
```

**Both commands must pass.** A template that passes `astro check` but fails `astro build` is broken.

#### Why both?

- `astro check` - Catches TypeScript type errors
- `astro build` - Catches runtime issues, missing imports, invalid syntax, broken references

#### Quick validation script

```bash
# Run this from the template directory
pnpm astro check && pnpm astro build && echo "✅ Template ready" || echo "❌ Template broken"
```

### FixerAgent Limitations

The AI FixerAgent can handle simple type errors but may struggle with:
- Complex generic types
- Nested object type inference
- Multiple cascading errors

**Fix templates at the source** rather than relying on runtime fixes.

---

## Template Structure

Each template must include:
- `src/components/integrations/` - booking, newsletter widgets
- `content/integrations/` - configuration markdown files
- `astro.config.mjs` - with proper TypeScript settings
- `tsconfig.json` - strict mode enabled

## Contributing

1. Fork the repo
2. Make changes to template
3. Run `pnpm astro check` - must pass
4. Submit PR

---

*Last updated: 2026-02-08*
