/**
 * api.js — Client-side API wrapper for all backend endpoints.
 * All functions return parsed response data or throw an Error with a user-readable message.
 */

async function callAPI(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Server error ${res.status}`);
  }

  return data;
}

/**
 * Score a company against the fund thesis.
 * @param {Object} companyData - company name, description, sector, stage, geography, askAmount
 * @param {Object} fundThesis  - sectorFocus, stage, geography, checkSize, thematicFocus
 * @returns {{ score, explanation, factors, recommendation }}
 */
export async function scoreThesisAlignment(companyData, fundThesis) {
  return callAPI('/api/score', { ...companyData, fundThesis });
}

/**
 * Generate a full IC memo for a deal.
 * @param {Object} dealData - company, description, sector, stage, founders, etc.
 * @returns {{ memo: string }} markdown IC memo
 */
export async function generateICMemo(dealData) {
  return callAPI('/api/memo', dealData);
}

/**
 * Analyze raw pitch deck text and extract structured fields.
 * @param {string} deckText
 * @returns {{ company, description, sector, stage, geography, askAmount, founders, marketSize, traction, competition, businessModel }}
 */
export async function analyzeDeck(deckText) {
  return callAPI('/api/analyze', { deckText });
}

/**
 * Get "why now" signals for a company.
 * @param {Object} companyData - company, sector, description
 * @returns {{ signals: [{title, description, relevance}], narrative: string }}
 */
export async function getWhyNowSignals(companyData) {
  return callAPI('/api/signal', companyData);
}

/**
 * Check that the backend is reachable and the API key is configured.
 * @returns {{ status, hasApiKey }}
 */
export async function checkHealth() {
  const res = await fetch('/api/health');
  return res.json();
}
