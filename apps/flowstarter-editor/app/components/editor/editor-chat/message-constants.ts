/**
 * Message constants for assistant messages in the concierge flow.
 * Keys, default English labels, and getMessage helper.
 */

export const MESSAGE_KEYS = {
  WELCOME_GREETING: 'message.welcome.greeting',
  WELCOME_GREETING_USER: 'message.welcome.greeting_user',
  WELCOME_SHOWCASE: 'message.welcome.showcase',
  WELCOME_CTA: 'message.welcome.cta',
  INTERNAL_WELCOME: 'message.internal.welcome',
  INTERNAL_WELCOME_WITH_NAME: 'message.internal.welcome_with_name',
  INTERNAL_TEMPLATE_PROMPT: 'message.internal.template_prompt',
  DESCRIBE_PROMPT: 'message.describe.prompt',
  DESCRIBE_ACK: 'message.describe.ack',
  QUICK_PROFILE_INTRO: 'message.quick_profile.intro',
  QUICK_PROFILE_ACK: 'message.quick_profile.ack',
  UVP_PROMPT: 'message.uvp.prompt',
  UVP_ACK: 'message.uvp.ack',
  NAME_GENERATION_ERROR: 'message.name.generation_error',
  NAME_PROMPT_MANUAL: 'message.name.prompt_manual',
  NAME_SKIP_BUSINESS: 'message.name.skip_business',
  NAME_TYPE_BELOW: 'message.name.type_below',
  NAME_CONFIRMATION: 'message.name.confirmation',
  BUILD_SELECT_TEMPLATE_FIRST: 'message.build.select_template_first',
  BUILD_SELECT_PALETTE_FIRST: 'message.build.select_palette_first',
  READY_SETUP_FIRST: 'message.ready.setup_first',
  READY_HELP_PROMPT: 'message.ready.help_prompt',
  READY_TELL_MORE: 'message.ready.tell_more',
  API_NAME_CONFIRM: 'message.api.name_confirm',
  API_NAME_UNCLEAR: 'message.api.name_unclear',
} as const;

export type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];

export const MESSAGE_LABELS: Record<MessageKey, string> = {
  [MESSAGE_KEYS.WELCOME_GREETING]: '**Welcome to Flowstarter Editor** 👋\n\nHow can I help you build today?',
  [MESSAGE_KEYS.WELCOME_GREETING_USER]: '**Hey {{username}}!** 👋',
  [MESSAGE_KEYS.WELCOME_SHOWCASE]: '',
  [MESSAGE_KEYS.WELCOME_CTA]: 'Tell me what you do and I\'ll build your site.',
  [MESSAGE_KEYS.INTERNAL_WELCOME]:
    "**Your business details are ready.** Let's pick a template that matches your brand.",
  [MESSAGE_KEYS.INTERNAL_WELCOME_WITH_NAME]:
    "**Everything is set for {{businessName}}.** Let's pick a template that matches your brand.",
  [MESSAGE_KEYS.INTERNAL_TEMPLATE_PROMPT]:
    "I've selected **3 templates** that match your business profile.\n\nClick any template to preview it, or browse all options below.",
  [MESSAGE_KEYS.DESCRIBE_PROMPT]:
    '**Tell me about your business.**\n\nWhat service do you offer, and who do you help?\n\n**Examples:**\n• "I\'m a life coach helping busy professionals find work-life balance"\n• "I\'m a therapist specializing in anxiety and stress management"\n• "I\'m a wedding photographer in Chicago"\n• "I\'m a personal trainer for women over 40"',
  [MESSAGE_KEYS.DESCRIBE_ACK]: 'A **{{businessType}}**, I love it! {{audienceNote}}Let\'s find the perfect name for your site.',
  [MESSAGE_KEYS.QUICK_PROFILE_INTRO]: 'Choose the options that best describe your business:',
  [MESSAGE_KEYS.QUICK_PROFILE_ACK]: '{{goalResponse}} One more question to personalize your copy...',
  [MESSAGE_KEYS.UVP_PROMPT]:
    '**What makes you stand out?**\n\nWhat\'s your unique approach that gets results for clients?\n\n*Example: "I use a holistic 3-step method that combines mindfulness with practical action plans."*',
  [MESSAGE_KEYS.UVP_ACK]: '"{{uvp}}" — that\'s powerful! This will make your site copy really compelling.',
  [MESSAGE_KEYS.NAME_GENERATION_ERROR]: "I couldn't generate a name right now. What would you like to call your project?",
  [MESSAGE_KEYS.NAME_PROMPT_MANUAL]: 'Great! Type your business or project name below.',
  [MESSAGE_KEYS.NAME_SKIP_BUSINESS]: "No problem! Let's pick a template to get started.",
  [MESSAGE_KEYS.NAME_TYPE_BELOW]: "Great! Type your name below and I'll use it for your project.",
  [MESSAGE_KEYS.NAME_CONFIRMATION]: "I'll use **{{name}}** as your project name. Sound good?",
  [MESSAGE_KEYS.BUILD_SELECT_TEMPLATE_FIRST]: 'Please select a template first.',
  [MESSAGE_KEYS.BUILD_SELECT_PALETTE_FIRST]: 'Please select a color palette first.',
  [MESSAGE_KEYS.READY_SETUP_FIRST]: "Let's set up your project first. What kind of website would you like to create?",
  [MESSAGE_KEYS.READY_HELP_PROMPT]: "I'm ready to help! What would you like me to change?",
  [MESSAGE_KEYS.READY_TELL_MORE]: 'Sure thing. Tell me more about what you have in mind.',
  [MESSAGE_KEYS.API_NAME_CONFIRM]: "I'll use **{{name}}** as your project name. Sound good?",
  [MESSAGE_KEYS.API_NAME_UNCLEAR]: "I didn't catch that. What would you like to name your project?",
};

export function getMessage(key: MessageKey, context?: Record<string, string>): string {
  let message = MESSAGE_LABELS[key] || key;
  if (context) {
    for (const [varName, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    }
  }
  return message;
}
