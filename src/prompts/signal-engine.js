/**
 * Builds the prompt for Claude to identify "why now" signals for a deal.
 * Surfaces macro, tech, regulatory, and market timing tailwinds.
 */
export function buildSignalEnginePrompt(data) {
  const { company, sector, description } = data;

  return `You are a macro-aware venture capital analyst specializing in identifying market timing signals. Analyze why NOW is the right moment for this company to succeed.

COMPANY:
- Name: ${company}
- Sector: ${sector}
- Description: ${description}

Identify 3-5 powerful "why now" signals that make this company timely. Look for:
- Macro trends (economic shifts, demographic changes, behavioral shifts)
- Technology inflection points (new capabilities, infrastructure that just became available)
- Regulatory changes (new rules, enforcement changes, policy tailwinds)
- Market timing (competitive white space, incumbent weakness, customer readiness)
- Recent events that create urgency or opportunity

Be specific and concrete — avoid generic statements like "AI is growing." Instead say exactly what changed and why it matters for THIS company.

Return ONLY valid JSON in this exact format:
{
  "signals": [
    {
      "title": "<short signal title, 3-6 words>",
      "description": "<2-3 sentences explaining this specific signal and what changed>",
      "relevance": "<1-2 sentences on why this signal directly benefits ${company}>"
    }
  ],
  "narrative": "<A 150-word paragraph that weaves these signals into a cohesive 'why now' story for ${company}. Should feel like something a partner would say at the start of an IC meeting.>"
}`;
}
