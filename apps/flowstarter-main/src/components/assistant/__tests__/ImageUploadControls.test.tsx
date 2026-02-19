import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ImageUploadControls,
  type UploadedImage,
} from '../ImageUploadControls';

describe('ImageUploadControls', () => {
  const mockImages: UploadedImage[] = [
    { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
    { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
  ];

  it('renders upload button with text', () => {
    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
      />
    );

    expect(screen.getByText('Attach Image')).toBeInTheDocument();
  });

  it('shows uploading state', () => {
    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={true}
      />
    );

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('disables button when isUploading is true', () => {
    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when isDisabled prop is true', () => {
    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
        isDisabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /attach image/i });
    expect(button).toBeDisabled();
  });

  it('renders image previews when images are provided', () => {
    render(
      <ImageUploadControls
        images={mockImages}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', mockImages[0].url);
    expect(images[0]).toHaveAttribute('alt', mockImages[0].name);
    expect(images[1]).toHaveAttribute('src', mockImages[1].url);
    expect(images[1]).toHaveAttribute('alt', mockImages[1].name);
  });

  it('does not render image previews when images array is empty', () => {
    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
      />
    );

    const images = screen.queryAllByRole('img');
    expect(images).toHaveLength(0);
  });

  it('calls onImagesChange when remove button is clicked', async () => {
    const user = userEvent.setup();
    const handleImagesChange = vi.fn();

    render(
      <ImageUploadControls
        images={mockImages}
        onImagesChange={handleImagesChange}
        onUpload={vi.fn()}
        isUploading={false}
      />
    );

    // Get all remove buttons
    const removeButtons = screen.getAllByRole('button', {
      name: /remove image/i,
    });

    // Click the first remove button
    await user.click(removeButtons[0]);

    expect(handleImagesChange).toHaveBeenCalledWith([mockImages[1]]);
  });

  it('calls onUpload when files are selected', async () => {
    const user = userEvent.setup();
    const handleUpload = vi.fn().mockResolvedValue(undefined);

    render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={handleUpload}
        isUploading={false}
      />
    );

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ImageUploadControls
        images={[]}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('disables remove buttons when isDisabled is true', () => {
    render(
      <ImageUploadControls
        images={mockImages}
        onImagesChange={vi.fn()}
        onUpload={vi.fn()}
        isUploading={false}
        isDisabled={true}
      />
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove image/i,
    });

    removeButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
