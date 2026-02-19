# UploadThing Setup Guide

This guide will help you set up UploadThing for image uploads in the dashboard assistant.

## 1. Get Your UploadThing API Keys

1. Go to [uploadthing.com](https://uploadthing.com/) and sign up/log in
2. Create a new app or select an existing one
3. Navigate to the API Keys section
4. Copy your `UPLOADTHING_TOKEN`

## 2. Add Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
UPLOADTUPLOADTHING_TOKEN=your_secret_here
```

## 3. Files Created

The following files have been created for the UploadThing integration:

- **`src/lib/uploadthing.ts`** - UploadThing React helpers and hooks
- **`src/app/api/uploadthing/core.ts`** - File router configuration with authentication
- **`src/app/api/uploadthing/route.ts`** - API route handlers for UploadThing

## 4. Usage

The image upload feature is now available in the dashboard assistant (`UnifiedAssistant` component):

- Click the image icon to upload images
- Supports multiple images (up to 3 images, max 4MB each)
- Images are authenticated using Clerk user authentication
- Uploaded images are displayed as previews with remove functionality
- Images are included in the AI generation request

## 5. Features

- **Authentication**: Only authenticated users can upload images
- **File Validation**: Only images accepted, max 4MB per file, max 3 files
- **Preview**: Thumbnails of uploaded images with hover-to-remove functionality
- **Loading States**: Upload progress indicator on the button
- **Error Handling**: User-friendly error messages for upload failures

## 6. Customization

### Change File Limits

Edit `src/app/api/uploadthing/core.ts`:

```typescript
assistantImageUploader: f({
  image: {
    maxFileSize: '4MB', // Change this
    maxFileCount: 3, // Change this
  },
});
```

### Add More File Types

You can add support for other file types like PDFs:

```typescript
assistantFileUploader: f({
  image: { maxFileSize: '4MB' },
  pdf: { maxFileSize: '8MB' },
});
```

## 7. Testing

1. Start your development server: `pnpm dev`
2. Navigate to the dashboard
3. Scroll to the assistant section
4. Click the image icon and select an image to upload
5. The image should upload and display as a preview
6. Click the X button on the preview to remove it

## Troubleshooting

**Upload fails with "Unauthorized" error:**

- Make sure you're logged in with Clerk
- Check that your Clerk authentication is working properly

**Upload fails with API key error:**

- Verify your `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are correct
- Make sure the environment variables are in `.env.local`
- Restart your development server after adding env variables

**Images not showing in preview:**

- Check browser console for errors
- Verify the upload was successful by checking the UploadThing dashboard
