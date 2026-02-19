import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_FONTS_URL } from '~/components/editor/editor-chat/constants';

// Timeout for font loading (10 seconds)
const FONT_LOAD_TIMEOUT_MS = 10000;

interface UseFontsLoaderReturn {
  fontsLoaded: boolean;
  fontError: string | null;
}

export function useFontsLoader(): UseFontsLoaderReturn {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  const handleFontsReady = useCallback(() => {
    document.fonts.ready
      .then(() => {
        setFontsLoaded(true);
        setFontError(null);
      })
      .catch((err) => {
        console.error('[useFontsLoader] Font ready promise failed:', err);

        // Still mark as loaded so UI doesn't block, but record the error
        setFontsLoaded(true);
        setFontError('Some fonts may not have loaded correctly');
      });
  }, []);

  useEffect(() => {
    const fontLinkId = 'editor-chat-fonts';
    let link = document.getElementById(fontLinkId) as HTMLLinkElement;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!link) {
      // Add preconnect for faster loading
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);

      // Load fonts
      link = document.createElement('link');
      link.id = fontLinkId;
      link.href = GOOGLE_FONTS_URL;
      link.rel = 'stylesheet';

      link.onload = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        handleFontsReady();
      };

      link.onerror = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error('[useFontsLoader] Failed to load font stylesheet');

        // Still mark as loaded so UI doesn't block indefinitely
        setFontsLoaded(true);
        setFontError('Failed to load fonts. Using system fonts as fallback.');
      };

      // Set timeout for font loading
      timeoutId = setTimeout(() => {
        if (!fontsLoaded) {
          console.warn('[useFontsLoader] Font loading timed out');
          setFontsLoaded(true);
          setFontError('Font loading timed out. Using system fonts as fallback.');
        }
      }, FONT_LOAD_TIMEOUT_MS);

      document.head.appendChild(link);
    } else {
      handleFontsReady();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fontsLoaded, handleFontsReady]);

  return { fontsLoaded, fontError };
}

