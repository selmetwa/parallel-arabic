import { supabase } from '$lib/supabaseClient';

/**
 * Make an authenticated API request with Supabase auth token
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  // Add auth header to the request
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * POST request with authentication
 * @param url - API endpoint URL
 * @param data - Data to send in request body
 * @returns Promise<Response>
 */
export async function authenticatedPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * GET request with authentication
 * @param url - API endpoint URL
 * @returns Promise<Response>
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'GET',
  });
}

/**
 * Increment sentences viewed (example usage)
 */
export async function incrementSentencesViewed(): Promise<number> {
  try {
    const response = await authenticatedPost('/api/increment-sentences', {});
    
    if (!response.ok) {
      throw new Error('Failed to increment sentences viewed');
    }
    
    const data = await response.json();
    return data.sentencesViewed;
  } catch (error) {
    console.error('Error incrementing sentences viewed:', error);
    throw error;
  }
}

/**
 * Increment tenses viewed (example usage)
 */
export async function incrementTensesViewed(): Promise<number> {
  try {
    const response = await authenticatedPost('/api/increment_tenses_viewed', {});
    
    if (!response.ok) {
      throw new Error('Failed to increment tenses viewed');
    }
    
    const data = await response.json();
    return data.tensesViewed;
  } catch (error) {
    console.error('Error incrementing tenses viewed:', error);
    throw error;
  }
}
