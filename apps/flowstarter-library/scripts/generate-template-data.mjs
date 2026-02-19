import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');
const OUTPUT_DIR = path.resolve(__dirname, '../showcase/public');

// Color palettes for templates
const palettes = {
  'academic-tutor': [
    { id: 'ocean-blue', name: 'Ocean Blue', colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#dbeafe', background: '#ffffff', text: '#0f172a' } },
    { id: 'emerald-scholar', name: 'Emerald Scholar', colors: { primary: '#10b981', secondary: '#047857', accent: '#d1fae5', background: '#ffffff', text: '#0f172a' } },
    { id: 'royal-purple', name: 'Royal Purple', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#ede9fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'warm-amber', name: 'Warm Amber', colors: { primary: '#f59e0b', secondary: '#d97706', accent: '#fef3c7', background: '#ffffff', text: '#0f172a' } },
  ],
  'workshop-host': [
    { id: 'creative-purple', name: 'Creative Purple', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#ede9fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'energetic-orange', name: 'Energetic Orange', colors: { primary: '#f97316', secondary: '#ea580c', accent: '#ffedd5', background: '#ffffff', text: '#0f172a' } },
    { id: 'professional-blue', name: 'Professional Blue', colors: { primary: '#0ea5e9', secondary: '#0284c7', accent: '#e0f2fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'fresh-teal', name: 'Fresh Teal', colors: { primary: '#14b8a6', secondary: '#0d9488', accent: '#ccfbf1', background: '#ffffff', text: '#0f172a' } },
  ],
  'language-teacher': [
    { id: 'romantic-pink', name: 'Romantic Pink', colors: { primary: '#ec4899', secondary: '#db2777', accent: '#fce7f3', background: '#ffffff', text: '#0f172a' } },
    { id: 'sunny-yellow', name: 'Sunny Yellow', colors: { primary: '#eab308', secondary: '#ca8a04', accent: '#fef9c3', background: '#ffffff', text: '#0f172a' } },
    { id: 'spanish-red', name: 'Spanish Red', colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#fee2e2', background: '#ffffff', text: '#0f172a' } },
    { id: 'french-blue', name: 'French Blue', colors: { primary: '#3b82f6', secondary: '#2563eb', accent: '#dbeafe', background: '#ffffff', text: '#0f172a' } },
  ],
  'coding-bootcamp': [
    { id: 'hacker-green', name: 'Hacker Green', colors: { primary: '#10b981', secondary: '#047857', accent: '#d1fae5', background: '#0f172a', text: '#f8fafc' } },
    { id: 'tech-blue', name: 'Tech Blue', colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#dbeafe', background: '#ffffff', text: '#0f172a' } },
    { id: 'startup-purple', name: 'Startup Purple', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#ede9fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'cyber-cyan', name: 'Cyber Cyan', colors: { primary: '#06b6d4', secondary: '#0891b2', accent: '#cffafe', background: '#0f172a', text: '#f8fafc' } },
  ],
  'music-teacher': [
    { id: 'golden-melody', name: 'Golden Melody', colors: { primary: '#f59e0b', secondary: '#d97706', accent: '#fef3c7', background: '#ffffff', text: '#0f172a' } },
    { id: 'piano-black', name: 'Piano Black', colors: { primary: '#374151', secondary: '#1f2937', accent: '#f3f4f6', background: '#ffffff', text: '#0f172a' } },
    { id: 'jazz-blue', name: 'Jazz Blue', colors: { primary: '#6366f1', secondary: '#4338ca', accent: '#e0e7ff', background: '#ffffff', text: '#0f172a' } },
    { id: 'rock-red', name: 'Rock Red', colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#fee2e2', background: '#0f172a', text: '#f8fafc' } },
  ],
  'edu-course-creator': [
    { id: 'knowledge-indigo', name: 'Knowledge Indigo', colors: { primary: '#6366f1', secondary: '#4338ca', accent: '#e0e7ff', background: '#ffffff', text: '#0f172a' } },
    { id: 'growth-green', name: 'Growth Green', colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#dcfce7', background: '#ffffff', text: '#0f172a' } },
    { id: 'wisdom-blue', name: 'Wisdom Blue', colors: { primary: '#0ea5e9', secondary: '#0284c7', accent: '#e0f2fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'creative-coral', name: 'Creative Coral', colors: { primary: '#fb7185', secondary: '#f43f5e', accent: '#ffe4e6', background: '#ffffff', text: '#0f172a' } },
  ],
  'coach-pro': [
    { id: 'executive-teal', name: 'Executive Teal', colors: { primary: '#14b8a6', secondary: '#0d9488', accent: '#ccfbf1', background: '#ffffff', text: '#0f172a' } },
    { id: 'power-navy', name: 'Power Navy', colors: { primary: '#1e3a8a', secondary: '#1e40af', accent: '#dbeafe', background: '#ffffff', text: '#0f172a' } },
    { id: 'success-gold', name: 'Success Gold', colors: { primary: '#ca8a04', secondary: '#a16207', accent: '#fef9c3', background: '#ffffff', text: '#0f172a' } },
    { id: 'mindful-purple', name: 'Mindful Purple', colors: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#ede9fe', background: '#ffffff', text: '#0f172a' } },
  ],
  'fitness-coach': [
    { id: 'power-red', name: 'Power Red', colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#fee2e2', background: '#ffffff', text: '#0f172a' } },
    { id: 'energy-orange', name: 'Energy Orange', colors: { primary: '#f97316', secondary: '#ea580c', accent: '#ffedd5', background: '#ffffff', text: '#0f172a' } },
    { id: 'strength-blue', name: 'Strength Blue', colors: { primary: '#3b82f6', secondary: '#2563eb', accent: '#dbeafe', background: '#0f172a', text: '#f8fafc' } },
    { id: 'vitality-green', name: 'Vitality Green', colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#dcfce7', background: '#ffffff', text: '#0f172a' } },
  ],
  'therapist-care': [
    { id: 'calm-green', name: 'Calm Green', colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#dcfce7', background: '#ffffff', text: '#0f172a' } },
    { id: 'serene-blue', name: 'Serene Blue', colors: { primary: '#0ea5e9', secondary: '#0284c7', accent: '#e0f2fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'gentle-lavender', name: 'Gentle Lavender', colors: { primary: '#a78bfa', secondary: '#8b5cf6', accent: '#ede9fe', background: '#ffffff', text: '#0f172a' } },
    { id: 'warm-sand', name: 'Warm Sand', colors: { primary: '#a8a29e', secondary: '#78716c', accent: '#f5f5f4', background: '#fafaf9', text: '#0f172a' } },
  ],
  'beauty-stylist': [
    { id: 'rose-gold', name: 'Rose Gold', colors: { primary: '#f472b6', secondary: '#ec4899', accent: '#fce7f3', background: '#ffffff', text: '#0f172a' } },
    { id: 'luxe-gold', name: 'Luxe Gold', colors: { primary: '#d97706', secondary: '#b45309', accent: '#fef3c7', background: '#ffffff', text: '#0f172a' } },
    { id: 'chic-black', name: 'Chic Black', colors: { primary: '#18181b', secondary: '#27272a', accent: '#f4f4f5', background: '#ffffff', text: '#0f172a' } },
    { id: 'soft-blush', name: 'Soft Blush', colors: { primary: '#fda4af', secondary: '#fb7185', accent: '#ffe4e6', background: '#fff1f2', text: '#0f172a' } },
  ],
  'creative-portfolio': [
    { id: 'bold-amber', name: 'Bold Amber', colors: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fef3c7', background: '#0f172a', text: '#f8fafc' } },
    { id: 'minimal-mono', name: 'Minimal Mono', colors: { primary: '#18181b', secondary: '#3f3f46', accent: '#f4f4f5', background: '#ffffff', text: '#0f172a' } },
    { id: 'electric-blue', name: 'Electric Blue', colors: { primary: '#3b82f6', secondary: '#2563eb', accent: '#dbeafe', background: '#0f172a', text: '#f8fafc' } },
    { id: 'forest-green', name: 'Forest Green', colors: { primary: '#166534', secondary: '#15803d', accent: '#dcfce7', background: '#ffffff', text: '#0f172a' } },
  ],
  'wellness-holistic': [
    { id: 'healing-teal', name: 'Healing Teal', colors: { primary: '#2dd4bf', secondary: '#14b8a6', accent: '#ccfbf1', background: '#ffffff', text: '#0f172a' } },
    { id: 'earth-brown', name: 'Earth Brown', colors: { primary: '#a16207', secondary: '#854d0e', accent: '#fef3c7', background: '#fefce8', text: '#0f172a' } },
    { id: 'spirit-purple', name: 'Spirit Purple', colors: { primary: '#a855f7', secondary: '#9333ea', accent: '#f3e8ff', background: '#ffffff', text: '#0f172a' } },
    { id: 'nature-green', name: 'Nature Green', colors: { primary: '#4ade80', secondary: '#22c55e', accent: '#dcfce7', background: '#f0fdf4', text: '#0f172a' } },
  ],
};

// Font pairings
const fonts = {
  default: [
    { id: 'inter-system', name: 'Inter + System', heading: 'Inter', body: 'system-ui' },
    { id: 'playfair-lato', name: 'Playfair + Lato', heading: 'Playfair Display', body: 'Lato' },
    { id: 'montserrat-opensans', name: 'Montserrat + Open Sans', heading: 'Montserrat', body: 'Open Sans' },
    { id: 'poppins-inter', name: 'Poppins + Inter', heading: 'Poppins', body: 'Inter' },
    { id: 'dm-sans', name: 'DM Sans', heading: 'DM Sans', body: 'DM Sans' },
    { id: 'space-grotesk', name: 'Space Grotesk', heading: 'Space Grotesk', body: 'Inter' },
  ],
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const yaml = match[1];
  const result = {};
  
  // Simple YAML parsing for key: value pairs
  const lines = yaml.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

function getTemplateData(templateDir) {
  const slug = path.basename(templateDir);
  
  // Read config.json
  const configPath = path.join(templateDir, 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  
  // Read hero.md for preview content
  const heroPath = path.join(templateDir, 'content', 'hero.md');
  let hero = {};
  if (fs.existsSync(heroPath)) {
    hero = parseFrontmatter(fs.readFileSync(heroPath, 'utf-8'));
  }
  
  // Check for thumbnail
  const thumbnailPath = path.join(templateDir, 'thumbnail.png');
  const hasThumbnail = fs.existsSync(thumbnailPath);
  
  // Check for dist (built template)
  const distPath = path.join(templateDir, 'dist');
  const hasPreview = fs.existsSync(distPath);
  
  return {
    slug,
    name: config.name || slug,
    description: config.description || '',
    category: config.category || 'other',
    tags: config.tags || [],
    color: palettes[slug]?.[0]?.colors?.primary || '#3b82f6',
    thumbnail: hasThumbnail ? `/thumbs/${slug}/thumbnail.png` : null,
    thumbnailLight: hasThumbnail ? `/thumbs/${slug}/thumbnail-light.png` : null,
    thumbnailDark: fs.existsSync(path.join(templateDir, 'thumbnail-dark.png')) ? `/thumbs/${slug}/thumbnail-dark.png` : null,
    palettes: palettes[slug] || palettes['academic-tutor'],
    fonts: fonts.default,
    features: config.features || [],
    integrations: config.integrations || {},
    hasPreview,
    hero: {
      headline: hero.headline || config.name || slug,
      subheadline: hero.subheadline || config.description || '',
    },
  };
}

function main() {
  console.log('Generating template data...\n');
  
  const templates = [];
  const dirs = fs.readdirSync(TEMPLATES_DIR);
  
  for (const dir of dirs) {
    const templateDir = path.join(TEMPLATES_DIR, dir);
    if (!fs.statSync(templateDir).isDirectory()) continue;
    if (dir.startsWith('.') || dir === 'node_modules') continue;
    
    try {
      const data = getTemplateData(templateDir);
      templates.push(data);
      console.log(`✓ ${data.name}`);
    } catch (err) {
      console.error(`✗ ${dir}: ${err.message}`);
    }
  }
  
  // Sort by name
  templates.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write to public folder
  const outputPath = path.join(OUTPUT_DIR, 'api', 'templates.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
  
  console.log(`\n✅ Generated ${templates.length} templates to ${outputPath}`);
}

main();
