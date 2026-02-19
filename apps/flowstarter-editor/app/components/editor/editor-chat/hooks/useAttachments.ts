import { useState, useCallback, useEffect, useRef } from 'react';
import type { AttachedImage } from '~/components/editor/editor-chat/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FileValidationError {
  file: string;
  reason: 'size' | 'type' | 'count';
}

export function useAttachments() {
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Track active FileReaders for cleanup
  const activeReadersRef = useRef<Set<FileReader>>(new Set());

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Abort all active FileReaders
      activeReadersRef.current.forEach((reader) => {
        if (reader.readyState === FileReader.LOADING) {
          reader.abort();
        }
      });
      activeReadersRef.current.clear();
    };
  }, []);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setAttachmentMenuOpen(false);
      }
    };

    if (attachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [attachmentMenuOpen]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (!files) {
        return;
      }

      const fileArray = Array.from(files);
      const errors: FileValidationError[] = [];

      // Check total count
      if (attachedImages.length + fileArray.length > MAX_FILES) {
        errors.push({ file: '', reason: 'count' });
        setValidationErrors(errors);

        return;
      }

      // Process valid files
      fileArray.forEach((file) => {
        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          errors.push({ file: file.name, reason: 'type' });
          return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push({ file: file.name, reason: 'size' });
          return;
        }

        const reader = new FileReader();
        activeReadersRef.current.add(reader);

        reader.onload = (event) => {
          // Remove from active readers
          activeReadersRef.current.delete(reader);

          // Only update state if still mounted
          if (isMountedRef.current) {
            const preview = event.target?.result as string;
            setAttachedImages((prev) => [...prev, { file, preview }]);
          }
        };

        reader.onerror = () => {
          activeReadersRef.current.delete(reader);
          console.error('Failed to read file:', file.name);
        };

        reader.onabort = () => {
          activeReadersRef.current.delete(reader);
        };

        reader.readAsDataURL(file);
      });

      setValidationErrors(errors);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setAttachmentMenuOpen(false);
    },
    [attachedImages.length],
  );

  const handleScreenshot = useCallback(async () => {
    setAttachmentMenuOpen(false);

    // Check file limit
    if (attachedImages.length >= MAX_FILES) {
      setValidationErrors([{ file: '', reason: 'count' }]);
      return;
    }

    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as MediaTrackConstraints,
      });

      // Check if still mounted after async operation
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Check if still mounted after async operation
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;

        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop all tracks immediately after capture
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      stream = null;
      video = null;

      // Convert to blob and create preview
      canvas.toBlob((blob) => {
        // Only update state if still mounted
        if (blob && isMountedRef.current) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
          const preview = canvas.toDataURL('image/png');
          setAttachedImages((prev) => [...prev, { file, preview }]);
        }
      }, 'image/png');
    } catch (err) {
      // Clean up on error
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) {
        video.srcObject = null;
      }

      console.error('Screenshot failed:', err);
    }
  }, [attachedImages.length]);

  const removeAttachedImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachedImages = useCallback(() => {
    setAttachedImages([]);
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return {
    attachmentMenuOpen,
    setAttachmentMenuOpen,
    attachedImages,
    validationErrors,
    fileInputRef,
    attachmentMenuRef,
    handleFileSelect,
    handleScreenshot,
    removeAttachedImage,
    clearAttachedImages,
    clearValidationErrors,

    // Expose limits for UI
    maxFiles: MAX_FILES,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
  };
}

