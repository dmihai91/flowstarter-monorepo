# Google Analytics Data API Setup

This guide shows how to set up the Google Analytics Data API to fetch analytics data from user projects into your Flowstarter dashboard.

## Overview

- **Client-side GA**: Users add their GA Measurement ID to their generated websites (for tracking)
- **Server-side GA Data API**: Flowstarter fetches analytics data to display in the dashboard

## Prerequisites

- Google Cloud Project
- Google Analytics 4 property
- Admin access to both

## Setup Steps

### 1. Enable Google Analytics Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Analytics Data API"
5. Click **Enable**

### 2. Create a Service Account

1. In Google Cloud Console, go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Enter details:
   - **Name**: `flowstarter-analytics-reader`
   - **Description**: `Service account for reading user project analytics`
4. Click **Create and Continue**
5. Skip optional steps (no roles needed at project level)
6. Click **Done**

### 3. Create Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. The JSON key file will download automatically
7. **Keep this file secure!** It contains credentials

### 4. Add Service Account to Google Analytics

For each GA4 property you want to access:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon, bottom left)
3. In the **Property** column, select your property
4. Click **Property Access Management**
5. Click **Add Users** (+)
6. Enter the service account email (format: `flowstarter-analytics-reader@your-project.iam.gserviceaccount.com`)
7. Select role: **Viewer**
8. Uncheck "Notify this user by email"
9. Click **Add**

### 5. Configure Environment Variables

Open your `.env` file and add:

```bash
GOOGLE_ANALYTICS_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important**: The entire JSON content must be on a single line, enclosed in single quotes.

#### Method 1: Manual Copy (macOS/Linux)
```bash
# Copy JSON content to clipboard (removes newlines)
cat ~/Downloads/your-service-account-key.json | tr -d '\n' | pbcopy

# Then paste into .env
GOOGLE_ANALYTICS_CREDENTIALS='<paste here>'
```

#### Method 2: Using jq
```bash
echo "GOOGLE_ANALYTICS_CREDENTIALS='$(cat ~/Downloads/your-service-account-key.json | jq -c)'" >> .env
```

### 6. Update Projects Database Schema

Add analytics columns to your projects table:

```sql
-- Run this migration
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS analytics_ga_property_id TEXT,
ADD COLUMN IF NOT EXISTS analytics_ga_measurement_id TEXT,
ADD COLUMN IF NOT EXISTS analytics_fb_pixel TEXT;

COMMENT ON COLUMN projects.analytics_ga_property_id IS 'GA4 Property ID (numeric, e.g., 123456789) for Data API';
COMMENT ON COLUMN projects.analytics_ga_measurement_id IS 'GA4 Measurement ID (e.g., G-XXXXXXXXXX) for client-side tracking';
COMMENT ON COLUMN projects.analytics_fb_pixel IS 'Facebook Pixel ID for user projects';
```

### 7. Test the Integration

```typescript
import { googleAnalyticsDataService } from '@/lib/google-analytics-data';

// Check if configured
console.log('Configured:', googleAnalyticsDataService.isConfigured());

// Fetch analytics for a property
const analytics = await googleAnalyticsDataService.getProjectOverview(
  '123456789', // GA4 Property ID
  30 // days
);

console.log('Analytics:', analytics);
```

## How Users Set Up Analytics

### Step 1: User Creates GA4 Property

Users need to:
1. Create a GA4 property in Google Analytics
2. Get two pieces of information:
   - **Measurement ID** (G-XXXXXXXXXX) - for tracking scripts
   - **Property ID** (numeric, e.g., 123456789) - for Data API

### Step 2: User Adds to Flowstarter

In project settings, user enters:
- **GA Measurement ID**: For injecting tracking code
- **GA Property ID**: For Flowstarter to fetch analytics

### Step 3: User Grants Access

User must add the service account email as a Viewer to their GA4 property:
1. Go to Google Analytics → Admin → Property Access Management
2. Add: `flowstarter-analytics-reader@your-project.iam.gserviceaccount.com`
3. Role: Viewer

## Finding the Property ID

Users can find their Property ID in Google Analytics:

1. Go to **Admin** → **Property Settings**
2. The **Property ID** is displayed at the top (numeric)

OR from the URL:
- URL format: `https://analytics.google.com/analytics/web/#/pXXXXXXXXX/...`
- The `pXXXXXXXXX` part (after the `p`) is the Property ID

## Architecture

```
User's Website (deployed)
    ↓ (has GA tracking code with Measurement ID)
Google Analytics
    ↓
Google Analytics Data API
    ↓ (Flowstarter fetches via Service Account)
Flowstarter Dashboard
```

## Available Metrics

The service can fetch:

- **Overview**: Page views, visitors, conversions, bounce rate, session duration
- **Traffic Sources**: Where visitors come from (Google, direct, social, etc.)
- **Geographic Data**: Visitor locations by country
- **Device Data**: Desktop, mobile, tablet breakdown
- **Page Performance**: Most viewed pages, time on page, bounce rate per page

## Security Considerations

1. **Service Account Key**: Never commit to git, use environment variables
2. **Viewer Access Only**: Service account only needs Viewer role
3. **Property-Level Access**: Grant access per property, not account-wide
4. **Rate Limits**: GA Data API has quotas (25,000 requests/day by default)
5. **Caching**: Cache analytics data to reduce API calls

## Troubleshooting

### "Permission denied" errors
- Ensure service account is added as Viewer to the GA4 property
- Check that the correct Property ID is being used

### "Invalid credentials" errors
- Verify `GOOGLE_ANALYTICS_CREDENTIALS` is properly formatted (single-line JSON)
- Ensure the JSON key hasn't expired or been deleted

### No data returned
- Check that the GA4 property has recent data
- Verify the date range (data may not be available for very recent dates)
- Ensure tracking code is properly installed on the website

### Rate limit errors
- Implement caching with a TTL (e.g., cache for 1 hour)
- Batch requests when possible
- Request quota increase if needed

## Resources

- [Google Analytics Data API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Node.js Client Library](https://github.com/googleapis/nodejs-analytics-data)
- [API Quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas)
