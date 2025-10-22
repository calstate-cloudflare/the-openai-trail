import { BaseScene } from './baseScene.js';

const DEFAULT_LIMIT = 10;

export class LeaderboardScene extends BaseScene {
  constructor(context) {
    super(context);
    this.state = {
      loading: true,
      error: null,
      entries: [],
    };
    this.abortController = null;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handlePromptClick = this.handlePromptClick.bind(this);
    this.promptNode = null;
  }

  mount() {
    this.clear();
    this.root.classList.add('leaderboard');
    const prompts = this.getPrompt('leaderboard') ?? {};

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title leaderboard__title';
      title.textContent = prompts.title;
      this.root.appendChild(title);
    }

    if (Array.isArray(prompts.body) && prompts.body.length) {
      const body = document.createElement('div');
      body.className = 'screen__body leaderboard__body';
      prompts.body.forEach((line, index) => {
        if (index > 0) body.appendChild(document.createElement('br'));
        const span = document.createElement('span');
        span.textContent = line;
        body.appendChild(span);
      });
      this.root.appendChild(body);
    }

    this.statusNode = document.createElement('div');
    this.statusNode.className = 'leaderboard__status';
    this.root.appendChild(this.statusNode);

    this.table = document.createElement('div');
    this.table.className = 'leaderboard__table';
    this.root.appendChild(this.table);

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt';
      prompt.textContent = prompts.prompt;
      this.promptNode = prompt;
      this.root.appendChild(prompt);
    }

    this.fetchLeaderboard();
    document.addEventListener('keydown', this.handleKeydown);
    this.promptNode?.addEventListener('click', this.handlePromptClick);
  }

  resolveEndpoint() {
    const env = this.envConfig ?? {};
    const explicit = env.PUBLIC_TELEMETRY_LEADERBOARD_ENDPOINT;
    const base = explicit || env.PUBLIC_TELEMETRY_FETCH_ENDPOINT || env.PUBLIC_TELEMETRY_ENDPOINT;
    if (!base) return null;
    if (/\/highscore(?:\/?$)/.test(base)) {
      return base.replace(/\/$/, '');
    }
    return `${base.replace(/\/$/, '')}/highscore`;
  }

  async fetchLeaderboard() {
    const endpoint = this.resolveEndpoint();
    if (!endpoint) {
      this.renderError('Leaderboard endpoint not configured.');
      return;
    }

    this.setStatus('Loading leaderboard…');
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      const response = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = await response.json();
      const entries = this.normalizeEntries(payload).slice(0, DEFAULT_LIMIT);
      this.state = { loading: false, error: null, entries };
      this.renderTable(entries);
      this.setStatus(entries.length ? '' : 'No leaderboard entries yet.');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[Leaderboard] fetch error', error);
      this.renderError('Unable to load leaderboard.');
    }
  }

  normalizeEntries(payload) {
    if (!payload) return [];
    const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return items
      .map((item) => {
        const rawScore = item.score ?? item.totalScore ?? item.points ?? 0;
        const numericScore =
          typeof rawScore === 'number'
            ? rawScore
            : Number.parseInt(String(rawScore).replace(/[^0-9.-]/g, ''), 10) || 0;
        return {
          name: item.teamName || item.team || item.name || 'Unknown Team',
          role: item.role?.label || item.role?.id || 'Unknown Role',
          score: numericScore,
        };
      })
      .filter((entry) => entry)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  renderTable(entries) {
    this.table.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'leaderboard__row leaderboard__row--header';
    header.innerHTML = `
      <span class="leaderboard__rank">#</span>
      <span class="leaderboard__name">Team</span>
      <span class="leaderboard__role">Role</span>
      <span class="leaderboard__score">Score</span>
    `;
    this.table.appendChild(header);

    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard__row';
      row.innerHTML = `
        <span class="leaderboard__rank">${index + 1}</span>
        <span class="leaderboard__name">${entry.name}</span>
        <span class="leaderboard__role">${entry.role}</span>
        <span class="leaderboard__score">${entry.score.toLocaleString()}</span>
      `;
      this.table.appendChild(row);
    });
  }

  setStatus(message) {
    if (!this.statusNode) return;
    this.statusNode.textContent = message ?? '';
    this.statusNode.hidden = !message;
  }

  renderError(message) {
    this.state = { loading: false, error: message, entries: [] };
    this.table.innerHTML = '';
    this.setStatus(message);
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.returnToMenu();
    }
  }

  handlePromptClick() {
    this.returnToMenu();
  }

  returnToMenu() {
    const destination = this.props?.returnTo ?? 'main_menu';
    this.navigate(destination, { source: 'leaderboard' });
  }

  destroy() {
    this.abortController?.abort();
    this.abortController = null;
    document.removeEventListener('keydown', this.handleKeydown);
    this.promptNode?.removeEventListener('click', this.handlePromptClick);
    this.promptNode = null;
    this.root.classList.remove('leaderboard');
    super.destroy?.();
  }
}
