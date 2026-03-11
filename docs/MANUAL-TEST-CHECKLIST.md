# Integration Manual Test Checklist

## Prerequisites
- [ ] Run Supabase migrations (20260311000000, 20260311000001, 20260311000002)
- [ ] Set env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [ ] Have a Calendly account with API key
- [ ] Have a GA4 property

## Calendly Integration

### Simple mode (URL only)
- [ ] Team dashboard → Project → Integrations → Enter Calendly URL
- [ ] Save → verify "Connected" badge appears
- [ ] Trigger site build → verify contact page has Calendly inline widget
- [ ] Widget loads and shows available time slots
- [ ] Booking flow works end-to-end

### API mode (with API key)
- [ ] Enter Calendly API key → masked field shows dots
- [ ] Save → verify key stored in Vault (check: GET returns hasApiKey: true, NOT the key)
- [ ] GET /api/integrations/calendly?apiKey=xxx returns event types
- [ ] Trigger site build → contact page has per-service popup buttons
- [ ] Each button opens Calendly popup with correct event type
- [ ] Duration shown correctly

### Upcoming Meetings card
- [ ] Client dashboard shows "Upcoming Meetings" card
- [ ] Shows next meetings with date, time, attendee, duration
- [ ] "Join call" button appears for video meetings
- [ ] Refresh button works
- [ ] Card hides when Calendly not configured
- [ ] Empty state shows when no upcoming meetings

## Google Analytics Integration

### OAuth connect
- [ ] Team dashboard → Project → Integrations → "Connect Google Analytics"
- [ ] Redirects to Google OAuth consent screen
- [ ] After approval, redirects back with "connected=true"
- [ ] Refresh token stored in Vault (check: ga_refresh_token_id is UUID)
- [ ] ga_connected_at timestamp populated

### Dashboard analytics
- [ ] Client dashboard shows real visitor/pageview/session data
- [ ] Numbers update when date range changes (?range=7, ?range=30)
- [ ] Top pages list populated
- [ ] Daily user trend chart works
- [ ] Handles token expiry gracefully (auto-refresh)

### Site injection
- [ ] GA4 script injected into Layout.astro <head>
- [ ] Measurement ID matches project config
- [ ] No double injection on re-build

## Lead Capture

### Form injection
- [ ] Generated contact page has hidden projectId field
- [ ] Form has data-lead-capture attribute
- [ ] Capture script present in page source

### Submission flow
- [ ] Submit form on generated site → "Thank you!" message
- [ ] Lead appears in Supabase leads table
- [ ] Correct projectId, name, email, phone, message stored
- [ ] Extra fields stored in JSONB extra column
- [ ] Source path captured
- [ ] IP address captured

### Spam detection
- [ ] Legitimate message → status: "new"
- [ ] Spam message (casino + crypto) → status: "spam"
- [ ] Rate limit: 11th request from same IP → 429

### CORS
- [ ] Form submission works from any origin (cross-domain)
- [ ] OPTIONS preflight returns correct headers
- [ ] Origin echoed in Access-Control-Allow-Origin

### Dashboard leads page
- [ ] /dashboard/leads shows lead list
- [ ] Filter tabs work (all/new/contacted/qualified/converted/archived)
- [ ] Counts shown per status
- [ ] Click lead to expand → shows email, phone, message, timestamp
- [ ] Status change buttons work
- [ ] mailto: and tel: links work
- [ ] Empty state when no leads
- [ ] Refresh button works

## Security

### Vault
- [ ] No plaintext API keys in projects table columns
- [ ] ga_refresh_token_id and calendly_api_key_id are UUIDs
- [ ] GET /api/projects/:id/integrations returns hasApiKey: true (NOT the key)
- [ ] Disconnect clears Vault secret AND table reference
- [ ] vault.secrets not accessible from anon/authenticated roles

### XSS
- [ ] Calendly URL with injection chars → rejected ("Invalid Calendly URL")
- [ ] Non-calendly.com URLs → rejected
- [ ] GA4 ID is contained within script string
- [ ] Lead capture projectId doesn't appear in visible DOM text
- [ ] No Authorization/Bearer/api_key in injected scripts

### Lead capture API
- [ ] No auth required (public endpoint)
- [ ] Rate limited per IP (10/min)
- [ ] Invalid projectId → 400
- [ ] Missing body → 400
- [ ] Spam auto-classified
