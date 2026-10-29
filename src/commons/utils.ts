const NGROK_SKIP_WARNING_HEADER = 'ngrok-skip-browser-warning';

export const isDevelopment = (): boolean => (
  !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
);

/**
 * In development the bundle is usually served through ngrok, whose free tier answers browser
 * requests with an HTML warning page unless this header is sent. Production sends nothing.
 */
export const devRequestHeaders = (): Record<string, string> => (
  isDevelopment() ? { [NGROK_SKIP_WARNING_HEADER]: 'any' } : {}
);
