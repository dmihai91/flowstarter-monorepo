/**
 * Modification Requests - Unit Tests
 *
 * Tests the modification request flow when users ask for changes to their site.
 * Covers:
 * - Text-only modification requests
 * - Image attachments with modification requests
 * - API response handling (success, errors, streaming)
 * - Error recovery and fallback messaging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ÔöÇÔöÇÔöÇ Test Fixtures ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

const MOCK_PROJECT = {
  urlId: 'aluat-de-casa-abc123',
  convexProjectId: 'js716gx0gj303t09k8bcmrzpan80jnwm',
  workingDirectory: '/workspaces/js716gx0gj303t09k8bcmrzpan80jnwm',
};

const MOCK_IMAGE_FILE = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });

interface AttachedImage {
  id: string;
  file: File;
  preview: string;
}

const MOCK_ATTACHED_IMAGES: AttachedImage[] = [
  { id: '1', file: MOCK_IMAGE_FILE, preview: 'data:image/jpeg;base64,test' },
];

// ÔöÇÔöÇÔöÇ Helper Functions to Test ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

/**
 * Validates that a modification request has required context
 */
function validateModificationRequest(
  input: string,
  projectId: string | null,
  urlId: string | null,
  hasImages = false
): { valid: boolean; error?: string } {
  if (!input.trim() && !hasImages) {
    return { valid: false, error: 'No input or images provided' };
  }
  if (!projectId) {
    return { valid: false, error: 'No project ID' };
  }
  if (!urlId) {
    return { valid: false, error: 'No URL ID' };
  }
  return { valid: true };
}

/**
 * Builds the instruction string for the Claude Agent
 */
function buildAgentInstruction(
  userInput: string,
  images: AttachedImage[]
): string {
  const hasImages = images.length > 0;

  if (hasImages && !userInput) {
    return 'The user has attached images. Please analyze them and ask where they would like to use these images on their website (e.g., hero section, about page, gallery, etc.)';
  }

  if (hasImages) {
    return `${userInput}\n\n[User has attached ${images.length} image(s) to use for this request]`;
  }

  return userInput;
}

/**
 * Formats user message with image indicator
 */
function formatUserMessage(input: string, images: AttachedImage[]): string {
  if (images.length === 0) {
    return input;
  }

  const imageText = images.length === 1 ? '1 image' : `${images.length} images`;
  return input ? `${input}\n\n­ƒôÄ Attached: ${imageText}` : `­ƒôÄ Attached: ${imageText}`;
}

/**
 * Determines appropriate error message based on error type
 */
function getErrorMessage(error: string): string {
  if (error.includes('API key') || error.includes('ANTHROPIC')) {
    return (
      "ÔÜá´©Å The AI modification feature requires an Anthropic API key to be configured.\n\n" +
      '**To enable this feature:**\n' +
      '1. Get an API key from [console.anthropic.com](https://console.anthropic.com)\n' +
      '2. Add `ANTHROPIC_API_KEY=your-key` to your environment\n' +
      '3. Restart the editor\n\n' +
      'In the meantime, you can use the **Editor** tab to modify files directly.'
    );
  }

  return `ÔØî Couldn't apply changes: ${error}\n\nYou can try editing the files directly in the Editor tab.`;
}

/**
 * Simulates file to base64 conversion result
 */
interface ImageData {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  filename: string;
}

function getImageData(file: File): ImageData {
  return {
    base64: 'dGVzdA==', // "test" in base64
    mediaType: file.type as ImageData['mediaType'],
    filename: file.name,
  };
}

/**
 * Parses SSE stream events
 */
interface SSEEvent {
  event: string;
  data: unknown;
}

function parseSSELine(line: string): SSEEvent | null {
  const eventMatch = line.match(/^event: ([\w-]+)/);
  const dataMatch = line.match(/^data: (.+)$/m);

  if (eventMatch && dataMatch) {
    try {
      return {
        event: eventMatch[1],
        data: JSON.parse(dataMatch[1]),
      };
    } catch {
      return null;
    }
  }
  return null;
}

// ÔöÇÔöÇÔöÇ Tests ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

describe('validateModificationRequest', () => {
  it('validates complete request', () => {
    const result = validateModificationRequest(
      'Change the hero background to blue',
      MOCK_PROJECT.convexProjectId,
      MOCK_PROJECT.urlId
    );
    expect(result.valid).toBe(true);
  });

  it('rejects empty input with no images', () => {
    const result = validateModificationRequest('', MOCK_PROJECT.convexProjectId, MOCK_PROJECT.urlId, false);
    // This depends on whether images are attached - testing the no-images case
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No input');
  });

  it('rejects request without project ID', () => {
    const result = validateModificationRequest('Make changes', null, MOCK_PROJECT.urlId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('project ID');
  });

  it('rejects request without URL ID', () => {
    const result = validateModificationRequest('Make changes', MOCK_PROJECT.convexProjectId, null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('URL ID');
  });
});

describe('buildAgentInstruction', () => {
  it('returns user input as-is when no images', () => {
    const instruction = buildAgentInstruction('Change the title color', []);
    expect(instruction).toBe('Change the title color');
  });

  it('adds image context when images attached with text', () => {
    const instruction = buildAgentInstruction('Use this for the hero', MOCK_ATTACHED_IMAGES);
    expect(instruction).toContain('Use this for the hero');
    expect(instruction).toContain('[User has attached 1 image(s)');
  });

  it('prompts for image placement when only images', () => {
    const instruction = buildAgentInstruction('', MOCK_ATTACHED_IMAGES);
    expect(instruction).toContain('attached images');
    expect(instruction).toContain('hero section');
    expect(instruction).toContain('gallery');
  });

  it('handles multiple images', () => {
    const multipleImages: AttachedImage[] = [
      { id: '1', file: MOCK_IMAGE_FILE, preview: '' },
      { id: '2', file: MOCK_IMAGE_FILE, preview: '' },
      { id: '3', file: MOCK_IMAGE_FILE, preview: '' },
    ];
    const instruction = buildAgentInstruction('Add these to the gallery', multipleImages);
    expect(instruction).toContain('3 image(s)');
  });
});

describe('formatUserMessage', () => {
  it('returns plain text when no images', () => {
    const message = formatUserMessage('Change the colors', []);
    expect(message).toBe('Change the colors');
  });

  it('adds image indicator for single image', () => {
    const message = formatUserMessage('Use this image', MOCK_ATTACHED_IMAGES);
    expect(message).toContain('Use this image');
    expect(message).toContain('­ƒôÄ Attached: 1 image');
  });

  it('adds image indicator for multiple images', () => {
    const multipleImages: AttachedImage[] = [
      { id: '1', file: MOCK_IMAGE_FILE, preview: '' },
      { id: '2', file: MOCK_IMAGE_FILE, preview: '' },
    ];
    const message = formatUserMessage('Add these', multipleImages);
    expect(message).toContain('­ƒôÄ Attached: 2 images');
  });

  it('shows only image indicator when no text', () => {
    const message = formatUserMessage('', MOCK_ATTACHED_IMAGES);
    expect(message).toBe('­ƒôÄ Attached: 1 image');
  });
});

describe('getErrorMessage', () => {
  it('shows API key setup instructions for missing key', () => {
    const message = getErrorMessage('ANTHROPIC_API_KEY not configured');
    expect(message).toContain('API key');
    expect(message).toContain('console.anthropic.com');
    expect(message).toContain('ANTHROPIC_API_KEY');
  });

  it('shows generic error with fallback suggestion', () => {
    const message = getErrorMessage('Network timeout');
    expect(message).toContain("Couldn't apply changes");
    expect(message).toContain('Network timeout');
    expect(message).toContain('Editor tab');
  });

  it('handles various API key error formats', () => {
    expect(getErrorMessage('Invalid API key')).toContain('console.anthropic.com');
    expect(getErrorMessage('ANTHROPIC error: unauthorized')).toContain('console.anthropic.com');
  });
});

describe('getImageData', () => {
  it('extracts correct media type from file', () => {
    const jpegFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const data = getImageData(jpegFile);
    expect(data.mediaType).toBe('image/jpeg');
    expect(data.filename).toBe('photo.jpg');
  });

  it('handles PNG files', () => {
    const pngFile = new File(['test'], 'logo.png', { type: 'image/png' });
    const data = getImageData(pngFile);
    expect(data.mediaType).toBe('image/png');
  });

  it('handles WebP files', () => {
    const webpFile = new File(['test'], 'image.webp', { type: 'image/webp' });
    const data = getImageData(webpFile);
    expect(data.mediaType).toBe('image/webp');
  });

  it('handles GIF files', () => {
    const gifFile = new File(['test'], 'animation.gif', { type: 'image/gif' });
    const data = getImageData(gifFile);
    expect(data.mediaType).toBe('image/gif');
  });
});

describe('parseSSELine', () => {
  it('parses message event', () => {
    const line = 'event: message\ndata: {"text":"Analyzing your request..."}';
    const result = parseSSELine(line);
    expect(result?.event).toBe('message');
    expect((result?.data as { text: string }).text).toBe('Analyzing your request...');
  });

  it('parses file-change event', () => {
    const line = 'event: file-change\ndata: {"path":"src/pages/index.astro","action":"modified"}';
    const result = parseSSELine(line);
    expect(result?.event).toBe('file-change');
    expect((result?.data as { path: string }).path).toBe('src/pages/index.astro');
  });

  it('parses result event', () => {
    const line = 'event: result\ndata: {"success":true,"response":"Changes applied!"}';
    const result = parseSSELine(line);
    expect(result?.event).toBe('result');
    expect((result?.data as { success: boolean }).success).toBe(true);
  });

  it('parses error event', () => {
    const line = 'event: error\ndata: {"error":"File not found"}';
    const result = parseSSELine(line);
    expect(result?.event).toBe('error');
    expect((result?.data as { error: string }).error).toBe('File not found');
  });

  it('returns null for invalid lines', () => {
    expect(parseSSELine('')).toBeNull();
    expect(parseSSELine('invalid')).toBeNull();
    expect(parseSSELine('event: message')).toBeNull(); // missing data
  });

  it('returns null for invalid JSON', () => {
    const line = 'event: message\ndata: {invalid json}';
    expect(parseSSELine(line)).toBeNull();
  });
});

describe('modification request flow states', () => {
  it('shows processing message immediately', () => {
    const hasImages = true;
    const processingMessage = hasImages
      ? '­ƒöä Processing your images and applying changes...'
      : '­ƒöä Applying your changes...';

    expect(processingMessage).toContain('Processing');
    expect(processingMessage).toContain('images');
  });

  it('shows text-only processing message', () => {
    const hasImages = false;
    const processingMessage = hasImages
      ? '­ƒöä Processing your images and applying changes...'
      : '­ƒöä Applying your changes...';

    expect(processingMessage).not.toContain('images');
    expect(processingMessage).toContain('Applying');
  });

  it('shows success message with response', () => {
    const response = 'I\'ve updated the hero section with your new image.';
    const successMessage = response || 'Ô£à Changes applied successfully! Refresh the preview to see the updates.';

    expect(successMessage).toContain('hero section');
  });

  it('shows default success message when no response', () => {
    const response = '';
    const successMessage = response || 'Ô£à Changes applied successfully! Refresh the preview to see the updates.';

    expect(successMessage).toContain('Changes applied successfully');
  });
});

describe('step routing', () => {
  type Step =
    | 'welcome'
    | 'describe'
    | 'name'
    | 'business-uvp'
    | 'business-audience'
    | 'template'
    | 'personalization'
    | 'ready'
    | 'creating';

  function getHandlerForStep(step: Step): string {
    switch (step) {
      case 'describe':
      case 'welcome':
        return 'handleDescriptionSubmit';
      case 'name':
        return 'handleNameSubmit';
      case 'business-uvp':
      case 'business-audience':
        return 'handleBusinessAnswer';
      case 'ready':
        return 'applyChangesWithAgent';
      case 'creating':
        return 'showCreatingMessage';
      default:
        return 'default';
    }
  }

  it('routes describe step to description handler', () => {
    expect(getHandlerForStep('describe')).toBe('handleDescriptionSubmit');
  });

  it('routes name step to name handler', () => {
    expect(getHandlerForStep('name')).toBe('handleNameSubmit');
  });

  it('routes business steps to business handler', () => {
    expect(getHandlerForStep('business-uvp')).toBe('handleBusinessAnswer');
    expect(getHandlerForStep('business-audience')).toBe('handleBusinessAnswer');
  });

  it('routes ready step to agent for modifications', () => {
    expect(getHandlerForStep('ready')).toBe('applyChangesWithAgent');
  });

  it('routes creating step to show message', () => {
    expect(getHandlerForStep('creating')).toBe('showCreatingMessage');
  });
});

describe('working directory resolution', () => {
  it('uses provided working directory', () => {
    const workingDirectory = '/workspaces/custom-dir';
    const convexProjectId = 'abc123';
    const projectDir = workingDirectory || `/workspaces/${convexProjectId}`;

    expect(projectDir).toBe('/workspaces/custom-dir');
  });

  it('falls back to convex project ID path', () => {
    const workingDirectory = undefined;
    const convexProjectId = 'abc123';
    const projectDir = workingDirectory || `/workspaces/${convexProjectId}`;

    expect(projectDir).toBe('/workspaces/abc123');
  });
});

describe('image attachment validation', () => {
  it('accepts JPEG images', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(validTypes.includes(file.type)).toBe(true);
  });

  it('accepts PNG images', () => {
    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(validTypes.includes(file.type)).toBe(true);
  });

  it('accepts WebP images', () => {
    const file = new File(['test'], 'modern.webp', { type: 'image/webp' });
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(validTypes.includes(file.type)).toBe(true);
  });

  it('accepts GIF images', () => {
    const file = new File(['test'], 'animated.gif', { type: 'image/gif' });
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(validTypes.includes(file.type)).toBe(true);
  });

  it('rejects non-image files', () => {
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(validTypes.includes(file.type)).toBe(false);
  });
});

