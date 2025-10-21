const BASE_WIDTH = 818;
const BASE_HEIGHT = 480;

export function initScaler(frame) {
  if (!frame) return () => {};

  const getAvailableRect = () => {
    const parent = frame.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return rect;
      }
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  const updateScale = () => {
    const rect = getAvailableRect();
    if (rect.width === 0 || rect.height === 0) return;

    const widthScale = rect.width / BASE_WIDTH;
    const heightScale = rect.height / BASE_HEIGHT;
    const scale = Math.min(widthScale, heightScale) || 1;
    frame.style.setProperty('--frame-scale', scale.toString());
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
