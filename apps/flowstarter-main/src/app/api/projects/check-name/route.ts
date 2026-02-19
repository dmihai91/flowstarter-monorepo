import { createSupabaseServerClient } from '@/supabase-clients/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectName } = body;

    if (!projectName || typeof projectName !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Convert project name to domain-friendly format (same logic as in DomainConfiguration)
    const domainFriendlyName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50); // Limit length

    const flowstarterDomain = `${domainFriendlyName}.flowstarter.io`;
    const altFlowstarterDomain = `${projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}.flowstarter.io`;

    // Check if any project has this exact name
    const { data: nameMatches, error: nameError } = await supabase
      .from('projects')
      .select('id, name')
      .ilike('name', projectName);

    if (nameError) {
      console.error('Database error checking project name:', nameError);
      return NextResponse.json(
        {
          error: 'Failed to check project name availability',
          details: nameError.message,
        },
        { status: 500 }
      );
    }

    // Try to check domain names if the column exists
    let domainMatches: Array<{
      id: string;
      name: string;
      domain_name?: string | null;
    }> = [];
    try {
      const { data, error: domainError } = await supabase
        .from('projects')
        .select('id, name, domain_name')
        .in('domain_name', [flowstarterDomain, altFlowstarterDomain]);

      if (domainError) {
        // If domain_name column doesn't exist, log but don't fail
        if (domainError.code === '42703') {
          console.warn(
            'domain_name column does not exist yet, skipping domain check'
          );
          domainMatches = [];
        } else {
          console.error('Database error checking domain name:', domainError);
          return NextResponse.json(
            {
              error: 'Failed to check domain name availability',
              details: domainError.message,
            },
            { status: 500 }
          );
        }
      } else {
        domainMatches = data || [];
      }
    } catch (error) {
      console.warn(
        'Error checking domain names, likely column does not exist:',
        error
      );
      domainMatches = [];
    }

    // Combine results and remove duplicates
    const existingProjects: Array<{
      id: string;
      name: string;
      domain_name?: string | null;
    }> = [
      ...(nameMatches || []).map((p) => ({
        ...p,
        domain_name: undefined as string | null | undefined,
      })),
      ...domainMatches,
    ].filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
    );

    const isNameTaken = existingProjects && existingProjects.length > 0;
    const suggestedDomain = `${domainFriendlyName}.flowstarter.io`;

    // If name is taken, suggest alternatives
    let suggestions: string[] = [];
    if (isNameTaken) {
      const baseNames = [
        `${domainFriendlyName}-app`,
        `${domainFriendlyName}-platform`,
        `${domainFriendlyName}-hub`,
        `${domainFriendlyName}-site`,
        `my-${domainFriendlyName}`,
        `get-${domainFriendlyName}`,
        `${domainFriendlyName}-pro`,
      ];

      // Only check domain suggestions if domain_name column exists
      try {
        for (const baseName of baseNames) {
          try {
            const { data: existing, error } = await supabase
              .from('projects')
              .select('id')
              .eq('domain_name', `${baseName}.flowstarter.io`)
              .single();

            // If no data found (.single() with no results), suggestion is available
            if (!existing && error?.code === 'PGRST116') {
              suggestions.push(`${baseName}.flowstarter.io`);
            }
          } catch (error: unknown) {
            // If domain_name column doesn't exist, add all suggestions
            if (
              error &&
              typeof error === 'object' &&
              'code' in error &&
              error.code === '42703'
            ) {
              suggestions.push(`${baseName}.flowstarter.io`);
            } else {
              // Ignore other errors for individual suggestions
              console.warn(`Error checking suggestion ${baseName}:`, error);
            }
          }
        }
      } catch (error) {
        // If we can't check domains, provide default suggestions
        console.warn(
          'Cannot check domain suggestions, providing defaults:',
          error
        );
        suggestions = baseNames.map((name) => `${name}.flowstarter.io`);
      }

      // Limit to 5 suggestions
      suggestions = suggestions.slice(0, 5);
    }

    return NextResponse.json({
      projectName,
      isAvailable: !isNameTaken,
      suggestedDomain: isNameTaken ? null : suggestedDomain,
      domainFriendlyName,
      suggestions,
      conflictingProjects:
        existingProjects?.map((p) => ({
          id: p.id,
          name: p.name,
          domain: p.domain_name || null,
        })) || [],
    });
  } catch (error) {
    console.error('Project name check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectName = searchParams.get('projectName');

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name parameter is required' },
        { status: 400 }
      );
    }

    // Create a mock request for the POST handler
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectName }),
    });

    return await POST(mockRequest);
  } catch (error) {
    console.error('Project name check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
