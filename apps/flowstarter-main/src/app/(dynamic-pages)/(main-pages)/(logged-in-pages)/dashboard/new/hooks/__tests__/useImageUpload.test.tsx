import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUpload } from '../useImageUpload';

// Mock the wizard store
vi.mock('@/store/wizard-store', () => ({
  useWizardStore: vi.fn((selector) => {
    const mockStore = {
      prefillImages: [],
      setPrefillImages: vi.fn(),
    };
    return selector(mockStore);
  }),
}));

import { useWizardStore } from '@/store/wizard-store';

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty uploaded images', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.uploadedImages).toEqual([]);
  });

  it('should allow setting uploaded images', () => {
    const { result } = renderHook(() => useImageUpload());

    const newImages = [
      { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
      { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
    ];

    act(() => {
      result.current.setUploadedImages(newImages);
    });

    expect(result.current.uploadedImages).toEqual(newImages);
  });

  it('should load prefill images on mount', () => {
    const prefillImages = [
      { url: 'https://example.com/prefill1.jpg', name: 'prefill1.jpg' },
      { url: 'https://example.com/prefill2.jpg', name: 'prefill2.jpg' },
    ];

    const mockSetPrefillImages = vi.fn();

    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          prefillImages,
          setPrefillImages: mockSetPrefillImages,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() => useImageUpload());

    expect(result.current.uploadedImages).toEqual(prefillImages);
    expect(mockSetPrefillImages).toHaveBeenCalledWith([]);
  });

  it('should not load prefill images if array is empty', () => {
    const mockSetPrefillImages = vi.fn();

    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          prefillImages: [],
          setPrefillImages: mockSetPrefillImages,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() => useImageUpload());

    expect(result.current.uploadedImages).toEqual([]);
    expect(mockSetPrefillImages).not.toHaveBeenCalled();
  });

  it('should update uploaded images list', () => {
    const { result } = renderHook(() => useImageUpload());

    const firstSet = [
      { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
    ];

    act(() => {
      result.current.setUploadedImages(firstSet);
    });
    expect(result.current.uploadedImages).toEqual(firstSet);

    const secondSet = [
      { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
      { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
    ];

    act(() => {
      result.current.setUploadedImages(secondSet);
    });
    expect(result.current.uploadedImages).toEqual(secondSet);
  });

  it('should clear uploaded images', () => {
    const { result } = renderHook(() => useImageUpload());

    const images = [
      { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
    ];

    act(() => {
      result.current.setUploadedImages(images);
    });
    expect(result.current.uploadedImages).toEqual(images);

    act(() => {
      result.current.setUploadedImages([]);
    });
    expect(result.current.uploadedImages).toEqual([]);
  });

  it('should handle multiple image objects', () => {
    const { result } = renderHook(() => useImageUpload());

    const manyImages = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/image${i}.jpg`,
      name: `image${i}.jpg`,
    }));

    act(() => {
      result.current.setUploadedImages(manyImages);
    });

    expect(result.current.uploadedImages).toHaveLength(10);
    expect(result.current.uploadedImages).toEqual(manyImages);
  });
});
