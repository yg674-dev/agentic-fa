/**
 * app.js — Main application controller for DealFlow AI.
 *
 * Manages:
 *  - View navigation
 *  - Mock data display (dashboard, deal flow, AI matches)
 *  - Real API calls for score and memo pages
 *  - localStorage persistence for deals
 */

import { scoreThesisAlignment, generateICMemo } from './api.js';
import { renderScoreResult, clearScoreResult, getScoreClass } from './scoring.js';

// -----------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------

const MOCK_STARTUPS = [
  {
    id: 'finflow-ai',
    name: 'FinFlow AI',
    tagline: 'AI-powered financial operations for SMBs',
    sector: 'FinTech',
    stage: 'Seed',
    location: 'San Francisco, CA',
    arr: '$540K',
    arrRaw: 540000,
    growth: '18% MoM',
    growthRaw: 18,
    seeking: '$3M',
    seekingRaw: 3000000,
    score: 85,
    description: 'FinFlow AI automates accounts payable, receivable, and cash flow forecasting for SMBs using large language models trained on financial data. Reduces CFO workload by 60% and provides real-time treasury insights.',
    aiInsight: 'Strong product-market fit in underserved SMB finance segment. 18% MoM growth signals strong demand. AI moat in financial domain is compelling.',
    factors: [
      { name: 'Stage Fit', score: 90, reason: 'Seed stage aligns perfectly with fund mandate' },
      { name: 'Sector Alignment', score: 95, reason: 'FinTech is core thesis sector' },
      { name: 'Check Size', score: 85, reason: '$3M ask within target range' },
      { name: 'Geography', score: 80, reason: 'SF hub with strong talent access' },
      { name: 'Thematic Fit', score: 88, reason: 'AI + finance is high conviction theme' },
    ],
    aiReasons: [
      'Exceptional MoM growth rate of 18% at Seed stage',
      'Large addressable market: 30M+ SMBs underserved by legacy tools',
      'AI-native architecture creates durable competitive moat',
      'Strong founder background in enterprise fintech',
    ],
    team: 12,
  },
  {
    id: 'medmatch',
    name: 'MedMatch',
    tagline: 'Connecting patients with the right specialists faster',
    sector: 'HealthTech',
    stage: 'Series A',
    location: 'Boston, MA',
    arr: '$2.16M',
    arrRaw: 2160000,
    growth: '25% MoM',
    growthRaw: 25,
    seeking: '$15M',
    seekingRaw: 15000000,
    score: 79,
    description: 'MedMatch uses AI to match patients with appropriate specialists in under 24 hours, reducing average wait times from 3 weeks to 2 days. Integrated with 200+ hospital systems and major insurance providers.',
    aiInsight: 'Exceptional growth at 25% MoM with strong network effects across hospital systems. Series A metrics are above benchmark for HealthTech.',
    factors: [
      { name: 'Stage Fit', score: 75, reason: 'Series A — at the upper end of stage focus' },
      { name: 'Sector Alignment', score: 85, reason: 'HealthTech is secondary thesis sector' },
      { name: 'Check Size', score: 70, reason: '$15M ask is at the high end' },
      { name: 'Geography', score: 80, reason: 'Boston HealthTech hub' },
      { name: 'Thematic Fit', score: 82, reason: 'AI in healthcare is strong theme' },
    ],
    aiReasons: [
      'Best-in-class 25% MoM growth rate for Series A HealthTech',
      'Network effects with 200+ hospital integrations create high switching costs',
      'Regulatory tailwinds from CMS interoperability mandates',
      'Clear path to $100M+ ARR within 24 months at current trajectory',
    ],
    team: 34,
  },
  {
    id: 'datavault',
    name: 'DataVault',
    tagline: 'Zero-trust data security for the modern enterprise',
    sector: 'SaaS',
    stage: 'Seed',
    location: 'Austin, TX',
    arr: '$780K',
    arrRaw: 780000,
    growth: '22% MoM',
    growthRaw: 22,
    seeking: '$5M',
    seekingRaw: 5000000,
    score: 91,
    description: 'DataVault provides a zero-trust data security platform that automatically discovers, classifies, and protects sensitive data across cloud and on-premise environments. Deployed at 45 enterprise customers with zero churn.',
    aiInsight: 'Top-tier fundamentals: 22% MoM growth, zero churn, and expanding in a $40B market. Best match in current deal flow.',
    factors: [
      { name: 'Stage Fit', score: 95, reason: 'Seed stage is sweet spot for fund' },
      { name: 'Sector Alignment', score: 90, reason: 'SaaS + Security = high conviction' },
      { name: 'Check Size', score: 92, reason: '$5M perfectly sized check' },
      { name: 'Geography', score: 88, reason: 'Austin tech ecosystem growing rapidly' },
      { name: 'Thematic Fit', score: 94, reason: 'Zero-trust security is major tailwind theme' },
    ],
    aiReasons: [
      'Zero customer churn demonstrates exceptional product stickiness',
      'NRR likely >130% based on expansion metrics disclosed',
      'Zero-trust security market growing at 23% CAGR through 2028',
      'Austin HQ with access to strong engineering talent at lower burn',
    ],
    team: 18,
  },
  {
    id: 'greengrid',
    name: 'GreenGrid',
    tagline: 'Smart energy management for industrial facilities',
    sector: 'CleanTech',
    stage: 'Series A',
    location: 'Denver, CO',
    arr: '$3.84M',
    arrRaw: 3840000,
    growth: '15% MoM',
    growthRaw: 15,
    seeking: '$25M',
    seekingRaw: 25000000,
    score: 52,
    description: 'GreenGrid deploys AI-driven energy management systems in large industrial facilities, reducing energy costs by 25-40% and enabling compliance with new EPA industrial efficiency standards.',
    aiInsight: 'Solid ARR and real impact metrics, but $25M ask exceeds typical check size. CleanTech is not a core thesis sector — consider for co-investment.',
    factors: [
      { name: 'Stage Fit', score: 55, reason: 'Series A at $25M is above typical entry' },
      { name: 'Sector Alignment', score: 40, reason: 'CleanTech is outside core thesis' },
      { name: 'Check Size', score: 30, reason: '$25M significantly exceeds check range' },
      { name: 'Geography', score: 65, reason: 'Denver is emerging tech market' },
      { name: 'Thematic Fit', score: 60, reason: 'Industrial AI is adjacent to thesis' },
    ],
    aiReasons: [
      'Strong $3.84M ARR but check size mismatch with fund strategy',
      'CleanTech hardware + software stack creates higher capital intensity',
      'EPA regulation tailwind is real but execution risk is elevated',
      'Better fit as co-investment with specialized climate fund',
    ],
    team: 52,
  },
  {
    id: 'codementor-ai',
    name: 'CodeMentor AI',
    tagline: 'Personalized AI coding tutor for developers',
    sector: 'EdTech',
    stage: 'Seed',
    location: 'New York, NY',
    arr: '$320K',
    arrRaw: 320000,
    growth: '30% MoM',
    growthRaw: 30,
    seeking: '$4M',
    seekingRaw: 4000000,
    score: 76,
    description: 'CodeMentor AI provides personalized, context-aware coding guidance using fine-tuned LLMs. Integrates with VS Code, GitHub, and Jira to understand a developer\'s exact codebase and provide hyper-relevant learning paths.',
    aiInsight: 'Impressive 30% MoM growth trajectory at early stage. Developer-tools + EdTech intersection is compelling with strong retention signals.',
    factors: [
      { name: 'Stage Fit', score: 90, reason: 'Seed stage perfectly aligns' },
      { name: 'Sector Alignment', score: 75, reason: 'EdTech adjacent to core AI/ML focus' },
      { name: 'Check Size', score: 88, reason: '$4M within target range' },
      { name: 'Geography', score: 78, reason: 'NYC strong for dev tools community' },
      { name: 'Thematic Fit', score: 80, reason: 'AI developer tools is high-conviction theme' },
    ],
    aiReasons: [
      '30% MoM growth rate is exceptional for EdTech SaaS at Seed',
      'IDE integration creates powerful daily-use habit formation',
      'Developer tools show strongest NPS in consumer software category',
      'Clear enterprise expansion path through team and org licensing',
    ],
    team: 8,
  },
  {
    id: 'secureflow',
    name: 'SecureFlow',
    tagline: 'Automated compliance for cloud-native engineering teams',
    sector: 'Cybersecurity',
    stage: 'Series A',
    location: 'Seattle, WA',
    arr: '$1.8M',
    arrRaw: 1800000,
    growth: '20% MoM',
    growthRaw: 20,
    seeking: '$12M',
    seekingRaw: 12000000,
    score: 82,
    description: 'SecureFlow automates SOC2, ISO 27001, and HIPAA compliance for engineering teams using AI-powered policy-as-code. Reduces compliance audit preparation from 6 months to 2 weeks.',
    aiInsight: 'Compliance automation is a massive pain point for Series A+ startups. Strong ICP focus and 20% MoM growth makes this a compelling opportunity.',
    factors: [
      { name: 'Stage Fit', score: 78, reason: 'Series A — within fund scope' },
      { name: 'Sector Alignment', score: 92, reason: 'Cybersecurity is core thesis sector' },
      { name: 'Check Size', score: 82, reason: '$12M ask is reasonable for Stage' },
      { name: 'Geography', score: 85, reason: 'Seattle strong tech ecosystem' },
      { name: 'Thematic Fit', score: 90, reason: 'Compliance AI is high-demand theme' },
    ],
    aiReasons: [
      'Compliance burden growing 40% YoY as regulations expand globally',
      'Strong ICP: every Series A+ startup must achieve SOC2',
      'Policy-as-code approach is defensible and integrates with CI/CD pipelines',
      '20% MoM growth with documented enterprise deals validates B2B motion',
    ],
    team: 28,
  },
  {
    id: 'agroai',
    name: 'AgroAI',
    tagline: 'Precision agriculture intelligence for mid-size farms',
    sector: 'SaaS',
    stage: 'Seed',
    location: 'Des Moines, IA',
    arr: '$410K',
    arrRaw: 410000,
    growth: '12% MoM',
    growthRaw: 12,
    seeking: '$3.5M',
    seekingRaw: 3500000,
    score: 61,
    description: 'AgroAI combines satellite imagery, IoT soil sensors, and weather data to give mid-size farms actionable insights on planting, irrigation, and harvesting — delivered via a mobile app with offline-first architecture.',
    aiInsight: 'AgTech is niche but growing. 12% MoM is decent for the vertical. Geography and sector are outside core thesis but team quality is high.',
    factors: [
      { name: 'Stage Fit', score: 85, reason: 'Seed stage is ideal entry point' },
      { name: 'Sector Alignment', score: 50, reason: 'AgTech SaaS is outside core sectors' },
      { name: 'Check Size', score: 82, reason: '$3.5M is within check range' },
      { name: 'Geography', score: 45, reason: 'Midwest geography is outside typical focus' },
      { name: 'Thematic Fit', score: 55, reason: 'AgTech is adjacent but not primary thesis' },
    ],
    aiReasons: [
      'Offline-first architecture solves real connectivity pain for rural customers',
      'Regulatory push for precision agriculture creates favorable tailwinds',
      'Team has strong agronomy + ML domain expertise combination',
      'Expansion opportunity in South America and Southeast Asia is large',
    ],
    team: 11,
  },
  {
    id: 'pulsehealth',
    name: 'PulseHealth',
    tagline: 'Continuous cardiac monitoring for at-risk patients at home',
    sector: 'HealthTech',
    stage: 'Series A',
    location: 'Chicago, IL',
    arr: '$1.2M',
    arrRaw: 1200000,
    growth: '16% MoM',
    growthRaw: 16,
    seeking: '$10M',
    seekingRaw: 10000000,
    score: 70,
    description: 'PulseHealth\'s wearable + AI platform continuously monitors cardiac patients at home, detecting anomalies and alerting care teams in real-time. FDA 510(k) cleared. Partnered with 12 major hospital networks.',
    aiInsight: 'FDA clearance and hospital partnerships are strong validation signals. HealthTech with recurring SaaS model is attractive. Check size is manageable.',
    factors: [
      { name: 'Stage Fit', score: 72, reason: 'Series A — within fund stage range' },
      { name: 'Sector Alignment', score: 82, reason: 'HealthTech with strong clinical validation' },
      { name: 'Check Size', score: 78, reason: '$10M ask is manageable' },
      { name: 'Geography', score: 68, reason: 'Chicago is growing health-tech hub' },
      { name: 'Thematic Fit', score: 75, reason: 'Remote patient monitoring is major macro trend' },
    ],
    aiReasons: [
      'FDA 510(k) clearance significantly de-risks regulatory path',
      '12 hospital network partnerships create strong distribution moat',
      'Aging demographics drive structural demand for home cardiac monitoring',
      'Recurring SaaS + device model generates high LTV per patient',
    ],
    team: 41,
  },
];

const MOCK_DEALS = [
  {
    id: 'deal-1',
    company: 'FinFlow AI',
    stage: 'Due Diligence',
    assignee: 'Jennifer Smith',
    date: '2026-03-18',
    score: 85,
  },
  {
    id: 'deal-2',
    company: 'MedMatch',
    stage: 'Term Sheet',
    assignee: 'Michael Chen',
    date: '2026-03-15',
    score: 79,
  },
  {
    id: 'deal-3',
    company: 'DataVault',
    stage: 'Reviewing',
    assignee: 'Jennifer Smith',
    date: '2026-03-17',
    score: 91,
  },
  {
    id: 'deal-4',
    company: 'CodeMentor AI',
    stage: 'New',
    assignee: 'Alex Rodriguez',
    date: '2026-03-18',
    score: 76,
  },
];

// -----------------------------------------------------------------------
// State
// -----------------------------------------------------------------------
const state = {
  fundThesis: {
    sectors: [],
    stages: [],
    minCheck: '',
    maxCheck: '',
    geography: '',
  },
  deals: JSON.parse(localStorage.getItem('agenticfa_deals') || '[]'),
  currentDeal: null,
  currentView: 'dashboard',
  matchesTab: 'all',
  dealflowFilter: { search: '', stage: '', sector: '', sort: 'score-desc' },
};

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function saveDeals() {
  try {
    localStorage.setItem('agenticfa_deals', JSON.stringify(state.deals));
  } catch { /* ignore quota errors */ }
}

function setLoading(btnId, loading, loadingText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner spinner-white"></span> ${loadingText}`;
  } else {
    btn.innerHTML = btn.dataset.origHtml || loadingText;
  }
}

function showAlert(containerId, message, type = 'error', autoDismiss = 0) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${escHtml(message)}</div>`;
  el.classList.remove('hidden');
  if (autoDismiss > 0) setTimeout(() => clearAlert(containerId), autoDismiss);
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) { el.innerHTML = ''; el.classList.add('hidden'); }
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el && value !== null && value !== undefined) el.value = value;
}

function badgeForStage(stage) {
  const map = {
    'Due Diligence': 'badge-due-diligence',
    'Term Sheet': 'badge-term-sheet',
    'Reviewing': 'badge-reviewing',
    'New': 'badge-new',
    'Passed': 'badge-passed',
  };
  return map[stage] || 'badge-secondary';
}

function scoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  return 'score-moderate';
}

function scoreBgClass(score) {
  if (score >= 80) return 'score-bg-excellent';
  if (score >= 60) return 'score-bg-good';
  return 'score-bg-moderate';
}

function scoreCategoryLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Moderate';
}

function avatarLetters(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// -----------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------
function navigateTo(viewName) {
  state.currentView = viewName;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });

  // Show/hide pages
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('active', el.id === `page-${viewName}`);
  });

  // Page-specific init
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'dealflow') renderDealFlow();
  if (viewName === 'matches') renderMatches();
}

// Expose globally for inline onclick attributes
window.navigateTo = navigateTo;

// -----------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------
function renderDashboard() {
  renderTopMatches();
  renderActivityList();
  renderPipelineStageChart();
  renderSectorPieChart();
}

function renderTopMatches() {
  const container = document.getElementById('dashboard-top-matches');
  if (!container) return;

  const topThree = [...MOCK_STARTUPS]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  container.innerHTML = topThree.map(s => {
    const tier = scoreClass(s.score);
    const bgTier = scoreBgClass(s.score);
    return `
      <div class="match-card" style="margin-bottom:10px;">
        <div class="match-card-avatar">${avatarLetters(s.name)}</div>
        <div class="match-card-body">
          <div class="match-card-name">${escHtml(s.name)}</div>
          <div class="match-card-meta">
            <span class="badge badge-sector">${escHtml(s.sector)}</span>
            <span class="badge badge-secondary">${escHtml(s.stage)}</span>
          </div>
          <div class="match-card-metrics">
            <div class="match-metric">
              <span class="match-metric-label">ARR</span>
              <span class="match-metric-value">${escHtml(s.arr)}</span>
            </div>
            <div class="match-metric">
              <span class="match-metric-label">Growth</span>
              <span class="match-metric-value">${escHtml(s.growth)}</span>
            </div>
            <div class="match-metric">
              <span class="match-metric-label">Seeking</span>
              <span class="match-metric-value">${escHtml(s.seeking)}</span>
            </div>
          </div>
        </div>
        <div class="match-card-score">
          <div class="${bgTier}">
            <div class="score-number ${tier}" style="font-size:24px;font-weight:800;line-height:1;letter-spacing:-1px;">${s.score}</div>
            <div class="score-label ${tier}" style="font-size:9px;text-align:center;">${scoreCategoryLabel(s.score)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActivityList() {
  const container = document.getElementById('dashboard-activity');
  if (!container) return;

  container.innerHTML = MOCK_DEALS.map(deal => {
    const startup = MOCK_STARTUPS.find(s => s.name === deal.company);
    const score = startup ? startup.score : deal.score;
    const tier = scoreClass(score);
    return `
      <div class="activity-item">
        <div class="activity-avatar">${avatarLetters(deal.company)}</div>
        <div class="activity-body">
          <div class="activity-name">${escHtml(deal.company)}</div>
          <div class="activity-meta">${escHtml(deal.assignee)} · ${deal.date}</div>
        </div>
        <span class="badge ${badgeForStage(deal.stage)}">${escHtml(deal.stage)}</span>
      </div>
    `;
  }).join('');
}

function renderPipelineStageChart() {
  const container = document.getElementById('chart-pipeline-stage');
  if (!container) return;

  const stages = [
    { label: 'Due Diligence', count: 1, color: '#9333ea', pct: 25 },
    { label: 'Reviewing', count: 1, color: '#2563eb', pct: 25 },
    { label: 'Term Sheet', count: 1, color: '#16a34a', pct: 25 },
    { label: 'New', count: 1, color: '#6b7280', pct: 25 },
  ];

  container.innerHTML = stages.map(s => `
    <div class="chart-bar-row">
      <span class="chart-bar-label">${escHtml(s.label)}</span>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" data-pct="${s.pct}" style="background:${s.color};width:0%;">${s.count}</div>
      </div>
    </div>
  `).join('');

  // Animate bars
  requestAnimationFrame(() => {
    container.querySelectorAll('.chart-bar-fill').forEach(el => {
      const pct = el.dataset.pct;
      setTimeout(() => { el.style.width = `${pct}%`; }, 100);
    });
  });
}

function renderSectorPieChart() {
  const container = document.getElementById('chart-sector');
  if (!container) return;

  const sectors = [
    { label: 'FinTech', pct: 25, color: '#2563eb' },
    { label: 'HealthTech', pct: 25, color: '#9333ea' },
    { label: 'SaaS', pct: 25, color: '#16a34a' },
    { label: 'CleanTech', pct: 12, color: '#ca8a04' },
    { label: 'Other', pct: 13, color: '#9ca3af' },
  ];

  // Simple SVG donut chart
  let cumulativePct = 0;
  const r = 52;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const gap = 1;

  const paths = sectors.map(s => {
    const dashArray = (s.pct / 100) * circumference - gap;
    const offset = circumference - (cumulativePct / 100) * circumference;
    cumulativePct += s.pct;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="18"
      stroke-dasharray="${dashArray} ${circumference}"
      stroke-dashoffset="${offset}"
      transform="rotate(-90 ${cx} ${cy})" />`;
  }).join('');

  const legend = sectors.map(s => `
    <div class="pie-legend-item">
      <div class="pie-dot" style="background:${s.color};"></div>
      <span class="pie-legend-label">${escHtml(s.label)}</span>
      <span class="pie-legend-pct">${s.pct}%</span>
    </div>
  `).join('');

  container.innerHTML = `
    <svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0;">${paths}</svg>
    <div class="pie-legend">${legend}</div>
  `;
}

// -----------------------------------------------------------------------
// Deal Flow
// -----------------------------------------------------------------------
function renderDealFlow() {
  const { search, stage, sector, sort } = state.dealflowFilter;

  let filtered = [...MOCK_STARTUPS];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }
  if (stage) filtered = filtered.filter(s => s.stage === stage);
  if (sector) filtered = filtered.filter(s => s.sector === sector);

  if (sort === 'score-desc') filtered.sort((a, b) => b.score - a.score);
  else if (sort === 'score-asc') filtered.sort((a, b) => a.score - b.score);
  else if (sort === 'arr-desc') filtered.sort((a, b) => b.arrRaw - a.arrRaw);
  else if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const countEl = document.getElementById('dealflow-count');
  if (countEl) countEl.textContent = `${filtered.length} startup${filtered.length !== 1 ? 's' : ''} found`;

  const grid = document.getElementById('dealflow-grid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="empty-state-title">No startups match your filters</div>
        <div class="empty-state-sub">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(s => renderStartupCard(s)).join('');
}

function renderStartupCard(s) {
  const tier = scoreClass(s.score);
  const bgTier = scoreBgClass(s.score);
  return `
    <div class="startup-card">
      <div class="startup-card-header">
        <div>
          <div class="startup-card-name">${escHtml(s.name)}</div>
          <div class="startup-card-tagline">${escHtml(s.tagline)}</div>
        </div>
        <div class="${bgTier}" style="text-align:center;min-width:54px;">
          <div class="score-number ${tier}" style="font-size:22px;font-weight:800;line-height:1;letter-spacing:-1px;">${s.score}</div>
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;" class="${tier}">${scoreCategoryLabel(s.score)}</div>
        </div>
      </div>
      <div class="startup-card-badges">
        <span class="badge badge-sector">${escHtml(s.sector)}</span>
        <span class="badge badge-secondary">${escHtml(s.stage)}</span>
        <span class="badge badge-outline">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${escHtml(s.location)}
        </span>
      </div>
      <div class="startup-card-desc">${escHtml(s.description)}</div>
      <div class="startup-metrics-grid">
        <div class="startup-metric">
          <div class="startup-metric-label">ARR</div>
          <div class="startup-metric-value">${escHtml(s.arr)}</div>
        </div>
        <div class="startup-metric">
          <div class="startup-metric-label">Growth</div>
          <div class="startup-metric-value" style="color:var(--green-600);">${escHtml(s.growth)}</div>
        </div>
        <div class="startup-metric">
          <div class="startup-metric-label">Team</div>
          <div class="startup-metric-value">${s.team}</div>
        </div>
        <div class="startup-metric">
          <div class="startup-metric-label">Stage</div>
          <div class="startup-metric-value">${escHtml(s.stage)}</div>
        </div>
      </div>
      <div class="startup-card-funding">
        <span class="funding-label">Seeking</span>
        <span class="funding-value">${escHtml(s.seeking)}</span>
      </div>
      <div class="ai-insight">
        <div class="ai-insight-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.204L6 21l5.447-2.724A10.7 10.7 0 0 0 12 18.23c4.97 0 9-3.185 9-7.115S16.97 3 12 3z"></path>
          </svg>
          AI Insight
        </div>
        <p>${escHtml(s.aiInsight)}</p>
      </div>
      <div class="startup-card-actions">
        <button class="btn btn-outline btn-sm" style="flex:1;">View Details</button>
        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="addToPipeline('${s.id}')">Add to Pipeline</button>
      </div>
    </div>
  `;
}

window.addToPipeline = function(startupId) {
  const startup = MOCK_STARTUPS.find(s => s.id === startupId);
  if (!startup) return;
  // Add to localStorage deals if not already present
  const existing = state.deals.find(d => d.company === startup.name);
  if (!existing) {
    state.deals.push({
      id: Date.now().toString(),
      company: startup.name,
      sector: startup.sector,
      stage: startup.stage,
      score: startup.score,
      status: 'New',
      createdAt: new Date().toISOString(),
    });
    saveDeals();
  }
  // Visual feedback
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = '✓ Added';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2000);
};

// -----------------------------------------------------------------------
// AI Matches
// -----------------------------------------------------------------------
function renderMatches() {
  const tab = state.matchesTab;
  const allStartups = [...MOCK_STARTUPS].sort((a, b) => b.score - a.score);

  const excellent = allStartups.filter(s => s.score >= 80);
  const good = allStartups.filter(s => s.score >= 60 && s.score < 80);
  const moderate = allStartups.filter(s => s.score < 60);

  // Update stat numbers
  const exEl = document.getElementById('match-stat-excellent');
  if (exEl) exEl.textContent = excellent.length;
  const goodEl = document.getElementById('match-stat-good');
  if (goodEl) goodEl.textContent = good.length;
  const totalEl = document.getElementById('match-stat-total');
  if (totalEl) totalEl.textContent = allStartups.length;

  // Filter by tab
  let toShow;
  if (tab === 'excellent') toShow = excellent;
  else if (tab === 'good') toShow = good;
  else if (tab === 'moderate') toShow = moderate;
  else toShow = allStartups;

  const container = document.getElementById('matches-list');
  if (!container) return;

  if (toShow.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="empty-state-title">No matches in this category</div>
        <div class="empty-state-sub">Switch tabs to see other matches</div>
      </div>
    `;
    return;
  }

  container.innerHTML = toShow.map(s => renderFullMatchCard(s)).join('');

  // Animate progress bars after render
  requestAnimationFrame(() => {
    container.querySelectorAll('[data-progress]').forEach(el => {
      const val = parseInt(el.dataset.progress, 10);
      setTimeout(() => { el.style.width = `${val}%`; }, 80);
    });
  });
}

function renderFullMatchCard(s) {
  const tier = scoreClass(s.score);
  const bgTier = scoreBgClass(s.score);
  const factors = s.factors || [];

  const factorProgressClass = (score) => {
    if (score >= 80) return 'progress-fill-green';
    if (score >= 60) return 'progress-fill-blue';
    return '';
  };

  const reasonsBullets = (s.aiReasons || []).map(r => `
    <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:5px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;color:var(--purple-600);">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span style="font-size:12.5px;color:var(--purple-700);line-height:1.5;">${escHtml(r)}</span>
    </div>
  `).join('');

  return `
    <div class="full-match-card">
      <div class="full-match-header">
        <div class="full-match-info">
          <div class="full-match-name">${escHtml(s.name)}</div>
          <div class="full-match-sub">${escHtml(s.tagline)} · ${escHtml(s.location)}</div>
          <div class="full-match-badges">
            <span class="badge badge-sector">${escHtml(s.sector)}</span>
            <span class="badge badge-secondary">${escHtml(s.stage)}</span>
            <span class="badge badge-outline">ARR ${escHtml(s.arr)}</span>
            <span class="badge badge-outline" style="color:var(--green-600);border-color:var(--green-100);background:var(--green-50);">${escHtml(s.growth)}</span>
          </div>
        </div>
        <div class="${bgTier}" style="text-align:center;">
          <div class="score-number ${tier}" style="font-size:36px;font-weight:800;line-height:1;letter-spacing:-2px;">${s.score}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;margin-top:2px;" class="${tier}">${scoreCategoryLabel(s.score)} Match</div>
        </div>
      </div>

      <!-- 5-factor breakdown -->
      <div class="breakdown-grid">
        ${factors.map(f => `
          <div class="breakdown-item">
            <div class="breakdown-label">${escHtml(f.name)}</div>
            <div class="progress-track">
              <div class="progress-fill ${factorProgressClass(f.score)}" data-progress="${f.score}" style="width:0%;"></div>
            </div>
            <div class="breakdown-score">${f.score}/100</div>
          </div>
        `).join('')}
      </div>

      <!-- AI reasoning box -->
      <div class="ai-insight">
        <div class="ai-insight-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.204L6 21l5.447-2.724A10.7 10.7 0 0 0 12 18.23c4.97 0 9-3.185 9-7.115S16.97 3 12 3z"></path>
          </svg>
          AI Reasoning
        </div>
        <div style="margin-top:4px;">${reasonsBullets}</div>
      </div>

      <div class="full-match-actions">
        <button class="btn btn-outline">View Full Profile</button>
        <button class="btn btn-primary" onclick="addToPipeline('${s.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add to Pipeline
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------
// Score Page
// -----------------------------------------------------------------------
function collectFundThesis() {
  const sectors = Array.from(document.querySelectorAll('input[name="sector"]:checked')).map(el => el.value);
  const stages = Array.from(document.querySelectorAll('input[name="stage"]:checked')).map(el => el.value);
  const minCheck = document.getElementById('thesis-min-check')?.value.trim() || '';
  const maxCheck = document.getElementById('thesis-max-check')?.value.trim() || '';
  const geography = document.getElementById('thesis-geography')?.value.trim() || '';
  return { sectors, stages, minCheck, maxCheck, geography };
}

async function handleScoreDeal() {
  const company = document.getElementById('score-company')?.value.trim();
  const description = document.getElementById('score-description')?.value.trim();
  const sector = document.getElementById('score-sector')?.value;
  const stage = document.getElementById('score-stage')?.value;
  const geography = document.getElementById('score-geography')?.value.trim();
  const askAmount = document.getElementById('score-ask')?.value.trim();

  if (!company || !description) {
    showAlert('score-alert', 'Company name and description are required.', 'error');
    return;
  }

  const fundThesis = collectFundThesis();

  setLoading('score-btn', true, 'Scoring…');
  clearAlert('score-alert');
  clearScoreResult();

  try {
    const result = await scoreThesisAlignment(
      { company, description, sector, stage, geography, askAmount },
      fundThesis
    );

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
    };

    // Add to/update deals
    const idx = state.deals.findIndex(d => d.company.toLowerCase() === company.toLowerCase());
    if (idx >= 0) state.deals[idx] = state.currentDeal;
    else state.deals.push(state.currentDeal);
    saveDeals();

    renderScoreResult(result);
  } catch (err) {
    showAlert('score-alert', `Scoring failed: ${err.message}`, 'error');
  } finally {
    setLoading('score-btn', false, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Score Deal');
  }
}

// -----------------------------------------------------------------------
// IC Memo Page
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
  const fundThesisNote = document.getElementById('memo-fund-thesis')?.value.trim();
  const matchScore = parseInt(document.getElementById('memo-match-score')?.value || '0', 10) || null;

  if (!company || !description) {
    showAlert('memo-alert', 'Company name and description are required.', 'error');
    return;
  }

  setLoading('memo-btn', true, 'Generating memo…');
  clearAlert('memo-alert');

  const emptyState = document.getElementById('memo-empty-state');
  if (emptyState) emptyState.classList.add('hidden');

  const outputSection = document.getElementById('memo-output-section');
  if (outputSection) outputSection.classList.add('hidden');

  try {
    const result = await generateICMemo({
      company,
      description,
      sector,
      stage,
      founders,
      marketSize,
      traction,
      competition,
      fundThesis: { note: fundThesisNote, ...collectFundThesis() },
      matchScore,
    });

    renderMemoOutput(result.memo);

    // Update deal if exists
    const idx = state.deals.findIndex(d => d.company.toLowerCase() === company.toLowerCase());
    if (idx >= 0) {
      state.deals[idx].memo = result.memo;
      state.deals[idx].status = 'IC Ready';
      saveDeals();
    }
  } catch (err) {
    showAlert('memo-alert', `Memo generation failed: ${err.message}`, 'error');
    if (emptyState) emptyState.classList.remove('hidden');
  } finally {
    setLoading('memo-btn', false, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Generate IC Memo');
  }
}

function renderMemoOutput(memoMarkdown) {
  const outputSection = document.getElementById('memo-output-section');
  const outputEl = document.getElementById('memo-output');
  if (!outputSection || !outputEl) return;

  if (window.marked) {
    outputEl.innerHTML = window.marked.parse(memoMarkdown);
  } else {
    outputEl.innerHTML = simpleMdToHtml(memoMarkdown);
  }

  outputEl.dataset.rawMemo = memoMarkdown;
  outputSection.classList.remove('hidden');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleCopyMemo() {
  const outputEl = document.getElementById('memo-output');
  const raw = outputEl?.dataset.rawMemo;
  if (!raw) return;
  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('copy-memo-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
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

function simpleMdToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>');
}

// -----------------------------------------------------------------------
// Score → Memo navigation
// -----------------------------------------------------------------------
function prefillMemoFromCurrentDeal() {
  if (!state.currentDeal) return;
  const d = state.currentDeal;
  setFieldValue('memo-company', d.company);
  setFieldValue('memo-description', d.description);
  setFieldValue('memo-sector', d.sector || '');
  const stageEl = document.getElementById('memo-stage');
  if (stageEl && d.stage) {
    const opt = Array.from(stageEl.options).find(o => o.value === d.stage);
    if (opt) stageEl.value = opt.value;
  }
  const scoreEl = document.getElementById('memo-match-score');
  if (scoreEl && d.score) scoreEl.value = d.score;
}

// -----------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------
function init() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Matches tabs
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.matchesTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMatches();
    });
  });

  // Deal flow filters
  document.getElementById('dealflow-search')?.addEventListener('input', e => {
    state.dealflowFilter.search = e.target.value;
    if (state.currentView === 'dealflow') renderDealFlow();
  });
  document.getElementById('dealflow-stage-filter')?.addEventListener('change', e => {
    state.dealflowFilter.stage = e.target.value;
    if (state.currentView === 'dealflow') renderDealFlow();
  });
  document.getElementById('dealflow-sector-filter')?.addEventListener('change', e => {
    state.dealflowFilter.sector = e.target.value;
    if (state.currentView === 'dealflow') renderDealFlow();
  });
  document.getElementById('dealflow-sort')?.addEventListener('change', e => {
    state.dealflowFilter.sort = e.target.value;
    if (state.currentView === 'dealflow') renderDealFlow();
  });

  // Score deal
  document.getElementById('score-btn')?.addEventListener('click', handleScoreDeal);
  document.getElementById('score-to-memo-btn')?.addEventListener('click', () => {
    prefillMemoFromCurrentDeal();
    navigateTo('memo');
  });

  // IC Memo
  document.getElementById('memo-btn')?.addEventListener('click', handleGenerateMemo);
  document.getElementById('copy-memo-btn')?.addEventListener('click', handleCopyMemo);
  document.getElementById('download-memo-btn')?.addEventListener('click', handleDownloadMemo);

  // Initial view
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
