/**
 * app.js — Main application controller for Agentic FA.
 *
 * Manages:
 *  - View/tab navigation
 *  - Application state (fundThesis, deals, currentDeal)
 *  - localStorage persistence
 *  - Event bindings for all UI interactions
 *  - Orchestration of API calls + UI feedback
 */

import { scoreThesisAlignment, generateICMemo, analyzeDeck, getWhyNowSignals, checkHealth } from './api.js';
import { renderScoreMeter, renderFactorBars, renderRecommendation, getScoreClass } from './scoring.js';
import { renderPipeline } from './pipeline.js';

// -----------------------------------------------------------------------
// State
// -----------------------------------------------------------------------
const state = {
  fundThesis: {},
  deals: [],
  currentDeal: null,
  currentView: 'dashboard',
};

const STORAGE_KEY = 'agentic-fa-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.fundThesis = saved.fundThesis || {};
      state.deals = saved.deals || [];
    }
  } catch {
    // Silently ignore parse errors
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      fundThesis: state.fundThesis,
      deals: state.deals,
    }));
  } catch {
    // Ignore quota errors
  }
}

// -----------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------
function showView(viewName) {
  state.currentView = viewName;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });

  // Update topbar title
  const titles = {
    dashboard: 'Dashboard',
    score: 'Score Deal',
    memo: 'IC Memo',
    pipeline: 'Deal Pipeline',
  };
  document.getElementById('topbar-title').textContent = titles[viewName] || viewName;

  // Show/hide content sections
  document.querySelectorAll('.view-section').forEach(el => {
    el.classList.toggle('hidden', el.dataset.view !== viewName);
  });

  // Refresh pipeline whenever it's opened
  if (viewName === 'pipeline') renderPipelineView();

  // Refresh dashboard stats
  if (viewName === 'dashboard') renderDashboardStats();
}

// -----------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------
function renderDashboardStats() {
  const totalEl = document.getElementById('stat-total-deals');
  const avgScoreEl = document.getElementById('stat-avg-score');
  const memosEl = document.getElementById('stat-memos');
  const icReadyEl = document.getElementById('stat-ic-ready');

  const total = state.deals.length;
  const scored = state.deals.filter(d => d.score !== undefined && d.score !== null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, d) => sum + d.score, 0) / scored.length)
    : 0;
  const memoCount = state.deals.filter(d => d.memo).length;
  const icReadyCount = state.deals.filter(d => d.status === 'IC Ready').length;

  if (totalEl) totalEl.textContent = total;
  if (avgScoreEl) avgScoreEl.textContent = scored.length ? avgScore : '–';
  if (memosEl) memosEl.textContent = memoCount;
  if (icReadyEl) icReadyEl.textContent = icReadyCount;

  renderRecentDeals();
}

function renderRecentDeals() {
  const container = document.getElementById('recent-deals-list');
  if (!container) return;

  const recent = [...state.deals]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-text">No deals scored yet</div>
        <div class="empty-state-sub">Go to "Score Deal" to evaluate your first company</div>
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map(deal => {
    const scoreClass = getScoreClass(deal.score || 0);
    return `
      <div class="deal-item" style="cursor:default;">
        <div class="deal-score-badge ${scoreClass}">
          ${deal.score !== null && deal.score !== undefined ? deal.score : '–'}
        </div>
        <div class="deal-info">
          <div class="deal-name">${escHtml(deal.company)}</div>
          <div class="deal-meta">${escHtml(deal.sector || '')}${deal.stage ? ' · ' + escHtml(deal.stage) : ''}</div>
        </div>
        <div class="deal-actions">
          <span class="badge badge-${deal.status === 'IC Ready' ? 'ic-ready' : deal.status === 'Passed' ? 'passed' : deal.status === 'Reviewing' ? 'reviewing' : 'new'}">
            ${deal.status || 'New'}
          </span>
          <button class="btn btn-secondary btn-sm" onclick="window.goToMemo('${deal.id}')">
            Memo
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// -----------------------------------------------------------------------
// Fund Thesis
// -----------------------------------------------------------------------
function saveFundThesis() {
  state.fundThesis = {
    sectorFocus: document.getElementById('thesis-sector')?.value || '',
    stage: document.getElementById('thesis-stage')?.value || '',
    geography: document.getElementById('thesis-geography')?.value || '',
    checkSize: document.getElementById('thesis-check-size')?.value || '',
    thematicFocus: document.getElementById('thesis-thematic')?.value || '',
  };
  saveState();
  showAlert('thesis-save-alert', 'Fund thesis saved.', 'success', 3000);
}

function populateThesisForm() {
  if (state.fundThesis.sectorFocus) {
    const el = document.getElementById('thesis-sector');
    if (el) el.value = state.fundThesis.sectorFocus;
  }
  if (state.fundThesis.stage) {
    const el = document.getElementById('thesis-stage');
    if (el) el.value = state.fundThesis.stage;
  }
  if (state.fundThesis.geography) {
    const el = document.getElementById('thesis-geography');
    if (el) el.value = state.fundThesis.geography;
  }
  if (state.fundThesis.checkSize) {
    const el = document.getElementById('thesis-check-size');
    if (el) el.value = state.fundThesis.checkSize;
  }
  if (state.fundThesis.thematicFocus) {
    const el = document.getElementById('thesis-thematic');
    if (el) el.value = state.fundThesis.thematicFocus;
  }
}

// -----------------------------------------------------------------------
// Score Deal
// -----------------------------------------------------------------------
async function handleScoreDeal() {
  const company = document.getElementById('score-company')?.value.trim();
  const description = document.getElementById('score-description')?.value.trim();
  const sector = document.getElementById('score-sector')?.value.trim();
  const stage = document.getElementById('score-stage')?.value;
  const geography = document.getElementById('score-geography')?.value.trim();
  const askAmount = document.getElementById('score-ask')?.value.trim();

  if (!company || !description) {
    showAlert('score-alert', 'Company name and description are required.', 'error');
    return;
  }

  setLoading('score-btn', true, 'Scoring…');
  clearAlert('score-alert');
  document.getElementById('score-results')?.classList.add('hidden');

  try {
    const result = await scoreThesisAlignment(
      { company, description, sector, stage, geography, askAmount },
      state.fundThesis
    );

    // Store as current deal
    state.currentDeal = {
      id: Date.now().toString(),
      company,
      description,
      sector,
      stage,
      geography,
      askAmount,
      score: result.score,
      explanation: result.explanation,
      factors: result.factors,
      recommendation: result.recommendation,
      status: 'New',
      createdAt: new Date().toISOString(),
      memo: null,
    };

    // Add to pipeline (replace if same company name)
    const existingIdx = state.deals.findIndex(
      d => d.company.toLowerCase() === company.toLowerCase()
    );
    if (existingIdx >= 0) {
      state.deals[existingIdx] = state.currentDeal;
    } else {
      state.deals.push(state.currentDeal);
    }
    saveState();

    renderScoreResults(result);
  } catch (err) {
    showAlert('score-alert', `Scoring failed: ${err.message}`, 'error');
  } finally {
    setLoading('score-btn', false, '⚡ Score Deal');
  }
}

function renderScoreResults(result) {
  const resultsEl = document.getElementById('score-results');
  if (!resultsEl) return;

  resultsEl.classList.remove('hidden');

  renderScoreMeter(document.getElementById('score-meter-container'), result.score);
  renderFactorBars(document.getElementById('score-factors-container'), result.factors);
  renderRecommendation(document.getElementById('score-recommendation-container'), result.recommendation);

  const explanationEl = document.getElementById('score-explanation');
  if (explanationEl) explanationEl.textContent = result.explanation || '';

  // Scroll into view
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// -----------------------------------------------------------------------
// Deck Analyzer
// -----------------------------------------------------------------------
async function handleAnalyzeDeck() {
  const deckText = document.getElementById('deck-text')?.value.trim();
  if (!deckText || deckText.length < 20) {
    showAlert('analyze-alert', 'Please paste some pitch deck text (minimum 20 characters).', 'error');
    return;
  }

  setLoading('analyze-btn', true, 'Analyzing…');
  clearAlert('analyze-alert');

  try {
    const result = await analyzeDeck(deckText);

    // Auto-populate the scoring form
    setFieldValue('score-company', result.company);
    setFieldValue('score-description', result.description);
    setFieldValue('score-sector', result.sector);
    setFieldValue('score-geography', result.geography);
    setFieldValue('score-ask', result.askAmount);

    // Select stage option if it matches
    const stageEl = document.getElementById('score-stage');
    if (stageEl && result.stage) {
      const options = Array.from(stageEl.options);
      const match = options.find(o => o.value.toLowerCase() === result.stage.toLowerCase());
      if (match) stageEl.value = match.value;
    }

    // Store extra fields for later memo generation
    state.currentDealExtras = {
      founders: result.founders,
      marketSize: result.marketSize,
      traction: result.traction,
      competition: result.competition,
      businessModel: result.businessModel,
    };

    showAlert('analyze-alert', `Extracted data for "${result.company}". Review and score below.`, 'success', 5000);

    // Clear deck text
    const deckEl = document.getElementById('deck-text');
    if (deckEl) deckEl.value = '';
  } catch (err) {
    showAlert('analyze-alert', `Analysis failed: ${err.message}`, 'error');
  } finally {
    setLoading('analyze-btn', false, '🔍 Analyze Deck');
  }
}

// -----------------------------------------------------------------------
// IC Memo
// -----------------------------------------------------------------------
async function handleGenerateMemo() {
  const company = document.getElementById('memo-company')?.value.trim();
  const description = document.getElementById('memo-description')?.value.trim();
  const sector = document.getElementById('memo-sector')?.value.trim();
  const stage = document.getElementById('memo-stage')?.value;
  const founders = document.getElementById('memo-founders')?.value.trim();
  const marketSize = document.getElementById('memo-market-size')?.value.trim();
  const traction = document.getElementById('memo-traction')?.value.trim();
  const competition = document.getElementById('memo-competition')?.value.trim();

  if (!company || !description) {
    showAlert('memo-alert', 'Company name and description are required.', 'error');
    return;
  }

  setLoading('memo-btn', true, 'Generating memo…');
  clearAlert('memo-alert');
  document.getElementById('memo-output-section')?.classList.add('hidden');

  try {
    const matchScore = state.currentDeal?.company?.toLowerCase() === company.toLowerCase()
      ? state.currentDeal.score
      : null;

    const result = await generateICMemo({
      company,
      description,
      sector,
      stage,
      founders,
      marketSize,
      traction,
      competition,
      fundThesis: state.fundThesis,
      matchScore,
    });

    // Save memo to the matching deal
    const dealIdx = state.deals.findIndex(
      d => d.company.toLowerCase() === company.toLowerCase()
    );
    if (dealIdx >= 0) {
      state.deals[dealIdx].memo = result.memo;
      state.deals[dealIdx].status = 'IC Ready';
      if (state.currentDeal?.company?.toLowerCase() === company.toLowerCase()) {
        state.currentDeal.memo = result.memo;
        state.currentDeal.status = 'IC Ready';
      }
      saveState();
    }

    renderMemoOutput(result.memo);
  } catch (err) {
    showAlert('memo-alert', `Memo generation failed: ${err.message}`, 'error');
  } finally {
    setLoading('memo-btn', false, '📄 Generate IC Memo');
  }
}

function renderMemoOutput(memoMarkdown) {
  const section = document.getElementById('memo-output-section');
  const outputEl = document.getElementById('memo-output');
  if (!section || !outputEl) return;

  // Use marked.js (loaded via CDN in index.html)
  if (window.marked) {
    outputEl.innerHTML = window.marked.parse(memoMarkdown);
  } else {
    // Fallback: simple markdown to HTML
    outputEl.innerHTML = simpleMdToHtml(memoMarkdown);
  }

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Store raw for copy/download
  outputEl.dataset.rawMemo = memoMarkdown;
}

function handleCopyMemo() {
  const outputEl = document.getElementById('memo-output');
  const raw = outputEl?.dataset.rawMemo;
  if (!raw) return;

  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('copy-memo-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}

function handleDownloadMemo() {
  const outputEl = document.getElementById('memo-output');
  const raw = outputEl?.dataset.rawMemo;
  const company = document.getElementById('memo-company')?.value.trim() || 'deal';
  if (!raw) return;

  const blob = new Blob([raw], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IC-Memo-${company.replace(/\s+/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------
// Why Now Signals
// -----------------------------------------------------------------------
async function handleGetSignals() {
  const company = document.getElementById('memo-company')?.value.trim()
    || document.getElementById('score-company')?.value.trim();
  const sector = document.getElementById('memo-sector')?.value.trim()
    || document.getElementById('score-sector')?.value.trim();
  const description = document.getElementById('memo-description')?.value.trim()
    || document.getElementById('score-description')?.value.trim();

  if (!company || !description) {
    showAlert('signals-alert', 'Fill in company name and description first.', 'error');
    return;
  }

  setLoading('signals-btn', true, 'Fetching signals…');
  clearAlert('signals-alert');
  document.getElementById('signals-output')?.classList.add('hidden');

  try {
    const result = await getWhyNowSignals({ company, sector, description });
    renderSignals(result);
  } catch (err) {
    showAlert('signals-alert', `Signal fetch failed: ${err.message}`, 'error');
  } finally {
    setLoading('signals-btn', false, '⚡ Why Now?');
  }
}

function renderSignals(result) {
  const container = document.getElementById('signals-output');
  if (!container) return;

  container.classList.remove('hidden');

  const narrativeHtml = result.narrative
    ? `<div class="card card-sm mb-3" style="border-left: 3px solid var(--accent-blue);">
         <div class="card-title">Why Now Narrative</div>
         <p class="text-secondary" style="font-size:13px;line-height:1.7">${escHtml(result.narrative)}</p>
       </div>`
    : '';

  const signalsHtml = (result.signals || []).map(s => `
    <div class="signal-card">
      <div class="signal-title">${escHtml(s.title)}</div>
      <div class="signal-desc">${escHtml(s.description)}</div>
      <div class="signal-relevance">→ ${escHtml(s.relevance)}</div>
    </div>
  `).join('');

  container.innerHTML = narrativeHtml + `<div class="signal-cards">${signalsHtml}</div>`;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// -----------------------------------------------------------------------
// Pipeline
// -----------------------------------------------------------------------
function renderPipelineView() {
  const container = document.getElementById('pipeline-container');
  if (!container) return;

  renderPipeline(container, state.deals, {
    onStatusChange: (dealId, newStatus) => {
      const deal = state.deals.find(d => d.id === dealId);
      if (deal) {
        deal.status = newStatus;
        saveState();
      }
    },
    onDelete: (dealId) => {
      state.deals = state.deals.filter(d => d.id !== dealId);
      saveState();
      renderPipelineView();
      renderDashboardStats();
    },
    onViewMemo: (deal) => {
      goToMemoForDeal(deal);
    },
    onRescoreDeal: (deal) => {
      // Populate score form and switch to score view
      setFieldValue('score-company', deal.company);
      setFieldValue('score-description', deal.description);
      setFieldValue('score-sector', deal.sector);
      setFieldValue('score-geography', deal.geography);
      setFieldValue('score-ask', deal.askAmount);
      showView('score');
    },
  });
}

// Global helper called from inline onclick in renderRecentDeals
window.goToMemo = function(dealId) {
  const deal = state.deals.find(d => d.id === dealId);
  if (deal) goToMemoForDeal(deal);
};

function goToMemoForDeal(deal) {
  setFieldValue('memo-company', deal.company);
  setFieldValue('memo-description', deal.description);
  setFieldValue('memo-sector', deal.sector);
  setFieldValue('memo-founders', deal.founders || '');
  setFieldValue('memo-market-size', deal.marketSize || '');
  setFieldValue('memo-traction', deal.traction || '');
  setFieldValue('memo-competition', deal.competition || '');

  const stageEl = document.getElementById('memo-stage');
  if (stageEl && deal.stage) {
    const options = Array.from(stageEl.options);
    const match = options.find(o => o.value.toLowerCase() === deal.stage.toLowerCase());
    if (match) stageEl.value = match.value;
  }

  // If memo already exists, display it immediately
  if (deal.memo) {
    renderMemoOutput(deal.memo);
  } else {
    document.getElementById('memo-output-section')?.classList.add('hidden');
  }

  showView('memo');
}

// -----------------------------------------------------------------------
// Quick-add deal from dashboard
// -----------------------------------------------------------------------
async function handleQuickAddDeal() {
  const company = document.getElementById('quick-company')?.value.trim();
  const description = document.getElementById('quick-description')?.value.trim();

  if (!company || !description) {
    showAlert('quick-alert', 'Company name and description are required.', 'error');
    return;
  }

  setFieldValue('score-company', company);
  setFieldValue('score-description', description);
  showView('score');
}

// -----------------------------------------------------------------------
// API health check
// -----------------------------------------------------------------------
async function checkApiStatus() {
  const dot = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  try {
    const health = await checkHealth();
    if (health.hasApiKey) {
      if (dot) dot.className = 'status-dot connected';
      if (text) text.textContent = 'API connected';
    } else {
      if (dot) dot.className = 'status-dot error';
      if (text) text.textContent = 'No API key';
    }
  } catch {
    if (dot) dot.className = 'status-dot error';
    if (text) text.textContent = 'Server offline';
  }
}

// -----------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------
function setLoading(btnId, loading, loadingText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    btn.innerHTML = btn.dataset.origText || loadingText;
  }
}

function showAlert(containerId, message, type = 'error', autoDismiss = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type}">${escHtml(message)}</div>`;
  container.classList.remove('hidden');
  if (autoDismiss > 0) {
    setTimeout(() => clearAlert(containerId), autoDismiss);
  }
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
    container.classList.add('hidden');
  }
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Minimal markdown → HTML for fallback (when marked.js isn't available) */
function simpleMdToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>');
}

// -----------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------
function init() {
  loadState();
  populateThesisForm();
  renderDashboardStats();
  checkApiStatus();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => showView(el.dataset.view));
  });

  // Fund thesis
  document.getElementById('save-thesis-btn')?.addEventListener('click', saveFundThesis);

  // Score deal
  document.getElementById('score-btn')?.addEventListener('click', handleScoreDeal);
  document.getElementById('score-to-memo-btn')?.addEventListener('click', () => {
    if (state.currentDeal) goToMemoForDeal(state.currentDeal);
  });

  // Deck analyzer
  document.getElementById('analyze-btn')?.addEventListener('click', handleAnalyzeDeck);

  // IC Memo
  document.getElementById('memo-btn')?.addEventListener('click', handleGenerateMemo);
  document.getElementById('copy-memo-btn')?.addEventListener('click', handleCopyMemo);
  document.getElementById('download-memo-btn')?.addEventListener('click', handleDownloadMemo);
  document.getElementById('signals-btn')?.addEventListener('click', handleGetSignals);

  // Quick-add from dashboard
  document.getElementById('quick-add-btn')?.addEventListener('click', handleQuickAddDeal);

  // Show initial view
  showView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
