/**
 * Google Analytics Admin API Helper
 * Fetches GA4 properties and account information
 */

export interface GA4Property {
  name: string; // Format: properties/123456789
  propertyId: string; // Extracted numeric ID: 123456789
  displayName: string;
  timeZone: string;
  currencyCode: string;
  createTime: string;
  measurementId?: string; // GA4 Measurement ID like G-XXXXXXXXXX
}

export interface GA4Account {
  name: string; // Format: accounts/123456
  displayName: string;
  regionCode: string;
  createTime: string;
}

type AccountsResponse = {
  accounts?: GA4Account[];
};

type ApiProperty = Omit<GA4Property, 'propertyId' | 'measurementId'>;

type PropertiesResponse = {
  properties?: ApiProperty[];
};

type DataStream = {
  type?: string;
  webStreamData?: {
    measurementId?: string;
  };
};

type DataStreamsResponse = {
  dataStreams?: DataStream[];
};

/**
 * Fetch all GA4 accounts the user has access to
 */
export async function fetchGA4Accounts(
  accessToken: string
): Promise<GA4Account[]> {
  try {
    const response = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch GA4 accounts:', errorText);
      return [];
    }

    const data = (await response.json()) as AccountsResponse;
    return data.accounts || [];
  } catch (error) {
    console.error('Error fetching GA4 accounts:', error);
    return [];
  }
}

/**
 * Fetch all GA4 properties for a specific account
 */
export async function fetchGA4PropertiesForAccount(
  accessToken: string,
  accountName: string
): Promise<GA4Property[]> {
  try {
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${accountName}/properties`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch GA4 properties for ${accountName}:`,
        errorText
      );
      return [];
    }

    const data = (await response.json()) as PropertiesResponse;
    const properties = data.properties || [];

    // Extract property IDs and fetch data streams to get measurement IDs
    return await Promise.all(
      properties.map(async (property) => {
        const propertyId = property.name.split('/')[1]; // Extract ID from "properties/123456789"

        // Fetch data streams to get measurement ID
        const measurementId = await fetchMeasurementId(
          accessToken,
          property.name
        );

        return {
          name: property.name,
          propertyId,
          displayName: property.displayName,
          timeZone: property.timeZone,
          currencyCode: property.currencyCode,
          createTime: property.createTime,
          measurementId,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching GA4 properties:', error);
    return [];
  }
}

/**
 * Fetch measurement ID (G-XXXXXXXXXX) for a property
 */
async function fetchMeasurementId(
  accessToken: string,
  propertyName: string
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${propertyName}/dataStreams`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as DataStreamsResponse;
    const dataStreams = data.dataStreams || [];

    // Find web data stream (type: WEB_DATA_STREAM)
    const webStream = dataStreams.find(
      (stream) => stream.type === 'WEB_DATA_STREAM' || stream.webStreamData
    );

    return webStream?.webStreamData?.measurementId;
  } catch (error) {
    console.error('Error fetching measurement ID:', error);
    return undefined;
  }
}

/**
 * Fetch all GA4 properties across all accounts the user has access to
 */
export async function fetchAllGA4Properties(
  accessToken: string
): Promise<GA4Property[]> {
  try {
    // First, get all accounts
    const accounts = await fetchGA4Accounts(accessToken);

    if (accounts.length === 0) {
      return [];
    }

    // Then, fetch properties for each account
    const propertiesPromises = accounts.map((account) =>
      fetchGA4PropertiesForAccount(accessToken, account.name)
    );

    const propertiesArrays = await Promise.all(propertiesPromises);

    // Flatten the array of arrays
    return propertiesArrays.flat();
  } catch (error) {
    console.error('Error fetching all GA4 properties:', error);
    return [];
  }
}
