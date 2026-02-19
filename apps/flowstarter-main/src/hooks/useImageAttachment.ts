import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function useImageAttachment() {
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error('Failed to load image');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to attach image');
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    attachedImage,
    isUploadingImage,
    fileInputRef,
    handleImageAttach,
    handleRemoveImage,
    clearImage,
  };
}
