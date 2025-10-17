import { BaseScene } from './baseScene.js';

function appendLines(container, lines = []) {
  lines.forEach((line, index) => {
    if (index > 0) container.appendChild(document.createElement('br'));
    const span = document.createElement('span');
    span.textContent = line;
    container.appendChild(span);
  });
}

function appendConditions(container, conditions = []) {
  conditions.forEach((condition) => {
    const line = document.createElement('div');
    line.textContent = `${condition.label}: ${condition.result}`;
    container.appendChild(line);
  });
}

export class InfoScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    const prompts = this.getPrompt(this.sceneName);
    if (!prompts) {
      throw new Error(`Missing prompts for scene "${this.sceneName}".`);
    }

    this.clear();

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = prompts.title;
      this.root.appendChild(title);
    }

    if (Array.isArray(prompts.body) && prompts.body.length > 0) {
      const body = document.createElement('div');
      body.className = 'screen__body';
      appendLines(body, prompts.body);
      this.root.appendChild(body);
    }

    if (Array.isArray(prompts.conditions) && prompts.conditions.length > 0) {
      const conditionsContainer = document.createElement('div');
      conditionsContainer.className = 'screen__body';
      appendConditions(conditionsContainer, prompts.conditions);
      this.root.appendChild(conditionsContainer);
    }

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt';
      prompt.textContent = prompts.prompt;
      this.root.appendChild(prompt);
    }

    document.addEventListener('keydown', this.handleKeydown);
    this.root.addEventListener('click', this.handleClick);
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
    const destination = this.props?.returnTo ?? 'main_menu';
    this.navigate(destination, { source: this.sceneName });
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.root.removeEventListener('click', this.handleClick);
  }
}
