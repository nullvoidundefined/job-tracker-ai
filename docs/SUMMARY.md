# Job Tracker AI — Application Summary

## What Is It?

Job Tracker AI is a backend API for tracking job applications. Paste in a raw job description, and the app uses Claude AI to extract structured data — job title, company, location, requirements, tech stack, and salary range — validated against a strict schema. Store your resume profile, and the AI will score how well each job fits your background on a scale of 0–100 with an explanation. You can also create and manage job entries manually.

---

## What It Does

- **Extracts structured data from job descriptions** using Claude AI with Zod schema validation
- **Scores job fit** by comparing extracted requirements against your stored resume profile (0–100 with explanation)
- **Tracks job applications** with full CRUD — create, read, update, and delete entries
- **Validates AI output** with automatic retry logic — if Claude returns malformed JSON, the system retries with the validation error included in the prompt (up to 2 retries)
- **Caches analysis results** in memory by SHA256 hash of the raw description, so identical job descriptions aren't re-analyzed
- **Manages resume profiles** — one profile per user with skills, experience, education, job title, and years of experience

---

## User Flows

> This is an API-only application with no frontend. All interactions happen via REST API calls (curl, httpie, Postman, or integration tests).

### 1. Creating an Account

1. Send `POST /auth/register` with `{ email, password }`
2. Password must be 8–72 characters
3. A session cookie (`sid`) is set — you're authenticated immediately
4. The session lasts 7 days

### 2. Logging In

1. Send `POST /auth/login` with `{ email, password }`
2. On success, a session cookie is set and the user object is returned
3. Include the cookie in subsequent requests for authentication

### 3. Adding a Job Manually

1. Send `POST /jobs` with any combination of: `title`, `company`, `location`, `requirements`, `tech_stack`, `salary_range`, `status`
2. The job is saved and returned with a generated UUID

### 4. Analyzing a Job Description with AI

1. Send `POST /jobs/analyze` with `{ raw_description: "..." }` (minimum 20 characters)
2. Claude extracts: title, company, location, requirements array, tech stack array, and salary range
3. The response is validated against a Zod schema — if it fails, Claude is re-prompted with the validation error
4. If you have a resume profile stored, a second AI call scores the job fit (0–100) with an explanation
5. The fully extracted job is saved to the database with `source: "ai-analyzed"` and `status: "saved"`

### 5. Storing Your Resume Profile

1. Send `PUT /profile` with your details: `skills` (array), `experience_summary`, `education`, `job_title`, `years_of_experience`
2. This creates or updates your profile (one per account)
3. Future AI analyses will automatically include fit scoring against this profile

### 6. Viewing Your Jobs

1. `GET /jobs` returns all your tracked jobs with pagination (`?limit=50&offset=0`)
2. `GET /jobs/:id` returns a single job with all its fields, including fit score if available

### 7. Updating a Job

1. Send `PUT /jobs/:id` with any fields you want to change (e.g., `{ status: "interviewing" }`)
2. Job statuses: `saved`, `applied`, `interviewing`, `offer`, `rejected`

### 8. Deleting a Job

1. Send `DELETE /jobs/:id`
2. Returns 204 No Content on success

### 9. Signing Out

1. Send `POST /auth/logout`
2. The session is destroyed and the cookie is cleared

---

## Key Behaviors to Know

- **This is API-only.** There is no frontend — it's the backend fundamentals app in the portfolio. Test via curl, httpie, or the integration test suite.
- **AI extraction retries automatically.** If Claude returns JSON that doesn't match the Zod schema, the system retries up to 2 more times, including the validation error in the prompt so Claude can self-correct.
- **Fit scoring requires a profile.** If you haven't stored a resume profile, the `analyze` endpoint still extracts the job data but skips the fit score.
- **Identical descriptions are cached.** The raw description is SHA256-hashed and cached in memory, so re-analyzing the same text doesn't make another API call.
- **Sessions last 7 days.** The session cookie is HTTP-only and stored in PostgreSQL via `connect-pg-simple`.
- **All inputs are validated with Zod.** Email format, password length, UUID parameters, pagination bounds — everything is checked before hitting the database or AI.
