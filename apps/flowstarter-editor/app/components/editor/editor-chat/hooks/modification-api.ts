/**
 * Modification API Helpers
 *
 * API functions for applying site modifications through the supported beta path.
 * The editor now uses the direct Convex-backed modification flow only.
 *
 * Extracted from useSendHandler to keep file sizes manageable.
 */

export interface ImageData {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  filename: string;
}

export interface RouteDecision {
  route: 'simple';
  confidence: number;
  reason: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

interface ModificationResult {
  success: boolean;
  response?: string;
  error?: string;
  changes?: Array<{ path: string; operation: string }>;
}

/** Convert File to base64 data */
export async function fileToBase64(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
      const mediaType = file.type as ImageData['mediaType'];
      resolve({
        base64,
        mediaType: mediaType || 'image/png',
        filename: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getModificationRoute(instruction: string): Promise<RouteDecision> {
  return {
    route: 'simple',
    confidence: 1,
    reason: `Beta editor uses the direct modification flow for: ${instruction.slice(0, 80)}`,
    estimatedComplexity: 'low',
  };
}

/**
 * Apply changes using Convex-based modification API (simple route)
 * This uses Convex as the source of truth, not Daytona filesystem
 */
export async function applyChangesSimple(
  instruction: string,
  projectId: string,
  images?: ImageData[],
): Promise<ModificationResult> {
  try {
    const response = await fetch('/api/modify-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'modify',
        projectId,
        instruction,
        images,
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      error?: string;
      message?: string;
      changes?: Array<{ path: string; operation: string }>;
    };

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to apply changes',
      };
    }

    return {
      success: true,
      response: data.message,
      changes: data.changes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Legacy: Call the old agent-code API (Daytona-based)
 * Kept for fallback if needed
 */
export async function applyChangesWithAgent(
  instruction: string,
  workingDirectory: string,
  images?: ImageData[],
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const response = await fetch('/api/agent-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'apply-changes',
        instruction,
        targetFiles: [],
        workingDirectory,
        images,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      return { success: false, error: errorData.error || 'Failed to apply changes' };
    }

    // Handle SSE stream and collect the response
    const reader = response.body?.getReader();

    if (!reader) {
      return { success: false, error: 'No response stream' };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let success = false;
    let responseText = '';
    let errorText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const eventMatch = line.match(/^event: (\w+)/);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch && dataMatch) {
          const event = eventMatch[1];

          try {
            const data = JSON.parse(dataMatch[1]);

            switch (event) {
              case 'message':
                responseText += data.text + '\n';
                break;
              case 'result':
                success = data.success;

                if (data.response) {
                  responseText += data.response;
                }

                break;
              case 'error':
                errorText = data.error;
                break;
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
    }

    if (errorText) {
      return { success: false, error: errorText };
    }

    return { success, response: responseText };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
