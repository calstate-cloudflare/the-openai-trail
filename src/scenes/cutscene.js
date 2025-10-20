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
    this.prompts = prompts;

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
    const prompts = this.prompts ?? this.getPrompt(this.sceneName) ?? {};
    if (!this.ready) return;
    if (event?.type === 'keydown' && !CONTINUE_KEYS.has(event.key)) {
      return;
    }
    if (this.hasContinued) return;
    this.hasContinued = true;
    event?.preventDefault?.();
    const transitionKey = `${this.sceneName}.continue`;
    const nextScene = this.resolveTransition(transitionKey, 'travel');

    const navigationProps = { source: this.sceneName };

    if (this.sceneName === 'cutscene_long_beach') {
      const totalCampuses = this.game?.totalCampuses ?? 23;
      const currentYear = this.game?.state?.timeline?.year ?? 2025;
      navigationProps.progress = {
        users: 180000,
        campuses: {
          reached: totalCampuses,
        },
        nextCampus: 'Educause',
        dateTimeline: {
          year: currentYear,
          month: 10,
          day: 29,
        },
        video: 'img/backgrounds/music-city-center.mp4',
      };
    }

    const progressOverrides = prompts?.progress;
    if (progressOverrides && typeof progressOverrides === 'object') {
      navigationProps.progress = {
        ...(navigationProps.progress ?? {}),
        ...progressOverrides,
      };
    }

    this.navigate(nextScene, navigationProps);
  }

  destroy() {
    document.removeEventListener('keydown', this.handleContinue);
    this.root.removeEventListener('click', this.handleContinue);
    this.root.classList.remove('cutscene');
    this.ready = false;
    this.hasContinued = false;
  }
}
