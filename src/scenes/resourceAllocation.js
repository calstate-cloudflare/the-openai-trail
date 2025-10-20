import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class ResourceAllocationScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = null;
    this.prompts = null;
    this.feedback = 'Hiring freeze in effect — No added staff.';
  }

  mount() {
    this.prompts = this.getPrompt('resource_menu');
    if (!this.prompts) {
      throw new Error('Missing resource_menu prompts.');
    }

    this.renderScene();
  }

  renderScene() {
    this.menu?.detach();
    this.clear();

    if (this.prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = this.prompts.title;
      this.root.appendChild(title);
    }

    const bodyLines = [...(this.prompts.body ?? [])];
    const body = document.createElement('div');
    body.className = 'screen__body';
    bodyLines.forEach((line, index) => {
      if (index > 0) body.appendChild(document.createElement('br'));
      const span = document.createElement('span');
      span.textContent = line;
      body.appendChild(span);
    });
    this.root.appendChild(body);

    if (this.feedback) {
      const feedback = document.createElement('div');
      feedback.className = 'screen__feedback';
      feedback.textContent = this.feedback;
      this.root.appendChild(feedback);
    }

    const menuContainer = document.createElement('div');
    this.root.appendChild(menuContainer);

    this.menu = new MenuView(menuContainer);
    this.menu.render({
      options: this.buildOptions(),
      prompt: this.prompts.prompt,
      onSelect: (option) => this.handleSelect(option),
    });
  }

  buildOptions() {
    const staffOptions = (this.prompts.options ?? []).map((option) => {
      const fte = option.fteRequired ?? 1;
      const description = `${fte} FTE : ${option.benefit}`;
      return {
        ...option,
        description,
        disabled: true,
        locked: true,
      };
    });

    const finish = this.prompts.finishOption
      ? [
          {
            id: 'finish',
            label: this.prompts.finishOption.label,
            nextScene: this.prompts.finishOption.nextScene,
            description: this.prompts.finishOption.description,
          },
        ]
      : [];

    return [...staffOptions, ...finish];
  }

  handleSelect(option) {
    if (option.id === 'finish') {
      const fallback = option.nextScene ?? 'travel';
      const nextScene = this.resolveTransition('resource_allocation.finish', fallback);
      this.navigate(nextScene, { source: 'resource_allocation' });
      return;
    }

    const message = `${option.label} request denied — hiring freeze means no new staff.`;
    this.feedback = message;
    this.game.addLogEntry({
      type: 'event',
      message,
    });
    this.renderScene();
  }

  destroy() {
    this.menu?.detach();
  }
}
