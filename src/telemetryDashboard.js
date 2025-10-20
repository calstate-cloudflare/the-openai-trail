import { loadEnvironmentConfig } from './config/environment.js';

const state = {
  endpoint: null,
  fetchLimit: 100,
  cursor: null,
  items: [],
  loading: false,
  totalLoaded: 0,
};

const selectors = {
  summary: document.getElementById('summary'),
  tableBody: document.getElementById('table-body'),
  status: document.getElementById('status'),
  loadMore: document.getElementById('load-more'),
  paginationInfo: document.getElementById('pagination-info'),
  limitSelect: document.getElementById('limit-select'),
  refreshButton: document.getElementById('refresh-button'),
  endpointLabel: document.getElementById('endpoint-label'),
};

function setStatus(message, tone = 'info') {
  if (!selectors.status) return;
  selectors.status.textContent = message ?? '';
  selectors.status.dataset.tone = tone;
}

function renderSummary() {
  if (!selectors.summary) return;
  selectors.summary.innerHTML = '';
  if (!state.items.length) return;

  const totalSessions = state.items.length;
  const roleCounts = state.items.reduce((acc, item) => {
    const roleId = item.role?.id ?? 'unknown';
    acc.set(roleId, (acc.get(roleId) ?? 0) + 1);
    return acc;
  }, new Map());

  const latestSubmission = state.items.reduce((latest, item) => {
    const submittedAt = item.submittedAt ?? item.storedAt ?? item.collectedAt;
    if (!submittedAt) return latest;
    const timestamp = Date.parse(submittedAt);
    if (!Number.isFinite(timestamp)) return latest;
    if (!latest || timestamp > latest.timestamp) {
      return { timestamp, submittedAt };
    }
    return latest;
  }, null);

  selectors.summary.appendChild(createSummaryCard('Sessions Loaded', totalSessions.toString()));

  const roleList = Array.from(roleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([roleId, count]) => {
      const roleLabel =
        state.items.find((item) => item.role?.id === roleId)?.role?.label ?? roleId.replace(/^unknown$/, 'Not set');
      return `${roleLabel}: ${count}`;
    });
  selectors.summary.appendChild(createSummaryCard('Role Distribution', roleList));

  const quizAnswerCount = state.items.reduce((sum, item) => sum + (item.quizAnswers?.length ?? 0), 0);
  selectors.summary.appendChild(createSummaryCard('Quiz Answers Logged', quizAnswerCount.toString()));

  if (latestSubmission?.submittedAt) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    selectors.summary.appendChild(
      createSummaryCard('Most Recent Submission', formatter.format(new Date(latestSubmission.submittedAt)))
    );
  }
}

function createSummaryCard(title, content) {
  const card = document.createElement('dl');
  card.className = 'dashboard__summary-card';

  const titleElement = document.createElement('dt');
  titleElement.textContent = title;
  card.appendChild(titleElement);

  if (Array.isArray(content)) {
    const list = document.createElement('ul');
    list.className = 'dashboard__summary-list';
    content.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = entry;
      list.appendChild(li);
    });
    const container = document.createElement('dd');
    container.appendChild(list);
    card.appendChild(container);
  } else {
    const valueElement = document.createElement('dd');
    valueElement.textContent = content;
    card.appendChild(valueElement);
  }

  return card;
}

function renderTable() {
  if (!selectors.tableBody) return;
  selectors.tableBody.innerHTML = '';

  if (!state.items.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'No submissions found.';
    row.appendChild(cell);
    selectors.tableBody.appendChild(row);
    return;
  }

  state.items.forEach((item) => {
    const row = document.createElement('tr');
    row.appendChild(createCell(item.sessionId ?? '—'));
    row.appendChild(createCell(formatDateTime(item.collectedAt)));
    row.appendChild(createCell(formatRole(item.role)));
    row.appendChild(createCell(item.teamName ?? '—'));
    row.appendChild(createCell(formatTeamMembers(item.teamMembers)));
    row.appendChild(createCell(formatQuizAnswers(item.quizAnswers)));
    selectors.tableBody.appendChild(row);
  });
}

function createCell(content) {
  const cell = document.createElement('td');
  if (content instanceof Node) {
    cell.appendChild(content);
  } else {
    cell.textContent = content;
  }
  return cell;
}

function formatDateTime(value) {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatRole(role) {
  if (!role) return '—';
  const parts = [role.label ?? role.id ?? '—'];
  if (role.id) {
    parts.push(`(${role.id})`);
  }
  return parts.join(' ');
}

function formatTeamMembers(members) {
  if (!Array.isArray(members) || !members.length) return '—';
  const list = document.createElement('ul');
  members.forEach((member) => {
    const li = document.createElement('li');
    li.textContent = member;
    list.appendChild(li);
  });
  return list;
}

function formatQuizAnswers(answers) {
  if (!Array.isArray(answers) || !answers.length) return '—';
  const list = document.createElement('ul');
  answers.forEach((answer) => {
    const li = document.createElement('li');
    const parts = [answer.questionId, '→', answer.choiceId];
    if (answer.answeredAt) {
      parts.push(`@ ${formatDateTime(answer.answeredAt)}`);
    }
    li.textContent = parts.filter(Boolean).join(' ');
    list.appendChild(li);
  });
  return list;
}

function updatePaginationControls() {
  if (selectors.loadMore) {
    selectors.loadMore.disabled = !state.cursor || state.loading;
  }
  if (selectors.paginationInfo) {
    selectors.paginationInfo.textContent = state.cursor
      ? `Next cursor: ${state.cursor}`
      : state.items.length
        ? 'All records loaded.'
        : '';
  }
}

async function fetchPage({ reset = false } = {}) {
  if (state.loading) return;
  if (!state.endpoint) {
    setStatus('Telemetry endpoint not configured. Check your .env file.', 'error');
    return;
  }
  state.loading = true;
  setStatus('Loading submissions…', 'info');
  updatePaginationControls();

  if (reset) {
    state.cursor = null;
    state.items = [];
    state.totalLoaded = 0;
    renderTable();
    renderSummary();
  }

  try {
    const url = new URL(state.endpoint);
    url.searchParams.set('limit', String(state.fetchLimit));
    if (!reset && state.cursor) {
      url.searchParams.set('cursor', state.cursor);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorPayload = await safeReadBody(response);
      throw new Error(`Request failed: ${response.status} ${response.statusText} ${JSON.stringify(errorPayload)}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    state.cursor = payload.cursor ?? null;

    state.items = reset ? items : [...state.items, ...items];
    state.totalLoaded += items.length;

    renderTable();
    renderSummary();
    setStatus(`Loaded ${state.totalLoaded} submission${state.totalLoaded === 1 ? '' : 's'}.`, 'success');
  } catch (error) {
    console.error(error);
    setStatus(`Unable to load submissions. ${error.message}`, 'error');
  } finally {
    state.loading = false;
    updatePaginationControls();
  }
}

async function safeReadBody(response) {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return null;
    }
  }
}

function bindEvents() {
  selectors.loadMore?.addEventListener('click', () => fetchPage({ reset: false }));
  selectors.refreshButton?.addEventListener('click', () => fetchPage({ reset: true }));
  selectors.limitSelect?.addEventListener('change', (event) => {
    const value = Number.parseInt(event.target.value, 10);
    if (Number.isFinite(value) && value > 0) {
      state.fetchLimit = value;
      fetchPage({ reset: true });
    }
  });
}

async function initialise() {
  bindEvents();
  setStatus('Preparing dashboard…');

  try {
    const env = await loadEnvironmentConfig();
    const fetchEndpoint = env?.PUBLIC_TELEMETRY_FETCH_ENDPOINT ?? env?.PUBLIC_TELEMETRY_ENDPOINT ?? null;
    if (!fetchEndpoint) {
      setStatus('PUBLIC_TELEMETRY_ENDPOINT missing in .env. Cannot load submissions.', 'error');
      return;
    }
    state.endpoint = fetchEndpoint;
    if (selectors.endpointLabel) {
      selectors.endpointLabel.textContent = `Source: ${fetchEndpoint}`;
    }
    await fetchPage({ reset: true });
  } catch (error) {
    console.error(error);
    setStatus(`Failed to read environment configuration. ${error.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', initialise);
