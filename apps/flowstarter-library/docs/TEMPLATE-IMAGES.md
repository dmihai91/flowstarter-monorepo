# Template Images Guide

Each template requires two images for the UI:

## Required Images

### 1. `thumbnail.png`
- **Purpose**: Small preview shown in template selection grid
- **Recommended size**: 400x300px (4:3 ratio)
- **Usage**: List views, quick selection
- **Format**: PNG with transparency support

### 2. `preview.png`
- **Purpose**: Large preview shown in template details
- **Recommended size**: 1200x900px (4:3 ratio)  
- **Usage**: Detail views, before template selection
- **Format**: PNG or JPG

## Current Status

Placeholder files have been created for all templates:
- ✅ `local-business-pro/thumbnail.png` *(empty placeholder)*
- ✅ `local-business-pro/preview.png` *(empty placeholder)*
- ✅ `personal-brand-pro/thumbnail.png` *(empty placeholder)*
- ✅ `personal-brand-pro/preview.png` *(empty placeholder)*
- ✅ `saas-product-pro/thumbnail.png` *(empty placeholder)*
- ✅ `saas-product-pro/preview.png` *(empty placeholder)*

## How to Add Real Images

### Option 1: Take Screenshots
1. Build and run each template locally
2. Take screenshots of the homepage
3. Crop and resize to recommended dimensions
4. Save as `thumbnail.png` and `preview.png` in the template directory

### Option 2: Design Custom Images
1. Create branded preview images using design tools (Figma, Photoshop, etc.)
2. Include template name, key features, tech stack
3. Follow Flowstarter branding guidelines
4. Export as PNG

### Option 3: Generate with AI
1. Use AI image generation tools
2. Prompt: "Modern web application interface for [template type]"
3. Ensure images match template's actual design
4. Post-process to add text overlays if needed

## Image Serving

Images are served via HTTP endpoints:
- Thumbnail: `http://localhost:3001/api/templates/{slug}/thumbnail`
- Preview: `http://localhost:3001/api/templates/{slug}/preview`

These URLs are automatically included in the template metadata returned by the MCP server.

## Technical Details

The MCP server:
1. Checks for image files in each template directory
2. Only includes URLs if files exist
3. Serves images via Express static file handler
4. Supports CORS for cross-origin requests

## Best Practices

- ✅ Use consistent aspect ratios across all templates
- ✅ Optimize images for web (compress without losing quality)
- ✅ Use descriptive, high-quality screenshots
- ✅ Show the template's key features visually
- ✅ Include mobile/responsive views if possible
- ❌ Don't use copyrighted images without permission
- ❌ Don't make images too large (keep under 500KB each)

## Future Enhancements

Potential improvements:
- [ ] Auto-generate previews from templates
- [ ] Multiple preview images (carousel)
- [ ] Dark/light mode variations
- [ ] Animated previews (GIF or video)
- [ ] Responsive image sizes (thumbnail variations)
