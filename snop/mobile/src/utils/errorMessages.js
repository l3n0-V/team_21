/**
 * User-friendly error message translations
 * Converts technical errors to Norwegian messages
 */

const ERROR_TRANSLATIONS = {
  // Network errors
  'Network request failed': 'Ingen internettforbindelse. Sjekk tilkoblingen din og prøv igjen.',
  'timeout': 'Forespørselen tok for lang tid. Prøv igjen.',
  'Failed to fetch': 'Kunne ikke koble til serveren. Prøv igjen senere.',

  // Auth errors
  'auth/invalid-email': 'Ugyldig e-postadresse',
  'auth/user-not-found': 'Ingen bruker funnet med denne e-postadressen',
  'auth/wrong-password': 'Feil passord',
  'auth/email-already-in-use': 'E-postadressen er allerede i bruk',
  'auth/weak-password': 'Passordet er for svakt (minst 6 tegn)',
  'auth/too-many-requests': 'For mange forsøk. Prøv igjen senere.',

  // HTTP status codes
  'HTTP 400': 'Ugyldig forespørsel. Prøv igjen.',
  'HTTP 401': 'Du er ikke logget inn. Logg inn på nytt.',
  'HTTP 403': 'Du har ikke tilgang til denne ressursen.',
  'HTTP 404': 'Ressursen ble ikke funnet.',
  'HTTP 500': 'Serverfeil. Prøv igjen senere.',
  'HTTP 502': 'Serveren er midlertidig utilgjengelig. Prøv igjen senere.',
  'HTTP 503': 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.',

  // Common API errors
  'challenge_id is required': 'Utfordring-ID mangler',
  'User not found': 'Bruker ikke funnet',
  'Challenge not found': 'Utfordring ikke funnet',
  'Daily limit reached': 'Du har nådd dagens grense for denne utfordringstypen',
};

/**
 * Convert an error to a user-friendly Norwegian message
 * @param {Error|string} error - The error object or message
 * @returns {string} User-friendly message in Norwegian
 */
export function getErrorMessage(error) {
  const message = error?.message || error?.toString() || 'Ukjent feil';

  // Check for exact matches
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }

  // Check for partial matches (e.g., "HTTP 400: Bad Request" contains "HTTP 400")
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  // Check for common patterns
  if (message.includes('timeout') || message.includes('Timeout')) {
    return ERROR_TRANSLATIONS['timeout'];
  }

  if (message.includes('network') || message.includes('Network')) {
    return ERROR_TRANSLATIONS['Network request failed'];
  }

  // Return the original message if no translation found
  // This helps during development to see actual errors
  return message;
}

/**
 * Common error titles in Norwegian
 */
export const ERROR_TITLES = {
  network: 'Nettverksfeil',
  auth: 'Autentiseringsfeil',
  server: 'Serverfeil',
  validation: 'Valideringsfeil',
  general: 'Noe gikk galt',
};

/**
 * Get appropriate error title based on error type
 * @param {Error|string} error - The error object or message
 * @returns {string} Error title in Norwegian
 */
export function getErrorTitle(error) {
  const message = error?.message || error?.toString() || '';

  if (message.includes('Network') || message.includes('timeout') || message.includes('fetch')) {
    return ERROR_TITLES.network;
  }

  if (message.includes('401') || message.includes('auth/')) {
    return ERROR_TITLES.auth;
  }

  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return ERROR_TITLES.server;
  }

  if (message.includes('400') || message.includes('required') || message.includes('invalid')) {
    return ERROR_TITLES.validation;
  }

  return ERROR_TITLES.general;
}
