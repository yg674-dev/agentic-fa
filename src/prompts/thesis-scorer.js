/**
 * Builds the prompt for Claude to score a deal against a fund thesis.
 * Returns structured JSON with a 0-100 score, factor breakdown, and recommendation.
 */
export function buildThesisScorerPrompt(data) {
  const {
    company,
    description,
    sector,
    stage,
    geography,
    askAmount,
    fundThesis,
  } = data;

  return `You are a senior VC analyst. Score how well this company aligns with the fund thesis below.

FUND THESIS:
- Sector Focus: ${fundThesis.sectorFocus || 'Not specified'}
- Stage: ${fundThesis.stage || 'Not specified'}
- Geography: ${fundThesis.geography || 'Not specified'}
- Check Size: ${fundThesis.checkSize || 'Not specified'}
- Thematic Focus: ${fundThesis.thematicFocus || 'Not specified'}

COMPANY BEING EVALUATED:
- Company: ${company}
- Description: ${description}
- Sector: ${sector}
- Stage: ${stage}
- Geography: ${geography}
- Ask Amount: ${askAmount}

Score this deal's alignment with the fund thesis. Be rigorous and honest — most deals should score between 30-75. Only exceptional fits score above 85.

Return ONLY valid JSON in this exact format:
{
  "score": <integer 0-100>,
  "explanation": "<2-3 sentence overall assessment of fit>",
  "factors": [
    {
      "name": "Sector Fit",
      "score": <integer 0-100>,
      "reason": "<specific reason why this sector fits or doesn't fit the thesis>"
    },
    {
      "name": "Stage Fit",
      "score": <integer 0-100>,
      "reason": "<specific reason why this stage fits or doesn't fit>"
    },
    {
      "name": "Geography Fit",
      "score": <integer 0-100>,
      "reason": "<specific reason why this geography fits or doesn't fit>"
    },
    {
      "name": "Check Size Fit",
      "score": <integer 0-100>,
      "reason": "<specific reason why this ask aligns or misaligns with check size>"
    },
    {
      "name": "Thematic Alignment",
      "score": <integer 0-100>,
      "reason": "<specific reason why this company fits or doesn't fit the thematic focus>"
    }
  ],
  "recommendation": "<one of: Strong Pass | Soft Pass | Neutral | Soft Pursue | Strong Pursue> — <1 sentence rationale>"
}`;
}
