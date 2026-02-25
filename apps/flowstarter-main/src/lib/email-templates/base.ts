/**
 * Base email template with Flowstarter branding
 */

export const EMAIL_STYLES = {
  primaryColor: '#7B6AD8',
  backgroundColor: '#FAFAFA',
  textColor: '#1a1a2e',
  mutedColor: '#6b7280',
  borderColor: '#e5e7eb',
};

export function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flowstarter</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: ${EMAIL_STYLES.backgroundColor};
      color: ${EMAIL_STYLES.textColor};
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, ${EMAIL_STYLES.primaryColor}, #3B82F6);
      border-radius: 12px;
      color: white;
      font-size: 24px;
      font-weight: bold;
      line-height: 48px;
      text-align: center;
    }
    .logo-text {
      display: block;
      margin-top: 12px;
      font-size: 20px;
      font-weight: 600;
      color: ${EMAIL_STYLES.textColor};
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: ${EMAIL_STYLES.textColor};
    }
    p {
      margin: 0 0 16px 0;
      color: ${EMAIL_STYLES.mutedColor};
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, ${EMAIL_STYLES.primaryColor}, #3B82F6);
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid ${EMAIL_STYLES.borderColor};
    }
    .footer p {
      font-size: 13px;
      color: ${EMAIL_STYLES.mutedColor};
    }
    .footer a {
      color: ${EMAIL_STYLES.primaryColor};
      text-decoration: none;
    }
    .muted {
      font-size: 13px;
      color: ${EMAIL_STYLES.mutedColor};
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-icon">F</span>
        <span class="logo-text">Flowstarter</span>
      </div>
      ${content}
      <div class="footer">
        <p>
          Need help? <a href="mailto:hello@flowstarter.app">Contact us</a><br>
          <a href="https://flowstarter.dev/help">Help Center</a> · <a href="https://flowstarter.dev/privacy">Privacy</a> · <a href="https://flowstarter.dev/terms">Terms</a>
        </p>
        <p style="margin-top: 16px;">
          © ${new Date().getFullYear()} Flowstarter. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
