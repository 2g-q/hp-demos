(() => {
  'use strict';
  // Only our published samples may be embedded. Never interpolate a query URL.
  const works = {
    'nagi-stay': ['NAGI', '宿泊施設', '客室や食事、滞在の過ごし方を写真で伝える宿のサイトです。'],
    'towa-corporate': ['TOWA INDUSTRIES', '製造業・会社案内', '設備と加工の強みを整理し、図面の相談につなぐ会社案内です。'],
    'kajitsu': ['果日', '食品・商品紹介', '季節の果実と飲み方を紹介する、コーディアルの商品サイトです。'],
    'yohaku-architecture': ['YOHAKU / 余白設計室', '建築・設計', '空間の写真と設計の考え方を伝える建築事務所のサイトです。'],
    'craft-recruit': ['CRAFT', '採用', '現場の仕事と働く人を紹介し、応募前の疑問に答える採用サイトです。'],
    'linen-salon': ['linen', '美容室', '店内の雰囲気や施術メニューから予約を検討できるサロンサイトです。'],
    'axis-fitness': ['AXIS', 'ジム・体験申込', 'トレーニングの内容と料金を伝え、体験申込につなぐサイトです。'],
    'ember-restaurant': ['EMBER', '飲食店', '料理と店内の写真から、食事の時間を思い描けるレストランサイトです。'],
    'koto-learning': ['KOTO', 'スクール・講座', '講座の内容と開催日程を見比べて、体験を選べる教室サイトです。'],
    'vintage-archive': ['Cool Kimono Archive', 'ヴィンテージショップ', '商品写真と店舗の世界観を伝えるショップのサイトです。', './custom/cw-vintage-archive-inbound.html'],
    'pixel-office': ['ドット絵のオフィス', '体験型サイト', '働く人や休憩する人を描いた、動くドット絵の制作例です。', './cw-pixel-office.html']
  };
  const slug = new URLSearchParams(location.search).get('site');
  const entry = Object.hasOwn(works, slug) ? works[slug] : null;
  if (!entry) {
    document.getElementById('work-name').textContent = '制作例が見つかりません';
    document.getElementById('work-description').textContent = '上のリンクから制作例一覧に戻り、もう一度お選びください。';
    document.getElementById('work-notice').hidden = true;
    return;
  }
  const [name, category, description, custom] = entry;
  const source = custom || './works/' + slug + '/';
  document.title = name + '｜サイトの制作例｜ミナト AI・IT ラボ';
  document.getElementById('work-name').textContent = name;
  document.getElementById('work-category').textContent = category;
  document.getElementById('work-description').textContent = description;
  document.getElementById('standalone').href = source;
  const frame = document.querySelector('iframe');
  frame.title = name + 'の操作できる制作サンプル';
  document.getElementById('work').hidden = false;
  frame.src = source;
})();
