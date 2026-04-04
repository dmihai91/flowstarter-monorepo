'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Type, X } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import type { SelectedLogo } from '../components/scaffold/useScaffoldForm';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function LogoStep({
  onLogoSelected,
  onSkip,
  onBack,
}: {
  onLogoSelected: (logo: SelectedLogo) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        setError('File must be under 5 MB');
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setPreview(url);
      onLogoSelected({ type: 'uploaded', url, name: file.name });
    },
    [onLogoSelected],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Logo</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Upload a logo or skip to use the business name as text.
        </p>
      </div>

      {preview ? (
        <div className="relative inline-block rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4">
          <img src={preview} alt="Logo preview" className="max-h-24 object-contain" />
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
          >
            <Upload className="w-6 h-6 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload file</span>
            <span className="text-xs text-zinc-400">PNG, JPG, SVG — max 5 MB</span>
          </button>
          <button
            onClick={() => onLogoSelected({ type: 'text' })}
            className="flex flex-col items-center gap-2 p-6 rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
          >
            <Type className="w-6 h-6 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Use text logo</span>
            <span className="text-xs text-zinc-400">Business name as the logo</span>
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={onSkip}
          variant="accent"
          size="md"
          className="flex-1"
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          {preview ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
