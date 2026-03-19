/**
 * scoring.js — Renders the visual scoring UI components.
 *
 * Uses a large bold number display (not a circular SVG gauge).
 * Color-coded by score tier: excellent (≥80), good (60-79), moderate (<60).
 */

/**
 * Returns the CSS class for a score value.
 */
export function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  return 'moderate';
}

/**
 * Returns a hex color for a score value (used in progress bar fills).
 */
export function getScoreColor(score) {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#2563eb'; // blue-600
  return '#9ca3af';                  // gray-400
}

/**
 * Returns a progress bar fill CSS class based on score.
 */
function getProgressClass(score) {
  if (score >= 80) return 'progress-fill-green';
  if (score >= 60) return 'progress-fill-blue';
  return ''; // default blue
}

/**
 * Returns the score category label.
 */
function getScoreCategoryLabel(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  return 'Moderate Match';
}

/**
 * Animates a number element counting from start to end over duration ms.
 */
function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Renders the score result into the result panel.
 * result = { score, explanation, factors: [{name, score, reason}], recommendation }
 */
export function renderScoreResult(result) {
  const { score, explanation, factors, recommendation } = result;
  const tier = getScoreClass(score);

  // Show result panel
  const panel = document.getElementById('score-results');
  if (panel) panel.classList.remove('hidden');

  // Score number (large display)
  const numberEl = document.getElementById('score-main-number');
  if (numberEl) {
    numberEl.className = `score-main-number score-${tier}`;
    numberEl.textContent = '0';
    // Animate count-up
    animateCounter(numberEl, 0, score, 1000);
  }

  // Score category label
  const categoryEl = document.getElementById('score-category');
  if (categoryEl) {
    categoryEl.className = `score-category score-${tier}`;
    categoryEl.textContent = getScoreCategoryLabel(score);
  }

  // Explanation text
  const explEl = document.getElementById('score-explanation');
  if (explEl) {
    explEl.textContent = explanation || '';
  }

  // Factor breakdown progress bars
  const factorsEl = document.getElementById('score-factors');
  if (factorsEl && factors && factors.length > 0) {
    factorsEl.innerHTML = factors.map((f, i) => `
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">${escHtml(f.name)}</span>
          <span class="factor-score">${f.score}/100</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill ${getProgressClass(f.score)}"
            id="factor-bar-${i}"
          ></div>
        </div>
        ${f.reason ? `<div class="factor-reason">${escHtml(f.reason)}</div>` : ''}
      </div>
    `).join('');

    // Animate bars from 0 to value with stagger
    requestAnimationFrame(() => {
      factors.forEach((f, i) => {
        setTimeout(() => {
          const bar = document.getElementById(`factor-bar-${i}`);
          if (bar) bar.style.width = `${f.score}%`;
        }, i * 80);
      });
    });
  }

  // Recommendation box
  renderRecommendationBox(recommendation);

  // Scroll results into view
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Renders the recommendation box.
 */
function renderRecommendationBox(recommendation) {
  const container = document.getElementById('score-recommendation-container');
  if (!container || !recommendation) {
    if (container) container.innerHTML = '';
    return;
  }

  const lower = recommendation.toLowerCase();
  let boxClass = 'review';
  let label = 'Consider';

  if (lower.includes('invest') || lower.includes('strong pursue') || lower.includes('pursue')) {
    boxClass = 'invest';
    label = 'Invest';
  } else if (lower.includes('pass') || lower.includes('decline')) {
    boxClass = 'pass';
    label = 'Pass';
  }

  // Split label from rationale
  const parts = recommendation.split(/\s*[—–-]\s*/);
  const displayLabel = parts.length > 1 ? parts[0].trim() : label;
  const rationale = parts.length > 1 ? parts.slice(1).join(' — ').trim() : recommendation;

  container.innerHTML = `
    <div class="recommendation-box ${boxClass}">
      <div class="recommendation-label">${escHtml(displayLabel)}</div>
      <div class="recommendation-text">${escHtml(rationale)}</div>
    </div>
  `;
}

/**
 * Clears the score result panel.
 */
export function clearScoreResult() {
  const panel = document.getElementById('score-results');
  if (panel) panel.classList.add('hidden');

  const numberEl = document.getElementById('score-main-number');
  if (numberEl) { numberEl.textContent = '–'; numberEl.className = 'score-main-number score-good'; }

  const categoryEl = document.getElementById('score-category');
  if (categoryEl) { categoryEl.textContent = ''; }

  const explEl = document.getElementById('score-explanation');
  if (explEl) { explEl.textContent = ''; }

  const factorsEl = document.getElementById('score-factors');
  if (factorsEl) factorsEl.innerHTML = '';

  const recEl = document.getElementById('score-recommendation-container');
  if (recEl) recEl.innerHTML = '';
}

/**
 * Returns a small inline score display HTML string (for use in cards/lists).
 * @param {number} score
 * @returns {string} HTML
 */
export function scoreChip(score) {
  const tier = getScoreClass(score);
  return `<span class="score-number score-${tier}" style="font-size:20px;font-weight:800;letter-spacing:-0.5px;">${score}</span>`;
}

/**
 * Escapes HTML special characters.
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
