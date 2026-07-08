# Stack Selection Guide

Decision matrix for recommending technology stacks based on project requirements.

## Decision Factors

Evaluate each project against:

1. **Scale** - Expected data volume and user count
2. **Timeline** - MVP urgency vs long-term investment
3. **Team** - Solo dev, small team, or enterprise
4. **Complexity** - Simple CRUD vs complex business logic
5. **Real-time** - Need for live updates/websockets
6. **Mobile** - Web-only, responsive, or native apps

---

## Frontend Selection

| Framework              | Best For                                   | Avoid When                                       | Learning Curve |
| ---------------------- | ------------------------------------------ | ------------------------------------------------ | -------------- |
| **React + TypeScript** | Complex UIs, large apps, team projects     | Tiny projects, tight deadlines with no React exp | Medium         |
| **Vue 3 + TypeScript** | Rapid prototyping, progressive enhancement | Very large teams (less ecosystem)                | Low-Medium     |
| **Svelte/SvelteKit**   | Performance-critical, smaller bundles      | Large enterprise (smaller ecosystem)             | Low            |
| **Next.js**            | SEO-important, full-stack React            | Simple SPAs (overkill)                           | Medium         |

## Backend Selection

| Framework             | Best For                           | Avoid When              |
| --------------------- | ---------------------------------- | ----------------------- |
| **Node.js + Express** | JS ecosystem, real-time, rapid dev | CPU-intensive tasks     |
| **Python + FastAPI**  | ML integration, clean APIs         | Real-time heavy apps    |
| **Python + Django**   | Admin-heavy, rapid full-stack      | Microservices, API-only |
| **Go**                | High concurrency, performance      | Rapid prototyping       |

## Database Selection

| Database       | Best For                                       | Avoid When                   |
| -------------- | ---------------------------------------------- | ---------------------------- |
| **PostgreSQL** | Relational data, complex queries, JSON support | Simple key-value             |
| **MongoDB**    | Document data, flexible schema                 | Complex relationships        |
| **SQLite**     | Local apps, prototypes                         | Multi-user, high concurrency |
| **Supabase**   | Rapid PostgreSQL with auth, realtime           | Complex custom logic         |

## Deployment Selection

| Platform    | Best For                      | Cost Model    |
| ----------- | ----------------------------- | ------------- |
| **Vercel**  | Next.js, frontend, serverless | Per-request   |
| **Railway** | Full-stack, databases, simple | Usage-based   |
| **Render**  | Full-stack, background jobs   | Fixed + usage |
| **AWS**     | Enterprise, full control      | Usage-based   |

## Security Checklist Mapping

| Stack Component | Applicable Checklists      |
| --------------- | -------------------------- |
| React           | react.md, general-web.md   |
| Node.js         | nodejs.md, api-security.md |
| Python          | python.md, api-security.md |
| PostgreSQL      | database.md                |
| Any Auth        | auth.md                    |
| Any Deployment  | deployment.md              |
