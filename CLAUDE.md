# App 1: Job Tracker + AI Analyzer

API-only app (no frontend). Users paste raw job descriptions, LLM extracts structured data (title, company, salary, requirements) validated with Zod, then scores fit against a stored resume profile.

## Key AI pattern

Structured extraction with Zod schema validation and retry logic on parse failure.

## Stack

- Express + TypeScript on Railway
- PostgreSQL on Neon
- Anthropic Claude API
- No frontend, no worker, no Redis

## Spec

Read `FULL_APPLICATION_SPEC.md` for full system design, DB schema, and task breakdown.

## Build order

POC → get one job description extracted and validated → then fit scoring → then CRUD endpoints.
