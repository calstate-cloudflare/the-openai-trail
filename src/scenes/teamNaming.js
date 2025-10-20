import { BaseScene } from './baseScene.js';

export class TeamNamingScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.form = null;
    this.errorElement = null;
  }

  mount() {
    const prompts = this.getPrompt('team_naming');
    if (!prompts) {
      throw new Error('Missing team_naming prompts.');
    }

    this.clear();

    const container = document.createElement('div');
    container.className = 'team-single-column';
    this.root.appendChild(container);

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title team-single-column__title';
      title.textContent = prompts.title;
      container.appendChild(title);
    }

    this.form = document.createElement('form');
    this.form.className = 'team-single-column__form';
    this.form.addEventListener('submit', this.handleSubmit);

    const fields = prompts.fields ?? {};
    const teamLabel = fields.teamNameLabel ?? 'Team name';

    this.form.appendChild(this.createField(teamLabel, 'team-name', fields.submitLabel ?? 'Submit'));

    this.errorElement = document.createElement('div');
    this.errorElement.className = 'form__error';
    this.form.appendChild(this.errorElement);

    container.appendChild(this.form);

    const firstInput = this.form.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  createField(labelText, name, submitLabel) {
    const group = document.createElement('label');
    group.className = 'form__group team-single-column__group';

    const label = document.createElement('span');
    label.className = 'form__label';
    label.textContent = labelText;
    group.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    input.className = 'form__input';
    input.autocomplete = 'off';
    input.required = name === 'team-name';
    group.appendChild(input);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'form__submit team-single-column__submit';
    submit.textContent = submitLabel ?? 'Submit';
    group.appendChild(submit);

    return group;
  }

  handleSubmit(event) {
    event.preventDefault();
    this.showError('');
    const formData = new FormData(this.form);
    const teamName = (formData.get('team-name') || '').toString().trim();

    if (!teamName) {
      this.showError('Please provide a rollout team name.');
      return;
    }

    this.game.updateTeamName(teamName);
    this.game.updateTeammates([]);
    const nextScene = this.resolveTransition('team_naming.submit', 'start_timing');
    this.navigate(nextScene, { source: 'team_naming' });
  }

  showError(message) {
    if (this.errorElement) {
      this.errorElement.textContent = message;
    }
  }

  destroy() {
    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }
  }
}
