interface GoDaddyDomainAvailability {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  period?: number;
}

interface GoDaddyDomainSuggestion {
  domain: string;
  exact: boolean;
}

class GoDaddyService {
  private static readonly API_BASE = 'https://api.godaddy.com';
  private static readonly OTE_API_BASE = 'https://api.ote-godaddy.com'; // Test environment
  private static readonly API_KEY = process.env.GODADDY_API_KEY;
  private static readonly API_SECRET = process.env.GODADDY_API_SECRET;
  private static readonly USE_PRODUCTION =
    process.env.GODADDY_USE_PRODUCTION === 'true';

  /**
   * Check if GoDaddy API is properly configured
   */
  static isConfigured(): boolean {
    return !!(this.API_KEY && this.API_SECRET);
  }

  /**
   * Get API base URL based on environment
   */
  private static getBaseUrl(): string {
    return this.USE_PRODUCTION ? this.API_BASE : this.OTE_API_BASE;
  }

  /**
   * Get authorization header for GoDaddy API
   */
  private static getAuthHeader(): string {
    if (!this.API_KEY || !this.API_SECRET) {
      throw new Error('GoDaddy API credentials not configured');
    }
    return `sso-key ${this.API_KEY}:${this.API_SECRET}`;
  }

  /**
   * Check if a single domain is available for registration
   */
  static async checkDomainAvailability(
    domain: string
  ): Promise<GoDaddyDomainAvailability> {
    if (!this.isConfigured()) {
      throw new Error('GoDaddy API not configured');
    }

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v1/domains/available?domain=${encodeURIComponent(
          domain
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 403) {
        throw new Error(
          'GoDaddy API access denied. Requires 50+ domains in account.'
        );
      }

      if (!response.ok) {
        throw new Error(
          `GoDaddy API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        domain: domain,
        available: data.available === true,
      };
    } catch (error) {
      console.error('GoDaddy domain availability check failed:', error);
      throw error;
    }
  }

  /**
   * Check availability for multiple domains at once
   */
  static async checkMultipleDomainAvailability(
    domains: string[]
  ): Promise<GoDaddyDomainAvailability[]> {
    if (!this.isConfigured()) {
      throw new Error('GoDaddy API not configured');
    }

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v1/domains/available`,
        {
          method: 'POST',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(domains),
        }
      );

      if (response.status === 403) {
        throw new Error(
          'GoDaddy API access denied. Requires 50+ domains in account.'
        );
      }

      if (!response.ok) {
        throw new Error(
          `GoDaddy API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      return data.map((item: { domain: string; available: boolean }) => ({
        domain: item.domain,
        available: item.available === true,
      }));
    } catch (error) {
      console.error('GoDaddy bulk domain availability check failed:', error);
      throw error;
    }
  }

  /**
   * Get domain suggestions based on a keyword
   */
  static async getDomainSuggestions(
    query: string,
    limit: number = 10
  ): Promise<GoDaddyDomainSuggestion[]> {
    if (!this.isConfigured()) {
      throw new Error('GoDaddy API not configured');
    }

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v1/domains/suggest?query=${encodeURIComponent(
          query
        )}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 403) {
        throw new Error(
          'GoDaddy API access denied. Requires 50+ domains in account.'
        );
      }

      if (!response.ok) {
        throw new Error(
          `GoDaddy API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      return data.map((item: { domain: string; exact: boolean }) => ({
        domain: item.domain,
        exact: item.exact === true,
      }));
    } catch (error) {
      console.error('GoDaddy domain suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Generate purchase URL for GoDaddy
   */
  static getGoDaddyPurchaseUrl(domain: string): string {
    const cleanDomain = encodeURIComponent(domain);
    return `https://www.godaddy.com/domains/searchresults.aspx?checkAvail=1&domainToCheck=${cleanDomain}`;
  }

  /**
   * Test if API access is available (requires 50+ domains)
   */
  static async testApiAccess(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const uniqueDomain = `test-api-access-${Date.now()}.com`;
      await this.checkDomainAvailability(uniqueDomain);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('50+ domains')) {
        return false;
      }
      // Other errors might still mean API access is available
      return true;
    }
  }

  /**
   * Format price with currency and period
   */
  static formatPrice(
    price: number,
    currency: string = 'USD',
    period: number = 1
  ): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
    return period > 1 ? `${formatted}/${period}yr` : `${formatted}/yr`;
  }
}

export default GoDaddyService;
