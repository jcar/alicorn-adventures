/**
 * Installable-app support (iPad Home Screen): register the service worker
 * (built from tools/sw-template.js), which caches the game so it starts fast
 * and works without internet. New versions take over the next time it opens.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const go = () => navigator.serviceWorker.register('sw.js').catch(() => {
    /* not supported here: the game still works online */
  });
  if (document.readyState === 'complete') void go();
  else window.addEventListener('load', () => void go());
}
