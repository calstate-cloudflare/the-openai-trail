import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class StartTimingScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = new MenuView(this.root);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  mount() {
    const prompts = this.getPrompt('start_timing');
    if (!prompts) {
      throw new Error('Missing start_timing prompts.');
    }

    const options = (prompts.options ?? []).map((option, index) => ({
      ...option,
      disabled: option.locked === true || index !== 0,
    }));

    this.menu.render({
      title: prompts.title,
      body: prompts.body,
      options,
      prompt: prompts.prompt,
      onSelect: (option) => this.handleSelect(option),
    });

    document.addEventListener('keydown', this.handleKeydown);
  }

  handleSelect(option) {
    if (option.disabled || option.locked) return;

    this.game.setLaunchTiming({ month: option.month ?? 1 });
    this.game.addLogEntry({
      type: 'info',
      message: 'Launch mandate received — rollout begins immediately.',
    });
    this.navigate(option.nextScene ?? 'resource_allocation', { source: 'start_timing' });
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const options = this.menu?.root.querySelectorAll('.menu__button');
      if (!options?.length) return;
      const first = Array.from(options).find((button) => !button.disabled);
      if (first) {
        first.click();
      }
    }
  }

  destroy() {
    this.menu.detach();
    document.removeEventListener('keydown', this.handleKeydown);
  }
}
