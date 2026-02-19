import { useWizardStore } from '@/store/wizard-store';
import { useEffect, useState } from 'react';

export function useImageUpload() {
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ url: string; name: string }>
  >([]);
  const prefillImages = useWizardStore((s) => s.prefillImages);
  const setPrefillImages = useWizardStore((s) => s.setPrefillImages);

  // Load prefill images once on mount
  useEffect(() => {
    if (prefillImages.length > 0) {
      setUploadedImages(prefillImages);
      // Clear prefill images after loading
      setPrefillImages([]);
    }
  }, [prefillImages, setPrefillImages]);

  return {
    uploadedImages,
    setUploadedImages,
  };
}
