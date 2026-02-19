import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../[templateId]/preview/route';

// Mock the local template service
vi.mock('@/lib/templates/local-template-service', () => ({
  localTemplateService: {
    templateExists: vi.fn(),
    getProcessedTemplate: vi.fn(),
  },
}));

import { localTemplateService } from '@/lib/templates/local-template-service';

describe('Template Preview API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/templates/[templateId]/preview', () => {
    it('should return 404 when template does not exist', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/templates/non-existent/preview'
      );
      const params = Promise.resolve({ templateId: 'non-existent' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Template not found');
      expect(localTemplateService.templateExists).toHaveBeenCalledWith(
        'non-existent'
      );
    });

    it('should return processed template content', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html><body>Test Template</body></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview?name=MyBusiness&description=TestDesc'
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await GET(request, { params });
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe('<html><body>Test Template</body></html>');
      expect(localTemplateService.getProcessedTemplate).toHaveBeenCalledWith(
        'test-template',
        expect.objectContaining({
          name: 'MyBusiness',
          description: 'TestDesc',
        })
      );
    });

    it('should use default values when query params are missing', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html><body>Default</body></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview'
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(localTemplateService.getProcessedTemplate).toHaveBeenCalledWith(
        'test-template',
        expect.objectContaining({
          name: 'Your Business Name',
          description: 'Your business description',
          targetUsers: 'your target customers',
          businessGoals: 'your business goals',
          slug: 'your-business',
        })
      );
    });

    it('should return 500 on template processing error', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockRejectedValue(
        new Error('Template processing failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview'
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate preview');
      expect(data.message).toBe('Template processing failed');
    });

    it('should set correct headers', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview'
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await GET(request, { params });

      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe('POST /api/templates/[templateId]/preview', () => {
    it('should return 404 when template does not exist', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/templates/non-existent/preview',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test',
            description: 'Test Description',
          }),
        }
      );
      const params = Promise.resolve({ templateId: 'non-existent' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Template not found');
    });

    it('should process template with POST body data', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html><body>Custom Template</body></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Custom Business',
            description: 'Custom Description',
            targetUsers: 'Custom Users',
            businessGoals: 'Custom Goals',
            slug: 'custom-slug',
          }),
        }
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await POST(request, { params });
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe('<html><body>Custom Template</body></html>');
      expect(localTemplateService.getProcessedTemplate).toHaveBeenCalledWith(
        'test-template',
        {
          name: 'Custom Business',
          description: 'Custom Description',
          targetUsers: 'Custom Users',
          businessGoals: 'Custom Goals',
          slug: 'custom-slug',
        }
      );
    });

    it('should use default values for missing POST body fields', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html><body>Partial</body></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Partial Business',
          }),
        }
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      expect(localTemplateService.getProcessedTemplate).toHaveBeenCalledWith(
        'test-template',
        expect.objectContaining({
          name: 'Partial Business',
          description: 'Your business description',
          targetUsers: 'your target customers',
          businessGoals: 'your business goals',
          slug: 'your-business',
        })
      );
    });

    it('should return 500 on POST processing error', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockRejectedValue(
        new Error('POST processing failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        }
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate preview');
      expect(data.message).toBe('POST processing failed');
    });

    it('should handle empty POST body', async () => {
      vi.mocked(localTemplateService.templateExists).mockResolvedValue(true);
      vi.mocked(localTemplateService.getProcessedTemplate).mockResolvedValue(
        '<html><body>Empty Body</body></html>'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/templates/test-template/preview',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const params = Promise.resolve({ templateId: 'test-template' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      expect(localTemplateService.getProcessedTemplate).toHaveBeenCalledWith(
        'test-template',
        expect.objectContaining({
          name: 'Your Business Name',
          description: 'Your business description',
        })
      );
    });
  });
});
