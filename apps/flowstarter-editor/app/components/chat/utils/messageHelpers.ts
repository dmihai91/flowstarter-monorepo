import type { TextUIPart, FileUIPart, Attachment } from '@ai-sdk/ui-utils';

/**
 * Creates message parts array from text and images for AI SDK
 */
export const createMessageParts = (text: string, images: string[] = []): Array<TextUIPart | FileUIPart> => {
  const parts: Array<TextUIPart | FileUIPart> = [
    {
      type: 'text',
      text,
    },
  ];

  images.forEach((imageData) => {
    const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

    parts.push({
      type: 'file',
      mimeType,
      data: imageData.replace(/^data:image\/[^;]+;base64,/, ''),
    });
  });

  return parts;
};

/**
 * Converts File[] to Attachment[] for AI SDK
 */
export const filesToAttachments = async (files: File[]): Promise<Attachment[] | undefined> => {
  if (files.length === 0) {
    return undefined;
  }

  const attachments = await Promise.all(
    files.map(
      (file) =>
        new Promise<Attachment>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            resolve({
              name: file.name,
              contentType: file.type,
              url: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        }),
    ),
  );

  return attachments;
};

/**
 * Formats the message text with model and provider info
 */
export const formatMessageText = (content: string, model: string, providerName: string): string => {
  return `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n${content}`;
};
