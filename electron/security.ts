/**
 * Electron navigation security policy — pure, unit-testable.
 * Decides whether a URL may be opened in the external browser.
 */

/**
 * Should a URL be opened externally (in the OS browser)?
 * Only http/https are allowed; everything else (file:, javascript:,
 * data:, invalid) is denied.
 */
export function shouldOpenExternally(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Invalid URL — deny
    return false;
  }
}
