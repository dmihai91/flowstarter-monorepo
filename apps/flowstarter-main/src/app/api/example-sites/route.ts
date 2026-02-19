import { exampleSites } from '@/data/example-sites';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    let sites = [...exampleSites];

    // Filter by category
    if (category && category !== 'all') {
      sites = sites.filter((site) => site.category === category);
    }

    // Filter by industry
    if (industry && industry !== 'All Industries') {
      sites = sites.filter((site) => site.industry === industry);
    }

    // Filter by featured
    if (featured === 'true') {
      sites = sites.filter((site) => site.isFeatured);
    }

    // Filter by search query (client-side for text search)
    if (search) {
      const searchLower = search.toLowerCase();
      sites = sites.filter(
        (site) =>
          site.name.toLowerCase().includes(searchLower) ||
          site.description.toLowerCase().includes(searchLower) ||
          site.industry.toLowerCase().includes(searchLower) ||
          site.features.some((feature) =>
            feature.toLowerCase().includes(searchLower)
          )
      );
    }

    // Sort: featured first, then by views (if available)
    sites.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.stats?.views || 0) - (a.stats?.views || 0);
    });

    // Get unique categories and industries
    const uniqueCategories = Array.from(
      new Set(exampleSites.map((s) => s.category))
    ).sort();
    const uniqueIndustries = Array.from(
      new Set(exampleSites.map((s) => s.industry))
    ).sort();

    const categories = [
      { value: 'all', label: 'All Categories' },
      ...uniqueCategories.map((cat) => ({ value: cat, label: cat })),
    ];

    const industries = ['All Industries', ...uniqueIndustries];

    return NextResponse.json({
      sites,
      total: sites.length,
      categories,
      industries,
    });
  } catch (error) {
    console.error('Error fetching example sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch example sites' },
      { status: 500 }
    );
  }
}
