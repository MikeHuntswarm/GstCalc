# General Web Security Checklist

## Critical (HARD BLOCK)

- [ ] **HTTPS everywhere** - All traffic encrypted
- [ ] **No mixed content** - All resources over HTTPS
- [ ] **Input validation** - All user input validated and sanitized
- [ ] **Output encoding** - Prevent XSS in all outputs
- [ ] **Authentication required for protected resources**

## High (HARD BLOCK)

- [ ] **CSRF protection** - Tokens or SameSite cookies
- [ ] **Security headers configured** - See list below
- [ ] **Content Security Policy** - XSS mitigation
- [ ] **Clickjacking protection** - X-Frame-Options
- [ ] **No sensitive data in client storage** - Use httpOnly cookies
- [ ] **Secure cookie flags** - httpOnly, secure, sameSite
- [ ] **Error messages don't leak information**

## Medium (WARNING)

- [ ] **Subresource Integrity** - For CDN resources
- [ ] **Referrer Policy configured** - Limit information leakage
- [ ] **Dependency audit** - No known vulnerabilities
- [ ] **Third-party script review** - Minimize and audit
- [ ] **File upload validation** - Type, size, content
- [ ] **Open redirect prevention** - Validate redirect URLs

## Low (INFORMATIONAL)

- [ ] **Security.txt file** - Vulnerability reporting info
- [ ] **DNS CAA records** - Certificate authority restrictions
- [ ] **Regular penetration testing**

## Essential Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```
