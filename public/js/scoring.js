/**
 * scoring.js — Renders the visual scoring UI components:
 *   - Circular SVG score gauge (animated, color-coded)
 *   - Factor breakdown horizontal bars (animated)
 *   - Recommendation card
 *   - Animates score counting up
 */

/**
 * Returns the color for a given score value.
 * Red < 40, Yellow 40–70, Green > 70.
 */
export function getScoreColor(score) {
  if (score >= 70) return '#10b981'; // green
  if (score >= 40) return '#f59e0b'; // yellow
  return '#ef4444';                  // red
}

/**
 * Returns the CSS class suffix for a score (for badges).
 */
export function getScoreClass(score) {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Renders an animated circular SVG gauge into the given container element.
 * @param {HTMLElement} container
 * @param {number} score  0–100
 */
export function renderScoreMeter(container, score) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size / 2) - strokeWidth;
  // Arc covers 270 degrees (starting from 135deg, going clockwise to 45deg)
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270/360
  const dashArray = circumference * arcFraction;
  const dashOffset = dashArray; // start at 0 fill

  const color = getScoreColor(score);

  container.innerHTML = `
    <div class="score-meter-wrap">
      <svg
        class="score-meter-svg"
        width="${size}"
        height="${size}"
        viewBox="0 0 ${size} ${size}"
        aria-label="Score: ${score}/100"
      >
        <!-- Track arc -->
        <circle
          class="score-gauge-track"
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashArray} ${circumference}"
          stroke-dashoffset="${-circumference * 0.125}"
          transform="rotate(90 ${size / 2} ${size / 2})"
        />
        <!-- Fill arc -->
        <circle
          class="score-gauge-fill"
          id="score-gauge-fill"
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashArray} ${circumference}"
          stroke-dashoffset="${dashArray}"
          transform="rotate(90 ${size / 2} ${size / 2})"
        />
        <!-- Score number (animated via JS) -->
        <text
          class="score-meter-label"
          id="score-meter-number"
          x="${size / 2}"
          y="${size / 2 - 4}"
          font-size="30"
        >0</text>
        <text
          class="score-meter-sublabel"
          x="${size / 2}"
          y="${size / 2 + 18}"
          font-size="11"
        >/ 100</text>
      </svg>
      <div class="score-meter-title">Thesis Alignment</div>
    </div>
  `;

  // Animate after paint
  requestAnimationFrame(() => {
    const fill = container.querySelector('#score-gauge-fill');
    const numberEl = container.querySelector('#score-meter-number');
    if (!fill || !numberEl) return;

    // Animate the arc fill
    const targetOffset = dashArray - (dashArray * (score / 100));
    // We need to offset by -circumference*0.125 to start at the left bottom (225deg)
    const baseOffset = circumference * 0.125;
    fill.style.strokeDashoffset = targetOffset + baseOffset;

    // Animate count-up number
    animateCounter(numberEl, 0, score, 1200);
  });
}

/**
 * Animates a text element counting from `start` to `end` over `duration` ms.
 */
function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Renders the factor breakdown bars into the given container.
 * @param {HTMLElement} container
 * @param {Array} factors  [{name, score, reason}]
 */
export function renderFactorBars(container, factors) {
  if (!factors || factors.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">No factor data available.</p>';
    return;
  }

  container.innerHTML = `
    <div class="factor-bars">
      ${factors.map((f, i) => `
        <div class="factor-bar-item">
          <div class="factor-bar-header">
            <span class="factor-bar-name">${f.name}</span>
            <span class="factor-bar-score" id="factor-score-${i}">${f.score}</span>
          </div>
          <div class="factor-bar-track">
            <div
              class="factor-bar-fill"
              id="factor-fill-${i}"
              style="background: ${getScoreColor(f.score)};"
            ></div>
          </div>
          ${f.reason ? `<div class="factor-bar-reason">${f.reason}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  // Animate bars after paint
  requestAnimationFrame(() => {
    factors.forEach((f, i) => {
      const fill = container.querySelector(`#factor-fill-${i}`);
      if (fill) {
        // Stagger each bar slightly
        setTimeout(() => {
          fill.style.width = `${f.score}%`;
        }, i * 80);
      }
    });
  });
}

/**
 * Renders the recommendation card.
 * @param {HTMLElement} container
 * @param {string} recommendation  e.g. "Strong Pursue — rationale"
 */
export function renderRecommendation(container, recommendation) {
  if (!recommendation) {
    container.innerHTML = '';
    return;
  }

  // Determine card style based on recommendation type
  const lower = recommendation.toLowerCase();
  let cardClass = 'neutral';
  if (lower.includes('strong pursue') || lower.includes('soft pursue')) cardClass = 'pursue';
  else if (lower.includes('strong pass') || lower.includes('soft pass')) cardClass = 'pass';

  // Split label from rationale at the first em-dash or hyphen
  const parts = recommendation.split(/\s*[—–-]\s*/);
  const label = parts[0].trim();
  const rationale = parts.slice(1).join(' — ').trim();

  container.innerHTML = `
    <div class="recommendation-card ${cardClass}">
      <div class="recommendation-label">${label}</div>
      <div class="recommendation-text">${rationale || recommendation}</div>
    </div>
  `;
}
