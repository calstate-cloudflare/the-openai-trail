function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Math.random().toString(36).slice(2, 10)}${Date.now()}`;
}

function resolveFetcher(providedFetcher) {
  if (providedFetcher) return providedFetcher;
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return typeof fetch === 'function' ? fetch : null;
}

export class TelemetryClient {
  constructor({ endpoint = null, fetcher } = {}) {
    this.endpoint = endpoint;
    this.fetcher = resolveFetcher(fetcher);
    this.resetSession();
    this.hasWarnedMissingEndpoint = false;
  }

  resetSession() {
    this.payload = {
      sessionId: generateSessionId(),
      source: 'openai-trail',
      collectedAt: new Date().toISOString(),
      role: null,
      teamName: '',
      teamMembers: [],
      quizAnswers: [],
      gameMeta: {
        version: '0.1.0',
      },
    };
    this.submissionCount = 0;
  }

  setEndpoint(endpoint) {
    this.endpoint = endpoint ?? null;
  }

  setRole(role) {
    if (!role) return;
    this.payload.role = {
      id: role.id ?? null,
      label: role.label ?? '',
      description: role.description ?? '',
    };
  }

  setTeamName(teamName) {
    this.payload.teamName = teamName ?? '';
  }

  setTeamMembers(members) {
    if (Array.isArray(members)) {
      this.payload.teamMembers = members.slice(0, 4);
    }
  }

  recordQuizAnswer(questionId, choiceId, extras = {}) {
    if (!questionId || !choiceId) return;
    const timestamp = new Date().toISOString();
    const existingIndex = this.payload.quizAnswers.findIndex((answer) => answer.questionId === questionId);
    const entry = {
      questionId,
      choiceId,
      answeredAt: timestamp,
      ...extras,
    };

    if (existingIndex >= 0) {
      this.payload.quizAnswers.splice(existingIndex, 1, entry);
    } else {
      this.payload.quizAnswers.push(entry);
    }
    this.submitPayload();
  }

  async submitPayload() {
    if (!this.fetcher || !this.endpoint) {
      if (!this.fetcher) {
        console.warn('[Telemetry] No fetch implementation configured.');
      }
      if (!this.endpoint && !this.hasWarnedMissingEndpoint) {
        console.warn('[Telemetry] Telemetry endpoint not configured. Define PUBLIC_TELEMETRY_ENDPOINT in your .env file.');
        this.hasWarnedMissingEndpoint = true;
      }
      return;
    }

    const body = JSON.stringify({
      ...this.payload,
      submissionCount: this.submissionCount + 1,
      submittedAt: new Date().toISOString(),
    });

    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      if (response.ok) {
        this.submissionCount += 1;
      } else if (response.status === 409) {
        console.warn('[Telemetry] Submission conflict — immutable field change or stale submissionCount');
      } else if (response.status >= 400 && response.status < 500) {
        console.warn('[Telemetry] Submission failed', response.status, await this.safeReadBody(response));
      } else {
        console.warn('[Telemetry] Submission failed', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('[Telemetry] Submission error', error);
    }
  }

  async safeReadBody(response) {
    try {
      return await response.clone().json();
    } catch {
      try {
        return await response.clone().text();
      } catch {
        return null;
      }
    }
  }
}
