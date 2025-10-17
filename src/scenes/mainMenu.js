import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class MainMenuScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = new MenuView(this.root);
  }

  mount() {
    const prompts = this.getPrompt('main_menu');
    if (!prompts) {
      throw new Error('Missing main_menu prompts.');
    }

    this.menu.render({
      title: prompts.title,
      divider: prompts.divider,
      body: prompts.body,
      options: prompts.options ?? [],
      prompt: prompts.prompt,
      onSelect: (option) => this.handleSelect(option),
    });
  }

  handleSelect(option) {
    if (option?.id === 'start_campaign') {
      this.game.resetCampaign();
    }

    if (option?.nextScene) {
      this.navigate(option.nextScene, { source: 'main_menu', option });
    }
  }

  destroy() {
    this.menu.detach();
  }
}
