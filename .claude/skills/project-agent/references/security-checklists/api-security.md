# API Security Checklist

## Critical (HARD BLOCK)

- [ ] **Authentication on all protected endpoints** - No unauthenticated access
- [ ] **Authorization checks per resource** - User can only access their data
- [ ] **No sensitive data in URLs** - Tokens, passwords in headers/body only
- [ ] **Input validation on ALL endpoints** - Never trust client data
- [ ] **SQL injection prevention** - Parameterized queries only

## High (HARD BLOCK)

- [ ] **Rate limiting implemented** - Per user and per IP
- [ ] **HTTPS only** - No HTTP in production
- [ ] **Secure authentication tokens** - Short expiry, httpOnly cookies
- [ ] **CORS configured properly** - Explicit origins, not wildcard
- [ ] **No verbose error messages** - Generic errors to client, detailed logs server-side
- [ ] **Request size limits** - Prevent payload DoS
- [ ] **Content-Type validation** - Reject unexpected types
- [ ] **No mass assignment** - Whitelist allowed fields

## Medium (WARNING)

- [ ] **API versioning** - /v1/ prefix for future compatibility
- [ ] **Pagination on list endpoints** - Prevent data dumps
- [ ] **Request logging** - Audit trail without sensitive data
- [ ] **Timeout configuration** - Prevent hanging requests
- [ ] **Idempotency for mutations** - Safe retries
- [ ] **Deprecation headers** - Warn on old endpoints
- [ ] **Security headers set** - HSTS, CSP, X-Content-Type-Options

## Low (INFORMATIONAL)

- [ ] **OpenAPI/Swagger documentation** - Clear contract
- [ ] **Health check endpoint** - Monitoring
- [ ] **Request ID tracking** - Debugging
- [ ] **Graceful shutdown** - Complete in-flight requests
