import { auth } from '@clerk/nextjs/server';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Image uploader for assistant chat
  assistantImageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
  })
    .middleware(async () => {
      // Authenticate the user
      const { userId } = await auth();

      // If you throw, the user will not be able to upload
      if (!userId) throw new UploadThingError('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const uploadedUrl =
        'ufsUrl' in file && typeof file.ufsUrl === 'string' ? file.ufsUrl : '';

      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', uploadedUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: uploadedUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
