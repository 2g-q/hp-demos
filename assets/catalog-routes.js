// Preserve bookmarks to the former single-page catalogue.
(function () {
  if (!location.pathname.endsWith('/cw.html')) return;
  var routes = {'#web':'./cw-web.html', '#sns':'./cw-social.html', '#cases':'./cases.html', '#pricing':'./pricing.html'};
  function route() { if (routes[location.hash]) location.replace(routes[location.hash]); }
  window.addEventListener('hashchange', route);
  route();
})();
