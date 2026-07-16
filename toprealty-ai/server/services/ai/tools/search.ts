import { searchWeb } from '../../../utils/tinyfish';

export interface SearchWebInput {
  query: string;
}

export interface SearchWebOutput {
  results: string;
  source: 'live' | 'mock';
  timestamp: string;
}

/**
 * Execute a web search for Philippine real estate data.
 *
 * Attempts live search via TinyFish API first; falls back to local mock data
 * when the API is unavailable or not configured.
 */
export async function executeSearchWeb(
  input: SearchWebInput,
): Promise<SearchWebOutput> {
  const hasApiKey = Boolean(process.env.TINYFISH_API_KEY);

  if (!hasApiKey) {
    console.log('[search_web] No TINYFISH_API_KEY configured. Using mock data.');
  }

  const results = await searchWeb(input.query);

  const source = results.startsWith('🌐 Live Web Search Results')
    ? 'live'
    : 'mock';

  if (source === 'mock') {
    const note =
      '\n\n📝 Note: These results are from an internal mock database. ' +
      'Live web search is not configured (no TINYFISH_API_KEY). ' +
      'Data may not reflect current market listings. Encourage the client to ' +
      'contact a TopRealty agent for the latest available properties.';

    return {
      results: results + note,
      source: 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    results,
    source: 'live',
    timestamp: new Date().toISOString(),
  };
}
