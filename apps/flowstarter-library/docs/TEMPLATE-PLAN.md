# 🚀 Flowstarter Template Expansion Plan

## Goal: 27 Templates for Launch

### Current Templates (9)
| Template | Category | Status | Quality |
|----------|----------|--------|---------|
| consultant-pro | business | ✅ | Basic (3 files) |
| creative-portfolio | personal-brand | ✅ | Good (palettes/fonts) |
| fitness-coach | fitness | ✅ | **GOLD** (21 files, 6 palettes) |
| home-services | local-business | ✅ | Basic (3 files) |
| legal-services | business | ✅ | Basic (7 files) |
| modern-business | business | ✅ | Good (24 files) |
| saas-landing | saas-product | ✅ | Good (13 files, palettes/fonts) |
| therapist-care | health | ✅ | Good (13 files) |
| tutor-online | education | ✅ | Basic (3 files) |

### Missing Templates (18 needed)

#### 🍽️ Food & Hospitality (3)
1. **restaurant-page** - Menu, reservations, gallery
2. **cafe-bakery** - Warm, cozy design
3. **catering-events** - Event galleries, packages

#### 🏪 Retail & E-commerce (3)
4. **boutique-shop** - Product showcase, minimal
5. **jewelry-store** - Luxury, elegant design
6. **florist-shop** - Fresh, botanical aesthetic

#### 💼 Professional Services (3)
7. **accounting-firm** - Trust-focused, clean
8. **dental-clinic** - Healthcare, calming
9. **veterinary-care** - Pet-friendly, warm

#### 🎨 Creative & Media (3)
10. **photography-studio** - Image-heavy gallery
11. **music-artist** - Bold, band/musician focused
12. **event-planner** - Elegant, showcases events

#### 🏠 Real Estate & Property (2)
13. **real-estate-agent** - Listings, agent profile
14. **interior-design** - Project galleries, luxe

#### 🎓 Education & Coaching (2)
15. **online-course** - Course sales, curriculum
16. **life-coach** - Personal brand, testimonials

#### 💻 Tech & Startup (2)
17. **app-landing** - Mobile app showcase
18. **ai-product** - Modern, tech-forward

---

## Template Quality Standards (fitness-coach model)

### Required Structure
```
template-name/
├── template.json          # Metadata + palettes + fonts
├── palettes/              # 4-6 color schemes
│   ├── palette-1.json
│   └── ...
├── src/
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Services.astro    # or Features/Products
│   │   ├── Pricing.astro     # if applicable
│   │   ├── Testimonials.astro
│   │   └── integrations/     # Plug-and-play widgets
│   │       ├── BookingWidget.astro
│   │       ├── ContactForm.astro
│   │       └── Newsletter.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── contact.astro
│   └── styles/
│       └── global.css
└── public/
    └── images/           # Placeholder images
```

### Required Metadata (template.json)
```json
{
  "slug": "restaurant-page",
  "displayName": "Restaurant",
  "description": "Appetizing design with menu and reservation features.",
  "category": "food-service",
  "useCase": ["restaurant", "cafe", "food", "dining"],
  "palettes": [...],
  "fonts": [...],
  "theme": { "light": {...}, "dark": {...} }
}
```

### Palette Requirements
- Minimum 4 palettes per template
- Each palette: primary, secondary, accent, background, text
- Consider light/dark modes

### Font Requirements
- 4-6 font pairings per template
- Each: heading font, body font, Google Fonts URL

---

## Implementation Priority

### Phase 1: High-Demand (Week 1)
1. 🍕 **restaurant-page** - Most requested
2. 🏠 **real-estate-agent** - High market
3. 🦷 **dental-clinic** - Local business staple
4. 📱 **app-landing** - Startup demand

### Phase 2: Retail & Creative (Week 2)
5. 🛍️ **boutique-shop**
6. 📸 **photography-studio**
7. 🎉 **event-planner**
8. 🌸 **florist-shop**

### Phase 3: Professional (Week 3)
9. 💰 **accounting-firm**
10. 🐾 **veterinary-care**
11. 🏡 **interior-design**
12. 🎸 **music-artist**

### Phase 4: Education & Tech (Week 4)
13. 📚 **online-course**
14. 🧠 **life-coach**
15. ☕ **cafe-bakery**
16. 🤖 **ai-product**

### Phase 5: Remaining (Week 5)
17. 💎 **jewelry-store**
18. 🎊 **catering-events**

---

## Upgrade Existing Templates

Templates to upgrade to fitness-coach standard:
- [ ] consultant-pro (3→20+ files)
- [ ] home-services (3→15+ files)
- [ ] tutor-online (3→15+ files)

---

## AI Generation Strategy

For each new template:
1. Use Claude/GPT to generate initial structure based on fitness-coach
2. Customize hero, sections for industry
3. Create 4-6 unique palettes matching industry (warm for food, clinical for healthcare)
4. Add appropriate font pairings
5. Include relevant integration placeholders

---

## Estimated Effort

| Task | Time |
|------|------|
| Generate 1 new template | 2-3 hours |
| Upgrade 1 basic template | 1-2 hours |
| Total for 18 new templates | ~45 hours |
| Total for 3 upgrades | ~5 hours |
| **Total** | **~50 hours** |

With AI assistance: **2-3 weeks** realistic timeline
