# AI-Powered Template Preview System

## Overview

The template preview system now uses AI to dynamically adapt template content based on project details. When users view a template preview, the content (hero titles, pricing, features, stats, etc.) is personalized in real-time using GPT-4o-mini.

## How It Works

### 1. AI Enhancement API (`/api/ai/enhance-preview`)

**Location**: `src/app/api/ai/enhance-preview/route.ts`

This API endpoint:
- Receives `templateId` and `projectData` (name, description, targetUsers, USP)
- Uses OpenAI GPT-4o-mini to generate comprehensive personalized content
- Returns structured JSON with all template content (hero, features, pricing, stats, etc.)
- Adapts pricing format based on business type (SaaS, local business, consulting)

**Generated Content Includes**:
- Hero title and subtitle
- About section headline and text
- Features (4 items with titles and descriptions)
- Services (3 items with names and descriptions)
- Pricing (3 tiers with realistic prices, features)
- CTA button text (primary and secondary)
- Stats (4 metrics with values and labels)
- Testimonials (2 customer quotes)
- Contact information

### 2. Template Preview Component

**Location**: `src/components/template-preview/TemplatePreview.tsx`

**New Features**:
- `enhanceWithAI` prop - when true, fetches AI-generated content
- `AIContentContext` - provides AI content to all preview components
- `useAIContent()` hook - access AI content in preview templates
- Loading state with "Personalizing preview with AI..." indicator
- Error handling for API failures

### 3. Preview Page Route

**Location**: `src/app/template-preview/[id]/page.tsx`

Now accepts `enhanceWithAI` query parameter to enable AI enhancement.

### 4. Template Card Integration

**Location**: `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/templates/TemplateCard.tsx`

The template preview iframe automatically passes:
- `enhanceWithAI=true` - enables AI enhancement
- Project config data (name, description, USP, targetUsers)
- Theme preference

### 5. Preview Components

**Example**: `src/components/template-preview/previews/PersonalBrandProPreview.tsx`

Preview components now:
- Import `useAIContent` hook
- Use AI-generated content when available
- Fallback to project data or defaults if AI content isn't available
- Dynamically render hero, stats, features, services, pricing sections

**Example Usage**:
```tsx
import { useAIContent } from '../TemplatePreview';

export default function PersonalBrandProPreview() {
  const aiContent = useAIContent();
  const projectData = useProjectData();
  
  // Use AI content with fallbacks
  const heroTitle = aiContent?.heroTitle || 'Default Title';
  const stats = aiContent?.stats || defaultStats;
  const pricing = aiContent?.pricing || defaultPricing;
  
  return (
    // Render with dynamic content
    <h1>{heroTitle}</h1>
    {stats.map(stat => ...)}
    {pricing.plans.map(plan => ...)}
  );
}
```

## AI Prompt Strategy

The AI is instructed to:
1. **Be authentic** - use natural language, avoid buzzwords
2. **Be specific** - tailor content to the actual business
3. **Be appropriate** - adjust pricing and metrics for industry type
4. **Be realistic** - generate believable stats and testimonials

**Pricing Intelligence**:
- Local businesses: per-service/per-session pricing
- SaaS: monthly subscription tiers
- Consultants: hourly/project/retainer rates
- E-commerce: product pricing

## User Experience

When a user previews a template:

1. **Immediate Display**: Template loads with project data
2. **AI Enhancement**: If project details are available, AI generates personalized content (2-3 seconds)
3. **Smooth Update**: Content smoothly updates with AI-generated text
4. **Loading Indicator**: Shows "Personalizing preview with AI..." notification
5. **Error Handling**: Falls back to project data if AI fails

## Benefits

- **Personalized Previews**: Users see templates customized for their actual business
- **Better Decisions**: More realistic preview helps users choose the right template
- **Realistic Pricing**: Shows appropriate pricing for their industry
- **Authentic Copy**: Natural, business-specific content instead of generic placeholders
- **Comprehensive**: Covers hero, features, services, pricing, stats, testimonials

## Performance

- AI generation: ~2-3 seconds
- Model: GPT-4o-mini (fast and cost-effective)
- Caching: Client-side caching in React state
- Fallbacks: Always works even if AI fails

## Next Steps

To add AI enhancement to more templates:

1. Import `useAIContent` hook in preview component
2. Destructure needed content: `const { heroTitle, pricing, stats, features } = useAIContent() || {}`
3. Add fallback values: `const title = aiContent?.heroTitle || 'Default'`
4. Update JSX to use dynamic values
5. Test with different project types

## Example: Adding AI to a New Template

```tsx
'use client';
import { useProjectData, useAIContent } from '../TemplatePreview';

export default function MyTemplatePreview() {
  const projectData = useProjectData();
  const aiContent = useAIContent();
  
  // Dynamic content with fallbacks
  const heroTitle = aiContent?.heroTitle || projectData?.name || 'Default';
  const pricing = aiContent?.pricing?.plans || defaultPricing;
  
  return (
    <div>
      <h1>{heroTitle}</h1>
      {pricing.map(plan => (
        <div key={plan.name}>
          <h3>{plan.name}</h3>
          <p>{plan.price} / {plan.period}</p>
          <ul>
            {plan.features.map(f => <li>{f}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## Configuration

Add to `.env`:
```
OPENAI_API_KEY=your_key_here
```

The system automatically uses the existing OpenAI configuration.
