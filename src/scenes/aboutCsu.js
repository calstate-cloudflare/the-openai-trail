import { BaseScene } from './baseScene.js';

export class AboutCsuScene extends BaseScene {
  constructor(context) {
    super(context);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.armInteraction = this.armInteraction.bind(this);
    this.interactionReady = false;
    this.interactionFrame = null;
  }

  mount() {
    const prompts = this.getPrompt(this.sceneName);
    if (!prompts) {
      throw new Error(`Missing prompts for scene "${this.sceneName}".`);
    }

    this.clear();

    const wrapper = document.createElement('section');
    wrapper.className = 'about-csu';

    const logoContainer = document.createElement('div');
    logoContainer.className = 'about-csu__logo';
    logoContainer.setAttribute('role', 'img');
    logoContainer.setAttribute('aria-label', prompts.logoLabel ?? 'California State University system logo');

    const logoMark = document.createElement('div');
    logoMark.className = 'about-csu__logo-mark';
    logoMark.textContent = prompts.logoMark ?? 'CSU';

    const logoText = document.createElement('div');
    logoText.className = 'about-csu__logo-text';
    logoText.textContent = prompts.logoText ?? 'California State University';

    logoContainer.appendChild(logoMark);
    logoContainer.appendChild(logoText);

    const content = document.createElement('div');
    content.className = 'about-csu__content';

    if (prompts.title) {
      const title = document.createElement('h1');
      title.className = 'screen__title about-csu__title';
      title.textContent = prompts.title;
      content.appendChild(title);
    }

    const scrollClip = document.createElement('div');
    scrollClip.className = 'about-csu__scroll-clip';

    const scrollBody = document.createElement('div');
    scrollBody.className = 'about-csu__scroll-body';

    const paragraphs = Array.isArray(prompts.scrollContent)
      ? prompts.scrollContent
      : Array.isArray(prompts.body)
        ? prompts.body
        : [];

    paragraphs.forEach((text, index) => {
      if (!text) return;
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      paragraph.className = index === 0 ? 'about-csu__lead' : '';
      scrollBody.appendChild(paragraph);
    });

    scrollClip.appendChild(scrollBody);
    content.appendChild(scrollClip);

    if (prompts.prompt) {
      const prompt = document.createElement('div');
      prompt.className = 'screen__prompt about-csu__prompt';
      prompt.textContent = prompts.prompt;
      content.appendChild(prompt);
    }

    const logoStack = document.createElement('div');
    logoStack.className = 'about-csu__logo-stack';
    logoStack.appendChild(logoContainer);

    const mainMenuButton = document.createElement('button');
    mainMenuButton.type = 'button';
    mainMenuButton.className = 'about-csu__main-menu';
    mainMenuButton.textContent = prompts.mainMenuLabel ?? 'Main Menu';
    mainMenuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.navigate('main_menu', { source: this.sceneName, viaButton: true });
    });

    logoStack.appendChild(mainMenuButton);

    wrapper.appendChild(logoStack);
    wrapper.appendChild(content);

    this.root.appendChild(wrapper);

    document.addEventListener('keydown', this.handleKeydown);
    this.root.addEventListener('click', this.handleClick);
    this.interactionFrame = requestAnimationFrame(this.armInteraction);
  }

  handleKeydown(event) {
    if (!this.interactionReady) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.continue();
    }
  }

  handleClick() {
    if (!this.interactionReady) return;
    this.continue();
  }

  continue() {
    const destination = this.props?.returnTo ?? 'main_menu';
    this.navigate(destination, { source: this.sceneName });
  }

  armInteraction() {
    this.interactionReady = true;
    this.interactionFrame = null;
  }

  destroy() {
    this.interactionReady = false;
    if (this.interactionFrame !== null) {
      cancelAnimationFrame(this.interactionFrame);
      this.interactionFrame = null;
    }
    document.removeEventListener('keydown', this.handleKeydown);
    this.root.removeEventListener('click', this.handleClick);
  }
}
