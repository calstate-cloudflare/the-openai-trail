# OpenAI Trail Telemetry API – Integration Notes

## Endpoint
- `POST https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions`
- Required header: `Content-Type: application/json`

## Request Contract
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `sessionId` | string | ✅ | Unique per playthrough; used as KV key. |
| `source` | string | ✅ | Current client value: `openai-trail`. Immutable after first submit. |
| `collectedAt` | ISO-8601 string | ✅ | When telemetry collection started. |
| `submittedAt` | ISO-8601 string | ✅ | Timestamp of this submission. |
| `submissionCount` | integer | ✅ | 1-based retry counter; must increase for updates. |
| `role` | object | optional | `{ id, label, description }`. Immutable once set. |
| `teamName` | string | optional | Persisted if provided. |
| `teamMembers` | string[] | optional | Max four entries. |
| `quizAnswers` | object[] | optional | Each `{ questionId, choiceId, label?, description?, outcome?, answeredAt? }`. Answers merge by `questionId`. |
| `gameMeta` | object | optional | Additional metadata (e.g., `{ "version": "0.1.0" }`). |

## Responses
- `200 OK` – initial submission accepted.
- `202 Accepted` – existing session updated.
- `400 Bad Request` – validation failure (response includes `error` and `details`).
- `409 Conflict` – immutable field change (role/source) or `submissionCount` not increasing.
- `5xx` – Cloudflare error; retry like any transient failure.

## Sample Payload
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

## Quick Curl Test
```bash
curl https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "sessionId": "demo-session-1",
  "source": "openai-trail",
  "collectedAt": "2025-01-20T20:15:03.111Z",
  "submittedAt": "2025-01-20T20:18:47.908Z",
  "submissionCount": 1,
  "teamName": "Integration Testers",
  "teamMembers": ["A", "B"],
  "quizAnswers": [
    {
      "questionId": "quiz_intro",
      "choiceId": "research_launch",
      "answeredAt": "2025-01-20T20:16:20.312Z"
    }
  ],
  "gameMeta": {
    "version": "0.1.0"
  }
}
JSON
```

## Viewing Stored Records
- Preview namespace (dev data):  
  `npx wrangler kv:key get --preview SUBMISSIONS <sessionId>`
- Production namespace:  
  `npx wrangler kv:key get SUBMISSIONS <sessionId>`

Replace `<sessionId>` with the session you want to inspect. Output is the JSON stored in KV.

## Notes for Developers
- All timestamps must parse via `Date.parse` (ISO-8601).
- When updating a session omit fields you don’t want to change; existing values persist.
- Ensure `submissionCount` increments with each retry to avoid 409 conflicts.
- Authentication is currently open; add bearer token checks in `src/index.ts:112` when ready.

---

## Fetching Submissions (App Integration)
- `GET https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions`

### Query Parameters
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | integer | 100 | Max number of records to return (clamped at 1 000). |
| `cursor` | string | — | Pass the cursor returned by the previous page to continue listing. |

### Response Shape
```jsonc
{
  "items": [
    {
      "sessionId": "…",
      "source": "openai-trail",
      "collectedAt": "2025-01-20T20:15:03.111Z",
      "submittedAt": "2025-01-20T20:18:47.908Z",
      "submissionCount": 2,
      "role": { "...": "..." },
      "teamName": "…",
      "teamMembers": ["…"],
      "quizAnswers": [{ "...": "..." }],
      "gameMeta": { "...": "..." },
      "storedAt": "2025-01-20T20:18:47.990Z"
    }
  ],
  "cursor": "optional-next-page-token"
}
```
If `cursor` is missing from the response, pagination is complete.

### Sample Fetch
```bash
curl "https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions?limit=200"
```

### App Paging Loop (pseudo-code)
```ts
let cursor: string | undefined = undefined;
do {
  const url = new URL("https://openai-trail-telemetry.mattjhughes.workers.dev/openai-trail/submissions");
  if (cursor) url.searchParams.set("cursor", cursor);
  url.searchParams.set("limit", "200");

  const res = await fetch(url.toString());
  const { items, cursor: nextCursor } = await res.json();
  process(items); // render/store
  cursor = nextCursor;
} while (cursor);
```
