import { supabase } from "../lib/supabase";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Send a request to the FastAPI backend with the current
 * Supabase user's access token.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      `Unable to retrieve your login session: ${error.message}`
    );
  }

  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(input, {
    ...init,
    headers,
  });
}