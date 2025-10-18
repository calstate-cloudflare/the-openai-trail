# 🧭 The OpenAI Trail — Game Design Overview

A parody re-imagining of the 1985 *Oregon Trail*, themed around the **California State University (CSU)** system’s 2025 rollout of ChatGPT EDU.

---

## 🎮 Core Concept
Players lead a CSU-wide initiative to deploy ChatGPT across 23 campuses before the end of 2025.  
They must balance limited resources, governance reviews, staff morale, and AI adoption metrics while encountering random events (budget freezes, FERPA audits, viral success stories).

Goal:  
Successfully reach the “Maritime Academy” (final campus) with your team intact, reputation solid, and usage metrics high.

---

## 🧱 Architecture Overview

| Module | Purpose |
|--------|----------|
| `/data/text_prompts.json` | All dialogue, menu text, and event messages. Easily editable by non-coders. |
| `/assets/images/` | Retro pixel art: campus map, staff avatars, dialog windows. |
| `/src/ui/menus.js` | Renders menus using text from `text_prompts.json`. |
| `/src/game/logic.js` | Core state machine controlling resources, pacing, and random events. |
| `/src/game/events.js` | Table of event probabilities, conditions, and effects. |
| `/data/flow.json` | Controls scene order and default transitions so writers can steer the campaign. |
| `/src/scenes/` | Scene-specific render logic (store, rollout, review meetings, leaderboard). |
| `/style/retro.css` | 16-color palette + monospace styling (simulate Apple II look). |
| `/src/scenes/progressScene.js` | Animated campus progress readout screen. |
| `/src/scenes/quizScene.js` | Text-only branching quiz menu for kickoff choices. |

---

## 🔀 Steering the Flow

Scene transitions are data-driven via `/data/flow.json`. Set `initialScene` to change the game’s starting point and edit entries in the `transitions` map to reroute default paths. Each key follows the pattern `sceneName.event`:

- `role_selection.select`: triggered after the player locks in a role.
- `team_naming.submit`: when the team form is completed.
- `resource_allocation.finish`: when the player leaves the staffing screen.
- `launch_briefing.continue`: when the Chancellor’s Office splash is dismissed.
- `quiz_intro.select`: choice made on the kickoff strategy quiz.
- `progress_status.continue.1/2/3`: branching points after each status check (routes to quiz_phase2/4/6).
- `quiz_phase2.select`, `quiz_phase3.select`, `quiz_phase4.select`, `quiz_phase5.select`, `quiz_phase6.select`: follow-up quizzes in the rollout cycle.
- `cutscene_maritime.continue`, `cutscene_channel_islands.continue`, `cutscene_long_beach.continue`: campus beat screens tying into the progress loop.
- `cutscene_golden_bear.continue`, `cutscene_channel_islands.continue`, `cutscene_long_beach.continue`: cut-scene beat screens tied to their respective backgrounds.
- `progress_status.continue`: rollout progress dashboard with animated header.

### Testing Aids

- Tap the subtle “Skip” button in the top-right corner of the frame to jump directly to the Chancellor’s Office launch briefing during development.
- You can deep-link to any scene by appending its ID as a hash (e.g. `/#quiz_phase2`). The URL updates automatically as you navigate so you can refresh or share a specific page.

Update the target scene string to steer the campaign without touching JavaScript.

---

## 🏁 Game Flow

### **Main Menu**
```
THE OPENAI TRAIL
---------------------------------
1. Roll out ChatGPT
2. Learn about the CSU
3. See the Rollout Leaderboard
What is your choice? _
```

### **Character Selection**
```
Many people played a role in rolling out ChatGPT across the CSU.
You may:

1. Be a System-Wide CIO
   (High influence, high expectations, few excuses)
2. Be a Campus Engagement Partner
   (Knows the people, limited authority, big heart)
3. Be a Chief Infrastructure & Administrative Officer
   (Has the keys to the network... and the budget)
4. Be a Senior Technology Strategist
   (Underpaid, overworked, but somehow keeps it all together)

What is your choice? _
```

Each profession sets starting “resources,” analogous to Oregon Trail’s money and difficulty.

| Role | Starting Budget | Bonus | Multiplier |
|------|------------------|--------|-------------|
| CIO | $1600 | Easiest | ×1 |
| Engagement Partner | $800 | Balanced | ×2 |
| Strategist | $400 | Hardest | ×3 |

---

### **Team Naming**
```
What is the name of your rollout team? _
Name your teammates:
1. _
2. _
3. _
4. _
Each will have their own strengths... and their own meeting fatigue.
```

---

### **Start Timing**
```
It is 2025.
AI has suddenly become a critical technology.
You must decide when to begin your system-wide rollout of ChatGPT.

1. Right now (January)
2. Not an option
3. Not an option
4. Not an option

What is your choice? _
```

---

### **Resource Allocation Menu**
```
Before starting this rollout, you should acquire dedicated resources.
You have funds for 0 new FTEs.

You may:
1. Secure a Faculty Innovation Fellow
2. Reassign a Systems Administrator
3. Recruit a Communications Lead
4. Borrow a Privacy Officer
5. Tap an AI Policy Coordinator
6. Check out
Which role would you like to secure? _
```

| Resource | Function | Benefit | Risk |
|-----------|-----------|----------|------|
| Faculty Innovation Fellow | Adoption Speed | Boosts morale | Overpromises |
| Systems Administrator | Infrastructure | Prevents outages | Slows change |
| Communications Lead | PR & training | Improves morale | Consumes goodwill |
| Privacy Officer | FERPA compliance | Prevents disasters | Slows progress |
| AI Policy Coordinator | Governance | Improves consistency | Time sink early on |

---

## 🗺️ Core Loop Menu (Travel Screen)
```
You are now beginning the rollout.
Weather: turbulent
Morale: good
Budget: low
Pace: steady
Engagement: filling
Next milestone: Campus #2

You may:
1. Continue the rollout
2. Check resources
3. Look at system map
4. Change pace
5. Change engagement level
6. Stop to rest (mental health day)
7. Attempt to trade staff time
8. Conduct training or hackathon
9. Talk to stakeholders
10. Request emergency funding
What is your choice? _
```

---

## ⚙️ Sub-Menus

### **Change Pace**
```
The rollout pace can affect morale and outcomes.
1. Steady
2. Strenuous
3. Grueling
What is your choice? _
```

### **Change Engagement Level**
```
Engagement affects adoption and burnout.
1. Filling (workshops and support)
2. Meager (emails and reminders)
3. Bare-bones (hope and prayer)
What is your choice? _
```

### **Governance Review (River Crossing Analogue)**
```
You are now at a Systemwide Governance Review.
Complexity: HIGH
Risk of delay: MODERATE

You may:
1. Attempt to rush it through
2. Prepare full documentation
3. Wait for better timing
4. Hire external consultants
What is your choice? _
```

---

## 🎯 End Conditions

| Condition | Result |
|------------|--------|
| Reach CSU Maritime | 🎉 Win (successful rollout) |
| Lose staff / burnout | You “ran out of implementation teams.” |
| Lose goodwill | “The rollout has lost support.” |
| Run out of time | “The academic year ended before you finished.” |

End-screen:
```
You have successfully reached CSU Maritime!
Faculty, students, and staff are using ChatGPT daily.
Your legacy as an AI Trailblazer will be remembered.
```

---

## 🧮 Scoring
- Surviving team members: +500 pts each  
- Campuses deployed: +50 pts each  
- Remaining goodwill: +1 pt / 25 units  
- Remaining budget: +1 pt / $5  
- Bonus multiplier based on role (×1–×3)

---

## 🖼️ Visual & Styling Notes
- 16-color pixel palette (black background, green/white/amber text).
- Retro text borders with ASCII art.
- 320×200 canvas grid (simulate Apple IIe CRT).
- Scene images:
  - `/assets/images/start_screen.png`
  - `/assets/images/rollout_map.png`
  - `/assets/images/governance_review.png`
  - `/assets/images/hackathon.png`
  - `/assets/images/game_over.png`

---

## 🧩 Example Text Config (`/data/text_prompts.json`)
```json
{
  "main_menu": {
    "title": "THE OPENAI TRAIL",
    "options": [
      "Roll out ChatGPT",
      "Learn about the CSU",
      "See the Rollout Leaderboard"
    ]
  },
  "roles": [
    {"name": "System-Wide CIO", "desc": "High influence, high expectations"},
    {"name": "Campus Engagement Partner", "desc": "Knows the people"},
    {"name": "Chief Infrastructure & Admin Officer", "desc": "Controls the budget"},
    {"name": "Senior Technology Strategist", "desc": "Underpaid, overworked"}
  ],
  "review_event": {
    "text": "You are now at a Systemwide Governance Review. Complexity: HIGH.",
    "options": ["Rush it", "Prepare documentation", "Wait", "Hire consultants"]
  }
}
```

---

## 🔧 Development Notes
- Game logic should read from `text_prompts.json` and `events.json`, so writers can update all content without touching JS code.  
- Use a retro-style font (e.g. *Press Start 2P*).  
- Sounds: simple square-wave “beeps” for menus and alerts.  
- Maintain a modular event system (`events.js`) for random incidents and probability rolls.

---

✅ **Next Steps**
1. Build a simple HTML/JS prototype that loads `text_prompts.json` → renders menus.
2. Add state tracking for budget, morale, engagement, and progress.
3. Attach imagery from `/assets/images/`.
4. Integrate events and scoring.
5. Export final build as a web game playable in browser.
