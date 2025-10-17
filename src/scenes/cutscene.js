import { BaseScene } from './baseScene.js';

const CONTINUE_KEYS = new Set(['Enter', ' ']);

export class CutsceneScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleContinue = this.handleContinue.bind(this);
    this.ready = false;
    this.hasContinued = false;
  }

  mount() {
    const prompts = this.getPrompt(this.sceneName) ?? {};

    this.clear();
    this.root.classList.add('cutscene');

    const board = document.createElement('div');
    board.className = 'cutscene__board';
    if (prompts.boardText) {
      board.textContent = prompts.boardText;
    }
    this.root.appendChild(board);

    if (prompts.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'cutscene__subtitle';
      subtitle.textContent = prompts.subtitle;
      this.root.appendChild(subtitle);
    }

    const promptText = prompts.prompt ?? '';
    if (promptText) {
      const prompt = document.createElement('div');
      prompt.className = 'cutscene__prompt';
      prompt.textContent = promptText;
      this.root.appendChild(prompt);
    }

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
    const transitionKey = `${this.sceneName}.continue`;
    const nextScene = this.resolveTransition(transitionKey, 'travel');
    this.navigate(nextScene, { source: this.sceneName });
  }

  destroy() {
    document.removeEventListener('keydown', this.handleContinue);
    this.root.removeEventListener('click', this.handleContinue);
    this.root.classList.remove('cutscene');
    this.ready = false;
    this.hasContinued = false;
  }
}

