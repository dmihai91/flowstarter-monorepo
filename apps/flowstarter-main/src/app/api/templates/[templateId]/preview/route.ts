import { localTemplateService } from '@/lib/templates/local-template-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Get project data from query params
  const projectData = {
    name: searchParams.get('name') || 'Your Business Name',
    description: searchParams.get('description') || 'Your business description',
    targetUsers: searchParams.get('targetUsers') || 'your target customers',
    businessGoals: searchParams.get('goals') || 'your business goals',
    slug: searchParams.get('slug') || 'your-business',
  };

  try {
    // Check if template exists
    const exists = await localTemplateService.templateExists(templateId);
    if (!exists) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 }
      );
    }

    // Get processed template
    const processedContent = await localTemplateService.getProcessedTemplate(
      templateId,
      projectData
    );

    // Return as HTML (for iframe embedding)
    return new NextResponse(processedContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const body = await request.json();
    const projectData = {
      name: body.name || 'Your Business Name',
      description: body.description || 'Your business description',
      targetUsers: body.targetUsers || 'your target customers',
      businessGoals: body.businessGoals || 'your business goals',
      slug: body.slug || 'your-business',
    };

    // Check if template exists
    const exists = await localTemplateService.templateExists(templateId);
    if (!exists) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 }
      );
    }

    // Get processed template
    const processedContent = await localTemplateService.getProcessedTemplate(
      templateId,
      projectData
    );

    return new NextResponse(processedContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
