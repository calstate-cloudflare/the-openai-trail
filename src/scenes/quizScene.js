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

    this.game.recordQuizAnswer(this.sceneName, option.id, {
      label: option.label ?? '',
      description: option.description ?? '',
      outcome: option.outcome ?? '',
    });

    if (option.outcome) {
      this.game.addLogEntry({
        type: 'info',
        message: option.outcome,
      });
    }

    const resolutionKey = `${this.sceneName}.select`;
    const nextScene = option.nextScene ?? this.resolveTransition(resolutionKey, 'progress_status');

    const navigationProps = {
      source: this.sceneName,
      choice: option.id,
    };

    if (this.sceneName === 'quiz_phase3') {
      navigationProps.progress = {
        users: 10000,
        campuses: {
          reached: 4,
        },
        nextCampus: 'Channel Islands',
        dateTimeline: {
          year: 2025,
          month: 3,
          day: 31,
        },
      };
    }

    if (this.sceneName === 'quiz_phase5') {
      navigationProps.progress = {
        users: 100000,
        campuses: {
          reached: 20,
        },
        nextCampus: 'Long Beach',
        dateTimeline: {
          year: 2025,
          month: 8,
          day: 31,
        },
      };
    }

    this.navigate(nextScene, navigationProps);
  }

  destroy() {
    this.menu.detach();
  }
}
