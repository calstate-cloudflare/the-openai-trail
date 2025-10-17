const BASE_WIDTH = 818;
const BASE_HEIGHT = 480;

export function initScaler(frame) {
  if (!frame) return () => {};

  const updateScale = () => {
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const widthScale = rect.width / BASE_WIDTH;
    const heightScale = rect.height / BASE_HEIGHT;
    const scale = Math.min(widthScale, heightScale) || 1;
    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;

    frame.style.setProperty('--screen-scale', scale.toString());
    frame.style.setProperty('--screen-offset-x', `${offsetX}px`);
    frame.style.setProperty('--screen-offset-y', `${offsetY}px`);
  };

  const scheduleUpdate = () => requestAnimationFrame(updateScale);

  scheduleUpdate();
  window.addEventListener('resize', updateScale);
  window.addEventListener('orientationchange', updateScale);

  return () => {
    window.removeEventListener('resize', updateScale);
    window.removeEventListener('orientationchange', updateScale);
  };
}
