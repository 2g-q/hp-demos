(() => {
  // This catalogue is the single source for display order, filters and search.
  const works = [
    ['works/nagi-stay/', 'assets/catalogue-thumbs/works_nagi-stay.webp', 'NAGI', '宿泊施設のサイト', 'HOSPITALITY / HP', '宿泊・予約', 'company booking', '宿泊 ホテル 旅館 予約 自然', '自然と客室の写真で滞在を伝え、プラン選びから予約の確認へ。', '客室・プラン選択', '予約への導線'],
    ['works/craft-recruit/', 'assets/catalogue-thumbs/works_craft-recruit.webp', 'CRAFT', '家具工房の採用LP', 'RECRUITMENT / LP', '採用・見学', 'recruit', '採用 求人 ものづくり 製造業 家具 工房', '働く姿と仕事内容を率直に伝え、募集内容の確認から見学へ。', '募集内容の確認', '見学への導線'],
    ['assets/demo-previews/cw-relay.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-relay.webp', 'Relay', '業務サービスのLP', 'BUSINESS SERVICE / LP', 'サービス案内', 'company', '業務改善 サービス 法人 BtoB タスク 管理', 'サービスの使い方を、依頼の確認から完了まで動かして試せます。', '依頼のステータス変更', '件数の連動表示'],
    ['works/kajitsu/', 'assets/catalogue-thumbs/works_kajitsu.webp', 'KAJITSU', '食品ブランドのLP', 'FOOD & PRODUCT / LP', '商品・販売', 'product company', '食品 商品 EC 通販 コーディアル 果日', '商品のある暮らしを写真で伝え、飲み方やセットを選べる構成に。', '飲み方の切り替え', '商品セット選択'],
    ['works/linen-salon/', 'assets/catalogue-thumbs/works_linen-salon.webp', 'LINEN', 'ヘアサロンのサイト', 'BEAUTY / HP', '美容・予約', 'booking company', '美容 サロン ヘア 髪 予約', 'スタイル写真と落ち着いた文字組みで、お店の空気を伝えます。', 'スタイル・メニュー', '予約への導線'],
    ['works/axis-fitness/', 'assets/catalogue-thumbs/works_axis-fitness.webp', 'AXIS', 'フィットネスのLP', 'FITNESS / LP', '体験・集客', 'booking', 'ジム フィットネス トレーニング スポーツ', '動きのある写真と力強い文字で、体験トレーニングへ案内します。', 'プログラム選択', '体験への導線'],
    ['works/yohaku-architecture/', 'assets/catalogue-thumbs/works_yohaku-architecture.webp', 'YOHAKU', '建築設計のサイト', 'ARCHITECTURE / HP', '建築・相談', 'company booking', '建築 設計 住宅 不動産', '余白と写真の大きさで空間を見せ、設計の考え方も届けます。', 'プロジェクト閲覧', '相談への導線'],
    ['works/ember-restaurant/', 'assets/catalogue-thumbs/works_ember-restaurant.webp', 'EMBER', 'レストランのサイト', 'RESTAURANT / HP', '飲食・予約', 'booking company', '飲食 レストラン ビストロ 料理 メニュー', '料理とお店の雰囲気を見せ、メニュー選びから来店の相談へ。', 'メニュー閲覧', '予約への導線'],
    ['works/towa-corporate/', 'assets/catalogue-thumbs/works_towa-corporate.webp', 'TOWA', '製造業の企業サイト', 'MANUFACTURING / HP', '企業・事業案内', 'company', '製造業 会社案内 法人 BtoB', '技術と対応範囲を整理し、相談したい内容を選びやすく。', '事業・技術の紹介', '相談への導線'],
    ['cw-pixel-office.html', 'assets/catalogue-thumbs/cw-pixel-office.webp', 'PIXEL OFFICE', '動くドット絵のオフィス', 'INTERACTIVE / WEB', '会社・仕事紹介', 'company recruit', 'ピクセル ドット絵 オフィス アニメーション 会社 採用', '働く人や休憩する人を描き、会社の一日を小さな風景で伝えます。', '人物の仕事を表示', '再生・停止'],
    ['assets/demo-previews/cw-lp-recruit.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-lp-recruit.webp', 'ひだまり介護グループ', '介護スタッフ採用のLP', 'CARE RECRUITMENT / LP', '採用・仕事紹介', 'recruit', '採用 求人 介護 仕事 スタッフ', '日勤の一日や募集条件を確かめ、応募・見学・相談を選べます。', '仕事・募集条件の紹介', '応募・見学内容の確認'],
    ['custom/cw-vintage-archive-inbound.html', 'assets/catalogue-thumbs/custom_cw-vintage-archive-inbound.webp', 'Cool Kimono Archive', '日英の商品紹介サイト', 'BILINGUAL / HP', '商品・店舗案内', 'product company', '多言語 インバウンド 着物 アンティーク 日英 英語 販売', '日英で商品を紹介し、気になる品を並べて比較できるアーカイブです。', '日本語・英語切り替え', '商品詳細・比較'],
    ['assets/demo-previews/cw-dental-sakura.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-dental-sakura.webp', 'さくら駅前歯科', '歯科クリニックのHP', 'DENTAL CLINIC / HP', '診療・相談', 'booking company', '歯科 クリニック 医院 医療 訪問診療', '来院や訪問診療の案内を読み、相談したい内容を選べます。', '相談内容の選択', '入力内容の確認'],
    ['assets/demo-previews/cw-corp.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-corp.webp', 'ミライブリッジ', '人材会社のHP', 'CORPORATE / HP', '企業・事業案内', 'company', '人材 会社案内 法人 企業 派遣 仕事', '企業と求職者、それぞれに合わせて案内と相談項目を切り替えます。', '閲覧目的の切り替え', '相談への導線'],
    ['assets/demo-previews/cw-lp-gym.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-lp-gym.webp', 'REBORN GYM', 'パーソナルジムのLP', 'FITNESS / LP', '体験・集客', 'booking', 'ジム フィットネス トレーニング スポーツ 店舗', '3つの料金プランを比べ、気になるプランを選んで体験内容を確認できます。', '料金プランの比較', '体験内容の確認'],
    ['works/koto-learning/', 'assets/catalogue-thumbs/works_koto-learning.webp', 'koto.', '大人のアトリエ教室LP', 'EDUCATION / LP', '習い事・体験', 'booking', '教育 学習 教室 習い事 大人 陶芸 アート', '手を動かす楽しさを写真で伝え、初めての方を体験教室へ。', 'コース選択', '体験への導線'],
    ['assets/demo-previews/cw-stay-naginoma.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-stay-naginoma.webp', '凪の間', '宿泊施設のHP', 'HOSPITALITY / HP', '宿泊・相談', 'company booking', '宿泊 ホテル 旅館 客室 滞在 観光', '客室を選ぶと、写真や人数、滞在の案内が切り替わります。', '客室の切り替え', '滞在の相談窓口'],
    ['assets/demo-previews/cw-salon.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-salon.webp', 'Atelier LUCE', 'サロンのサイト', 'BEAUTY / HP', '美容・相談', 'booking company', '美容 サロン ヘア 髪 スタイル', 'スタイル写真や料金を見て、選んだメニューを相談欄へ引き継ぎます。', 'メニュー選択', '相談内容の引き継ぎ'],
    ['assets/demo-previews/cw-studio-yohaku.html', 'assets/catalogue-thumbs/assets_demo-previews_cw-studio-yohaku.webp', '余白建築室', '建築・設計事務所のHP', 'ARCHITECTURE / HP', '建築・相談', 'company booking', '建築 設計 住宅 不動産 間取り', '間取りの場所を切り替えると、設計の考え方と相談内容が連動します。', '間取りの切り替え', '相談内容の連動']
  ];
  const grid = document.querySelector('#all-works');
  if (!grid) return;
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
  const cards = works.map(([href, image, name, title, type, purpose, tags, keywords, description, feature1, feature2]) => {
    const article = document.createElement('article');
    article.className = 'work';
    article.innerHTML = `<a class="work-image" href="${href}" target="_blank" rel="noopener"><img src="${image}?v=thumbnails-r4-20261024" alt="${name} ${title}の画面" width="1600" height="1000" loading="lazy"><span class="open-tag">サイトを開く ↗</span></a><div class="work-meta"><span>${type}</span><span>${purpose}</span></div><h3><a href="${href}" target="_blank" rel="noopener"><span class="work-name">${name}</span><span class="work-title">${title}</span><b aria-hidden="true">↗</b></a></h3><p>${description}</p><div class="work-features"><span>${feature1}</span><span>${feature2}</span></div>`;
    grid.append(article);
    return { element: article, categories: tags.split(' '), searchText: normalize([name, title, type, purpose, keywords, description, feature1, feature2].join(' ')) };
  });
  document.querySelectorAll('[data-work-total]').forEach(element => { element.textContent = String(works.length); });
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#work-search');
  let category = 'all';
  function update() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      const match = (category === 'all' || card.categories.includes(category)) && terms.every(term => card.searchText.includes(term));
      card.element.hidden = !match;
      if (match) count++;
    }
    document.querySelector('#result-count').textContent = count + '件の制作例';
    document.querySelector('#empty-state').hidden = count !== 0;
    filters.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(); }));
  search.addEventListener('input', update);
  document.querySelector('#reset-search').addEventListener('click', () => { category = 'all'; search.value = ''; update(); search.focus(); });
  update();
})();
