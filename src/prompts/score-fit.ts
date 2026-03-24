export const FIT_SCORE_SYSTEM_PROMPT = `You are a job fit evaluator. Compare a candidate's resume profile against job requirements and return a fit score. Return ONLY valid JSON matching the specified schema. Do not include any text outside the JSON object.`;

export function buildFitScorePrompt(
  jobRequirements: string[],
  techStack: string[],
  jobTitle: string | null,
  candidateSkills: string[],
  experienceSummary: string | null,
  jobTitle2: string | null,
  yearsOfExperience: number | null,
): string {
  return `Evaluate how well this candidate fits the job and return a JSON object with:
- score (integer 0-100): How well the candidate matches. 80+ = strong fit, 60-79 = decent fit, 40-59 = partial fit, below 40 = weak fit.
- explanation (string): A 1-3 sentence explanation of the fit assessment, noting key matches and gaps.

<job>
Title: ${jobTitle ?? "Not specified"}
Requirements: ${jobRequirements.length > 0 ? jobRequirements.join(", ") : "None listed"}
Tech Stack: ${techStack.length > 0 ? techStack.join(", ") : "None listed"}
</job>

<candidate>
Current Title: ${jobTitle2 ?? "Not specified"}
Years of Experience: ${yearsOfExperience ?? "Not specified"}
Skills: ${candidateSkills.length > 0 ? candidateSkills.join(", ") : "None listed"}
Experience Summary: ${experienceSummary ?? "Not provided"}
</candidate>

Return ONLY a JSON object with "score" and "explanation" fields.`;
}
