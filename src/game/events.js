export function filterEligibleEvents(events = [], state = {}) {
  return events.filter((event) => isEventEligible(event, state));
}

export function isEventEligible(event, state = {}) {
  if (!event || typeof event !== 'object') return false;

  const conditions = event.conditions ?? {};

  if (conditions.minCampus !== undefined && (state.campusesReached ?? 0) < conditions.minCampus) {
    return false;
  }

  if (conditions.minEngagement && state.engagement !== conditions.minEngagement) {
    return false;
  }

  if (conditions.requiresStaff) {
    const staffList = Array.isArray(state.staff)
      ? state.staff.map((member) => (typeof member === 'string' ? member : member.id))
      : [];
    const staff = new Set(staffList);
    const requirements = conditions.requiresStaff;
    const unmet = requirements.some((staffId) => !staff.has(staffId));
    if (unmet) {
      return false;
    }
  }

  return true;
}

export function applyEventEffects(event, state, { onBudgetChange, onGoodwillChange, onMoraleChange } = {}) {
  if (!event?.effects) return state;

  const nextState = { ...state };
  const effects = event.effects;

  if (effects.budget) {
    nextState.budget = Math.max(0, (nextState.budget ?? 0) + effects.budget);
    onBudgetChange?.(nextState.budget);
  }

  if (effects.goodwill) {
    nextState.goodwill = Math.max(0, (nextState.goodwill ?? 0) + effects.goodwill);
    onGoodwillChange?.(nextState.goodwill);
  }

  if (effects.morale) {
    nextState.morale = Math.max(0, Math.min(100, (nextState.morale ?? 0) + effects.morale));
    onMoraleChange?.(nextState.morale);
  }

  if (effects.progress) {
    nextState.campusesReached = Math.max(0, (nextState.campusesReached ?? 0) + effects.progress);
  }

  return nextState;
}
