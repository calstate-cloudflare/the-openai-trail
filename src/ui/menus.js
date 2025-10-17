function createElement(tag, className, textContent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

export class MenuView {
  constructor(root) {
    this.root = root;
    this.onSelect = () => {};
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  updateRoot(root) {
    this.detach();
    this.root = root;
  }

  render({ title, divider, body = [], options = [], prompt, onSelect }) {
    this.detach();
    this.onSelect = onSelect ?? (() => {});
    this.root.innerHTML = '';

    const fragment = document.createDocumentFragment();

    if (title && String(title).trim().length > 0) {
      fragment.appendChild(createElement('h1', 'screen__title', title));
    }

    if (divider && String(divider).trim().length > 0) {
      fragment.appendChild(createElement('div', 'ascii-divider', divider));
    }

    if (Array.isArray(body) && body.length) {
      const bodyElement = createElement('div', 'screen__body');
      body.forEach((line, index) => {
        if (index > 0) bodyElement.appendChild(document.createElement('br'));
        const span = createElement('span', '', line);
        bodyElement.appendChild(span);
      });
      fragment.appendChild(bodyElement);
    }

    if (options.length) {
      const menuElement = createElement('div', 'menu');

      options.forEach((option, index) => {
        const optionRow = createElement('div', 'menu__option');

        const header = createElement('div', 'menu__option-header');
        const indexLabel = createElement('span', 'menu__index', `${index + 1}.`);
        header.appendChild(indexLabel);

        const textWrapper = createElement('div', 'menu__text-wrapper');

        const button = createElement('button', 'menu__button', option.label);
        button.type = 'button';
        button.dataset.index = String(index);
        const isDisabled = option.disabled || option.locked;
        if (isDisabled) {
          button.disabled = true;
          button.classList.add('menu__button--disabled');
          button.tabIndex = -1;
        } else {
          button.addEventListener('click', () => this.onSelect(option, index));
        }
        textWrapper.appendChild(button);

        if (option.description) {
          const description = createElement('span', 'menu__description', option.description);
          textWrapper.appendChild(description);
        } else if (option.benefit) {
          const description = createElement('span', 'menu__description', `Benefit: ${option.benefit}`);
          textWrapper.appendChild(description);
        }

        if (option.note) {
          const note = createElement('span', 'menu__note', option.note);
          textWrapper.appendChild(note);
        }

        header.appendChild(textWrapper);
        optionRow.appendChild(header);

        menuElement.appendChild(optionRow);
      });

      fragment.appendChild(menuElement);
    }

    if (prompt) {
      fragment.appendChild(createElement('div', 'screen__prompt', prompt));
    }

    this.root.appendChild(fragment);
    document.addEventListener('keydown', this.handleKeydown);
  }

  handleKeydown(event) {
    const { key } = event;
    if (!/^\d$/.test(key)) return;

    const index = Number(key) - 1;
    const options = Array.from(this.root.querySelectorAll('.menu__button'));

    if (index >= 0 && index < options.length) {
      event.preventDefault();
      const button = options[index];
      if (button.disabled) return;
      button.focus();
      button.click();
    }
  }

  detach() {
    document.removeEventListener('keydown', this.handleKeydown);
  }
}
