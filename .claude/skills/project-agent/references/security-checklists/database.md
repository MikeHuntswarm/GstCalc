# Database Security Checklist

## Critical (HARD BLOCK)

- [ ] **Parameterized queries only** - No string concatenation for SQL
- [ ] **Database credentials in environment variables** - Never in code
- [ ] **No public database access** - Firewall/VPC required
- [ ] **Unique credentials per environment** - Dev ≠ staging ≠ production
- [ ] **Sensitive data encrypted at rest** - PII, passwords, tokens

## High (HARD BLOCK)

- [ ] **Least privilege principle** - App user has minimal permissions
- [ ] **Connection strings secured** - TLS/SSL required
- [ ] **Password hashing for user data** - bcrypt, argon2, scrypt
- [ ] **No admin credentials in app** - Separate admin access
- [ ] **Backup encryption** - Protect backup files
- [ ] **Input sanitization before queries** - Even with ORM
- [ ] **Row-level security where supported** - PostgreSQL RLS

## Medium (WARNING)

- [ ] **Connection pooling configured** - Prevent connection exhaustion
- [ ] **Query timeouts set** - Prevent long-running queries
- [ ] **Audit logging enabled** - Track data access
- [ ] **Regular backups tested** - Restore actually works
- [ ] **Indexes on frequently queried columns** - Performance = security
- [ ] **Database version current** - Security patches

## Low (INFORMATIONAL)

- [ ] **Schema documentation** - Clear data model
- [ ] **Soft deletes for audit** - Never hard delete sensitive data
- [ ] **Data retention policy** - GDPR compliance

---

## Code Examples

### SQL Injection Prevention

```typescript
// BAD - SQL Injection vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.execute(query);

// GOOD - Parameterized query (Prisma)
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// GOOD - Parameterized query (raw SQL)
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE id = ${userId}
`;

// GOOD - Parameterized query (pg)
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Secure Connection String

```typescript
// BAD - Credentials in code
const connectionString = "postgresql://admin:password123@db.example.com:5432/mydb";

// GOOD - Environment variables with SSL
const connectionString = process.env.DATABASE_URL;

// .env (never commit)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

// Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Password Hashing

```typescript
import bcrypt from 'bcrypt';
import { hash, verify } from 'argon2';

// BAD - Plain text or weak hash
const password = userInput; // Never store plain
const weakHash = md5(userInput); // MD5 is broken

// GOOD - bcrypt (cost factor 10-12)
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hashedPassword);

// GOOD - Argon2 (recommended)
const hashedPassword = await hash(password);
const isValid = await verify(hashedPassword, password);
```

### Least Privilege Database User

```sql
-- Create application user with minimal permissions
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT ON orders TO app_user;
-- Note: No DELETE, no TRUNCATE, no DDL permissions

-- For specific columns only
GRANT SELECT (id, email, name) ON users TO app_user;
-- Excludes password_hash column from app access

-- Row-level security (PostgreSQL)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_orders ON orders
  USING (user_id = current_setting('app.current_user_id')::int);
```

### Secure Prisma Configuration

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pooling in Prisma
// Add to DATABASE_URL: ?connection_limit=10&pool_timeout=30

// Query timeout middleware
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  query: {
    $allOperations({ operation, args, query }) {
      return Promise.race([
        query(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        )
      ]);
    }
  }
});
```

### Audit Logging

```typescript
// Prisma middleware for audit logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  // Log to audit table
  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        model: params.model,
        action: params.action,
        userId: getCurrentUserId(),
        data: JSON.stringify(params.args),
        duration: after - before,
        timestamp: new Date(),
      },
    });
  }

  return result;
});
```

### Input Sanitization

```typescript
import { z } from 'zod';

// Define strict schema
const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/),
  age: z.number().int().min(0).max(150),
});

// Validate before database operation
const createUser = async (input: unknown) => {
  const validated = UserInputSchema.parse(input);

  return prisma.user.create({
    data: validated,
  });
};
```

### Soft Deletes

```typescript
// Prisma middleware for soft deletes
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args['data'] = { deletedAt: new Date() };
    }
  }
  return next(params);
});

// Filter out soft-deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

## Quick Audit Commands

```bash
# Check for SQL injection patterns
grep -rn "SELECT.*\${" --include="*.ts" src/
grep -rn "INSERT.*\${" --include="*.ts" src/
grep -rn "UPDATE.*\${" --include="*.ts" src/
grep -rn "DELETE.*\${" --include="*.ts" src/

# Check for hardcoded credentials
grep -rn "password\s*=" --include="*.ts" src/
grep -rn "DATABASE_URL\s*=" --include="*.ts" src/

# Verify Prisma is using parameterized queries
grep -rn "\$queryRawUnsafe" --include="*.ts" src/  # Should return nothing
```
