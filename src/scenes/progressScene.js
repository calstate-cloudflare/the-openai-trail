import { BaseScene } from './baseScene.js';

const CONTINUE_KEYS = new Set(['Enter', ' ']);

export class ProgressScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleContinue = this.handleContinue.bind(this);
    this.hasContinued = false;
    this.ready = false;
    this.animationFrame = null;
    this.usersValueElement = null;
    this.dateValueElement = null;
    this.campusesValueElement = null;
    this.healthValueElement = null;
    this.nextValueElement = null;
    this.contextOverrides = {};
    this.dateLabel = 'Date';
  }

  mount() {
    const prompts = this.getPrompt('progress_status') ?? {};

    this.clear();
    this.root.classList.add('progress-scene');

    this.contextOverrides = this.extractOverrides();

    const wrapper = document.createElement('div');
    wrapper.className = 'progress-scene__wrapper';

    const visual = document.createElement('div');
    visual.className = 'progress-scene__visual';
    const progressVideo = document.createElement('video');
    progressVideo.src = 'img/backgrounds/bld.mp4';
    progressVideo.autoplay = true;
    progressVideo.muted = true;
    progressVideo.playsInline = true;
    progressVideo.loop = false;
    progressVideo.className = 'progress-scene__visual-media';
    const poster = prompts.imagePoster;
    if (poster) {
      progressVideo.poster = poster;
    }
    progressVideo.addEventListener('ended', () => {
      progressVideo.pause();
    });
    progressVideo.addEventListener('loadeddata', () => {
      progressVideo.currentTime = 0;
      progressVideo.play().catch(() => {});
    });
    visual.appendChild(progressVideo);
    this.progressVideo = progressVideo;
    wrapper.appendChild(visual);

    const statsPanel = document.createElement('div');
    statsPanel.className = 'progress-scene__stats';

    const statsList = Array.isArray(prompts.stats) ? prompts.stats : [];
    const snapshot = this.game?.getSnapshot?.() ?? null;
    const context = this.buildContext(snapshot);

    const dateEntry = this.findEntry(statsList, 'date');
    if (dateEntry) {
      this.dateLabel = dateEntry.label ?? 'Date';
      const dateBlock = document.createElement('div');
      dateBlock.className = 'progress-scene__date';
      const dateValue = document.createElement('span');
      dateValue.className = 'progress-scene__date-value';
      dateValue.textContent = `${this.dateLabel}: ${context.date}`;
      dateBlock.appendChild(dateValue);
      statsPanel.appendChild(dateBlock);
      this.dateValueElement = dateValue;
    }

    const grid = document.createElement('div');
    grid.className = 'progress-scene__stats-grid';
    const leftColumn = document.createElement('div');
    leftColumn.className = 'progress-scene__stats-column';
    const rightColumn = document.createElement('div');
    rightColumn.className = 'progress-scene__stats-column';

    const leftOrder = ['users', 'campuses'];
    const rightOrder = ['health', 'next'];

    leftOrder.forEach((labelKey) => {
      const entry = this.findEntry(statsList, labelKey);
      if (!entry) return;
      leftColumn.appendChild(this.renderStatRow(entry, context));
    });

    rightOrder.forEach((labelKey) => {
      const entry = this.findEntry(statsList, labelKey);
      if (!entry) return;
      rightColumn.appendChild(this.renderStatRow(entry, context));
    });

    grid.appendChild(leftColumn);
    grid.appendChild(rightColumn);
    statsPanel.appendChild(grid);

    wrapper.appendChild(statsPanel);

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'progress-scene__prompt';
      prompt.textContent = prompts.prompt;
      wrapper.appendChild(prompt);
    }

    const continueButton = document.createElement('button');
    continueButton.type = 'button';
    continueButton.className = 'progress-scene__continue';
    continueButton.textContent = 'Continue';
    continueButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleContinue(event);
    });
    wrapper.appendChild(continueButton);

    this.root.appendChild(wrapper);

    document.addEventListener('keydown', this.handleContinue);
    requestAnimationFrame(() => {
      this.ready = true;
    });
    setTimeout(() => {
      this.root.addEventListener('click', this.handleContinue);
    }, 0);

    this.updateDisplayedValues(context);
    this.animateUsers();
  }

  handleContinue(event) {
    if (!this.ready) return;
    if (event?.type === 'keydown' && !CONTINUE_KEYS.has(event.key)) {
      return;
    }
    if (this.hasContinued) return;
    this.hasContinued = true;
    event?.preventDefault?.();
    const visitCount = this.game?.state?.progressVisits ?? 0;
    const baseSequence = ['quiz_phase2', 'quiz_phase4', 'quiz_phase6'];
    const zeroBased = Math.max(0, visitCount - 1);
    const baseTarget = baseSequence[zeroBased] ?? this.resolveTransition('progress_status.continue', 'travel');
    const dynamicKey = `progress_status.continue.${visitCount}`;
    const nextScene = this.resolveTransition(dynamicKey, baseTarget);
    this.navigate(nextScene, { source: 'progress_status' });
  }

  destroy() {
    document.removeEventListener('keydown', this.handleContinue);
    this.root.removeEventListener('click', this.handleContinue);
    this.root.classList.remove('progress-scene');
    this.hasContinued = false;
    this.ready = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.usersValueElement = null;
    this.dateValueElement = null;
    this.campusesValueElement = null;
    this.healthValueElement = null;
    this.nextValueElement = null;
    this.contextOverrides = {};
    if (this.progressVideo) {
      this.progressVideo.pause();
      this.progressVideo.currentTime = 0;
      this.progressVideo = null;
    }
  }

  animateUsers() {
    if (!this.shouldAnimateUsers()) {
      return;
    }

    if (!this.usersValueElement || !this.game?.advanceUsers) {
      return;
    }

    const { start, end, timeline } = this.game.advanceUsers();
    const finalSnapshot = this.game?.getSnapshot?.() ?? null;
    const finalContext = this.buildContext(finalSnapshot);

    const startDate = timeline?.previous
      ? new Date(timeline.previous.year, (timeline.previous.month ?? 1) - 1, timeline.previous.day ?? 1)
      : null;
    const endDate = timeline?.current
      ? new Date(timeline.current.year, (timeline.current.month ?? 1) - 1, timeline.current.day ?? 1)
      : null;
    const totalTime = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;

    const duration = 5000;
    const startTime = performance.now();
    const dateLabel = this.dateLabel ?? 'Date';

    this.usersValueElement.textContent = start.toLocaleString();
    if (this.dateValueElement && timeline?.previous) {
      const formatted = this.game?.formatTimeline?.(timeline.previous) ?? '';
      this.dateValueElement.textContent = `${dateLabel}: ${formatted}`;
    }

    const step = (current) => {
      const elapsed = current - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentValue = Math.round(start + (end - start) * progress);
      this.usersValueElement.textContent = currentValue.toLocaleString();

      if (this.dateValueElement && startDate && endDate && totalTime > 0) {
        const interpolatedTime = startDate.getTime() + totalTime * progress;
        const interpolated = new Date(interpolatedTime);
        const formatted = this.game?.formatTimeline?.({
          year: interpolated.getFullYear(),
          month: interpolated.getMonth() + 1,
          day: interpolated.getDate(),
        });
        this.dateValueElement.textContent = `${dateLabel}: ${formatted}`;
      }

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      } else {
        this.animationFrame = null;
        this.updateDisplayedValues(finalContext);
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  shouldAnimateUsers() {
    if (!this.game?.advanceUsers) {
      return false;
    }
    if (!this.usersValueElement) {
      return false;
    }

    const overrides = this.contextOverrides ?? {};
    if (overrides?.animateUsers === false) {
      return false;
    }

    const hasUsersOverride = Object.prototype.hasOwnProperty.call(overrides, 'users');
    const hasDateOverride = Object.prototype.hasOwnProperty.call(overrides, 'date');
    const hasCampusesOverride = Object.prototype.hasOwnProperty.call(overrides, 'campuses');

    return !hasUsersOverride && !hasDateOverride && !hasCampusesOverride;
  }

  findEntry(entries, key) {
    const target = key.toLowerCase();
    return entries.find((entry) => {
      const label = (entry?.label ?? '').toLowerCase();
      const source = (entry?.source ?? '').toLowerCase();
      return label === target || source === target;
    });
  }

  renderStatRow(entry, context) {
    const row = document.createElement('div');
    row.className = 'progress-scene__stat-row';

    const label = document.createElement('span');
    label.className = 'progress-scene__stat-label';
    label.textContent = `${entry.label ?? ''}:`;

    const value = document.createElement('span');
    value.className = 'progress-scene__stat-value';
    const source = (entry?.source ?? '').toLowerCase();
    value.dataset.source = source;
    if (entry.value !== undefined) {
      value.dataset.fallback = `${entry.value}`;
    }
    value.textContent = this.resolveStatValue(entry, context);

    row.appendChild(label);
    row.appendChild(value);

    if (source === 'users') {
      this.usersValueElement = value;
    }
    if (source === 'campuses') {
      this.campusesValueElement = value;
    }
    if (source === 'health') {
      this.healthValueElement = value;
    }
    if (source === 'next' || source === 'nextcampus') {
      this.nextValueElement = value;
    }

    return row;
  }

  updateDisplayedValues(context) {
    if (!context) return;
    if (this.usersValueElement) {
      this.usersValueElement.textContent = (context.users ?? 0).toLocaleString();
    }
    if (this.campusesValueElement) {
      const reached = context.campuses?.reached ?? 0;
      const total = context.campuses?.total ?? 0;
      this.campusesValueElement.textContent = `${reached} / ${total}`;
    }
    if (this.dateValueElement) {
      this.dateValueElement.textContent = `${this.dateLabel}: ${context.date ?? ''}`;
    }
    if (this.healthValueElement) {
      const fallback = this.healthValueElement.dataset?.fallback ?? '';
      this.healthValueElement.textContent = this.formatHealth(context.health, fallback);
    }
    if (this.nextValueElement) {
      const fallback = this.nextValueElement.dataset?.fallback ?? '';
      this.nextValueElement.textContent = this.formatNext(context.next, fallback);
    }
  }

  buildContext(snapshot, overrides = this.contextOverrides ?? {}) {
    const base = snapshot
      ? {
          date: this.game?.formatTimeline?.(snapshot.timeline) ?? '',
          users: snapshot.users ?? 0,
          campuses: {
            reached: snapshot.campusesReached ?? snapshot.progressVisits ?? 0,
            total: this.game?.totalCampuses ?? 0,
          },
          health: snapshot.morale ?? 0,
          next: undefined,
        }
      : {
          date: '',
          users: 0,
          campuses: {
            reached: 0,
            total: this.game?.totalCampuses ?? 0,
          },
          health: undefined,
          next: undefined,
        };

    if (overrides?.date !== undefined) {
      base.date = overrides.date;
    }
    if (overrides?.users !== undefined) {
      base.users = overrides.users;
    }
    if (overrides?.health !== undefined) {
      base.health = overrides.health;
    }
    if (overrides?.next !== undefined) {
      base.next = overrides.next;
    }
    if (overrides?.campuses) {
      base.campuses = {
        reached: overrides.campuses.reached ?? base.campuses.reached,
        total: overrides.campuses.total ?? base.campuses.total,
      };
    }

    return base;
  }

  resolveStatValue(entry, context) {
    if (!entry) return '';
    const source = (entry.source ?? '').toLowerCase();
    switch (source) {
      case 'date':
        return context.date ?? '';
      case 'users':
        return (context.users ?? 0).toLocaleString();
      case 'campuses': {
        const reached = context.campuses?.reached ?? 0;
        const total = context.campuses?.total ?? 0;
        return `${reached} / ${total}`;
      }
      case 'health':
        return this.formatHealth(context.health, entry.value ?? '');
      case 'next':
      case 'nextcampus':
        return this.formatNext(context.next, entry.value ?? '');
      default:
        return entry.value ?? '';
    }
  }

  extractOverrides() {
    const progressProps = this.props?.progress && typeof this.props.progress === 'object' ? this.props.progress : null;
    const directProps = this.props && typeof this.props === 'object' ? this.props : null;
    const overrides = {};

    const apply = (source) => {
      if (!source || typeof source !== 'object') return;
      if (source.date !== undefined) {
        overrides.date = source.date;
      }
      if (source.users !== undefined) {
        overrides.users = source.users;
      }
      if (source.health !== undefined) {
        overrides.health = source.health;
      }
      if (source.next !== undefined) {
        overrides.next = source.next;
      }
      if (source.nextCampus !== undefined) {
        overrides.next = source.nextCampus;
      }
      if (source.animateUsers === false) {
        overrides.animateUsers = false;
      }
      const campuses = this.normalizeCampusOverrides(source);
      if (campuses) {
        overrides.campuses = campuses;
      }
    };

    apply(progressProps);

    const directHasOverrides = directProps
      ? ['date', 'users', 'health', 'next', 'nextCampus', 'campuses', 'campusesReached', 'campusesTotal'].some(
          (key) => directProps[key] !== undefined
        )
      : false;

    if (!progressProps && directHasOverrides) {
      apply(directProps);
    }

    return overrides;
  }

  normalizeCampusOverrides(source) {
    if (!source) return null;
    if (source.campuses && typeof source.campuses === 'object') {
      const { reached, total } = source.campuses;
      return {
        reached: reached ?? source.campusesReached ?? source.reached,
        total: total ?? source.campusesTotal ?? source.total,
      };
    }

    const reached = source.campusesReached ?? source.reached;
    const total = source.campusesTotal ?? source.total;
    if (reached !== undefined || total !== undefined) {
      return {
        reached: reached ?? 0,
        total: total ?? this.game?.totalCampuses ?? 0,
      };
    }

    return null;
  }

  formatHealth(value, fallback = '') {
    if (value === undefined || value === null || value === '') {
      return `${fallback}`;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${Math.round(value)}`;
    }
    return `${value}`;
  }

  formatNext(value, fallback = '') {
    if (value === undefined || value === null || value === '') {
      return `${fallback}`;
    }
    return `${value}`;
  }
}
