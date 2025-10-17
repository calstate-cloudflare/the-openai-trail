import { BaseScene } from './baseScene.js';

const CONTINUE_KEYS = new Set(['Enter', ' ']);

export class ProgressScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleContinue = this.handleContinue.bind(this);
    this.hasContinued = false;
    this.ready = false;
  }

  mount() {
    const prompts = this.getPrompt('progress_status') ?? {};

    this.clear();
    this.root.classList.add('progress-scene');

    const wrapper = document.createElement('div');
    wrapper.className = 'progress-scene__wrapper';

    const visual = document.createElement('div');
    visual.className = 'progress-scene__visual';
    const progressImage = document.createElement('img');
    progressImage.src = 'img/backgrounds/progress.gif';
    progressImage.alt = prompts.imageAlt ?? 'Rollout progress animation';
    visual.appendChild(progressImage);
    wrapper.appendChild(visual);

    const statsPanel = document.createElement('div');
    statsPanel.className = 'progress-scene__stats';

    const statsList = Array.isArray(prompts.stats) && prompts.stats.length ? prompts.stats : [];
    statsList.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'progress-scene__stat-row';

      const label = document.createElement('span');
      label.className = 'progress-scene__stat-label';
      label.textContent = `${entry.label ?? ''}:`;

      const value = document.createElement('span');
      value.className = 'progress-scene__stat-value';
      value.textContent = entry.value ?? '';

      row.appendChild(label);
      row.appendChild(value);
      statsPanel.appendChild(row);
    });

    wrapper.appendChild(statsPanel);

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'progress-scene__prompt';
      prompt.textContent = prompts.prompt;
      wrapper.appendChild(prompt);
    }

    this.root.appendChild(wrapper);

    document.addEventListener('keydown', this.handleContinue);
    requestAnimationFrame(() => {
      this.ready = true;
    });
    setTimeout(() => {
      this.root.addEventListener('click', this.handleContinue);
    }, 0);
  }

  handleContinue(event) {
    if (!this.ready) return;
    if (event?.type === 'keydown' && !CONTINUE_KEYS.has(event.key)) {
      return;
    }
    if (this.hasContinued) return;
    this.hasContinued = true;
    event?.preventDefault?.();
    const nextScene = this.resolveTransition('progress_status.continue', 'travel');
    this.navigate(nextScene, { source: 'progress_status' });
  }

  destroy() {
    document.removeEventListener('keydown', this.handleContinue);
    this.root.removeEventListener('click', this.handleContinue);
    this.root.classList.remove('progress-scene');
    this.hasContinued = false;
    this.ready = false;
  }
}
