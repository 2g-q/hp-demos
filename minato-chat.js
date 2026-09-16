/* Shared free tawk.to inbox. Public widget identifiers, not API credentials. */
(function () {
  'use strict';
  if (window.top !== window.self || document.getElementById('minato-chat-embed')) return;
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  var script = document.createElement('script');
  script.id = 'minato-chat-embed';
  script.async = true;
  script.src = 'https://embed.tawk.to/6aaa30eee1b9133446619b3c/1k2kcu952';
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.head.appendChild(script);
})();
