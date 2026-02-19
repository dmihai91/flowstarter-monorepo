# Google Analytics 4 Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for your Flowstarter application.

## Prerequisites

- A Google account
- Access to [Google Analytics](https://analytics.google.com/)

## Setup Steps

### 1. Create a Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon in the bottom left)
3. In the **Account** column, select or create an account
4. In the **Property** column, click **Create Property**
5. Enter your property details:
   - **Property name**: `Flowstarter` (or your preferred name)
   - **Reporting time zone**: Select your time zone
   - **Currency**: Select your currency
6. Click **Next**
7. Fill in your business details
8. Click **Create**
9. Accept the Terms of Service

### 2. Set Up a Data Stream

1. After creating the property, you'll be prompted to set up a data stream
2. Select **Web**
3. Enter your website details:
   - **Website URL**: Your production URL (e.g., `https://flowstarter.com`)
   - **Stream name**: `Flowstarter Web` (or your preferred name)
4. Click **Create stream**

### 3. Get Your Measurement ID

1. After creating the stream, you'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
2. Copy this ID

### 4. Add to Your Environment Variables

1. Open your `.env` file (or `.env.local` for local development)
2. Add the following line:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Replace `G-XXXXXXXXXX` with your actual Measurement ID

### 5. Deploy and Test

1. Restart your development server or deploy to production
2. Visit your website
3. In Google Analytics, go to **Reports** → **Realtime** to see live traffic
4. You should see your visit appearing in real-time!

## Events Being Tracked

The application automatically tracks the following events:

### Automatic Events (by GA4)
- **page_view**: Automatically tracked on every page navigation
- **session_start**: When users start a session
- **first_visit**: First-time visitors

### Custom Events (via our tracking utilities)
- **form_submission**: When users submit forms
- **button_click**: Important button clicks
- **project_created**: When users create a new project
- **template_selected**: When users select a template
- **ai_generation**: AI generation events (success/error)
- **user_signup**: New user registrations
- **user_login**: User logins
- **domain_search**: Domain availability searches
- **error**: Application errors

## Using Custom Event Tracking

Import the tracking utilities in your components:

```typescript
import {
  trackProjectCreation,
  trackTemplateSelection,
  trackFormSubmission,
  trackButtonClick,
  trackError,
} from '@/lib/google-analytics';

// Track project creation
trackProjectCreation('personal-brand', 'consultants-coaches');

// Track template selection
trackTemplateSelection('personal-brand');

// Track form submission
trackFormSubmission('contact', 'inquiry');

// Track button click
trackButtonClick('Get Started', 'homepage-hero');

// Track errors
trackError('API Error', 'Failed to fetch projects');
```

## Viewing Analytics

### Real-time Reports
- Go to **Reports** → **Realtime** to see current activity

### Overview Reports
- **Reports** → **Life cycle** → **Acquisition**: See where users come from
- **Reports** → **Life cycle** → **Engagement**: See user activity
- **Reports** → **Life cycle** → **Monetization**: Track conversions

### Custom Reports
- **Explore** → Create custom reports and funnels
- **Events** → View all tracked events

## Privacy & GDPR Compliance

The Google Analytics integration:
- Only loads if a valid Measurement ID is provided
- Uses `afterInteractive` strategy to not block page rendering
- Respects user privacy settings

For full GDPR compliance, you may want to:
1. Add a cookie consent banner
2. Implement opt-out functionality
3. Update your privacy policy
4. Consider IP anonymization (enabled by default in GA4)

## Troubleshooting

### Analytics not showing data
1. Check that `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Verify the Measurement ID format (should be `G-XXXXXXXXXX`)
3. Check browser console for any errors
4. Ensure ad blockers are disabled when testing
5. Wait a few hours for data to appear in standard reports (Realtime is instant)

### Testing in Development
- GA4 works in development mode
- Use the **Realtime** report to verify events are being tracked
- Consider using a separate GA4 property for development/staging

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [GA4 Events](https://support.google.com/analytics/answer/9322688)
