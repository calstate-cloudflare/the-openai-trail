import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

export class QuizScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = new MenuView(this.root);
  }

  mount() {
    const prompts = this.getPrompt(this.sceneName) ?? this.getPrompt('quiz_intro');
    if (!prompts) {
      throw new Error('Missing quiz_intro prompts.');
    }

    const options = (prompts.options ?? []).map((option) => ({
      ...option,
      description: option.description,
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
    if (!option) return;

    if (option.outcome) {
      this.game.addLogEntry({
        type: 'info',
        message: option.outcome,
      });
    }

    const resolutionKey = `${this.sceneName}.select`;
    const nextScene = option.nextScene ?? this.resolveTransition(resolutionKey, 'progress_status');
    this.navigate(nextScene, { source: 'quiz_intro', choice: option.id });
  }

  destroy() {
    this.menu.detach();
  }
}
