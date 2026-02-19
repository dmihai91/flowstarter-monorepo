# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for Google Analytics integration in Flowstarter. This allows users to connect their Google Analytics accounts and automatically pull analytics data into their dashboard.

## Overview

Flowstarter uses OAuth 2.0 to allow users to:
- Connect their Google Analytics accounts
- Authorize Flowstarter to read their analytics data
- Automatically fetch metrics for their projects (views, visitors, conversions, etc.)

## Prerequisites

- A Google Cloud Platform account
- Admin access to your Flowstarter deployment

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name (e.g., "Flowstarter Production")
4. Click **Create**

## Step 2: Enable Required APIs

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Analytics Data API** - Required for fetching analytics data
   - **Google Analytics API** - Required for OAuth scopes

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (or **Internal** if using Google Workspace)
3. Click **Create**

### App Information:
- **App name**: Flowstarter (or your app name)
- **User support email**: Your support email
- **App logo**: Optional, upload your logo
- **Application home page**: Your production URL
- **Application privacy policy link**: Your privacy policy URL
- **Application terms of service link**: Your terms URL
- **Authorized domains**: Add your domain(s)
  - Example: `flowstarter.ai`
  - For development: `localhost`

### Developer Contact Information:
- Add your contact email address(es)

4. Click **Save and Continue**

### Scopes:
5. Click **Add or Remove Scopes**
6. Add these scopes:
   - `https://www.googleapis.com/auth/analytics.readonly` - View Google Analytics data
   - `https://www.googleapis.com/auth/analytics.edit` - Edit Google Analytics configuration (needed for some property access)

7. Click **Update** → **Save and Continue**

### Test Users (for development):
8. Add test user emails if using development environment
9. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**

### Configure OAuth Client:
- **Name**: Flowstarter Web Client
- **Authorized JavaScript origins**: Add your domains
  - Production: `https://your-domain.com`
  - Development: `http://localhost:3000`
  
- **Authorized redirect URIs**: Add callback URLs
  - Production: `https://your-domain.com/api/integrations/google-analytics/oauth/callback`
  - Development: `http://localhost:3000/api/integrations/google-analytics/oauth/callback`

4. Click **Create**
5. Copy your **Client ID** and **Client Secret**

## Step 5: Add Credentials to Your Environment

Add these to your `.env` or `.env.local` file:

```bash
# Google OAuth Client Credentials
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

### Environment Variables Reference:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_OAUTH_CLIENT_ID` | Yes | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret from Google Cloud Console |
| `GOOGLE_ANALYTICS_CREDENTIALS` | No | Service account JSON (deprecated, use OAuth instead) |

## Step 6: Verify Installation

### Test the OAuth Flow:

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to: `http://localhost:3000/dashboard/integrations`

3. Click **Connect Google Analytics**

4. You should be redirected to Google's consent screen

5. Authorize the application

6. You should be redirected back to your dashboard with success message

### Check Database:

Verify the integration was saved:

```sql
SELECT * FROM user_integrations WHERE integration_id = 'google-analytics';
```

You should see:
- `user_id`: Your Clerk user ID
- `integration_id`: "google-analytics"
- `config`: JSON with `access_token`, `refresh_token`, `expires_at`

## How It Works

### OAuth Flow:

1. **User clicks "Connect Google Analytics"**
   - Frontend calls `/api/integrations/google-analytics/oauth/start`
   - Returns authorization URL

2. **User authorizes on Google**
   - Google redirects to callback URL with authorization code

3. **Token Exchange**
   - Backend receives code at `/api/integrations/google-analytics/oauth/callback`
   - Exchanges code for access token and refresh token
   - Stores tokens in `user_integrations` table

4. **Fetching Analytics Data**
   - Dashboard stats API fetches user's OAuth credentials
   - Uses access token to authenticate with Google Analytics Data API
   - Automatically refreshes expired tokens using refresh token
   - Aggregates data across all user projects

### Security Features:

- ✅ Tokens stored encrypted in database
- ✅ Row-level security (RLS) policies ensure users can only access their own tokens
- ✅ Automatic token refresh when expired
- ✅ Scopes limited to read-only analytics access

## Project Integration

### Connecting Projects to Google Analytics:

After a user connects their Google account, they need to configure each project:

1. Go to project settings
2. Add **GA4 Property ID** (numeric, e.g., `123456789`)
3. Add **GA4 Measurement ID** (e.g., `G-XXXXXXXXXX`)

The system will:
- Use Property ID to fetch analytics via server-side API (using OAuth token)
- Inject Measurement ID into generated websites for client-side tracking

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Verify redirect URI in Google Cloud Console exactly matches your callback URL
- Check for trailing slashes
- Ensure protocol (http/https) is correct

### "Access token expired" errors
- Token refresh should happen automatically
- Check `GOOGLE_OAUTH_CLIENT_SECRET` is set correctly
- Verify refresh token is stored in database

### Users can't see analytics data
- Confirm user has connected Google Analytics (check `user_integrations` table)
- Verify projects have `analytics_ga_property_id` set
- Check user has access to the GA4 property in Google Analytics
- Review server logs for API errors

### "Invalid credentials" errors
- Verify scopes include `analytics.readonly`
- Check if user needs to re-authorize (delete record from `user_integrations` and reconnect)

## Production Deployment

### Before Going Live:

1. ✅ Enable APIs in production Google Cloud project
2. ✅ Configure OAuth consent screen
3. ✅ Add production redirect URIs
4. ✅ Set environment variables on hosting platform
5. ✅ Test OAuth flow in production
6. ✅ Submit app for verification if needed (for >100 users)

### App Verification (Optional):

If you expect >100 users to connect Google Analytics:
1. Go to **OAuth consent screen** in Google Cloud Console
2. Click **Publish App**
3. Submit for verification (includes security review by Google)
4. Approval takes 2-4 weeks

For MVP/Beta: You can stay in "Testing" mode with up to 100 test users.

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Analytics Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)

## Related Files

- **OAuth Start**: `src/app/api/integrations/google-analytics/oauth/start/route.ts`
- **OAuth Callback**: `src/app/api/integrations/google-analytics/oauth/callback/route.ts`
- **Token Helper**: `src/lib/google-oauth-helper.ts`
- **Analytics Service**: `src/lib/google-analytics-data.ts`
- **Dashboard Stats API**: `src/app/api/dashboard/stats/route.ts`
