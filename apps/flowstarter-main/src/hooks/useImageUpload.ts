import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function useImageUpload(
  uploadedImages: Array<{ url: string; name: string }>,
  setUploadedImages: (images: Array<{ url: string; name: string }>) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    try {
      const { uploadFiles } = await import('@/lib/uploadthing');
      const res = await uploadFiles('assistantImageUploader', {
        files: fileArray,
      });

      if (res) {
        const newImages = res.map((file) => ({
          url: file.url,
          name: file.name,
        }));
        setUploadedImages([...uploadedImages, ...newImages]);
      }
      setIsUploading(false);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Upload failed', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(
      uploadedImages.filter((_, index) => index !== indexToRemove)
    );
  };

  return {
    isUploading,
    fileInputRef,
    handleImageClick,
    handleFileChange,
    removeImage,
  };
}
