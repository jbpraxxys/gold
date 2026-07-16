import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

interface TinyFishSearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
  date?: string;
}

interface TinyFishAPIResponse {
  query: string;
  results: TinyFishSearchResult[];
  total_results: number;
  page: number;
}

interface MockProperty {
  name: string;
  type: string;
  location: string;
  price: string;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  price_per_sqm: string;
  amenities: string[];
  description: string;
}

let mockDataCache: MockProperty[] | null = null;

async function loadMockData(): Promise<MockProperty[]> {
  if (mockDataCache) return mockDataCache;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const mockPath = resolve(__dirname, '../data/mock-properties.json');
  const raw = await readFile(mockPath, 'utf-8');
  mockDataCache = JSON.parse(raw) as MockProperty[];
  return mockDataCache;
}

function searchMockData(query: string, properties: MockProperty[]): string {
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/);

  const scored = properties
    .map((p) => {
      const searchText = [
        p.name,
        p.type,
        p.location,
        p.description,
        ...p.amenities,
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (searchText.includes(term)) score += 1;
        if (p.name.toLowerCase().includes(term)) score += 3;
        if (p.location.toLowerCase().includes(term)) score += 2;
      }
      return { property: p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return formatMockResults(properties, true);
  }

  return formatMockResults(
    scored.slice(0, 5).map((s) => s.property),
    false,
  );
}

function formatMockResults(
  properties: MockProperty[],
  isFallback: boolean,
): string {
  const header = isFallback
    ? '⚠️ No matching properties found in mock database. Showing all available properties:\n\n'
    : '📋 Property Search Results (Mock Data):\n\n';

  const body = properties
    .map(
      (p) =>
        `🏠 ${p.name}\n` +
        `   Type: ${p.type}\n` +
        `   Location: ${p.location}\n` +
        `   Price: ${p.price}\n` +
        `   Floor Area: ${p.sqm} sqm | Price/sqm: ${p.price_per_sqm}\n` +
        `   Bedrooms: ${p.bedrooms} | Bathrooms: ${p.bathrooms}\n` +
        `   Amenities: ${p.amenities.join(', ')}\n` +
        `   Description: ${p.description}\n`,
    )
    .join('\n');

  const footer =
    '\n⚠️ Note: Results are from internal mock data. For live, current listings, please contact a TopRealty agent or visit our website.';

  return header + body + footer;
}

async function searchWithTinyFish(query: string): Promise<string> {
  const apiKey = process.env.TINYFISH_API_KEY;

  if (!apiKey) {
    throw new Error('TINYFISH_API_KEY not configured');
  }

  const url = new URL('https://api.search.tinyfish.ai');
  url.searchParams.set('query', `${query} real estate Philippines`);
  url.searchParams.set('language', 'en');
  url.searchParams.set('location', 'PH');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`TinyFish API returned status ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return 'No results found from web search.';
  }

  return data.results
    .map(
      (r, i) =>
        `**${i + 1}. ${r.title}**\n` +
        `URL: ${r.url}\n` +
        `${r.snippet}\n`,
    )
    .join('\n');
}

/**
 * Search the web for Philippine real estate data.
 *
 * Uses the TinyFish API when TINYFISH_API_KEY is configured.
 * Falls back to local mock data when the API key is unavailable or the call fails.
 *
 * @param query - The search query string
 * @returns Formatted search results as a string
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    const result = await searchWithTinyFish(query);
    return `🌐 Live Web Search Results:\n\n${result}`;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.warn(
      `[searchWeb] TinyFish API unavailable (${errorMessage}). Falling back to mock data.`,
    );
  }

  // Fallback to mock data
  const mockData = await loadMockData();
  const results = searchMockData(query, mockData);
  return results;
}
