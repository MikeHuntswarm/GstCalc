import { describe, it, expect } from 'vitest';
import { shouldOpenExternally } from './security';

describe('shouldOpenExternally', () => {
  it('allows http URLs', () => {
    expect(shouldOpenExternally('http://example.com')).toBe(true);
  });

  it('allows https URLs', () => {
    expect(shouldOpenExternally('https://www.ato.gov.au/tax-rates')).toBe(true);
  });

  it('denies file: URLs', () => {
    expect(shouldOpenExternally('file:///etc/passwd')).toBe(false);
  });

  it('denies javascript: URLs', () => {
    expect(shouldOpenExternally('javascript:alert(1)')).toBe(false);
  });

  it('denies data: URLs', () => {
    expect(shouldOpenExternally('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('denies invalid URLs', () => {
    expect(shouldOpenExternally('not a url')).toBe(false);
  });

  it('denies empty strings', () => {
    expect(shouldOpenExternally('')).toBe(false);
  });
});
