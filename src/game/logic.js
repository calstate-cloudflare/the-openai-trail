import { filterEligibleEvents, applyEventEffects } from './events.js';

const TOTAL_CAMPUSES = 23;
const DEFAULT_STARTING_BUDGET = 800;
const DEFAULT_ROLE_MULTIPLIER = 1;
const USERS_INCREMENT = 1000;
const PROGRESS_TIMELINE_INCREMENT_DAYS = 31;

export class GameLogic {
  constructor({ textPrompts, eventsConfig }) {
    this.textPrompts = textPrompts;
    this.eventsConfig = eventsConfig;
    this.listeners = new Map();
    this.totalCampuses = TOTAL_CAMPUSES;

    this.resetCampaign();
  }

  resetCampaign() {
    this.state = {
      role: null,
      teamName: '',
      teammates: [],
      budget: DEFAULT_STARTING_BUDGET,
      goodwill: 100,
      morale: 70,
      engagement: 'filling',
      pace: 'steady',
      campusesReached: 0,
      currentCampusIndex: 0,
      timeline: {
        year: 2025,
        month: 1,
        day: 1,
      },
      staff: [],
      travelLog: [],
      users: 0,
      progressVisits: 0,
    };

    this.emit('state:reset', this.state);
  }

  // --- Subscribers ---------------------------------------------------------

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler);
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload, this.state));
  }

  // --- Text Prompt Helpers -------------------------------------------------

  getRoleOptions() {
    return this.textPrompts?.role_selection?.options ?? [];
  }

  getRoleById(roleId) {
    return this.getRoleOptions().find((role) => role.id === roleId);
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getRemainingCampuses() {
    return Math.max(0, this.totalCampuses - this.state.campusesReached);
  }

  getTravelLog() {
    return this.state.travelLog.slice();
  }

  getUsers() {
    return this.state.users;
  }

  formatTimeline(timeline = this.state.timeline) {
    const { year, month, day } = timeline;
    const date = new Date(year, (month ?? 1) - 1, day ?? 1);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  advanceUsers() {
    const start = this.state.users;
    const previousTimeline = { ...this.state.timeline };

    this.state.users += USERS_INCREMENT;
    this.state.progressVisits += 1;
    this.state.timeline = this.incrementTimeline(previousTimeline);

    this.emit('users:changed', {
      from: start,
      to: this.state.users,
      timeline: { from: previousTimeline, to: { ...this.state.timeline } },
    });

    return {
      start,
      end: this.state.users,
      timeline: {
        previous: previousTimeline,
        current: { ...this.state.timeline },
      },
    };
  }

  incrementTimeline(timeline = this.state.timeline) {
    const base = timeline ?? this.state.timeline;
    const date = new Date(base.year, (base.month ?? 1) - 1, base.day ?? 1);
    date.setDate(date.getDate() + PROGRESS_TIMELINE_INCREMENT_DAYS);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  // --- State Mutators ------------------------------------------------------

  selectRole(roleId) {
    const role = this.getRoleById(roleId);
    if (!role) {
      throw new Error(`Unknown role "${roleId}"`);
    }
    this.state.role = {
      id: role.id,
      label: role.label,
      description: role.description ?? '',
      multiplier: DEFAULT_ROLE_MULTIPLIER,
    };
    this.state.budget = DEFAULT_STARTING_BUDGET;
    this.emit('role:selected', { role, state: this.state });
    return role;
  }

  updateTeamName(name) {
    this.state.teamName = name;
    this.emit('team:updated', { teamName: name });
  }

  updateTeammates(names) {
    this.state.teammates = names;
    this.emit('team:updated', { teammates: names });
  }

  adjustBudget(amount) {
    this.state.budget = Math.max(0, this.state.budget + amount);
    this.emit('budget:changed', { budget: this.state.budget });
  }

  adjustGoodwill(amount) {
    this.state.goodwill = Math.max(0, this.state.goodwill + amount);
    this.emit('goodwill:changed', { goodwill: this.state.goodwill });
  }

  adjustMorale(amount) {
    const maxMorale = 100;
    this.state.morale = Math.min(maxMorale, Math.max(0, this.state.morale + amount));
    this.emit('morale:changed', { morale: this.state.morale });
  }

  setEngagement(level) {
    this.state.engagement = level;
    this.emit('engagement:changed', { engagement: level });
  }

  setPace(level) {
    this.state.pace = level;
    this.emit('pace:changed', { pace: level });
  }

  setLaunchTiming(option) {
    if (!option || typeof option !== 'object') {
      throw new Error('Launch timing option is required.');
    }
    if (option.month) {
      this.state.timeline.month = option.month;
    }
    if (option.goodwillBonus) {
      this.adjustGoodwill(option.goodwillBonus);
    }
    this.emit('timeline:updated', { timeline: { ...this.state.timeline } });
  }

  registerStaffMember(staffId, details = {}) {
    if (this.hasStaffMember(staffId)) return;
    this.state.staff.push({
      id: staffId,
      label: details.label ?? staffId,
    });
    this.emit('staff:added', { staff: this.state.staff.slice() });
  }

  hasStaffMember(staffId) {
    return this.state.staff.some((member) => member.id === staffId);
  }

  getStaffIds() {
    return this.state.staff.map((member) => member.id);
  }

  addLogEntry(entry) {
    const logEntry = {
      type: entry.type ?? 'info',
      message: entry.message,
      timestamp: entry.timestamp ?? Date.now(),
    };
    this.state.travelLog.unshift(logEntry);
    if (this.state.travelLog.length > 12) {
      this.state.travelLog.length = 12;
    }
    this.emit('log:updated', { entry: logEntry, log: this.getTravelLog() });
    return logEntry;
  }

  // --- Events --------------------------------------------------------------

  getEventDeck() {
    return this.eventsConfig?.events ?? [];
  }

  findEventById(eventId) {
    return this.getEventDeck().find((event) => event.id === eventId);
  }

  advanceCampaign() {
    const baseBudgetCost = 40;
    const moraleTax = -4;
    const goodwillTax = -2;

    this.adjustBudget(-baseBudgetCost);
    this.adjustMorale(moraleTax);
    this.adjustGoodwill(goodwillTax);

    this.state.campusesReached = Math.min(this.totalCampuses, this.state.campusesReached + 1);
    this.state.currentCampusIndex = this.state.campusesReached;
    this.updateTimeline();

    let triggeredEvent = null;

    const eligibleEvents = filterEligibleEvents(this.getEventDeck(), this.state);
    if (eligibleEvents.length && Math.random() < 0.65) {
      triggeredEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
      const updatedState = applyEventEffects(triggeredEvent, this.state, {
        onBudgetChange: (budget) => {
          this.state.budget = budget;
          this.emit('budget:changed', { budget });
        },
        onGoodwillChange: (goodwill) => {
          this.state.goodwill = goodwill;
          this.emit('goodwill:changed', { goodwill });
        },
        onMoraleChange: (morale) => {
          this.state.morale = morale;
          this.emit('morale:changed', { morale });
        },
      });
      this.state = {
        ...this.state,
        ...updatedState,
      };
      this.addLogEntry({
        type: 'event',
        message: `${triggeredEvent.name}: ${triggeredEvent.description}`,
      });
    } else {
      this.addLogEntry({
        type: 'info',
        message: 'You push onward to the next campus without major incident.',
      });
    }

    const endGame = this.state.campusesReached >= this.totalCampuses;
    const failure = this.checkFailure();

    if (failure) {
      this.addLogEntry({
        type: 'event',
        message: this.describeFailure(failure.reason),
      });
      this.emit('campaign:failed', { failure, state: this.getSnapshot() });
      return {
        state: this.getSnapshot(),
        event: triggeredEvent,
        endGame: true,
        failure,
      };
    }

    if (endGame) {
      this.addLogEntry({
        type: 'success',
        message: 'You have reached CSU Maritime! The rollout is complete.',
      });
      this.emit('campaign:completed', { timeline: this.state.timeline, state: this.getSnapshot() });
    } else {
      this.emit('progress:advanced', {
        campusesReached: this.state.campusesReached,
        timeline: this.state.timeline,
      });
    }

    return {
      state: this.getSnapshot(),
      event: triggeredEvent,
      endGame,
      failure,
    };
  }

  updateTimeline() {
    this.state.timeline.month += 1;
    if (this.state.timeline.month > 12) {
      this.state.timeline.month = 1;
      this.state.timeline.year += 1;
    }
  }

  checkFailure() {
    if (this.state.budget <= 0) {
      return { reason: 'budget' };
    }
    if (this.state.morale <= 0) {
      return { reason: 'morale' };
    }
    if (this.state.goodwill <= 0) {
      return { reason: 'goodwill' };
    }
    if (this.state.timeline.year > 2025) {
      return { reason: 'time' };
    }
    return null;
  }

  describeFailure(reason) {
    const messages = {
      budget: 'The rollout stalls after the budget runs dry.',
      morale: 'Your core team burns out and refuses to continue.',
      goodwill: 'Stakeholders withdraw support, halting the rollout.',
      time: 'The academic year ends before you complete the rollout.',
    };
    return messages[reason] ?? 'The rollout has been halted.';
  }
}
