# React Security Checklist

## Critical (HARD BLOCK)

- [ ] **No dangerouslySetInnerHTML with user input** - XSS vulnerability
- [ ] **No eval() or Function() with user data** - Code injection
- [ ] **API keys not in client code** - Use environment variables server-side
- [ ] **No secrets in source code** - Check git history too

## High (HARD BLOCK)

- [ ] **Sanitize user input before rendering** - Use DOMPurify if HTML needed
- [ ] **Validate all user inputs client AND server** - Never trust client validation alone
- [ ] **Use HTTPS only** - No mixed content
- [ ] **Implement CSP headers** - Content Security Policy
- [ ] **No sensitive data in localStorage** - Use httpOnly cookies for tokens

## Medium (WARNING)

- [ ] **Disable React DevTools in production** - Information disclosure
- [ ] **Use rel="noopener noreferrer" on external links** - Tabnabbing prevention
- [ ] **Implement proper error boundaries** - Prevent stack trace leaks
- [ ] **Audit dependencies regularly** - npm audit, Snyk
- [ ] **Use TypeScript for type safety** - Prevents common bugs
- [ ] **Validate URL parameters** - Prevent open redirects

## Low (INFORMATIONAL)

- [ ] **Use latest React version** - Security patches
- [ ] **Implement rate limiting on forms** - Client-side throttling
- [ ] **Add referrer policy** - Control information leakage
- [ ] **Use Subresource Integrity for CDN scripts** - SRI hashes

## Common Vulnerabilities

### XSS Prevention

```jsx
// BAD - Never do this
<div dangerouslySetInnerHTML={{__html: userInput}} />

// GOOD - Let React escape
<div>{userInput}</div>

// GOOD - If HTML needed, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### Secure Link Handling

```jsx
// BAD
<a href={userProvidedUrl}>Link</a>;

// GOOD
const isSafeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

{
  isSafeUrl(url) && (
    <a href={url} rel="noopener noreferrer">
      Link
    </a>
  );
}
```

## Environment Variables

```bash
# .env.local (never commit)
NEXT_PUBLIC_API_URL=https://api.example.com  # Exposed to client
API_SECRET=xxx  # Server-only (no NEXT_PUBLIC_ prefix)

# .gitignore
.env*.local
```
