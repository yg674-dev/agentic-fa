/**
 * Builds the prompt for Claude to extract structured deal data from raw pitch deck text.
 * Designed to handle incomplete, messy, or OCR-extracted text gracefully.
 */
export function buildDeckParserPrompt(deckText) {
  return `You are an expert at analyzing startup pitch decks. Extract structured information from the raw pitch deck text below.

Be generous in your interpretation — the text may be incomplete, have OCR errors, or be formatted oddly. Make reasonable inferences where data is implicit. Use "Unknown" for fields that truly cannot be determined.

PITCH DECK TEXT:
---
${deckText.slice(0, 8000)}
---

Return ONLY valid JSON in this exact format:
{
  "company": "<company name>",
  "description": "<1-2 sentence description of what the company does and its value proposition>",
  "sector": "<primary sector, e.g.: Fintech, Healthcare, Enterprise SaaS, Consumer, Deep Tech, Climate, etc.>",
  "stage": "<one of: Pre-Seed | Seed | Series A | Series B | Series C | Growth>",
  "geography": "<primary market/HQ location>",
  "askAmount": "<fundraising ask, e.g.: $3M | $10M | Unknown>",
  "founders": "<founder names and relevant background, comma-separated>",
  "marketSize": "<TAM/SAM stated or estimated, e.g.: $50B TAM | Unknown>",
  "traction": "<key traction metrics: ARR, users, growth rate, customers — whatever is available>",
  "competition": "<main competitors or competitive landscape description>",
  "businessModel": "<how the company makes money — subscription, transaction fee, marketplace, etc.>"
}`;
}
