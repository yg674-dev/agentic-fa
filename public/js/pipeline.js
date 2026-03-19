/**
 * pipeline.js — Deal pipeline rendering and management.
 * Handles: deal list rendering, status updates, sorting, deletion,
 * and expanded detail view.
 */

import { getScoreClass } from './scoring.js';

const STATUSES = ['New', 'Reviewing', 'IC Ready', 'Passed'];

const STATUS_BADGE_MAP = {
  'New': 'badge-new',
  'Reviewing': 'badge-reviewing',
  'IC Ready': 'badge-ic-ready',
  'Passed': 'badge-passed',
};

/**
 * Renders the full pipeline view into `container`.
 * @param {HTMLElement} container
 * @param {Array}       deals     - app state deals array
 * @param {Function}    onStatusChange - (dealId, newStatus) => void
 * @param {Function}    onDelete       - (dealId) => void
 * @param {Function}    onViewMemo     - (deal) => void
 * @param {Function}    onRescoreDeal  - (deal) => void
 */
export function renderPipeline(container, deals, { onStatusChange, onDelete, onViewMemo, onRescoreDeal }) {
  if (!deals || deals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No deals in pipeline yet</div>
        <div class="empty-state-sub text-muted">Score a deal to add it to your pipeline</div>
      </div>
    `;
    return;
  }

  // Sort by score descending
  const sorted = [...deals].sort((a, b) => (b.score || 0) - (a.score || 0));

  container.innerHTML = `
    <div class="deal-list" id="pipeline-deal-list">
      ${sorted.map(deal => renderDealItem(deal)).join('')}
    </div>
  `;

  // Bind events after render
  sorted.forEach(deal => {
    const itemEl = container.querySelector(`[data-deal-id="${deal.id}"]`);
    if (!itemEl) return;

    // Expand/collapse detail on click
    itemEl.addEventListener('click', (e) => {
      // Don't expand if clicking buttons
      if (e.target.closest('button') || e.target.closest('select')) return;
      const detailEl = container.querySelector(`#detail-${deal.id}`);
      if (detailEl) detailEl.classList.toggle('open');
    });

    // Status change
    const statusSelect = container.querySelector(`#status-${deal.id}`);
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        onStatusChange(deal.id, e.target.value);
      });
    }

    // Delete
    const deleteBtn = container.querySelector(`#delete-${deal.id}`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove ${deal.company} from pipeline?`)) {
          onDelete(deal.id);
        }
      });
    }

    // View/generate memo
    const memoBtn = container.querySelector(`#memo-btn-${deal.id}`);
    if (memoBtn) {
      memoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onViewMemo(deal);
      });
    }

    // Re-score
    const rescoreBtn = container.querySelector(`#rescore-btn-${deal.id}`);
    if (rescoreBtn) {
      rescoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRescoreDeal(deal);
      });
    }
  });
}

/**
 * Generates the HTML string for a single deal item + its collapsed detail panel.
 */
function renderDealItem(deal) {
  const scoreClass = getScoreClass(deal.score || 0);
  const badgeClass = STATUS_BADGE_MAP[deal.status] || 'badge-new';
  const date = deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  }) : '';

  const statusOptions = STATUSES.map(s =>
    `<option value="${s}" ${deal.status === s ? 'selected' : ''}>${s}</option>`
  ).join('');

  return `
    <div>
      <div class="deal-item" data-deal-id="${deal.id}">
        <div class="deal-score-badge ${scoreClass}">
          ${deal.score !== null && deal.score !== undefined ? deal.score : '–'}
        </div>
        <div class="deal-info">
          <div class="deal-name">${escapeHtml(deal.company)}</div>
          <div class="deal-meta">${escapeHtml(deal.sector || '')}${deal.stage ? ' · ' + escapeHtml(deal.stage) : ''}${deal.geography ? ' · ' + escapeHtml(deal.geography) : ''}${date ? ' · ' + date : ''}</div>
        </div>
        <div class="deal-actions">
          <span class="badge ${badgeClass}">${deal.status || 'New'}</span>
          <select
            id="status-${deal.id}"
            class="btn btn-secondary btn-sm"
            style="padding: 5px 8px; font-size: 11px; cursor: pointer;"
            title="Change status"
          >${statusOptions}</select>
          <button id="memo-btn-${deal.id}" class="btn btn-secondary btn-sm" title="View/generate IC memo">
            📄 Memo
          </button>
          <button id="rescore-btn-${deal.id}" class="btn btn-secondary btn-sm" title="Re-score this deal">
            ↺
          </button>
          <button id="delete-${deal.id}" class="btn btn-danger btn-sm" title="Remove deal">
            ✕
          </button>
        </div>
      </div>
      <div class="deal-detail" id="detail-${deal.id}">
        ${deal.description ? `<p><strong style="color:var(--text-secondary)">Description:</strong> ${escapeHtml(deal.description)}</p>` : ''}
        ${deal.askAmount ? `<p class="mt-1"><strong style="color:var(--text-secondary)">Ask:</strong> ${escapeHtml(deal.askAmount)}</p>` : ''}
        ${deal.founders ? `<p class="mt-1"><strong style="color:var(--text-secondary)">Founders:</strong> ${escapeHtml(deal.founders)}</p>` : ''}
        ${deal.traction ? `<p class="mt-1"><strong style="color:var(--text-secondary)">Traction:</strong> ${escapeHtml(deal.traction)}</p>` : ''}
        ${deal.explanation ? `<p class="mt-1"><strong style="color:var(--text-secondary)">AI Assessment:</strong> ${escapeHtml(deal.explanation)}</p>` : ''}
        ${deal.memo ? `<p class="mt-2 text-sm" style="color:var(--accent-green)">IC memo generated ✓</p>` : `<p class="mt-2 text-sm text-muted">No IC memo yet — click "Memo" to generate.</p>`}
      </div>
    </div>
  `;
}

/**
 * Escapes HTML special chars to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { STATUSES };
