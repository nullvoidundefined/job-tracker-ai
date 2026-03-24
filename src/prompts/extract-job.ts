export const EXTRACTION_SYSTEM_PROMPT = `You are a job description parser. Extract structured data from raw job descriptions. Return ONLY valid JSON matching the specified schema. Do not include any text outside the JSON object.`;

export function buildExtractionPrompt(rawDescription: string, validationError?: string): string {
  let prompt = `Extract the following fields from this job description and return them as a JSON object:

- title (string or null): The job title
- company (string or null): The company name
- location (string or null): The job location (e.g. "Remote", "New York, NY", "Hybrid - San Francisco")
- requirements (string[]): Key requirements and qualifications listed. Each item should be a concise phrase.
- tech_stack (string[]): Technologies, languages, frameworks, and tools mentioned
- salary_range (string or null): The salary/compensation range if mentioned (e.g. "$120k - $150k")

If a field is not present in the description, use null for nullable fields or an empty array for array fields.

<examples>
<example>
<input>
We're hiring a Senior Backend Engineer at TechCorp in Austin, TX. You'll work with Node.js, PostgreSQL, and AWS. Requirements: 5+ years backend experience, strong SQL skills, experience with microservices. Salary: $140k-$180k.
</input>
<output>
{"title":"Senior Backend Engineer","company":"TechCorp","location":"Austin, TX","requirements":["5+ years backend experience","Strong SQL skills","Experience with microservices"],"tech_stack":["Node.js","PostgreSQL","AWS"],"salary_range":"$140k-$180k"}
</output>
</example>

<example>
<input>
Join our team! We need someone who can code in Python and knows machine learning. Remote position.
</input>
<output>
{"title":null,"company":null,"location":"Remote","requirements":["Machine learning knowledge"],"tech_stack":["Python"],"salary_range":null}
</output>
</example>
</examples>

<job_description>
${rawDescription}
</job_description>`;

  if (validationError) {
    prompt += `

IMPORTANT: Your previous response failed validation with the following error:
${validationError}

Please fix the output to match the required schema exactly. Return ONLY valid JSON.`;
  }

  return prompt;
}
