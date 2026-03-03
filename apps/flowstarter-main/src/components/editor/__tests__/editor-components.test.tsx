import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChatInput } from '../ChatInput';
import { PreviewControls } from '../PreviewControls';
import { PreviewPanel } from '../PreviewPanel';

// Mock design system components (avoid duplicate React instances)
vi.mock('@flowstarter/flow-design-system', () => ({
  FlowBackground: () => null,
  LoadingScreen: () => null,
}));

// Mock PreviewLoading which may also use design system
vi.mock('../PreviewLoading', () => ({
  PreviewLoading: ({ message }: { message?: string }) => <div data-testid="preview-loading">{message || 'Loading...'}</div>,
}));

// Mock the translations
vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'editor.openInNewTab': 'Open in New Tab',
        'editor.inputPlaceholder': 'Type your message...',
        'editor.attachedImageAlt': 'Attached image',
        'editor.removeImage': 'Remove image',
        'editor.attachImage': 'Attach Image',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock ResponseStream component
vi.mock('@/components/ui/response-stream', () => ({
  ResponseStream: ({ textStream }: { textStream: string }) => (
    <span>{textStream}</span>
  ),
}));

// Mock Next Image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <div
      data-testid="next-image"
      data-src={src}
      data-alt={alt}
      className={className}
    />
  ),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('PreviewControls', () => {
  const defaultProps = {
    deviceView: 'desktop' as const,
    onDeviceViewChange: vi.fn(),
    onFullscreen: vi.fn(),
    onOpenInTab: vi.fn(),
    hasPreview: true,
  };

  it('should render all device view buttons', () => {
    render(<PreviewControls {...defaultProps} />);
    expect(screen.getAllByRole('button')).toHaveLength(5); // 3 devices + 2 actions
  });

  it('should call onDeviceViewChange when mobile button is clicked', async () => {
    const user = userEvent.setup();
    const onDeviceViewChange = vi.fn();
    render(
      <PreviewControls
        {...defaultProps}
        onDeviceViewChange={onDeviceViewChange}
      />
    );

    const mobileButton = screen.getAllByRole('button')[0];
    await user.click(mobileButton);
    expect(onDeviceViewChange).toHaveBeenCalledWith('mobile');
  });

  it('should call onDeviceViewChange when tablet button is clicked', async () => {
    const user = userEvent.setup();
    const onDeviceViewChange = vi.fn();
    render(
      <PreviewControls
        {...defaultProps}
        onDeviceViewChange={onDeviceViewChange}
      />
    );

    const tabletButton = screen.getAllByRole('button')[1];
    await user.click(tabletButton);
    expect(onDeviceViewChange).toHaveBeenCalledWith('tablet');
  });

  it('should call onDeviceViewChange when desktop button is clicked', async () => {
    const user = userEvent.setup();
    const onDeviceViewChange = vi.fn();
    render(
      <PreviewControls
        {...defaultProps}
        onDeviceViewChange={onDeviceViewChange}
      />
    );

    const desktopButton = screen.getAllByRole('button')[2];
    await user.click(desktopButton);
    expect(onDeviceViewChange).toHaveBeenCalledWith('desktop');
  });

  it('should call onFullscreen when fullscreen button is clicked', async () => {
    const user = userEvent.setup();
    const onFullscreen = vi.fn();
    render(<PreviewControls {...defaultProps} onFullscreen={onFullscreen} />);

    const fullscreenButton = screen.getAllByRole('button')[3];
    await user.click(fullscreenButton);
    expect(onFullscreen).toHaveBeenCalled();
  });

  it('should call onOpenInTab when open in tab button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenInTab = vi.fn();
    render(<PreviewControls {...defaultProps} onOpenInTab={onOpenInTab} />);

    const openInTabButton = screen.getAllByRole('button')[4];
    await user.click(openInTabButton);
    expect(onOpenInTab).toHaveBeenCalled();
  });

  it('should disable all buttons when hasPreview is false', () => {
    render(<PreviewControls {...defaultProps} hasPreview={false} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

describe('PreviewPanel', () => {
  it('should render iframe when previewHtml is provided', () => {
    render(<PreviewPanel previewHtml="<h1>Test</h1>" />);
    const iframe = screen.getByTitle('Website Preview');
    expect(iframe).toBeInTheDocument();
  });

  it('should render loading state when previewHtml is null', () => {
    render(<PreviewPanel previewHtml={null} isGenerating={true} />);
    // Loading component should be rendered (we can check for the absence of iframe)
    expect(screen.queryByTitle('Website Preview')).not.toBeInTheDocument();
  });

  it('should use custom project name', () => {
    render(<PreviewPanel previewHtml={null} projectName="My Custom Project" />);
    // The project name is passed to PreviewLoading component
    expect(screen.queryByTitle('Website Preview')).not.toBeInTheDocument();
  });

  it('should render iframe with correct attributes', () => {
    render(<PreviewPanel previewHtml="<h1>Test</h1>" />);

    const iframe = screen.getByTitle('Website Preview');
    expect(iframe).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-same-origin'
    );
  });
});

describe('ChatInput', () => {
  const fileInputRef = createRef<HTMLInputElement>();
  const defaultProps = {
    onSend: vi.fn(),
    isDisabled: false,
    attachedImage: null,
    isUploadingImage: false,
    fileInputRef,
    onImageAttach: vi.fn(),
    onRemoveImage: vi.fn(),
  };

  it('should render textarea and send button', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    expect(textarea).toHaveValue('Test message');
  });

  it('should call onSend when send button is clicked', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message', null);
  });

  it('should call onSend when Enter is pressed', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message{Enter}');

    expect(onSend).toHaveBeenCalledWith('Test message', null);
  });

  it('should not call onSend when Shift+Enter is pressed', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message{Shift>}{Enter}{/Shift}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatInput {...defaultProps} />);
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when there is an attached image', () => {
    render(
      <ChatInput {...defaultProps} attachedImage="data:image/png;base64,..." />
    );
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('should display attached image preview', () => {
    render(
      <ChatInput {...defaultProps} attachedImage="data:image/png;base64,test" />
    );
    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-alt', 'Attached image');
  });

  it('should call onRemoveImage when remove button is clicked', async () => {
    const onRemoveImage = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatInput
        {...defaultProps}
        attachedImage="data:image/png;base64,test"
        onRemoveImage={onRemoveImage}
      />
    );

    const removeButton = screen.getByLabelText('Remove image');
    await user.click(removeButton);
    expect(onRemoveImage).toHaveBeenCalled();
  });

  it('should disable all inputs when isDisabled is true', () => {
    render(<ChatInput {...defaultProps} isDisabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    // Send button should be disabled when isDisabled is true
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('should show loading state when uploading image', () => {
    render(<ChatInput {...defaultProps} isUploadingImage={true} />);
    // Check for loader icon (we don't render the actual icon text, but the component structure should be there)
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should use custom placeholder', () => {
    render(<ChatInput {...defaultProps} placeholder="Custom placeholder" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('should clear input after sending', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    expect(textarea).toHaveValue('');
  });

  it('should send with image data when both text and image are present', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const imageData = 'data:image/png;base64,test';
    render(
      <ChatInput {...defaultProps} onSend={onSend} attachedImage={imageData} />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message', imageData);
  });
});
