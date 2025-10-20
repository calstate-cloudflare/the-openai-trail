<img src="./img/title.png" alt="The OpenAI Trail title screen">

# The OpenAI Trail

A parody reimagining of the classic Oregon Trail where you lead a CSU-wide rollout of ChatGPT EDU. Manage staff morale, budget, and adoption metrics across 23 campuses while surviving policy reviews, surprise audits, and the occasional viral success story.

## Features

- **Campaign management:** Balance goodwill, morale, pace, and engagement while marching toward the Maritime Academy.
- **Data-driven storytelling:** All dialog, events, and scene flows live in `data/*.json`, making it easy to iterate without touching code.
- **Branching encounters:** Randomized events and quiz decisions influence resources and timeline progression.
- **Retro presentation:** Pixel UI, CRT scanlines, and responsive scaling evoke the Apple II era.

## Run Locally

The project is a static site with no build step—serve the root directory and open it in a browser.

```bash
python -m http.server 8888
```

Then visit [http://localhost:8888](http://localhost:8888) and the game will load from `index.html`.

Feel free to use any other static server (e.g., `npx serve`, `http-server`, or a VS Code Live Server extension).

### Environment Variables

Copy `.env.example` to `.env` and update `PUBLIC_TELEMETRY_ENDPOINT` (and any other values) for your deployment. The file is served to the browser, so only include keys intended for public use.

### Telemetry Dashboard

Open `telemetry.html` after configuring the endpoint to browse captured role/team/quiz submissions. The page uses the same `.env` values and supports pagination via the API’s `cursor` parameter.

## Editing Content

- `data/text_prompts.json` contains all menu copy, dialog, and quiz text.
- `data/events.json` defines campaign events, conditions, and resource effects.
- `data/flow.json` controls the default scene order and transitions.
- `src/game/logic.js` and `src/scenes/` house the state machine and scene render logic.

## Deploying to Netlify

Netlify can host the project as a static site:

1. Connect the GitHub repository in Netlify.
2. Set **Build command** to blank (no build step).
3. Set **Publish directory** to `.` (the repository root).
4. Deploy. Netlify will serve `index.html` along with all assets.

Alternatively, any static hosting service that can serve the repository root will work (GitHub Pages, Cloudflare Pages, etc.).
