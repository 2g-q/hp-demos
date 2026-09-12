/* Each demo keeps its state in this page. No network writes or persistence. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  const clearConfirmation = () => all('[data-demo-form] output').forEach(el => { el.textContent = ''; });
  const pressed = (selector, value, key) => all(selector).forEach(el => el.setAttribute('aria-pressed', String(el.dataset[key] === String(value))));
  const options = (id, values) => { const select = $(id); select.replaceChildren(...values.map(value => { const option = document.createElement('option'); option.textContent = value; return option; })); };
  const scrollTo = (id) => $(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  // The preserved base URL must not turn local section links into root navigation.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) { event.preventDefault(); scrollTo(link.getAttribute('href').slice(1)); }
  });
  all('[data-demo-form]').forEach(form => {
    form.addEventListener('input', clearConfirmation);
    form.addEventListener('change', clearConfirmation);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = [...form.elements].filter(el => el.name && !el.disabled).map(el => {
        const value = el.tagName === 'SELECT' ? el.selectedOptions[0]?.textContent : el.value;
        return `${el.name}：${value}`;
      });
      form.querySelector('output').textContent = `${values.join(' / ')}。相談内容の確認サンプルです。外部への送信・予約・申し込みは行っていません。`;
    });
  });

  if (document.body.dataset.demo === 'studio-yohaku') {
    const spaces = {
      court: ['01', '家の真ん中に、外をつくる。', '中庭を囲む回遊動線。部屋を移るたびに、空と緑が目に入ります。', '中庭'],
      living: ['02', '食卓から、家族の気配が届く。', '庭に向けて開いた居間。食卓と窓辺がつながり、それぞれの時間を近くで過ごせます。', '居間'],
      window: ['03', '通り道に、立ち止まる場所を。', '木の格子が光をやわらげる窓辺。庭を眺める、小さな居場所をつくります。', '窓辺']
    };
    function setSpace(key) {
      const value = spaces[key];
      pressed('[data-space]', key, 'space');
      all('[data-plan]').forEach(el => el.classList.toggle('active', el.dataset.plan === key));
      ['space-number', 'space-title', 'space-copy'].forEach((id, index) => text(id, value[index]));
      $('space-inquiry').value = value[3];
      text('plan-title', `${value[3]}を朱色で示した間取りの概念図`);
      clearConfirmation();
    }
    all('[data-space]').forEach(button => button.addEventListener('click', () => setSpace(button.dataset.space)));
    $('space-inquiry').addEventListener('change', () => setSpace(Object.keys(spaces).find(key => spaces[key][3] === $('space-inquiry').value)));
  }

  if (document.body.dataset.demo === 'stay-naginoma') {
    const rooms = {
      sea: { title: '海に向かう客室', copy: 'テラスの椅子で、波の音を聞く。大きな窓の向こうに海が広がる、静かな客室です。', max: 2, feature: '専用テラス', condition: '窓辺の読書、テラスでのひと休み', image: 'concept-assets/hotel.jpg', alt: '専用テラスの先に海が見える客室イメージ', number: '01 / OCEAN ROOM', kicker: 'Sea, light & a private terrace' },
      suite: { title: 'ゆったり過ごすスイート', copy: '読書やお茶の時間を楽しめる、独立したリビング付き。家族や友人と、部屋で過ごす一日にも。', max: 4, feature: '独立したリビング', condition: '家族での団らん、リビングでくつろぐ時間', image: 'concept-assets/architecture.jpg', alt: '庭へ開いたリビングの空間イメージ。スイート実室の写真ではありません', number: '02 / LIVING SUITE', kicker: 'Room for time together' }
    };
    function setRoom(key) {
      const room = rooms[key];
      const previousGuests = parseInt($('room-guests').value, 10) || 2;
      pressed('button[data-room]', key, 'room');
      ['title', 'copy', 'feature', 'condition', 'number', 'kicker'].forEach(field => text(`room-${field}`, room[field]));
      text('room-people', `${room.max}名まで`);
      $('room-photo').src = room.image;
      $('room-photo').alt = room.alt;
      $('room-figure').dataset.room = key;
      $('room-inquiry').value = key;
      options('room-guests', Array.from({ length: room.max }, (_, i) => `${i + 1}名`));
      $('room-guests').value = `${Math.min(previousGuests, room.max)}名`;
      clearConfirmation();
    }
    all('button[data-room]').forEach(button => button.addEventListener('click', () => setRoom(button.dataset.room)));
    $('room-inquiry').addEventListener('change', () => setRoom($('room-inquiry').value));
  }

  if (document.body.dataset.demo === 'relay') {
    const initial = [
      { id: 'REQ-001', title: '新規見積の確認', owner: '営業 → 経理', state: 'request' },
      { id: 'REQ-002', title: '受注データの登録', owner: '営業 → 業務担当', state: 'request' },
      { id: 'REQ-003', title: '週次レポートの作成', owner: '業務担当 → チームリーダー', state: 'request' },
      { id: 'REQ-004', title: '請求書の内容確認', owner: '経理 → チームリーダー', state: 'review' },
      { id: 'REQ-005', title: '商品一覧の更新', owner: '業務担当 → 営業', state: 'done' }
    ];
    let tasks = initial.map(task => ({ ...task }));
    const stages = [['request', '依頼'], ['review', '確認'], ['done', '完了']];
    function render(focusId) {
      $('workflow-columns').replaceChildren(...stages.map(([state, label]) => {
        const column = document.createElement('section');
        column.className = 'workflow-column';
        column.dataset.stage = state;
        const matching = tasks.filter(task => task.state === state);
        column.innerHTML = `<div class="column-heading"><span>${label}</span><span class="count" aria-label="${label} ${matching.length}件">${matching.length}</span></div>`;
        matching.forEach(task => {
          const card = document.createElement('article');
          card.className = `task-card${state === 'done' ? ' complete' : ''}`;
          card.dataset.task = task.id;
          card.tabIndex = -1;
          card.innerHTML = `<span class="task-id">${task.id}${state === 'done' ? ' / COMPLETE' : ''}</span><h3>${task.title}</h3><p>${task.owner}</p><div class="task-actions"></div>`;
          const actions = state === 'request' ? [['review', '確認へ送る']] : state === 'review' ? [['done', '完了にする'], ['request', '差し戻す']] : [['request', '依頼に戻す']];
          actions.forEach(([nextState, action]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = action;
            button.setAttribute('aria-label', `${task.title}を${action}`);
            button.addEventListener('click', () => {
              task.state = nextState;
              render(task.id);
              const count = tasks.filter(item => item.state === nextState).length;
              text('relay-status', `${task.id}「${task.title}」を${stages.find(stage => stage[0] === nextState)[1]}へ移しました。この列は${count}件です。`);
            });
            card.querySelector('.task-actions').append(button);
          });
          column.append(card);
        });
        if (!matching.length) {
          const empty = document.createElement('p');
          empty.className = 'empty-column';
          empty.textContent = `${label}の仕事はありません。`;
          column.append(empty);
        }
        return column;
      }));
      if (focusId) document.querySelector(`[data-task="${focusId}"] button`)?.focus({ preventScroll: true });
    }
    $('relay-reset').addEventListener('click', () => {
      tasks = initial.map(task => ({ ...task })); render();
      text('relay-status', '最初の5件に戻しました。依頼3件、確認1件、完了1件です。');
    });
    render();
  }

  if (document.body.dataset.demo === 'corp') {
    const audiences = {
      company: ['採用したい人を、一緒に考える。', '募集の背景、任せたい仕事、職場の雰囲気。求人票に収まりきらない条件まで伺います。', '人材紹介・人材派遣・採用の仕組み', '職種、採用時期、必要な人数', '採用について相談する →', ['人材紹介について', '人材派遣について', '採用・組織支援について']],
      work: ['次の仕事を、あなたの希望から。', '経験してきたこと、これから大切にしたいこと。仕事内容や働く時間の希望を整理します。', '仕事探し・働き方・就業後の相談', '希望する仕事、働ける時間、就業時期', '仕事探しについて相談する →', ['希望する仕事について', '働く時間・場所について', '就業までの流れについて']]
    };
    function setAudience(key) {
      const value = audiences[key];
      pressed('[data-audience]', key, 'audience');
      ['audience-title', 'audience-copy', 'audience-detail', 'audience-check', 'audience-cta'].forEach((id, i) => text(id, value[i]));
      $('audience-inquiry').value = key; options('audience-topic', value[5]); clearConfirmation();
    }
    all('[data-audience]').forEach(button => button.addEventListener('click', () => setAudience(button.dataset.audience)));
    $('audience-inquiry').addEventListener('change', () => setAudience($('audience-inquiry').value));
  }

  if (document.body.dataset.demo === 'lp-gym') {
    let goal = 'habit', frequency = 1;
    const goals = { habit: ['運動習慣', 'フォームを確かめながら、全身を動かす基本メニュー。'], body: ['ボディメイク', '全身のトレーニングと、日々の食事を見直すきっかけに。'], strength: ['筋力づくり', '基本動作を練習し、その日の状態を見ながら負荷を調整。'] };
    const plans = { 1: ['ライト', '29,800', [2]], 2: ['ボディメイク', '49,800', [1, 4]], 3: ['プレミアム', '69,800', [0, 2, 5]] };
    function updatePlan() {
      const plan = plans[frequency];
      pressed('[data-goal]', goal, 'goal'); pressed('[data-frequency]', frequency, 'frequency');
      text('gym-plan', plan[0]);
      $('gym-price').innerHTML = `¥${plan[1]} <small>/ 月・税込</small>`;
      text('gym-detail', `60分 × 月${frequency * 4}回 / 週${frequency}回のペース`);
      text('gym-focus', goals[goal][1]);
      $('gym-week').replaceChildren(...['月', '火', '水', '木', '金', '土', '日'].map((day, i) => {
        const el = document.createElement('div');
        const active = plan[2].includes(i);
        el.className = `day${active ? ' active' : ''}`;
        el.innerHTML = `${day}<strong>${active ? '60分' : '休み'}</strong>`;
        return el;
      }));
      $('gym-week').setAttribute('aria-label', '週間例。' + ['月', '火', '水', '木', '金', '土', '日'].map((day, i) => `${day}曜日${plan[2].includes(i) ? 'トレーニング60分' : '休み'}`).join('、'));
      $('gym-inquiry').value = `${plan[0]} / ${goals[goal][0]} / 週${frequency}回`;
      clearConfirmation();
    }
    all('[data-goal]').forEach(button => button.addEventListener('click', () => { goal = button.dataset.goal; updatePlan(); }));
    all('[data-frequency]').forEach(button => button.addEventListener('click', () => { frequency = Number(button.dataset.frequency); updatePlan(); }));
    updatePlan();
  }

  if (document.body.dataset.demo === 'lp-recruit') {
    const day = [
      ['08:30', '出勤・申し送り', '夜勤のスタッフから、一人ひとりの様子を聞きます。その日の予定と担当を、チームで確かめます。'],
      ['09:00', '入浴介助・水分補給', '利用者の方のペースに合わせ、スタッフ同士で声をかけながら生活を支えます。'],
      ['12:00', '昼食の介助と、交代での休憩', '昼食のサポートが落ち着いたら、スタッフも交代でひと休みします。'],
      ['14:00', 'レクリエーション', '季節の遊びや体操など、その日の様子に合わせて一緒に過ごします。'],
      ['16:00', '記録・翌日の準備', '気づいたことをスマートフォンで記録。小さな変化も、次の担当者へ伝えます。'],
      ['17:30', '申し送り・退勤', '次のシフトへ様子を伝え、一日の仕事を終えます。']
    ];
    all('[data-time]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.time); pressed('[data-time]', index, 'time');
      ['day-time', 'day-title', 'day-copy'].forEach((id, i) => text(id, day[index][i]));
    }));
    const employment = {
      full: ['介護スタッフ / 正社員', 'シフト制。日勤 8:30〜17:30、ほか早番・遅番・夜勤。', '月給238,000〜322,000円（各種手当込み・架空の条件）', '希望勤務地、勤務できる時間帯、資格の有無', '試用期間3ヶ月・待遇変更なし。夜勤は入社6ヶ月以降、希望者のみの設定です。夜勤手当1回8,000円、介護福祉士手当15,000円/月は別途。', ['一日の仕事とチームの体制', '勤務時間とシフトの相談', '未経験からの仕事の覚え方']],
      part: ['介護スタッフ / パート', '勤務日数・時間帯は、希望を伺って相談する想定です。', '個別条件を確認する想定です。このサンプルでは時給を設定していません。', '勤務できる曜日、開始・終了時刻、希望日数', 'パートも同時募集する設定です。正社員の給与や勤務条件は適用していません。', ['希望する曜日と時間帯', '週の勤務日数', '仕事の覚え方とサポート']],
      night: ['介護スタッフ / 夜勤専従', '夜勤 16:30〜翌9:30。回数と担当範囲は相談する想定です。', '個別条件を確認する想定です。このサンプルでは一勤務の給与を設定していません。', '夜勤の経験、希望する回数、勤務開始時期', '夜勤専従も同時募集する設定です。勤務ごとの給与・休憩・配置人数は事前確認が必要です。', ['夜間のスタッフ体制', '夜勤の回数と休憩', '担当する仕事と経験の確認']]
    };
    function setEmployment(key) {
      const value = employment[key]; pressed('[data-employment]', key, 'employment');
      ['employment-title', 'employment-hours', 'employment-pay', 'employment-check', 'employment-note'].forEach((id, i) => text(id, value[i]));
      $('employment-inquiry').value = key; options('employment-topic', value[5]); clearConfirmation();
    }
    all('[data-employment]').forEach(button => button.addEventListener('click', () => setEmployment(button.dataset.employment)));
    $('employment-inquiry').addEventListener('change', () => setEmployment($('employment-inquiry').value));
  }

  if (document.body.dataset.demo === 'dental-sakura') {
    const care = {
      clinic: ['At the clinic', '医院での診療を相談する', '初めての方も、定期的なケアをご希望の方も。来院前に確認したいことを伺います。', ['ご相談の内容を確認', 'ご希望の日時を相談', '当日の持ち物と来院方法をご案内'], '来院について相談する →', ['初めての来院について', '定期的なケアについて', '来院時の持ち物について']],
      visit: ['At your home', '訪問診療について相談する', '通院が難しい方のご自宅や施設への訪問を想定しています。ご家族やケアマネジャーからの相談も受け付ける構成です。', ['ご本人・ご家族・支援者から相談', '訪問先と通院の状況を確認', '医院で対応可否と日程をご案内'], '訪問について相談する →', ['自宅への訪問について', '施設への訪問について', '家族・ケアマネジャーからの相談']]
    };
    function setCare(key) {
      const value = care[key]; pressed('[data-care]', key, 'care');
      ['care-kicker', 'care-title', 'care-copy'].forEach((id, i) => text(id, value[i]));
      $('care-steps').replaceChildren(...value[3].map(step => { const li = document.createElement('li'); li.textContent = step; return li; }));
      text('care-cta', value[4]); $('care-inquiry').value = key; options('care-topic', value[5]); clearConfirmation();
    }
    all('[data-care]').forEach(button => button.addEventListener('click', () => setCare(button.dataset.care)));
    $('care-inquiry').addEventListener('change', () => setCare($('care-inquiry').value));
  }

  if (document.body.dataset.demo === 'salon') {
    const cards = all('[data-style]');
    function filterStyles() {
      let count = 0;
      cards.forEach(card => {
        const matches = ($('style-length').value === 'all' || card.dataset.length === $('style-length').value) && ($('style-menu').value === 'all' || card.dataset.menu === $('style-menu').value);
        card.hidden = !matches; if (matches) count++;
      });
      text('style-status', `${count}スタイルを表示しています。`); $('style-empty').hidden = count > 0;
    }
    ['style-length', 'style-menu'].forEach(id => $(id).addEventListener('change', filterStyles));
    all('[data-select-style]').forEach(button => button.addEventListener('click', () => {
      const card = cards.find(item => item.dataset.style === button.dataset.selectStyle);
      $('style-inquiry').value = card.dataset.name; $('style-inquiry-menu').value = card.dataset.menu;
      clearConfirmation(); scrollTo('inquiry'); $('style-inquiry-menu').focus({ preventScroll: true });
    }));
    $('style-inquiry-menu').addEventListener('change', () => {
      const selected = cards.find(card => card.dataset.name === $('style-inquiry').value);
      if (selected && selected.dataset.menu !== $('style-inquiry-menu').value) $('style-inquiry').value = '相談して決めたい';
    });
  }
})();
