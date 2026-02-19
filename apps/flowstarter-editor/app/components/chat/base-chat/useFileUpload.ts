/**
 * BaseChat - File Upload Hook
 *
 * Handles file upload and paste functionality for images.
 */

interface UseFileUploadOptions {
  uploadedFiles: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList: string[];
  setImageDataList?: (dataList: string[]) => void;
}

interface UseFileUploadReturn {
  handleFileUpload: () => void;
  handlePaste: (e: React.ClipboardEvent) => Promise<void>;
}

export function useFileUpload({
  uploadedFiles,
  setUploadedFiles,
  imageDataList,
  setImageDataList,
}: UseFileUploadOptions): UseFileUploadReturn {
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const base64Image = e.target?.result as string;
          setUploadedFiles?.([...uploadedFiles, file]);
          setImageDataList?.([...imageDataList, base64Image]);
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;

    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();

        const file = item.getAsFile();

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }

        break;
      }
    }
  };

  return {
    handleFileUpload,
    handlePaste,
  };
}

