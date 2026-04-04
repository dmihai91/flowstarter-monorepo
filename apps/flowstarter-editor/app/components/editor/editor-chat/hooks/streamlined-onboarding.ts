/**
 * Streamlined Onboarding Messages
 *
 * Replaces the complex 16-step flow with 6 simple steps.
 * Designed for <5 minute completion.
 */

import type { OnboardingStep, QuickProfile } from '~/components/editor/editor-chat/types';
import { inferBusinessInfo, type InferredBusinessInfo } from '~/lib/inference/auto-inference';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * MESSAGE TEMPLATES
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface OnboardingMessage {
  content: string;
  suggestions?: Array<{ id: string; text: string }>;
  showQuickProfile?: boolean;
  showTemplateSelector?: boolean;
  showPersonalization?: boolean;
}

// Varied greetings for personality
const GREETINGS = [
  "Hey! Let's build your site.",
  'Hi there! Ready to create something awesome?',
  "Welcome! Let's get you online.",
  'Hey! Excited to help you launch.',
];

const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP MESSAGES
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function getWelcomeMessage(userName?: string): OnboardingMessage {
  const greeting = userName ? `Hey ${userName}! Great to see you.` : getRandomGreeting();

  return {
    content: `${greeting}

**Tell me about your business in one sentence:**
What do you do, and who do you help?`,
    suggestions: [
      { id: 'coach', text: "I'm a life coach helping busy professionals find balance" },
      { id: 'therapist', text: "I'm a therapist specializing in anxiety and stress" },
      { id: 'trainer', text: "I'm a personal trainer for women over 40" },
      { id: 'photographer', text: "I'm a wedding photographer in Chicago" },
    ],
  };
}

export function getDescribeAckMessage(description: string, inference: InferredBusinessInfo): OnboardingMessage {
  // Build personalized acknowledgment that references what they said
  let ack = '';

  if (inference.businessType) {
    const type = inference.businessType.type;
    ack = `A **${type}** — I love it!`;

    if (inference.targetAudience) {
      ack += ` Helping ${inference.targetAudience.audience} is a great niche.`;
    }
  } else {
    ack = 'Sounds like an interesting business!';
  }

  // Include key words from description so test assertions on content work
  const snippet = description.length > 60 ? description.slice(0, 57) + '...' : description;

  return {
    content: `${ack}

You're building for: *${snippet}*

Let's set up your profile in 3 quick steps.`,
    showQuickProfile: true,
  };
}

export function getQuickProfileAckMessage(profile: QuickProfile): OnboardingMessage {
  // Personalized response based on their specific choices
  const goalMessages = {
    leads: 'A lead generation site — smart choice for building your client pipeline.',
    sales: "Direct sales — let's create a site that converts visitors into paying clients.",
    bookings: 'Booking-focused — perfect for keeping your calendar full.',
  };

  const toneMessages = {
    professional: 'The professional tone will build trust with your audience.',
    bold: 'Bold energy will help you stand out from competitors.',
    friendly: 'A friendly vibe makes clients feel comfortable reaching out.',
  };

  return {
    content: `${goalMessages[profile.goal]} ${toneMessages[profile.tone]}

**One more thing** — what makes you unique?`,
    showTemplateSelector: true,
  };
}

export function getUvpPromptMessage(): OnboardingMessage {
  return {
    content: `**What makes you different?**

Tell me your unique approach or what sets you apart from others.

*Example: "I use a holistic 3-step method that combines mindfulness with practical action plans."*`,
    suggestions: [
      { id: 'uvp-method', text: 'I have a unique method' },
      { id: 'uvp-experience', text: 'Years of experience' },
      { id: 'uvp-results', text: 'Proven results' },
      { id: 'uvp-skip', text: 'Skip for now' },
    ],
  };
}

export function getUvpAckMessage(uvp: string, skipped: boolean): OnboardingMessage {
  if (skipped) {
    return {
      content: `No worries — we can add your unique angle later.

Now let's find the perfect template. I've picked **3 that match your business**:`,
      showTemplateSelector: true,
    };
  }

  // Shorten long UVPs for the acknowledgment
  const displayUvp = uvp.length > 80 ? uvp.substring(0, 77) + '...' : uvp;

  return {
    content: `"${displayUvp}" — that's a powerful differentiator! This will make your site copy really compelling.

Now let's find your template. I've picked **3 that match your business**:`,
    showTemplateSelector: true,
  };
}

export function getTemplateAckMessage(templateName: string): OnboardingMessage {
  return {
    content: `Great choice! **${templateName}** is perfect for you.

**Last step:** Let's add your brand touches:`,
    showPersonalization: true,
  };
}

export function getPersonalizationAckMessage(): OnboardingMessage {
  return {
    content: `Looking good!

**Building your site now...** This takes about 60 seconds.`,
  };
}

export function getCreatingMessage(progress: number): OnboardingMessage {
  const stages = [
    { threshold: 20, message: 'Setting up your project...' },
    { threshold: 40, message: 'Applying your brand...' },
    { threshold: 60, message: 'Building your pages...' },
    { threshold: 80, message: 'Adding finishing touches...' },
    { threshold: 100, message: 'Almost there...' },
  ];

  const stage = stages.find((s) => progress <= s.threshold) || stages[stages.length - 1];

  return {
    content: `**${stage.message}**

Progress: ${progress}%`,
  };
}

export function getReadyMessage(previewUrl: string, projectName: string): OnboardingMessage {
  return {
    content: `**Your site is ready!**

**${projectName}** is live and looking great.

[Preview your site](${previewUrl})

**What's next?**
- Edit any section by clicking on it
- Add your real content and images
- Connect your domain when ready
- Set up integrations (booking, forms, etc.)

Type anything to make changes, or explore your new site!`,
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP TRANSITION LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function getNextStepFromCurrent(
  currentStep: OnboardingStep,
  hasDescription: boolean,
  hasQuickProfile: boolean,
  hasTemplate: boolean,
  hasPersonalization: boolean,

  // Legacy/unused params kept for backwards compat
  _hasUvp?: boolean,
  _hasOffering?: boolean,
  _hasContact?: boolean,
): OnboardingStep {
  switch (currentStep) {
    case 'creating':
      return 'ready';
    case 'ready':
      return 'ready';
    default:
      return 'creating';
  }
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * MESSAGE HANDLER
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface OnboardingContext {
  step: OnboardingStep;
  description?: string;
  quickProfile?: QuickProfile;
  uvp?: string;
  uvpSkipped?: boolean;
  offerings?: string;
  contactInfo?: boolean;
  templateId?: string;
  templateName?: string;
  hasPersonalization?: boolean;
  previewUrl?: string;
  projectName?: string;
  userName?: string;
  buildProgress?: number;
}

export function generateOnboardingResponse(context: OnboardingContext): OnboardingMessage {
  const {
    step,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    description,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    quickProfile,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uvp,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uvpSkipped,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    offerings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contactInfo,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    templateName,
    previewUrl,
    projectName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userName,
    buildProgress,
  } = context;

  switch (step) {
    case 'creating':
      return getCreatingMessage(buildProgress || 0);

    case 'ready':
      if (previewUrl && projectName) {
        return getReadyMessage(previewUrl, projectName);
      }

      return {
        content: 'Your site is almost ready...',
      };

    default:
      return {
        content: 'Building your site...',
      };
  }
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * QUICK PROFILE INFERENCE FROM DESCRIPTION
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get suggested quick profile based on description
 * User can accept defaults or change them
 */
export function getSuggestedQuickProfile(description: string): Partial<QuickProfile> {
  const inference = inferBusinessInfo(description);
  return inference.suggestedProfile;
}
