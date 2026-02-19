import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImageAttachment } from '../useImageAttachment';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useImageAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useImageAttachment());

    expect(result.current.attachedImage).toBeNull();
    expect(result.current.isUploadingImage).toBe(false);
    expect(result.current.fileInputRef.current).toBeNull();
  });

  it('should reject non-image files', async () => {
    const { result } = renderHook(() => useImageAttachment());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleImageAttach(event);
    });

    expect(toast.error).toHaveBeenCalledWith('Please select an image file');
    expect(result.current.attachedImage).toBeNull();
  });

  it('should reject files larger than 5MB', async () => {
    const { result } = renderHook(() => useImageAttachment());

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const event = {
      target: { files: [largeFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleImageAttach(event);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Image size should be less than 5MB'
    );
    expect(result.current.attachedImage).toBeNull();
  });

  it('should handle no file selected', async () => {
    const { result } = renderHook(() => useImageAttachment());

    const event = {
      target: { files: [] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleImageAttach(event);
    });

    expect(result.current.attachedImage).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should remove attached image', () => {
    const { result } = renderHook(() => useImageAttachment());

    // Manually set an attached image
    act(() => {
      result.current.fileInputRef.current = document.createElement('input');
      result.current.fileInputRef.current.value = 'test.jpg';
    });

    act(() => {
      result.current.handleRemoveImage();
    });

    expect(result.current.attachedImage).toBeNull();
    expect(result.current.fileInputRef.current?.value).toBe('');
  });

  it('should clear image', () => {
    const { result } = renderHook(() => useImageAttachment());

    // Set up file input ref
    act(() => {
      result.current.fileInputRef.current = document.createElement('input');
      result.current.fileInputRef.current.value = 'test.jpg';
    });

    act(() => {
      result.current.clearImage();
    });

    expect(result.current.attachedImage).toBeNull();
    expect(result.current.fileInputRef.current?.value).toBe('');
  });

  it('should handle clear when fileInputRef is null', () => {
    const { result } = renderHook(() => useImageAttachment());

    act(() => {
      result.current.clearImage();
    });

    expect(result.current.attachedImage).toBeNull();
  });
});
