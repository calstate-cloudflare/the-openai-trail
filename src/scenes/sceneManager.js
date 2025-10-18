export class SceneManager {
  constructor(context) {
    this.context = context;
    this.frame = context.frame;
    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = null;
    this.internalHashUpdate = false;

    this.handleHashChange = this.handleHashChange.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', this.handleHashChange);
    }
  }

  register(name, SceneClass) {
    this.scenes.set(name, SceneClass);
  }

  hasScene(name) {
    return this.scenes.has(name);
  }

  start(name, props, options) {
    this.transitionTo(name, props, options);
  }

  transitionTo(name, props, options = {}) {
    const { updateHash = true } = options;
    const SceneClass = this.scenes.get(name);
    if (!SceneClass) {
      throw new Error(`Scene "${name}" is not registered.`);
    }

    if (this.currentScene?.destroy) {
      this.currentScene.destroy();
    }

    this.currentSceneName = name;
    this.currentScene = new SceneClass({
      ...this.context,
      manager: this,
      sceneName: name,
      props,
    });

    if (this.frame) {
      this.frame.dataset.background = name;
    }

    if (this.context?.root) {
      this.context.root.dataset.scene = name;
    }

    if (this.currentScene?.mount) {
      this.currentScene.mount();
    }

    if (updateHash && typeof window !== 'undefined') {
      const desiredHash = `#${name}`;
      if (window.location.hash !== desiredHash) {
        this.internalHashUpdate = true;
        window.location.hash = desiredHash;
      }
    }
  }

  handleHashChange() {
    if (this.internalHashUpdate) {
      this.internalHashUpdate = false;
      return;
    }

    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash || hash === this.currentSceneName || !this.hasScene(hash)) {
      return;
    }

    this.transitionTo(hash, undefined, { updateHash: false });
  }
}
