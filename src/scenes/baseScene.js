export class BaseScene {
  constructor({ root, game, textPrompts, manager, sceneName, props }) {
    this.root = root;
    this.game = game;
    this.textPrompts = textPrompts;
    this.manager = manager;
    this.sceneName = sceneName;
    this.props = props;
    this.flowConfig = manager?.context?.flowConfig ?? {};
  }

  getPrompt(key) {
    return this.textPrompts?.[key] ?? null;
  }

  navigate(nextScene, props) {
    this.manager.transitionTo(nextScene, props);
  }

  resolveTransition(key, fallback) {
    const transitions = this.flowConfig?.transitions ?? {};
    return transitions[key] ?? fallback;
  }

  clear() {
    this.root.innerHTML = '';
  }

  mount() {}

  destroy() {}
}
