export const integrationsKeys = {
  // Integrations
  'integrations.active': 'Active',
  'integrations.available': 'Available',
  'integrations.status.connected': 'Connected',
  'integrations.status.notConnected': 'Not connected',
  'integrations.keyFeatures': 'KEY FEATURES',
  'integrations.disconnect': 'Disconnect',
  'integrations.connecting': 'Connecting...',
  'integrations.custom.title': 'Need a Custom Integration?',
  'integrations.custom.description':
    "Let us know which tools you need and we'll help you connect them",
  'integrations.custom.requestButton': 'Request Integration',
  'integrations.connect': 'Connect',

  // Calendly Integration
  'integrations.calendly.name': 'Calendly',
  'integrations.calendly.description':
    'Schedule meetings and appointments directly from your website',
  'integrations.calendly.features.scheduling': 'Automated scheduling',
  'integrations.calendly.features.reminders': 'Email reminders',
  'integrations.calendly.features.timezone': 'Timezone detection',
  'integrations.calendly.tutorialUrl':
    'https://www.youtube.com/watch?v=calendly-tutorial',
  // Calendly setup guide
  'integrations.calendly.errors.apiKeyRequired': 'API key is required',
  'integrations.calendly.errors.apiKeyTooShort':
    'API key must be at least 10 characters',
  'integrations.calendly.errors.eventUrlRequired': 'Event URL is required',
  'integrations.calendly.errors.eventUrlInvalid': 'Invalid URL format',
  'integrations.calendly.errors.eventUrlHost': 'URL must be on calendly.com',

  // Mailchimp Integration
  'integrations.mailchimp.name': 'Mailchimp',
  'integrations.mailchimp.description':
    'Sync your email list and manage campaigns',
  'integrations.mailchimp.features.contactSync': 'Contact sync',
  'integrations.mailchimp.features.campaignManagement': 'Campaign management',
  'integrations.mailchimp.features.emailAnalytics': 'Email analytics',
  'integrations.mailchimp.tutorialUrl':
    'https://www.youtube.com/watch?v=mailchimp-tutorial',
  // Mailchimp setup guide
  'integrations.mailchimp.errors.apiKeyRequired': 'API key is required',
  'integrations.mailchimp.errors.apiKeyInvalid':
    'Invalid API key format (e.g., abc123-us21)',
  'integrations.mailchimp.errors.audienceIdRequired': 'Audience ID is required',
  'integrations.mailchimp.errors.audienceIdInvalid': 'Audience ID is too short',

  // Google Analytics Integration
  'integrations.googleAnalytics.name': 'Google Analytics',
  'integrations.googleAnalytics.description':
    'Track visitor behavior, traffic sources, and conversions on your generated websites.',

  // Domain configuration
  'domain.hosted': 'Hosted Domain',
  'domain.custom': 'Custom Domain',
  'domain.recommended': 'Recommended for fast launch',
  'domain.config.title': 'Domain Configuration',
  'domain.config.subtitle': 'Choose how you want to set up your domain',
  'domain.config.ownershipQuestion':
    'How would you like to set up your domain?',
  'domain.config.owns': 'My Custom Domain',
  'domain.config.useExisting': 'Use my existing domain',
  'domain.config.wantsToBuy': 'Help me buy a domain',
  'domain.config.findAndPurchase': 'Find and purchase a domain',
  'domain.config.useHosted': 'Platform Hosted',
  'domain.config.freeSubdomain': 'Free subdomain on our platform',
  'domain.config.changeSelection': 'Change selection',
  'domain.hostedOption.title': 'Platform Hosted',
  'domain.hostedOption.freeSubdomainOn': 'Free subdomain on',
  'domain.customOption.title': 'My Custom Domain',
  'domain.customOption.useExisting': 'Use your existing domain',
  'domain.customOption.note': 'Use your own address. Requires DNS setup',
  'domain.customOption.useSuggested': 'Use',
  'domain.customOption.helpIntro': 'Enter your custom domain name.',
  'domain.customOption.helpOwns':
    "You'll need to configure DNS settings after deployment.",
  'domain.customOption.helpWantsToBuy':
    "We can help you check if it's available for purchase.",
  'domain.buy.available': 'Suggested domains',
  'domain.buy.refresh': 'Refresh suggestions',
  'domain.buy.inputLabel': 'Enter a domain to check availability',
  'domain.buy.check': 'Check',
  'domain.buy.checking': 'Checking',
  'domain.buy.availableShort': 'appears available',
  'domain.buy.notAvailableShort': 'may not be available',
  'domain.buy.buyOnGoDaddy': 'Buy on GoDaddy',
  'domain.buy.buyOnRoTLD': 'Buy on RoTLD',
  'domain.buy.generating': 'Generating domain suggestions...',
  'domain.buy.enterName':
    'Enter a project name above to see domain suggestions',
  'domain.buy.postPurchaseHint':
    'After purchasing, return here and choose "My Custom Domain" to connect it.',
  'domain.buy.pleaseTryAgainOrCheckWithYourRegistrar':
    'Please try again or check with your registrar.',
  'domain.buy.couldNotVerifyAvailability': 'Could not verify availability',
  'domain.preview.availableAt': 'Your site will be available at:',
  'domain.preview.customConfigured': 'Custom domain configured',
  'domain.preview.hostedOn': 'Hosted on',
  'domain.validation.valid': 'Valid domain format',
  'domain.validation.invalid': 'Invalid domain format',
  'domain.validation.didYouMean': 'Did you mean:',
  'domain.config.subtitle2':
    'A domain is your website\u2019s address (for example, mybusiness.com). You can start with a free hosted subdomain or connect your own.',
  'domain.config.subtitle3':
    'Get a free subdomain today. You can connect your own domain later.',
  'domain.config.hintChangeToCustomOrBuy':
    'Have a custom domain or want to purchase one? Click "Change selection" above and choose "My Custom Domain" or "Help me buy a domain."',
  'domain.config.subdomain': 'subdomain',
  'domain.config.subtitle4':
    'Connect your own domain. You\u2019ll verify ownership and update DNS after launch.',
  'domain.autoSuggested': 'Auto-suggested from project name "{name}"',
  'domain.continueWithThisDomain': 'Use this domain',
  'domain.config.bestOption':
    'This will help us configure the best option for your project.',

  // Database offline
  'database.offline.title': 'Database Offline',
  'database.offline.subtitle':
    "We're having trouble connecting to our database. This might be temporary.",
  'database.offline.connectionStatus': 'Connection Status:',
  'database.offline.offlineSince': 'Offline since {time}',
  'database.offline.retryConnection': 'Retry Connection',
  'database.offline.checkingConnection': 'Checking Connection...',
  'database.offline.whatYouCanDo': 'What you can do:',
  'database.offline.action1': 'Wait a moment and try again',
  'database.offline.action2': 'Check your internet connection',
  'database.offline.action3': 'Contact support if the issue persists',
} as const;
