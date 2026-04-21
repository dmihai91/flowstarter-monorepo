import { useRef, useState } from 'react';
import { toast } from 'sonner';

function getUploadedFileUrl(file: unknown): string {
  if (
    typeof file === 'object' &&
    file !== null &&
    'serverData' in file &&
    typeof (file as { serverData?: { url?: string } }).serverData?.url ===
      'string'
  ) {
    return (file as { serverData: { url: string } }).serverData.url;
  }
  if (
    typeof file === 'object' &&
    file !== null &&
    'ufsUrl' in file &&
    typeof (file as { ufsUrl?: string }).ufsUrl === 'string'
  ) {
    return (file as { ufsUrl: string }).ufsUrl;
  }
  return '';
}

function getUploadedFileName(file: unknown): string {
  if (
    typeof file === 'object' &&
    file !== null &&
    'name' in file &&
    typeof (file as { name?: string }).name === 'string'
  ) {
    return (file as { name: string }).name;
  }
  if (
    typeof file === 'object' &&
    file !== null &&
    'fileName' in file &&
    typeof (file as { fileName?: string }).fileName === 'string'
  ) {
    return (file as { fileName: string }).fileName;
  }
  return 'upload';
}

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
          url: getUploadedFileUrl(file),
          name: getUploadedFileName(file),
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
