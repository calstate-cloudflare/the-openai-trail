import { GameLogic } from './game/logic.js';
import { SceneManager } from './scenes/sceneManager.js';
import { MainMenuScene } from './scenes/mainMenu.js';
import { RoleSelectionScene } from './scenes/roleSelection.js';
import { TeamNamingScene } from './scenes/teamNaming.js';
import { StartTimingScene } from './scenes/startTiming.js';
import { ResourceAllocationScene } from './scenes/resourceAllocation.js';
import { TravelScene } from './scenes/travelScene.js';
import { ChangePaceScene } from './scenes/changePace.js';
import { ChangeEngagementScene } from './scenes/changeEngagement.js';
import { VictoryScene, GameOverScene } from './scenes/endScenes.js';
import { InfoScene } from './scenes/infoScene.js';
import { LaunchBriefingScene } from './scenes/launchBriefing.js';
import { CutsceneScene } from './scenes/cutscene.js';
import { ProgressScene } from './scenes/progressScene.js';
import { QuizScene } from './scenes/quizScene.js';
import { initScaler } from './ui/scaler.js';

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function mountError(root, error) {
  root.innerHTML = '';
  const message = document.createElement('p');
  message.textContent = `⚠️ Unable to load game data. ${error.message}`;
  root.appendChild(message);
}

async function bootstrap() {
  const root = document.getElementById('app');
  const frame = document.getElementById('frame');
  initScaler(frame);

  try {
    const [textPrompts, eventsConfig, flowConfig] = await Promise.all([
      loadJSON('data/text_prompts.json'),
      loadJSON('data/events.json'),
      loadJSON('data/flow.json'),
    ]);

    const game = new GameLogic({ textPrompts, eventsConfig });
    const sceneManager = new SceneManager({ root, frame, game, textPrompts, flowConfig });

    sceneManager.register('main_menu', MainMenuScene);
    sceneManager.register('role_selection', RoleSelectionScene);
    sceneManager.register('about_csu', InfoScene);
    sceneManager.register('team_naming', TeamNamingScene);
    sceneManager.register('start_timing', StartTimingScene);
    sceneManager.register('resource_allocation', ResourceAllocationScene);
    sceneManager.register('travel', TravelScene);
    sceneManager.register('change_pace', ChangePaceScene);
    sceneManager.register('change_engagement', ChangeEngagementScene);
    sceneManager.register('victory', VictoryScene);
    sceneManager.register('game_over', GameOverScene);
    sceneManager.register('scoring', InfoScene);
    sceneManager.register('leaderboard', InfoScene);
    sceneManager.register('launch_briefing', LaunchBriefingScene);
    sceneManager.register('quiz_intro', QuizScene);
    sceneManager.register('cutscene_golden_bear', CutsceneScene);
    sceneManager.register('cutscene_channel_islands', CutsceneScene);
    sceneManager.register('cutscene_long_beach', CutsceneScene);
    sceneManager.register('progress_status', ProgressScene);

    const initialScene = flowConfig?.initialScene ?? 'main_menu';
    sceneManager.start(initialScene);
  } catch (error) {
    console.error(error);
    mountError(root, error);
  }
}

bootstrap();
