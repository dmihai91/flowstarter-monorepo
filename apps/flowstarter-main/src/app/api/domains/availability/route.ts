import GoDaddyService from '@/lib/godaddy-service';
import { createSupabaseServerClient } from '@/supabase-clients/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface DomainAvailabilityResult {
  domain: string;
  isAvailable: boolean;
  error?: string;
  registrarInfo?: {
    name: string;
    website: string;
    note: string;
  };
  isFlowstarterSubdomain?: boolean;
  conflictingProjects?: Array<{
    id: string;
    name: string;
    domain: string;
  }>;
}

interface DomainSuggestion {
  domain: string;
  isAvailable: boolean;
  tld: string;
  note: string;
  isFlowstarterSubdomain?: boolean;
}

class DomainAvailabilityService {
  private static readonly API_KEY = process.env.WHOIS_API_KEY;
  private static readonly API_ENDPOINT = 'https://api.apilayer.com/whois/query';

  // Check if domain is a flowstarter.io subdomain
  private static isFlowstarterSubdomain(domain: string): boolean {
    return domain.endsWith('.flowstarter.io') && domain !== 'flowstarter.io';
  }

  // Check flowstarter.io subdomain availability in database
  private static async checkFlowstarterSubdomain(
    domain: string
  ): Promise<DomainAvailabilityResult> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return {
          domain,
          isAvailable: false,
          error: 'Authentication required to check flowstarter.io subdomains',
          isFlowstarterSubdomain: true,
        };
      }

      const supabase = createSupabaseServerClient();

      // Check if subdomain is already taken
      // Handle case where domain_name column might not exist yet
      let existingProjects: Array<{
        id: string;
        name: string;
        domain_name: string | null;
      }> = [];
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, domain_name')
          .eq('domain_name', domain);

        if (error) {
          // If domain_name column doesn't exist, assume domain is available
          if (error.code === '42703') {
            console.warn(
              'domain_name column does not exist yet, assuming domain is available'
            );
            return {
              domain,
              isAvailable: true,
              isFlowstarterSubdomain: true,
              conflictingProjects: [],
            };
          } else {
            console.error(
              'Database error checking flowstarter subdomain:',
              error
            );
            return {
              domain,
              isAvailable: false,
              error: 'Failed to check subdomain availability',
              isFlowstarterSubdomain: true,
            };
          }
        }

        existingProjects = data || [];
      } catch (error) {
        console.warn(
          'Error checking flowstarter subdomain, likely column does not exist:',
          error
        );
        // Assume domain is available if we can't check
        return {
          domain,
          isAvailable: true,
          isFlowstarterSubdomain: true,
          conflictingProjects: [],
        };
      }

      const isAvailable = !existingProjects || existingProjects.length === 0;

      return {
        domain,
        isAvailable,
        isFlowstarterSubdomain: true,
        conflictingProjects:
          existingProjects?.map((p) => ({
            id: p.id,
            name: p.name,
            domain: p.domain_name || '',
          })) || [],
      };
    } catch (error) {
      console.error('Error checking flowstarter subdomain:', error);
      return {
        domain,
        isAvailable: true, // Optimistic fallback
        error: 'Internal error checking subdomain',
        isFlowstarterSubdomain: true,
      };
    }
  }

  static async checkAvailability(
    domain: string,
    userEmail?: string,
    userCountry?: string
  ): Promise<DomainAvailabilityResult> {
    if (!domain || typeof domain !== 'string') {
      return {
        domain,
        isAvailable: false,
        error: 'Invalid domain provided',
      };
    }

    const cleanDomain = domain.trim().toLowerCase();
    const isRoDomain = cleanDomain.endsWith('.ro');
    const prefersRoTLD = isRoDomain && userCountry?.toUpperCase?.() === 'RO';

    // Check if it's a flowstarter.io subdomain
    if (this.isFlowstarterSubdomain(cleanDomain)) {
      return this.checkFlowstarterSubdomain(cleanDomain);
    }

    // For external domains, use existing logic
    // Try GoDaddy API first if configured (unless we prefer RoTLD UI path)
    if (GoDaddyService.isConfigured() && !prefersRoTLD) {
      try {
        const godaddyResult = await GoDaddyService.checkDomainAvailability(
          cleanDomain
        );

        return {
          domain: cleanDomain,
          isAvailable: godaddyResult.available,
          registrarInfo: {
            name: 'GoDaddy',
            website: GoDaddyService.getGoDaddyPurchaseUrl(cleanDomain),
            note: 'Check pricing and register on GoDaddy',
          },
        };
      } catch (error) {
        console.error('GoDaddy API failed, falling back to WHOIS:', error);
        // Continue to WHOIS fallback
      }
    }

    // Fallback to WHOIS API or default behavior
    if (!this.API_KEY) {
      return {
        domain: cleanDomain,
        isAvailable: true, // Optimistic assumption for UX
        error:
          'Domain availability check not configured. You can verify availability manually.',
        registrarInfo: prefersRoTLD
          ? {
              name: 'RoTLD',
              website: `https://www.rotld.ro/?domain=${encodeURIComponent(
                cleanDomain
              )}`,
              note: 'Cumpără și administrează domenii .ro la RoTLD',
            }
          : {
              name: 'GoDaddy',
              website: GoDaddyService.getGoDaddyPurchaseUrl(cleanDomain),
              note: 'Check pricing and register on GoDaddy',
            },
      };
    }

    try {
      // Use WHOIS API to check domain availability
      const response = await fetch(
        `${this.API_ENDPOINT}?domain=${encodeURIComponent(cleanDomain)}`,
        {
          headers: {
            apikey: this.API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // If domain has no registrar info, it's likely available
      let isAvailable =
        !data.registrar ||
        data.status === 'No Match' ||
        data.status === 'Available';

      // Ownership heuristic: if the domain appears registered but the WHOIS
      // payload contains the signed-in user's email, treat it as available to them
      if (!isAvailable && userEmail) {
        try {
          const haystack = JSON.stringify(data || {}).toLowerCase();
          const email = String(userEmail).toLowerCase();
          if (email && haystack.includes(email)) {
            isAvailable = true;
          }
        } catch (_) {
          // ignore parsing errors and fall back to original value
        }
      }

      return {
        domain: cleanDomain,
        isAvailable,
        registrarInfo: prefersRoTLD
          ? {
              name: 'RoTLD',
              website: `https://www.rotld.ro/?domain=${encodeURIComponent(
                cleanDomain
              )}`,
              note: 'Cumpără și administrează domenii .ro la RoTLD',
            }
          : {
              name: 'GoDaddy',
              website: GoDaddyService.getGoDaddyPurchaseUrl(cleanDomain),
              note: 'Check pricing and register on GoDaddy',
            },
      };
    } catch (error) {
      console.error('Domain availability check failed:', error);

      // Fallback: assume domain might be available and offer purchase link
      return {
        domain: cleanDomain,
        isAvailable: true, // Optimistic assumption for UX
        error:
          'Could not verify availability, but you can check with registrar',
        registrarInfo: prefersRoTLD
          ? {
              name: 'RoTLD',
              website: `https://www.rotld.ro/?domain=${encodeURIComponent(
                cleanDomain
              )}`,
              note: 'Cumpără și administrează domenii .ro la RoTLD',
            }
          : {
              name: 'GoDaddy',
              website: GoDaddyService.getGoDaddyPurchaseUrl(cleanDomain),
              note: 'Check pricing and register on GoDaddy',
            },
      };
    }
  }

  static async generateDomainSuggestions(
    baseName: string
  ): Promise<DomainSuggestion[]> {
    const cleanBaseName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suggestions: DomainSuggestion[] = [];

    try {
      // Add flowstarter.io subdomain suggestions first
      const { userId } = await auth();
      if (userId) {
        const supabase = createSupabaseServerClient();

        // Primary flowstarter.io suggestion (only base name, no variants)
        const primaryFlowstarterDomain = `${cleanBaseName}.flowstarter.io`;

        try {
          const { data: primaryExists, error } = await supabase
            .from('projects')
            .select('id')
            .eq('domain_name', primaryFlowstarterDomain)
            .single();

          // Check if domain_name column exists
          if (error?.code === '42703') {
            console.warn(
              'domain_name column does not exist yet, adding all flowstarter suggestions'
            );
            // Add primary suggestion since we can't check availability
            suggestions.push({
              domain: primaryFlowstarterDomain,
              isAvailable: true,
              tld: 'flowstarter.io',
              note: 'Free hosted subdomain',
              isFlowstarterSubdomain: true,
            });
          } else if (!primaryExists) {
            suggestions.push({
              domain: primaryFlowstarterDomain,
              isAvailable: true,
              tld: 'flowstarter.io',
              note: 'Free hosted subdomain',
              isFlowstarterSubdomain: true,
            });
          }
        } catch (error) {
          console.warn(
            'Error checking flowstarter domain availability, adding default suggestions:',
            error
          );
          // Add default suggestions if we can't check (primary only)
          suggestions.push({
            domain: primaryFlowstarterDomain,
            isAvailable: true,
            tld: 'flowstarter.io',
            note: 'Free hosted subdomain',
            isFlowstarterSubdomain: true,
          });
        }
      }
    } catch (error) {
      console.error('Error generating flowstarter.io suggestions:', error);
    }

    // Try GoDaddy API for external domains if configured
    if (GoDaddyService.isConfigured()) {
      try {
        const godaddySuggestions = await GoDaddyService.getDomainSuggestions(
          cleanBaseName,
          8
        );

        // Only include exact base name matches (no prefixes/suffixes/hyphens)
        const filtered = godaddySuggestions
          .map((s) => s.domain.toLowerCase())
          .filter((d) => d.split('.')[0] === cleanBaseName)
          .map((domain) => ({
            domain,
            isAvailable: true,
            tld: domain.split('.').pop() || 'com',
            note: domain.endsWith('.ro')
              ? 'See pricing on RoTLD'
              : 'See pricing on GoDaddy',
            isFlowstarterSubdomain: false,
          }));

        suggestions.push(...filtered);
      } catch (error) {
        console.error(
          'GoDaddy suggestions failed, falling back to static list:',
          error
        );
      }
    }

    // Enhanced fallback suggestions for external domains
    if (suggestions.filter((s) => !s.isFlowstarterSubdomain).length === 0) {
      const primaryTlds = [
        '.com',
        '.net',
        '.org',
        '.io',
        '.co',
        '.ai',
        '.ro',
        '.app',
        '.dev',
        '.tech',
        '.shop',
        '.store',
        '.site',
        '.online',
        '.xyz',
        '.me',
        '.us',
        '.biz',
        '.info',
        '.pro',
      ];

      for (const tld of primaryTlds) {
        const domain = `${cleanBaseName}${tld}`;
        suggestions.push({
          domain,
          isAvailable: true, // Will be verified when clicked
          tld: tld.substring(1),
          note:
            tld === '.ro' ? 'See pricing on RoTLD' : 'See pricing on GoDaddy',
          isFlowstarterSubdomain: false,
        });
      }
    }

    // Remove duplicates and return balanced mix (prioritize flowstarter.io)
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, self) =>
        index === self.findIndex((s) => s.domain === suggestion.domain)
    );

    const flowstarterSuggestions = uniqueSuggestions
      .filter((s) => s.isFlowstarterSubdomain)
      .slice(0, 1); // only primary subdomain

    // Build external suggestions and always include/priority .ro
    const externalAll = uniqueSuggestions.filter(
      (s) => !s.isFlowstarterSubdomain
    );

    const hasRo = externalAll.some(
      (s) => s.tld === 'ro' || s.domain.endsWith('.ro')
    );
    if (!hasRo && cleanBaseName) {
      externalAll.unshift({
        domain: `${cleanBaseName}.ro`,
        isAvailable: true,
        tld: 'ro',
        note: 'See pricing on RoTLD',
        isFlowstarterSubdomain: false,
      });
    }

    const externalSuggestions = externalAll
      .sort((a, b) => (a.tld === 'ro' ? -1 : b.tld === 'ro' ? 1 : 0))
      .slice(0, 15);

    return [...flowstarterSuggestions, ...externalSuggestions].slice(0, 16);
  }

  static async checkMultipleDomains(
    domains: string[]
  ): Promise<DomainAvailabilityResult[]> {
    // Separate flowstarter.io domains from external domains
    const flowstarterDomains = domains.filter((d) =>
      this.isFlowstarterSubdomain(d)
    );
    const externalDomains = domains.filter(
      (d) => !this.isFlowstarterSubdomain(d)
    );

    const results: DomainAvailabilityResult[] = [];

    // Check flowstarter.io domains
    for (const domain of flowstarterDomains) {
      const result = await this.checkFlowstarterSubdomain(domain);
      results.push(result);
    }

    // Check external domains
    if (externalDomains.length > 0) {
      // Try GoDaddy bulk check if configured
      if (GoDaddyService.isConfigured()) {
        try {
          const godaddyResults =
            await GoDaddyService.checkMultipleDomainAvailability(
              externalDomains
            );

          const externalResults = godaddyResults.map((result) => ({
            domain: result.domain,
            isAvailable: result.available,
            registrarInfo: {
              name: 'GoDaddy',
              website: GoDaddyService.getGoDaddyPurchaseUrl(result.domain),
              note: 'Check pricing and register on GoDaddy',
            },
          }));

          results.push(...externalResults);
        } catch (error) {
          console.error(
            'GoDaddy bulk check failed, falling back to individual checks:',
            error
          );
          // Fallback to individual checks for external domains
          const individualResults = await Promise.all(
            externalDomains.map((domain) => this.checkAvailability(domain))
          );
          results.push(...individualResults);
        }
      } else {
        // Fallback to individual checks
        const individualResults = await Promise.all(
          externalDomains.map((domain) => this.checkAvailability(domain))
        );
        results.push(...individualResults);
      }
    }

    return results;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, domains, generateSuggestions, baseName } = body;

    // Resolve current user's email (if any)
    let userEmail: string | undefined;
    try {
      const user = await currentUser();
      // Clerk user can have primaryEmailAddress or emailAddresses array
      const primary = (
        user as { primaryEmailAddress?: { emailAddress?: string } } | null
      )?.primaryEmailAddress?.emailAddress;
      const first = (
        user as { emailAddresses?: Array<{ emailAddress?: string }> } | null
      )?.emailAddresses?.[0]?.emailAddress;
      userEmail = primary || first || undefined;
    } catch (_) {
      // ignore
    }

    // Detect user country from cookie (set in middleware)
    const userCountry = request.cookies.get('fs_country')?.value;

    // Handle single domain check
    if (domain) {
      const result = await DomainAvailabilityService.checkAvailability(
        domain,
        userEmail,
        userCountry
      );
      return NextResponse.json(result);
    }

    // Handle multiple domains check
    if (domains && Array.isArray(domains)) {
      const results = await DomainAvailabilityService.checkMultipleDomains(
        domains
      );
      return NextResponse.json({ results });
    }

    // Handle domain suggestions generation
    if (generateSuggestions && baseName) {
      const suggestions =
        await DomainAvailabilityService.generateDomainSuggestions(baseName);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Provide domain, domains, or generateSuggestions with baseName.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Domain availability API error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const baseName = searchParams.get('baseName');
  const generateSuggestions =
    searchParams.get('generateSuggestions') === 'true';

  try {
    // Handle single domain check
    if (domain) {
      const result = await DomainAvailabilityService.checkAvailability(domain);
      return NextResponse.json(result);
    }

    // Handle domain suggestions generation
    if (generateSuggestions && baseName) {
      const suggestions =
        await DomainAvailabilityService.generateDomainSuggestions(baseName);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Provide domain or generateSuggestions with baseName.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Domain availability API error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
