import { BaseScene } from './baseScene.js';

function formatLines(lines = [], context = {}) {
  return lines.map((line) =>
    line.replace(/{{(.*?)}}/g, (_, key) => {
      const value = context[key.trim()];
      return value !== undefined ? value : '';
    })
  );
}

export class VictoryScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    const prompts = this.getPrompt('victory');
    if (!prompts) throw new Error('Missing victory prompts.');

    const snapshot = this.props?.snapshot ?? this.game.getSnapshot();
    const data = {
      campuses: snapshot.campusesReached,
      goodwill: snapshot.goodwill,
      budget: snapshot.budget,
      morale: snapshot.morale,
    };

    this.render(prompts, data);
    document.addEventListener('keydown', this.handleKeydown);
    this.root.addEventListener('click', this.handleClick);
  }

  render(prompts, data) {
    this.clear();

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = prompts.title;
      this.root.appendChild(title);
    }

    if (Array.isArray(prompts.body)) {
      const body = document.createElement('div');
      body.className = 'screen__body';
      formatLines(prompts.body, data).forEach((line, index) => {
        if (index > 0) body.appendChild(document.createElement('br'));
        const span = document.createElement('span');
        span.textContent = line;
        body.appendChild(span);
      });
      this.root.appendChild(body);
    }

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt';
      prompt.textContent = prompts.prompt;
      this.root.appendChild(prompt);
    }
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.continue();
    }
  }

  handleClick() {
    this.continue();
  }

  continue() {
    this.navigate('scoring', { returnTo: 'main_menu' });
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.root.removeEventListener('click', this.handleClick);
  }
}

export class GameOverScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    const prompts = this.getPrompt('game_over');
    if (!prompts) throw new Error('Missing game_over prompts.');

    const snapshot = this.props?.snapshot ?? this.game.getSnapshot();
    const reasonKey = this.props?.reason ?? 'budget';
    const reasonDescription = prompts.reasons?.[reasonKey] ?? '';

    const data = {
      campuses: snapshot.campusesReached,
      goodwill: snapshot.goodwill,
      budget: snapshot.budget,
      morale: snapshot.morale,
    };

    this.render(prompts, data, reasonDescription);
    document.addEventListener('keydown', this.handleKeydown);
    this.root.addEventListener('click', this.handleClick);
  }

  render(prompts, data, reasonDescription) {
    this.clear();

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = prompts.title;
      this.root.appendChild(title);
    }

    if (reasonDescription) {
      const reason = document.createElement('div');
      reason.className = 'screen__body';
      reason.textContent = reasonDescription;
      this.root.appendChild(reason);
    }

    if (Array.isArray(prompts.body)) {
      const body = document.createElement('div');
      body.className = 'screen__body';
      formatLines(prompts.body, data).forEach((line, index) => {
        if (index > 0) body.appendChild(document.createElement('br'));
        const span = document.createElement('span');
        span.textContent = line;
        body.appendChild(span);
      });
      this.root.appendChild(body);
    }

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt';
      prompt.textContent = prompts.prompt;
      this.root.appendChild(prompt);
    }
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.continue();
    }
  }

  handleClick() {
    this.continue();
  }

  continue() {
    this.navigate('main_menu');
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.root.removeEventListener('click', this.handleClick);
  }
}
