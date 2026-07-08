# Authentication Security Checklist

## Critical (HARD BLOCK)

- [ ] **Password minimum 12 characters** - Longer is better
- [ ] **Passwords hashed with bcrypt/argon2** - Never MD5/SHA1
- [ ] **No plaintext password storage** - Ever
- [ ] **No plaintext password in logs** - Mask in all logging
- [ ] **Secure session token generation** - Cryptographically random
- [ ] **HTTPS for all auth operations** - No exceptions

## High (HARD BLOCK)

- [ ] **Rate limiting on auth endpoints** - Brute force protection
- [ ] **Account lockout after failed attempts** - 5-10 attempts max
- [ ] **Secure password reset flow** - Time-limited tokens
- [ ] **Session invalidation on logout** - Server-side too
- [ ] **Session invalidation on password change** - All sessions
- [ ] **httpOnly cookies for tokens** - Prevent XSS access
- [ ] **Secure + SameSite cookie flags** - CSRF protection
- [ ] **Token expiration** - Short-lived access tokens
- [ ] **No credentials in URLs** - Query params logged everywhere

## Medium (WARNING)

- [ ] **Password strength meter** - Help users choose good passwords
- [ ] **Check against breached passwords** - HaveIBeenPwned API
- [ ] **MFA option available** - TOTP or WebAuthn
- [ ] **Login notification emails** - New device/location
- [ ] **Session timeout** - Idle timeout for sensitive apps
- [ ] **Audit log for auth events** - Login, logout, failures

## Low (INFORMATIONAL)

- [ ] **Username enumeration prevention** - Same response for valid/invalid
- [ ] **CAPTCHA after failures** - Bot prevention
- [ ] **Passwordless option** - Magic links, WebAuthn
