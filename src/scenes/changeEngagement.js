import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class ChangeEngagementScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = null;
  }

  mount() {
    const prompts = this.getPrompt('engagement_levels');
    if (!prompts) throw new Error('Missing engagement_levels prompts.');

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
      prompts.body.forEach((line, index) => {
        if (index > 0) body.appendChild(document.createElement('br'));
        const span = document.createElement('span');
        span.textContent = line;
        body.appendChild(span);
      });
      this.root.appendChild(body);
    }

    const menuHost = document.createElement('div');
    this.root.appendChild(menuHost);

    this.menu = new MenuView(menuHost);
    this.menu.render({
      options: prompts.options ?? [],
      prompt: prompts.prompt,
      onSelect: (option) => this.handleSelect(option),
    });
  }

  handleSelect(option) {
    this.game.setEngagement(option.id);
    this.game.addLogEntry({
      type: 'info',
      message: `Engagement level set to ${option.label.toLowerCase()}.`,
    });
    const returnTo = this.props?.returnTo ?? 'travel';
    this.navigate(returnTo, { source: 'change_engagement' });
  }

  destroy() {
    this.menu?.detach();
  }
}
