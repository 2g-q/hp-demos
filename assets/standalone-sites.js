// Standalone sites use their real viewport and keep in-page links in this site.
(() => {
  if (window.top !== window.self) return;
  const viewport = () => document.documentElement.style.setProperty('--demo-screen-height', `${innerHeight}px`);
  viewport();
  addEventListener('resize', viewport, { passive: true });
  if (!document.querySelector('base')) return;
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    const fragment = link?.getAttribute('href');
    if (!fragment?.startsWith('#') || fragment === '#') return;
    const id = decodeURIComponent(fragment.slice(1));
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    event.preventDefault();
    const url = new URL(location.href);
    url.hash = fragment;
    if (url.href !== location.href) history.pushState(null, '', url);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, true);
})();
