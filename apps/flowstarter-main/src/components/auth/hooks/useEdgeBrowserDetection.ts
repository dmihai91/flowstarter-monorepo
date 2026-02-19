import { useEffect, useState } from 'react';

/**
 * Detects if the browser is Microsoft Edge.
 * Used to avoid showing custom password toggle as Edge has its own.
 */
export function useEdgeBrowserDetection() {
  const [isEdgeBrowser, setIsEdgeBrowser] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsEdgeBrowser(userAgent.includes('Edg/') || userAgent.includes('Edge/'));
  }, []);

  return isEdgeBrowser;
}
