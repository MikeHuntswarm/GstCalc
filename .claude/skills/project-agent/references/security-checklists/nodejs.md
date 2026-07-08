# Node.js Security Checklist

## Critical (HARD BLOCK)

- [ ] **No eval() with user input** - Remote code execution
- [ ] **No child_process with unsanitized input** - Command injection
- [ ] **No require() with user input** - Arbitrary module loading
- [ ] **Secrets in environment variables** - Never in code
- [ ] **No SQL string concatenation** - Use parameterized queries

## High (HARD BLOCK)

- [ ] **Validate all input** - Use Joi, Zod, or similar
- [ ] **Sanitize file paths** - Prevent path traversal (../)
- [ ] **Set security headers** - Use helmet middleware
- [ ] **Rate limiting implemented** - Prevent brute force
- [ ] **CORS properly configured** - Not wildcard (\*) in production
- [ ] **No sensitive data in logs** - Mask passwords, tokens, PII
- [ ] **Error messages don't leak internals** - Generic messages to client

## Medium (WARNING)

- [ ] **Dependencies audited** - npm audit regularly
- [ ] **Node.js version current** - Security patches
- [ ] **Use HTTPS everywhere** - TLS 1.2+
- [ ] **Implement request timeouts** - Prevent slowloris
- [ ] **Limit request body size** - Prevent DoS
- [ ] **Use security linter** - eslint-plugin-security
- [ ] **Validate Content-Type** - Prevent MIME sniffing

## Low (INFORMATIONAL)

- [ ] **Use strict mode** - 'use strict' or ES modules
- [ ] **Freeze critical objects** - Object.freeze() where appropriate
- [ ] **Monitor for vulnerabilities** - Snyk, npm audit in CI
- [ ] **Implement graceful shutdown** - Clean resource cleanup
