import { useTranslations } from '@/lib/i18n';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadButtonProps {
  isUploading: boolean;
  isGenerating: boolean;
  onClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploadButton({
  isUploading,
  isGenerating,
  onClick,
  fileInputRef,
  onFileChange,
}: ImageUploadButtonProps) {
  const { t } = useTranslations();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={onClick}
        disabled={isUploading || isGenerating}
        className="shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isUploading
            ? t('assistant.button.uploading')
            : t('assistant.button.attachImage')
        }
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-400" />
        ) : (
          <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </>
  );
}
