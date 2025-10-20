const ENV_PATHS = ['.env', '.env.public'];
let envPromise = null;

function parseEnv(text) {
  if (!text) return {};
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return acc;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = value.replace(/^"|"$/g, '');
      return acc;
    }, {});
}

async function fetchEnv() {
  if (typeof fetch !== 'function') {
    return {};
  }

  for (const path of ENV_PATHS) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      return parseEnv(text);
    } catch (error) {
      console.warn(`[Env] Failed to fetch ${path}`, error);
    }
  }

  console.warn('[Env] No environment file found (.env or .env.public).');
  return {};
}

export function loadEnvironmentConfig() {
  if (!envPromise) {
    envPromise = fetchEnv();
  }
  return envPromise;
}
