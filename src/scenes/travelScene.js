import { BaseScene } from './baseScene.js';
import { MenuView } from '../ui/menus.js';

const WEATHER_PATTERNS = ['turbulent', 'foggy', 'sunny', 'overcast', 'stormy'];

export class TravelScene extends BaseScene {
  constructor(context) {
    super(context);
    this.menu = null;
    this.prompts = null;
    this.menuContainer = null;
    this.logContainer = null;
    this.statusContainer = null;
  }

  mount() {
    this.prompts = this.getPrompt('core_loop');
    if (!this.prompts) {
      throw new Error('Missing core_loop prompts.');
    }

    this.renderScene();
  }

  renderScene() {
    this.clear();
    if (this.prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title';
      title.textContent = this.prompts.title;
      this.root.appendChild(title);
    }

    this.statusContainer = document.createElement('div');
    this.statusContainer.className = 'status-board';
    this.root.appendChild(this.statusContainer);
    this.renderStatus();

    this.logContainer = document.createElement('div');
    this.logContainer.className = 'event-log';
    this.root.appendChild(this.logContainer);
    this.renderLog();

    this.menuContainer = document.createElement('div');
    this.root.appendChild(this.menuContainer);

    this.menu = new MenuView(this.menuContainer);
    this.menu.render({
      options: this.prompts.actions ?? [],
      prompt: this.prompts.prompt,
      onSelect: (option) => this.handleAction(option),
    });
  }

  renderStatus() {
    const snapshot = this.game.getSnapshot();
    const entries = [
      {
        label: 'Weather',
        value: this.determineWeather(snapshot.timeline.month, snapshot.pace),
      },
      {
        label: 'Morale',
        value: `${snapshot.morale}`,
      },
      {
        label: 'Budget',
        value: `$${snapshot.budget}`,
      },
      {
        label: 'Pace',
        value: snapshot.pace,
      },
      {
        label: 'Engagement',
        value: snapshot.engagement,
      },
      {
        label: 'Next milestone',
        value: this.nextMilestoneLabel(snapshot),
      },
    ];

    this.statusContainer.innerHTML = '';
    entries.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'status-board__row';
      const label = document.createElement('span');
      label.className = 'status-board__label';
      label.textContent = entry.label;

      const value = document.createElement('span');
      value.className = 'status-board__value';
      value.textContent = entry.value;

      row.appendChild(label);
      row.appendChild(value);
      this.statusContainer.appendChild(row);
    });
  }

  renderLog() {
    const entries = this.game.getTravelLog();
    this.logContainer.innerHTML = '';
    if (!entries.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'event-log__item';
      placeholder.textContent = 'No major events yet. Keep rolling!';
      this.logContainer.appendChild(placeholder);
      return;
    }

    entries.slice(0, 6).forEach((entry) => {
      const line = document.createElement('div');
      line.className = `event-log__item event-log__item--${entry.type}`;
      line.textContent = entry.message;
      this.logContainer.appendChild(line);
    });
  }

  handleAction(option) {
    switch (option.id) {
      case 'continue_rollout':
        this.advanceTurn();
        break;
      case 'check_resources':
        this.game.addLogEntry({
          type: 'info',
          message: this.describeResources(),
        });
        break;
      case 'change_pace':
        this.navigate('change_pace', { returnTo: 'travel' });
        return;
      case 'change_engagement':
        this.navigate('change_engagement', { returnTo: 'travel' });
        return;
      case 'rest':
        this.game.adjustMorale(8);
        this.game.addLogEntry({
          type: 'info',
          message: 'You took a mental health day. Morale improves.',
        });
        break;
      case 'conduct_training':
        this.game.adjustGoodwill(12);
        this.game.adjustMorale(-4);
        this.game.addLogEntry({
          type: 'info',
          message: 'Training blitz boosts goodwill (+12) but leaves your team tired (-4 morale).',
        });
        break;
      case 'stakeholder_outreach':
        this.game.adjustGoodwill(8);
        this.game.addLogEntry({
          type: 'info',
          message: 'Stakeholder listening sessions add goodwill (+8).',
        });
        break;
      case 'request_funding':
        this.requestFunding();
        break;
      default:
        this.game.addLogEntry({
          type: 'info',
          message: 'That action is not implemented yet.',
        });
    }

    this.renderStatus();
    this.renderLog();
  }

  advanceTurn() {
    const outcome = this.game.advanceCampaign();

    if (outcome.failure) {
      this.navigate('game_over', { reason: outcome.failure.reason, snapshot: outcome.state });
      return;
    }

    if (outcome.endGame) {
      this.navigate('victory', { snapshot: outcome.state });
      return;
    }
  }

  describeResources() {
    const snapshot = this.game.getSnapshot();
    const staff = snapshot.staff.length
      ? snapshot.staff.map((member) => member.label).join(', ')
      : 'No dedicated staff';
    return `Budget $${snapshot.budget} | Goodwill ${snapshot.goodwill} | Staff: ${staff}`;
  }

  requestFunding() {
    const success = Math.random() > 0.5;
    if (success) {
      this.game.adjustBudget(200);
      this.game.addLogEntry({
        type: 'success',
        message: 'Emergency funding request approved! Budget increases by $200.',
      });
    } else {
      this.game.adjustGoodwill(-10);
      this.game.addLogEntry({
        type: 'event',
        message: 'Emergency funding request denied. Goodwill drops by 10.',
      });
    }
  }

  determineWeather(month, pace) {
    const paceAnchor = {
      steady: 'sunny',
      strenuous: 'turbulent',
      grueling: 'stormy',
    };
    const anchor = paceAnchor[pace] ?? 'sunny';
    const anchorIndex = WEATHER_PATTERNS.indexOf(anchor);
    const index = (month + (anchorIndex >= 0 ? anchorIndex : 0)) % WEATHER_PATTERNS.length;
    return WEATHER_PATTERNS[index];
  }

  nextMilestoneLabel(snapshot) {
    const remaining = this.game.getRemainingCampuses();
    if (remaining <= 0) return 'CSU Maritime';
    const nextNumber = snapshot.campusesReached + 1;
    return `Campus #${nextNumber} (${remaining} to go)`;
  }

  destroy() {
    this.menu?.detach();
  }
}
