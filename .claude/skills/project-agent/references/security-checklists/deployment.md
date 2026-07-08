# Deployment Security Checklist

## Critical (HARD BLOCK)

- [ ] **All secrets in environment variables** - Never in code or config files
- [ ] **Production secrets different from dev/staging** - Unique per environment
- [ ] **HTTPS enforced** - Redirect all HTTP to HTTPS
- [ ] **TLS 1.2+ only** - Disable older protocols
- [ ] **Database not publicly accessible** - VPC/firewall required
- [ ] **No debug mode in production** - Debug=False, NODE_ENV=production

## High (HARD BLOCK)

- [ ] **Firewall configured** - Minimal open ports
- [ ] **SSH key-only authentication** - No password SSH
- [ ] **Non-root application user** - Principle of least privilege
- [ ] **Security updates automated** - Unattended upgrades
- [ ] **Secrets management** - Use vault/secrets manager
- [ ] **Backup strategy verified** - Test restores
- [ ] **Logging configured** - But no sensitive data in logs
- [ ] **CORS configured properly** - Not wildcard in production

## Medium (WARNING)

- [ ] **WAF enabled** - Web Application Firewall
- [ ] **DDoS protection** - Cloudflare, AWS Shield, etc.
- [ ] **Rate limiting at infrastructure level** - In addition to app level
- [ ] **Container images scanned** - Snyk, Trivy
- [ ] **Dependency updates automated** - Dependabot, Renovate
- [ ] **Monitoring and alerting** - Know when things break
- [ ] **Incident response plan** - Document procedures
- [ ] **Infrastructure as Code** - Reproducible deployments

## Low (INFORMATIONAL)

- [ ] **Geographic restrictions if applicable** - Block suspicious regions
- [ ] **IP allowlisting for admin panels** - Extra layer
- [ ] **Regular penetration testing** - External audit
- [ ] **Compliance certifications** - SOC2, GDPR if needed

---

## Code Examples

### Environment Variables Setup

```bash
# .env.example (commit this)
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=your_api_key_here
NEXTAUTH_SECRET=generate_with_openssl_rand

# .env.local (NEVER commit)
NODE_ENV=production
DATABASE_URL=postgresql://user:realpass@prod-db:5432/mydb
API_KEY=real_api_key_here
NEXTAUTH_SECRET=real_secret_here

# .gitignore
.env
.env.local
.env.production
*.pem
*.key
```

### Next.js Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' wss: https:;
      font-src 'self';
      frame-ancestors 'none';
    `
      .replace(/\s{2,}/g, ' ')
      .trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### CORS Configuration

```typescript
// BAD - Wildcard CORS in production
app.use(cors({ origin: '*' }));

// GOOD - Specific origins
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://myapp.com', 'https://www.myapp.com']
    : ['http://localhost:3000', 'http://localhost:3333'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
```

### Production Logging (No Secrets)

```typescript
// Winston logger configuration
import winston from 'winston';

// Redact sensitive fields
const redactSecrets = winston.format((info) => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];

  const redact = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const result = { ...obj };
    for (const key of Object.keys(result)) {
      if (sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = redact(result[key]);
      }
    }
    return result;
  };

  return redact(info);
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    redactSecrets(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### PM2 Production Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'agent-helper',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
      // Security: Don't expose env vars in pm2 list
      filter_env: ['DATABASE_URL', 'API_KEY', 'NEXTAUTH_SECRET'],
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
```

### GitHub Actions Security Workflow

```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Security audit
        run: npm audit --audit-level=high
        continue-on-error: false

      - name: Check for secrets in code
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Dependency review
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
```

### Docker Security Best Practices

```dockerfile
# Dockerfile
# Use specific version, not latest
FROM node:20-alpine AS base

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy package files first (cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3333/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Nginx Reverse Proxy (HTTPS)

```nginx
# /etc/nginx/sites-available/myapp
server {
    listen 80;
    server_name myapp.com www.myapp.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name myapp.com www.myapp.com;

    # TLS configuration
    ssl_certificate /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Pre-Deployment CI/CD Gate

```
┌─────────────────────────────────────────────────┐
│ 🚀 DEPLOYMENT READINESS CHECK                   │
├─────────────────────────────────────────────────┤
│ [ ] All changes committed and pushed            │
│ [ ] All GitHub Actions workflows passing        │
│ [ ] No failed workflow runs in history          │
│ [ ] Security audit complete (npm audit)         │
│ [ ] Secrets verified in production env          │
│ [ ] PROJECT_REVIEW.md generated                 │
│ [ ] Health score > 80/100                       │
│ [ ] No Critical/High security issues            │
└─────────────────────────────────────────────────┘
```

## Quick Audit Commands

```bash
# Check for hardcoded secrets
grep -rn "password\s*=" --include="*.ts" --include="*.js" .
grep -rn "api_key\s*=" --include="*.ts" --include="*.js" .
grep -rn "secret\s*=" --include="*.ts" --include="*.js" .

# Verify NODE_ENV
echo $NODE_ENV  # Should be 'production'

# Check TLS version
nmap --script ssl-enum-ciphers -p 443 myapp.com

# Verify security headers
curl -I https://myapp.com | grep -E "(X-Frame|X-Content|Strict-Transport)"

# Check open ports
nmap -p- localhost
```
