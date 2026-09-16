/* Shared free tawk.to inbox. Public widget identifiers, not API credentials. */
(function () {
  'use strict';
  if (window.top !== window.self || document.getElementById('minato-chat-embed')) return;
  window.Tawk_API = window.Tawk_API || {};
  var api = window.Tawk_API;
  var label = document.createElement('button');
  label.type = 'button';
  label.id = 'minato-chat-label';
  label.textContent = 'チャットで相談';
  label.hidden = true;
  label.addEventListener('click', function () { api.maximize(); });
  var style = document.createElement('style');
  style.textContent = '#minato-chat-label{position:fixed;right:96px;bottom:24px;z-index:2147483000;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#172554;padding:12px 17px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 4px 20px #17255418;cursor:pointer}#minato-chat-label[hidden]{display:none}#minato-chat-label:hover{background:#eff6ff}#minato-chat-label:focus-visible{outline:3px solid #2563eb;outline-offset:3px}@media(max-width:600px){#minato-chat-label{right:96px;bottom:calc(22px + env(safe-area-inset-bottom));padding:10px 13px}}';
  document.head.appendChild(style);
  document.body.appendChild(label);
  api.onLoad = function () { label.hidden = api.isChatMaximized() || api.isChatHidden(); };
  api.onChatMaximized = function () { label.hidden = true; };
  api.onChatMinimized = function () { label.hidden = false; };
  api.onChatHidden = function () { label.hidden = true; };
  window.Tawk_LoadStart = new Date();
  var script = document.createElement('script');
  script.id = 'minato-chat-embed';
  script.async = true;
  script.src = 'https://embed.tawk.to/6aaa30eee1b9133446619b3c/1k2kcu952';
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.head.appendChild(script);
})();
