# OpenAI Trail Telemetry API Specification

## Purpose
- Capture early-game decisions (role, team composition) once a player begins answering quiz prompts.
- Persist incremental quiz responses so partial playthroughs still generate analytics value.
- Provide a lightweight integration target (Google Sheets, Airtable, etc.) future services can implement.

## Endpoint
- `POST https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions`
- HTTPS required.
- Accepts `application/json` only.
- Front-end reads the endpoint from `config/runtime-env.json` (preferred) or from `PUBLIC_TELEMETRY_ENDPOINT` defined in `.env` / `.env.public` if the JSON file is missing. Ensure whichever file you use is published with the site and contains only public-safe values.

## Authentication
- Initial implementation may allow unauthenticated requests.
- Production deployment should require one of:
  - Static bearer token (`Authorization: Bearer <token>`).
  - Signed request headers (e.g., HMAC using shared secret).

## Request Body
JSON object with the fields below. Fields marked **required** must be present; others are optional but sent by the current client.

| Field | Type | Details |
|-------|------|---------|
| **sessionId** | string | UUID or unique identifier for a single playthrough. Enables idempotent upserts. |
| **source** | string | Client identifier. Current value: `"openai-trail"`. |
| **collectedAt** | string (ISO-8601) | Timestamp of when telemetry collection began. |
| **submittedAt** | string (ISO-8601) | Timestamp of this submission attempt. |
| **submissionCount** | integer | 1-based counter; increments with each client retry/update. |
| role | object | `{ id, label, description }` for the selected role. Omitted if player never chose a role. |
| teamName | string | Team name supplied during setup. |
| teamMembers | array<string> | Up to four teammate names. |
| quizAnswers | array<object> | Each `{ questionId, choiceId, label, description, outcome, answeredAt }`. `questionId` matches scene ids (`quiz_intro`, `quiz_phase2`, …). |
| gameMeta | object | `{ version: "0.1.0" }` plus future metadata. |

### Example Payload
```json
{
  "sessionId": "3f6f8f3c-1a5a-4e9a-9f7b-cc55c7fe84f3",
  "source": "openai-trail",
  "collectedAt": "2025-01-20T20:15:03.111Z",
  "submittedAt": "2025-01-20T20:18:47.908Z",
  "submissionCount": 2,
  "role": {
    "id": "cio",
    "label": "Be a System-Wide CIO",
    "description": "Sets CSU-wide strategy and answers to everyone."
  },
  "teamName": "Maritime Mavericks",
  "teamMembers": ["Alex", "Jordan", "Sam", "Priya"],
  "quizAnswers": [
    {
      "questionId": "quiz_intro",
      "choiceId": "research_launch",
      "label": "Launch comms blitz",
      "description": "Kick off with a CSU-wide briefing.",
      "outcome": "Usage analytics shared",
      "answeredAt": "2025-01-20T20:16:20.312Z"
    }
  ],
  "gameMeta": {
    "version": "0.1.0"
  }
}
```

## Response Contract
- **200 OK**: Initial submission accepted.
- **202 Accepted**: Existing session updated successfully.
- **400 Bad Request**: Malformed JSON or missing required fields. Response includes `error` and details.
- **409 Conflict**: Immutable field mismatch (`source`, `role`) or `submissionCount` not strictly increasing.
- **429 Too Many Requests**: (Future) request throttled; client should respect `Retry-After` header if provided.
- **5xx**: Server-side errors; treat as transient and retry on subsequent quiz answers.

## Storage Notes
- Upsert records keyed by `sessionId`. Merging strategy should replace prior `quizAnswers` entries that share `questionId`.
- Preserve a submission history (sessionId + submissionCount) if audit trails are required.

## Operational Considerations
- Implement basic rate limiting (e.g., 30 req/min per IP) to avoid abuse.
- Log request metadata and validation errors for debugging.
- Provide a lightweight dashboard or export that surfaces:
  - Total unique sessions.
  - Distribution of role selections.
  - Drop-off rate per quiz question.
- Consider nightly export to CSV/Sheets for non-technical stakeholders.
