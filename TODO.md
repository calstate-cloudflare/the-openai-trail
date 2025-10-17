# OpenAI Trail – Content & Polish TODOs

Use this checklist to finish the narrative, art, and audio polish that the current prototype still stubs out. Paths are workspace‑relative.

- **Retro imagery:** Supply Apple II–style PNGs for the key scenes and drop them in `img/` (e.g. `start_screen.png`, `rollout_map.png`, `governance_review.png`, `hackathon.png`, `game_over.png`). Update any scene components that should display them once assets exist.
- **Audio cues:** Decide on menu and alert sound effects; add them under `audio/` (create the folder) and wire playback into the relevant scenes (main menu selections, event popups, victory/failure).
- **Prompt copy polish:** Review and expand the placeholder text in `data/text_prompts.json`, especially the `about_csu`, `resource_menu`, `victory`, and `game_over` sections. Writers can edit this JSON directly to iterate on localization and tone.
- **Event catalog:** Flesh out `data/events.json` with a larger set of rollout incidents. Include `effects` blocks that adjust budget, morale, goodwill, or progress, and add `conditions` using the new staff IDs (`faculty_innovation_fellow`, `privacy_officer`, etc.).
- **Campus progression:** Author a structured campus list (name, description, optional art id) under a new file such as `data/campuses.json`, then extend `GameLogic` to reference it when advancing milestones.
- **Governance review scene:** The design doc calls for a dedicated governance “river crossing” menu. Implement a scene that pulls from `text_prompts.governance_review` and plugs into the travel loop when appropriate.
- **Scoring details:** Hook the `scoring` prompt up to real calculations (survivors, goodwill, budget, multiplier) and surface a leaderboard storage mechanism if desired.
- **Styling tweaks:** Once imagery is ready, adjust `style/retro.css` spacing and colors to best showcase the art, and consider adding subtle CRT animations to transitions.
- **Testing harness:** Add quick unit tests (e.g. with Vitest or Jest) covering `GameLogic.advanceCampaign`, event filtering, and failure conditions so narrative edits don’t break core systems.

Ping these tasks off as you complete them to track progress toward a feature-complete parody build.
