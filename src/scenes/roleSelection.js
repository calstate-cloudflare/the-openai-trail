import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class RoleSelectionScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = new MenuView(this.root);
  }

  mount() {
    const prompts = this.getPrompt('role_selection');
    if (!prompts) {
      throw new Error('Missing role_selection prompts.');
    }

    const options = (prompts.options ?? []).map((role) => ({
      ...role,
      description: role.description,
    }));

    this.menu.render({
      title: prompts.title,
      body: prompts.body,
      options,
      prompt: prompts.prompt,
      onSelect: (option) => this.handleSelect(option),
    });
  }

  handleSelect(option) {
    try {
      this.game.selectRole(option.id);
      const nextScene = this.resolveTransition('role_selection.select', 'team_naming');
      this.navigate(nextScene, { selectedRole: option, returnTo: 'main_menu' });
    } catch (error) {
      console.error(error);
    }
  }

  destroy() {
    this.menu.detach();
  }
}
