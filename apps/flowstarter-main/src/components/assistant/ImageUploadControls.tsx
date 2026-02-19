import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useRef } from 'react';

export interface UploadedImage {
  url: string;
  name: string;
}

interface ImageUploadControlsProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onUpload: (files: FileList) => Promise<void>;
  isUploading: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function ImageUploadControls({
  images,
  onImagesChange,
  onUpload,
  isUploading,
  isDisabled = false,
  className = '',
}: ImageUploadControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await onUpload(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={className}>
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleImageClick}
          disabled={isUploading || isDisabled}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#2e2e36] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          title="Attach image"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          <span className="text-xs">
            {isUploading ? 'Uploading...' : 'Attach Image'}
          </span>
        </button>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.name}
                className="h-20 w-20 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={isDisabled}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
