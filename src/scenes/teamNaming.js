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

    const layout = document.createElement('div');
    layout.className = 'team-layout';
    this.root.appendChild(layout);

    const infoColumn = document.createElement('div');
    infoColumn.className = 'team-layout__info';
    layout.appendChild(infoColumn);

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = prompts.title;
      infoColumn.appendChild(title);
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
      infoColumn.appendChild(body);
    }

    this.form = document.createElement('form');
    this.form.className = 'form';
    this.form.addEventListener('submit', this.handleSubmit);

    const fields = prompts.fields ?? {};
    const teamLabel = fields.teamNameLabel ?? 'Team name';

    this.form.appendChild(this.createField(teamLabel, 'team-name', true));

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'form__submit form__submit--right';
    submit.textContent = fields.submitLabel ?? 'Continue';
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'form__error';
    this.form.appendChild(this.errorElement);

    const formColumn = document.createElement('div');
    formColumn.className = 'team-layout__form';
    layout.appendChild(formColumn);
    formColumn.appendChild(this.form);

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt';
      prompt.textContent = prompts.prompt ?? '';
      infoColumn.appendChild(prompt);
    }

    this.form.appendChild(submit);

    const firstInput = this.form.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  createField(labelText, name, inline = false) {
    const group = document.createElement('label');
    group.className = 'form__group';
    if (inline) group.classList.add('form__group--inline');

    const label = document.createElement('span');
    label.className = 'form__label';
    label.textContent = labelText;
    group.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    input.className = 'form__input';
    input.autocomplete = 'off';
    input.required = inline || name === 'team-name';
    group.appendChild(input);

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
