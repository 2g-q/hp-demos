/* Outer presentation only. Palette source: pf/real-covers/manifest.json.
 * Keep application/window colours independent of the portfolio shell. */
(() => {
  const themes = {
    'document-intake': ['#f5f1e9', '#282824', '#d63d2e', 'paper', 'center'],
    'data-dashboard': ['#10151d', '#f6f7f8', '#c7f561', 'orbit', 'center'],
    'workflow': ['#12594d', '#ffffff', '#e4f49f', 'route', 'right'],
    'product-catalog': ['#e34e2f', '#fff8f0', '#ffdf7e', 'sun', 'center'],
    'web-watch': ['#191d37', '#ffffff', '#ffbf70', 'radar', 'left'],
    'case-management': ['#e7dced', '#36283e', '#715088', 'stripes', 'wide'],
    'workbench-data': ['#164aa0', '#ffffff', '#bde3ff', 'grid', 'bottom'],
    'workbench-shipping': ['#f2c967', '#352e1c', '#876028', 'steps', 'right'],
    'workbench-review': ['#633f4f', '#fff5ec', '#edb8a0', 'paper', 'left'],
    'ec-support': ['#d6e6dd', '#244b40', '#438b71', 'route', 'center'],
    'cw-api-link': ['#102a45', '#ffffff', '#57d8d5', 'orbit', 'wide'],
    'cw-gyomu-system': ['#e8e1d3', '#39372f', '#a07246', 'steps', 'bottom'],
    'cw-automation': ['#44225c', '#fff8ff', '#d4adff', 'loop', 'right'],
    'cw-dashboard': ['#f3dace', '#573126', '#b55737', 'sun', 'wide'],
    'ai-improvement': ['#112c35', '#f5fbf8', '#8be2c2', 'orbit', 'bottom'],
    'knowledge-search': ['#e9e5ce', '#3b4434', '#72834f', 'stripes', 'left'],
    'cw-line': ['#193e27', '#f6fff1', '#bce598', 'sun', 'right'],
    'sns-workflow': ['#f0d5dd', '#5a334c', '#9c557d', 'paper', 'left'],
    'cw-design': ['#f4e6c7', '#2f3a50', '#d18b39', 'grid', 'center'],
    'cw-sns': ['#4c326e', '#fff5ff', '#eca9c6', 'sun', 'wide'],
    'sales-slides': ['#22344a', '#ffffff', '#e2aa55', 'stripes', 'bottom']
  };
  function applyTheme() {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '');
    const tab = ['data', 'shipping', 'review'].includes(location.hash.slice(1))
      ? location.hash.slice(1) : 'data';
    const key = page === 'workbench' ? `${page}-${tab}` : page;
    if (!themes[key]) return;
    const root = document.documentElement;
    root.dataset.portfolioTheme = key;
    root.dataset.portfolioMotif = themes[key][3];
    root.dataset.portfolioLayout = themes[key][4];
    themes[key].slice(0, 3).forEach((value, i) => root.style.setProperty(
      ['--portfolio-bg', '--portfolio-ink', '--portfolio-accent'][i], value));
    // The orange cover needs darker text for readable small body copy.
    root.style.setProperty('--portfolio-text', key === 'product-catalog' ? '#170e08' : themes[key][1]);
  }
  applyTheme();
  addEventListener('hashchange', applyTheme);
})();
