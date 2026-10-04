// Preserve old shared URLs while opening each completed site directly.
(() => {
  const sites = {
  "nagi-stay": "works/nagi-stay/",
  "towa-corporate": "works/towa-corporate/",
  "kajitsu": "works/kajitsu/",
  "yohaku-architecture": "works/yohaku-architecture/",
  "craft-recruit": "works/craft-recruit/",
  "linen-salon": "works/linen-salon/",
  "axis-fitness": "works/axis-fitness/",
  "ember-restaurant": "works/ember-restaurant/",
  "koto-learning": "works/koto-learning/",
  "vintage-archive": "custom/cw-vintage-archive-inbound.html",
  "pixel-office": "cw-pixel-office.html"
};
  const slug = new URLSearchParams(location.search).get('site');
  if (Object.hasOwn(sites, slug)) {
    location.replace(new URL(sites[slug], location.href));
  } else {
    document.getElementById('work-name').textContent = '制作例が見つかりません';
  }
})();
