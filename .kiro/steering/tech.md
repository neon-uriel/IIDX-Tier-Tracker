# Technology Stack

## Architecture

Monorepo with separate frontend and backend directories. Frontend is a React SPA communicating with Express REST API. PostgreSQL database for persistence. Docker Compose for local development orchestration.

## Core Technologies

- **Frontend**: React 19, Vite 7, TailwindCSS 4
- **Backend**: Node.js, Express 5, PostgreSQL 15
- **Authentication**: Passport.js with Google OAuth 2.0
- **Runtime**: Node.js (ES Modules frontend, CommonJS backend)

## Key Libraries

### Frontend
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls
- `framer-motion` - Animations
- `lucide-react` - Icons
- `tailwind-merge` / `clsx` - Utility class composition

### Backend
- `pg` - PostgreSQL client
- `node-pg-migrate` - Database migrations
- `cheerio` / `iconv-lite` - Web scraping for data import
- `express-session` - Session management

## Development Standards

### Code Quality
- ESLint for linting (frontend)
- Vitest for frontend testing
- Jest + Supertest for backend testing

### Testing
- Frontend: Vitest with React Testing Library, jsdom environment
- Backend: Jest with Supertest for API testing
- Test files: `*.test.jsx` (frontend), `*.test.js` (backend)

## Development Environment

### Required Tools
- Node.js
- PostgreSQL 15 (or Docker)
- npm

### Common Commands
```bash
# Frontend dev server
cd frontend && npm run dev

# Backend dev server
cd backend && npm run dev

# Database migrations
cd backend && npm run migrate

# Run tests
cd frontend && npm test
cd backend && npm test

# Data import/scraping
cd backend && npm run scrape
```

## Key Technical Decisions

- **Separate package.json**: Frontend and backend have independent dependencies
- **Vite proxy**: Frontend dev server proxies `/api` and `/auth` to backend (port 5000)
- **Path alias**: Frontend uses `@/` alias mapping to `./src`
- **CommonJS backend**: Backend uses `require()` syntax for Node.js compatibility
- **ES Modules frontend**: Frontend uses `import/export` syntax

---
_created_at: 2025-02-04_
