import { X } from 'lucide-react';

interface ImagePreviewsProps {
  images: Array<{ url: string; name: string }>;
  onRemove: (index: number) => void;
  isGenerating: boolean;
}

export function ImagePreviews({
  images,
  onRemove,
  isGenerating,
}: ImagePreviewsProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
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
            onClick={() => onRemove(index)}
            disabled={isGenerating}
            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
