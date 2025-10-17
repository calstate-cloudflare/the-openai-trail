export class SceneManager {
  constructor(context) {
    this.context = context;
    this.frame = context.frame;
    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = null;
  }

  register(name, SceneClass) {
    this.scenes.set(name, SceneClass);
  }

  start(name, props) {
    this.transitionTo(name, props);
  }

  transitionTo(name, props) {
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
  }
}
