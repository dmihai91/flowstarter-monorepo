# Website Code Generation with MetaGPT

This feature allows you to generate complete website code based on project details and templates using the MetaGPT AI agent.

## Overview

Instead of using pre-built templates, the system can now generate custom website code tailored to your specific project requirements. The AI analyzes your project details, understands the template structure, and generates production-ready Next.js code.

## How It Works

### 1. Data Flow

```
Project Details + Template Info + Template Code
           ↓
    API Route (/api/ai/generate-website)
           ↓
    MetaGPT Service (website-generator agent)
           ↓
    OpenAI GPT-4 (code generation)
           ↓
    Generated Website Code
```

### 2. Input Required

The generator needs:

- **Project Details**: Name, description, target users, business goals, USP, brand tone, key services, primary color
- **Template Info**: Template ID, name, category, description
- **Template Code** (optional): Base template code to use as a reference structure

### 3. Output

The generator provides:

- **Generated Code**: Complete page.tsx file content
- **Files**: Array of generated files with paths and content
- **Explanation**: Brief description of what was generated
- **Timestamp**: Generation timestamp

## Usage

### In Code

```typescript
import { aiAgentService } from '@/lib/ai/ai-agent-service';

const result = await aiAgentService.generateWebsiteCode(
  {
    name: 'My Business',
    description: 'A modern consulting firm',
    targetUsers: 'Small business owners',
    businessGoals: 'Generate leads and showcase expertise',
    USP: 'Personalized consulting with proven results',
    brandTone: 'Professional yet approachable',
    keyServices: 'Business strategy, Marketing, Operations',
    designConfig: {
      primaryColor: '#3b82f6',
    },
  },
  {
    id: 'personal-brand-1',
    name: 'Personal Brand - Professional',
    description: 'Clean professional landing page',
    category: 'Personal Brand',
  },
  templateCodeString // optional
);

console.log(result.response.generatedCode);
```

### Via API

```typescript
const response = await fetch('/api/ai/generate-website', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectDetails: {
      /* ... */
    },
    templateInfo: {
      /* ... */
    },
    templateCode: '...', // optional
  }),
});

const data = await response.json();
console.log(data.generatedCode);
```

### Test Page

Visit `/dashboard/new/test-generate` to test the feature:

1. Complete the project wizard to set your project details and template
2. Navigate to the test page
3. Click "Generate Website Code"
4. View, copy, or download the generated code

## API Endpoints

### POST /api/ai/generate-website

Generate website code from project details.

**Request Body:**

```json
{
  "projectDetails": {
    "name": "string",
    "description": "string",
    "targetUsers": "string (optional)",
    "businessGoals": "string (optional)",
    "USP": "string (optional)",
    "brandTone": "string (optional)",
    "keyServices": "string (optional)",
    "designConfig": {
      "primaryColor": "string (optional)"
    }
  },
  "templateInfo": {
    "id": "string",
    "name": "string",
    "description": "string (optional)",
    "category": "string (optional)"
  },
  "templateCode": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "generatedCode": "string",
  "files": [
    {
      "path": "string",
      "content": "string"
    }
  ],
  "explanation": "string",
  "timestamp": "string"
}
```

## MetaGPT Service

The website generation is handled by the MetaGPT service (`coding-agent/main.py`).

### Generate Website Code Method

```python
async def generate_website_code(self, context: Dict[str, Any]) -> Dict[str, Any]:
    """Generate complete website code from project details and template"""
```

The method:

1. Extracts project details, template info, and template code from context
2. Constructs a detailed prompt with requirements
3. Calls OpenAI GPT-4 with the prompt
4. Parses and structures the response
5. Returns generated code with metadata

### Prompt Engineering

The prompt includes:

- System prompt defining the AI's role as a Next.js expert
- Project details (name, description, goals, USP, etc.)
- Template information (name, category, description)
- Base template code as reference (first 5000 chars)
- Specific requirements:
  - Modern, responsive landing page
  - Hero, Features, About/USP, Contact sections
  - TypeScript and Tailwind CSS
  - Brand tone and color matching
  - Mobile-responsive design
  - SEO meta tags

## Integration with Wizard

### Adding to Wizard Flow

You can integrate code generation into the wizard by:

1. **After Template Selection**: Generate code when user selects a template
2. **In Review Step**: Show a "Preview Generated Code" option
3. **Custom Generation Step**: Add a dedicated step for code generation

Example integration:

```typescript
// In ReviewStep.tsx or similar
const handleGenerateCode = async () => {
  const result = await aiAgentService.generateWebsiteCode(
    projectConfig,
    templateInfo,
    templateCode
  );

  // Show generated code or proceed to deployment
  setGeneratedCode(result.response.generatedCode);
};
```

## Customization

### Modifying the Prompt

To customize the generated code, edit the prompt in `coding-agent/main.py`:

```python
user_prompt = f"""
Generate a complete Next.js website based on these details:

## Your custom instructions here...
"""
```

### Adding More File Types

To generate additional files (components, styles, etc.), extend the response:

```python
return {
    "generatedCode": main_code,
    "files": [
        {"path": "app/page.tsx", "content": main_code},
        {"path": "components/Hero.tsx", "content": hero_code},
        {"path": "app/globals.css", "content": styles}
    ],
    "explanation": "Generated complete website structure"
}
```

## Best Practices

1. **Provide Complete Details**: The more information you provide, the better the generated code
2. **Use Quality Templates**: Base templates should be well-structured for best results
3. **Review Generated Code**: Always review and test generated code before deployment
4. **Iterate**: Use the generated code as a starting point and refine as needed
5. **Monitor Costs**: GPT-4 calls can be expensive - cache results when possible

## Troubleshooting

### Service Not Running

```bash
# Check if MetaGPT service is running
Invoke-WebRequest -Uri http://localhost:8000/health -Method GET
```

### Generation Fails

- Verify project details are complete
- Check MetaGPT service logs
- Ensure OpenAI API key is valid
- Check API rate limits

### Code Quality Issues

- Improve project details descriptions
- Use better-structured base templates
- Adjust the system prompt for your needs

## Migration from Templates

To migrate from template-based to code-generation approach:

1. Keep existing templates as reference structures
2. Generate code for each project instead of copying templates
3. Use template code as the `templateCode` parameter
4. Customize generated code based on project specifics

## Future Enhancements

- [ ] Generate multiple page types (About, Services, Contact)
- [ ] Create component libraries from templates
- [ ] Add style variations (themes, layouts)
- [ ] Support for different frameworks (Vue, Angular)
- [ ] Generate database schemas and API routes
- [ ] Interactive code editing with AI suggestions

## References

- **MetaGPT Service**: `coding-agent/main.py`
- **API Route**: `src/app/api/ai/generate-website/route.ts`
- **AI Agent Service**: `src/lib/ai/ai-agent-service.ts`
- **Test Page**: `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/test-generate/page.tsx`
- **Usage Guide**: `docs/METAGPT_USAGE.md`
