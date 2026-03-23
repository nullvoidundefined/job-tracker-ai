# App 1: Job Tracker + AI Analyzer

**Weeks 1-2 | Ships Apr 1**
**Repo:** `job-tracker-ai`

## Product Summary

A job application tracker where users can manually add jobs or paste a raw job description and have an LLM extract structured data automatically. The AI analyzer parses job titles, company names, requirements, tech stack, and scores how well the job fits against a stored resume profile.

## Hosting & Infrastructure

| Service | Provider | Notes |
|---------|----------|-------|
| API Server | Railway | Express + TypeScript |
| Database | Neon | PostgreSQL with connection pooling |
| Auth | Custom session-based | express-session + connect-pg-simple |
| LLM | Anthropic Claude API | claude-sonnet-4-20250514 for extraction |
| Frontend | None (API-only) | REST endpoints, tested via Vitest + httpie/curl |

**Why API-only for App 1:** This is backend fundamentals. No frontend distraction. Test everything via integration tests and manual API calls. The frontend pattern starts in App 2.

**Auth transition note:** App 1 uses hand-rolled session auth (express-session + connect-pg-simple) to learn the primitives. Starting with App 2, all apps use Supabase Auth via `@supabase/ssr` as the standard auth provider, and Supabase Postgres replaces Neon. The hand-rolled auth in App 1 remains as a learning artifact.

## Project Setup

Start from **Express template**. The template provides:
- TypeScript + ESLint + Prettier config
- Express server scaffold with error handling middleware
- Vitest setup with supertest for integration tests
- Environment variable management (.env + validation)
- Database connection setup (node-postgres)
- Migration runner (node-pg-migrate)
- Project structure: `src/routes/`, `src/repositories/`, `src/services/`, `src/middleware/`, `src/prompts/`

## Core User Stories

1. As a user, I can sign up, log in, and manage my session securely.
2. As a user, I can manually create, read, update, and delete job applications.
3. As a user, I can paste a raw job description and have the AI extract structured fields (title, company, location, requirements, tech stack, salary range).
4. As a user, I can store my resume profile (skills, experience summary) and get a fit score for each job.
5. As a user, I can list all my tracked jobs with status, fit score, and date added.

## Infrastructure

**Hosting:** Railway (Express API) + Supabase (Postgres + Auth)
**Auth:** Supabase Auth (email/password). Session-based auth via Supabase's `@supabase/ssr` helpers. Hand-rolled session auth from Module 3 is kept as a learning artifact in the codebase but Supabase Auth is the primary provider going forward.
**Database:** Supabase Postgres
**Template:** Express API template. No frontend for App 1 (API-only, tested via REST client + integration tests). Next.js frontend is introduced in App 2.

## System Design

```
Client (REST via curl/httpie/tests)
  |
  v
Express API Server (Railway)
  |
  +-- Auth routes (register, login, logout)
  +-- Jobs CRUD routes
  +-- AI analyzer route (POST /jobs/analyze)
  |     |
  |     +-- Validate input (raw JD text)
  |     +-- Call Anthropic API with extraction prompt
  |     +-- Validate LLM response against Zod schema
  |     +-- Retry up to 2x on malformed response
  |     +-- Return structured job data
  |
  +-- Resume profile routes (GET/PUT)
  
PostgreSQL (Neon)
  +-- users (id, email, password_hash, created_at)
  +-- resume_profiles (id, user_id, skills[], experience_summary, updated_at)
  +-- jobs (id, user_id, title, company, location, requirements[], tech_stack[],
            salary_range, fit_score, fit_explanation, status, raw_description,
            source, created_at, updated_at)

Session Store: express-session + connect-pg-simple (Neon)
```

### AI Integration Detail

- **Prompt design:** System prompt instructs Claude to return JSON matching a strict schema. Few-shot examples included for edge cases (jobs with no salary, vague requirements). Prompts live in `src/prompts/` as versioned files.
- **Schema validation:** Zod schema defines the expected shape. If the LLM response fails validation, retry with a more explicit prompt (include the validation error in the retry prompt).
- **Fit scoring:** Second LLM call compares extracted requirements against resume profile. Returns a 0-100 score with a short explanation.
- **Cost control:** Cache analysis results keyed by a hash of the raw description. Don't re-analyze identical JDs.

## Tasks

### POC (Days 1-3): Get the core loop working end-to-end

Deliver a deployed Express API on Railway backed by a Neon Postgres database where a user can register, log in, and perform full CRUD on job applications. At the end of this phase, every endpoint should be callable via curl or httpie, backed by at least one integration test each, and the app should be live on a Railway URL.

- [ ] Scaffold from Express template
- [ ] PostgreSQL schema: users, jobs tables + migrations (Neon)
- [ ] Auth: register, login, logout with session store
- [ ] Jobs CRUD: POST, GET, GET/:id, PUT/:id, DELETE/:id
- [ ] One integration test per endpoint
- [ ] Deploy to Railway (API live, DB on Neon)

### Week 1 Remainder: Harden the foundation

Deliver a security-hardened API with CSRF protection, rate limiting, and Helmet headers. Add the resume profile feature (table, migration, endpoints) so fit scoring has something to compare against. Refactor all data access into the repository pattern, validate every endpoint's input with Zod, and reach full integration test coverage across auth and CRUD flows.

- [ ] CSRF protection (double-submit cookie pattern)
- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet security headers
- [ ] Resume profile table + migration
- [ ] Resume profile endpoints (GET /profile, PUT /profile)
- [ ] Repository pattern refactor for data access layer
- [ ] Input validation with Zod on all endpoints
- [ ] Full integration test coverage for auth + CRUD

### Week 2: AI Integration + Ship

Deliver the AI-powered features: a POST /jobs/analyze endpoint that accepts raw job description text and returns structured data (title, company, requirements, tech stack, salary) extracted by Claude, validated against a Zod schema with retry logic. Add fit scoring that compares extracted requirements against the user's resume profile and returns a 0-100 score with explanation. Implement a cache layer to avoid re-analyzing duplicate descriptions. Ship with mocked-API integration tests, a complete README, and a final production deploy.

- [ ] Anthropic API client wrapper (handles auth, retries, errors)
- [ ] Job description extraction prompt with few-shot examples (`src/prompts/extract-job.ts`)
- [ ] Zod schema for LLM extraction output (`src/schemas/job-extraction.ts`)
- [ ] POST /jobs/analyze: accepts raw text, returns structured data
- [ ] Retry logic: if Zod validation fails, retry with error context in prompt (max 2 retries)
- [ ] Fit scoring prompt (`src/prompts/score-fit.ts`)
- [ ] Fit scoring: second LLM call comparing job requirements to resume profile
- [ ] Cache layer: hash raw description, skip re-analysis for duplicates
- [ ] Error handling for API failures (rate limits, timeouts, malformed responses)
- [ ] Integration tests for AI endpoints (mock Anthropic API in tests)
- [ ] README: problem statement, tradeoffs, schema diagram, how to run, how to deploy
- [ ] Final deploy

## Key Decisions to Document

- Why Zod for LLM output validation (not just JSON.parse)
- Retry strategy for malformed LLM responses
- Fit scoring approach (single call vs. separate extraction + scoring)
- Caching strategy for repeated job descriptions
- Why Neon for Postgres (connection pooling, branching for App 8)

## Claude Code Implementation Notes

Start with POC tasks only. Get CRUD + auth + deploy working before AI integration. Do not combine POC and AI work in the same session.

Prompt templates must live in `src/prompts/` as separate TypeScript files exporting template functions. Not inline strings. This pattern carries forward to prompt versioning in App 8.

File structure after completion:
```
src/
  middleware/    -- auth, csrf, rate-limit, error-handler
  repositories/ -- user.repo.ts, job.repo.ts, profile.repo.ts
  routes/       -- auth.routes.ts, job.routes.ts, profile.routes.ts
  services/     -- anthropic.service.ts, analyzer.service.ts
  prompts/      -- extract-job.ts, score-fit.ts
  schemas/      -- job-extraction.ts, user.ts, profile.ts
  config/       -- db.ts, env.ts, session.ts
  index.ts
```
