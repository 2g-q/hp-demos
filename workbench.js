(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const normalize = (value) => value.normalize('NFKC').trim();
  const announce = (message) => { $('live-status').textContent = message; };
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const cell = (row, text) => { const td = element('td', text); row.append(td); return td; };
  const badge = (text, type) => element('span', text, `badge ${type}`);
  const metric = (label, count, unit = '行') => {
    const node = element('div', undefined, 'metric');
    const value = element('strong', String(count));
    value.append(element('small', unit));
    node.append(element('span', label), value);
    return node;
  };
  const downloadCSV = (filename, rows) => {
    // Quote cells and neutralize spreadsheet formula prefixes, including user edits.
    const quote = (value) => {
      let text = String(value);
      if (/^[\s]*[=+\-@]/u.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const blob = new Blob(['\ufeff' + rows.map((row) => row.map(quote).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = element('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('CSVを作成しました。ブラウザのダウンロードをご確認ください。');
  };
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const activate = (name, focus = false) => {
    const activeName = ['data', 'shipping', 'review'].includes(name) ? name : 'data';
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === activeName;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(`panel-${tab.dataset.tab}`).hidden = !selected;
      if (selected && focus) tab.focus();
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { location.hash = tab.dataset.tab; activate(tab.dataset.tab); });
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      location.hash = tabs[next].dataset.tab;
      activate(tabs[next].dataset.tab, true);
    });
  });
  window.addEventListener('hashchange', () => activate(location.hash.slice(1)));
  activate(location.hash.slice(1));

  const dataSeed = [
    [' D-001 ', ' サンプルマグ　', '２', '１２００'],
    ['D-002', 'サンプルノート ', '3', '４５０'],
    ['D-001', 'サンプルマグ', '2', '1200'],
    ['D-003', 'サンプルペン', '', '180'],
    ['D-004', '', '1', '800'],
    ['Ｄ-００５', ' サンプルポーチ', '１', '９００']
  ];
  let dataReady = [];
  const invalidateData = () => {
    dataReady = [];
    $('data-result').hidden = true;
    $('data-empty').hidden = false;
    $('data-download').disabled = true;
  };
  const resetData = () => {
    $('data-input').replaceChildren();
    dataSeed.forEach((values, index) => {
      const row = element('tr');
      cell(row, String(index + 1).padStart(2, '0'));
      values.forEach((value, column) => {
        const input = element('input');
        input.type = 'text'; input.value = value; input.maxLength = 100;
        input.setAttribute('aria-label', `${index + 1}行目の${['売上ID', '商品名', '数量', '単価'][column]}`);
        if (column > 1) input.inputMode = 'numeric';
        input.addEventListener('input', () => { invalidateData(); announce('入力が変わりました。もう一度整形してください。'); });
        cell(row).append(input);
      });
      $('data-input').append(row);
    });
    invalidateData();
  };
  $('data-reset').addEventListener('click', () => { resetData(); announce('売上表を初期状態に戻しました。'); });
  $('data-run').addEventListener('click', () => {
    const seen = new Map();
    const issues = [];
    const output = [];
    let duplicates = 0;
    dataReady = [];
    const records = [...$('data-input').rows].map((row) => [...row.querySelectorAll('input')].map((input) => normalize(input.value)));
    records.forEach((values, index) => {
      const key = JSON.stringify(values);
      if (seen.has(key)) {
        duplicates++;
        issues.push(`${index + 1}行目：${seen.get(key)}行目と全項目が同じため、重複として除外しました。`);
        return;
      }
      seen.set(key, index + 1);
      const errors = [];
      if (!values[0]) errors.push('売上IDが空欄');
      if (!values[1]) errors.push('商品名が空欄');
      if (!/^\d+$/.test(values[2]) || Number(values[2]) < 1 || !Number.isSafeInteger(Number(values[2]))) errors.push('数量は1以上の整数が必要');
      if (!/^\d+$/.test(values[3]) || !Number.isSafeInteger(Number(values[3]))) errors.push('単価は0以上の整数が必要');
      if (values[0] && records.some((other, otherIndex) => otherIndex !== index && other[0] === values[0] && JSON.stringify(other) !== key)) errors.push('同じ売上IDに異なる内容がある');
      const row = element('tr');
      cell(row, String(index + 1).padStart(2, '0'));
      values.forEach((value) => cell(row, value || '—'));
      cell(row).append(badge(errors.length ? '要確認' : '取込可能', errors.length ? 'warn' : 'ok'));
      output.push(row);
      if (errors.length) issues.push(`${index + 1}行目：${errors.join(' / ')}。`);
      else dataReady.push(values);
    });
    $('data-output').replaceChildren(...output);
    const pending = output.length - dataReady.length;
    $('data-metrics').replaceChildren(metric('取込可能', dataReady.length), metric('要確認', pending), metric('重複を除外', duplicates));
    $('data-issues').replaceChildren(...(issues.length ? issues : ['確認が必要な項目はありません。']).map((issue) => element('li', issue)));
    $('data-result').hidden = false; $('data-empty').hidden = true;
    $('data-download').disabled = dataReady.length === 0;
    announce(`整形しました。取込可能${dataReady.length}行、要確認${pending}行、重複${duplicates}行です。`);
  });
  $('data-download').addEventListener('click', () => { if (dataReady.length) downloadCSV('sample-sales-clean.csv', [['売上ID', '商品名', '数量', '単価'], ...dataReady]); });
  resetData();

  const orders = [
    {id: 'S-101', name: 'サンプル購入者A', product: 'mug', quantity: 2, address: '架空県見本市サンプル町1-1'},
    {id: 'S-102', name: 'サンプル購入者B', product: 'mug', quantity: 3, address: '架空県見本市サンプル町2-2'},
    {id: 'S-103', name: 'サンプル購入者C', product: 'note', quantity: 1, address: ''},
    {id: 'S-104', name: 'サンプル購入者D', product: 'note', quantity: 2, address: '架空県見本市サンプル町4-4'},
    {id: 'S-105', name: 'サンプル購入者E', product: 'mug', quantity: 1, address: '架空県見本市サンプル町5-5'}
  ];
  const productName = {mug: 'サンプルマグ', note: 'サンプルノート'};
  let shippingReady = [];
  const invalidateShipping = () => {
    shippingReady = []; $('shipping-result').hidden = true; $('shipping-empty').hidden = false; $('shipping-download').disabled = true;
  };
  const shippingChanged = () => { invalidateShipping(); announce('注文・在庫が変わりました。もう一度出荷前チェックをしてください。'); };
  const resetShipping = () => {
    $('stock-mug').value = '4'; $('stock-note').value = '8';
    $('shipping-input').replaceChildren(...orders.map((order) => {
      const row = element('tr');
      cell(row, order.id); cell(row, order.name); cell(row, `${productName[order.product]} × ${order.quantity}`);
      const input = element('input'); input.type = 'text'; input.value = order.address; input.maxLength = 150;
      input.placeholder = '住所が未入力です'; input.setAttribute('aria-label', `${order.id}の架空住所`);
      input.addEventListener('input', shippingChanged);
      cell(row).append(input); return row;
    }));
    invalidateShipping();
  };
  ['stock-mug', 'stock-note'].forEach((id) => $(id).addEventListener('input', shippingChanged));
  $('shipping-reset').addEventListener('click', () => { resetShipping(); announce('注文と在庫を初期状態に戻しました。'); });
  $('shipping-run').addEventListener('click', () => {
    const stocks = {};
    for (const key of ['mug', 'note']) {
      const input = $(`stock-${key}`);
      if (!input.value || !input.checkValidity()) { announce('在庫数は0〜9999の整数で入力してください。'); input.focus(); return; }
      stocks[key] = Number(input.value);
    }
    shippingReady = [];
    const rows = orders.map((order, index) => {
      const address = normalize($('shipping-input').rows[index].querySelector('input').value);
      const errors = [];
      if (!address) errors.push('住所が未入力');
      else if (!/\d/.test(address)) errors.push('番地を確認');
      if (stocks[order.product] < order.quantity) errors.push(`在庫不足（残り${stocks[order.product]} / 必要${order.quantity}）`);
      if (!errors.length) { stocks[order.product] -= order.quantity; shippingReady.push([order.id, order.name, address, productName[order.product], order.quantity]); }
      const row = element('tr'); cell(row, order.id);
      cell(row).append(badge(errors.length ? '要確認' : '出荷対象', errors.length ? 'warn' : 'ok'));
      cell(row, errors.length ? errors.join(' / ') : '住所の簡易検査済み・在庫を仮引当');
      return row;
    });
    $('shipping-output').replaceChildren(...rows);
    $('shipping-metrics').replaceChildren(metric('出荷対象', shippingReady.length, '件'), metric('要確認', orders.length - shippingReady.length, '件'), metric('検査した注文', orders.length, '件'));
    $('shipping-result').hidden = false; $('shipping-empty').hidden = true; $('shipping-download').disabled = !shippingReady.length;
    announce(`出荷前チェックが完了しました。出荷対象${shippingReady.length}件、要確認${orders.length - shippingReady.length}件です。`);
  });
  $('shipping-download').addEventListener('click', () => { if (shippingReady.length) downloadCSV('sample-shipping-preview.csv', [['架空注文番号', '架空宛名', '架空住所', '商品名', '数量'], ...shippingReady]); });
  resetShipping();

  const inquiries = {
    expense: {question: '展示会で使った交通費を精算したいです。何を用意すればよいですか？', draft: '交通費の精算には、利用日・区間・金額をご用意ください。\n\nこのサンプルでは、社内の経費フォームに入力し、領収書がある場合は添付するルールを想定しています。\n\n提出前に、費用の目的と記載内容をご確認ください。'},
    account: {question: '新しく入ったメンバーの社内ツール用アカウントを申請したいです。', draft: 'アカウントの申請には、利用者名・所属・必要なツールを記入してください。\n\nこのサンプルでは、所属責任者の確認後に管理担当が発行する流れを想定しています。\n\n必要な権限もあわせてご確認ください。'},
    leave: {question: '来月の休暇は、どのように申請すればよいですか？', draft: '休暇を希望する日を、社内の申請フォームに入力してください。\n\nこのサンプルでは、上長が業務予定を確認して承認する流れを想定しています。\n\n申請前に、担当業務の引き継ぎもご確認ください。'}
  };
  let generated = false;
  const resetReview = (resetSelection) => {
    if (resetSelection) $('inquiry-select').value = 'expense';
    $('inquiry-text').textContent = inquiries[$('inquiry-select').value].question;
    generated = false; $('draft-text').value = ''; $('draft-text').disabled = true;
    $('review-check').checked = false; $('review-check').disabled = true; $('draft-approve').disabled = true;
    $('review-badge').textContent = '未作成'; $('review-badge').className = 'badge neutral';
    $('review-message').textContent = '承認しても、メールやチャットは送信されません。';
  };
  $('inquiry-select').addEventListener('change', () => { resetReview(false); announce('問い合わせを切り替えました。下書きを作成してください。'); });
  $('draft-generate').addEventListener('click', () => {
    generated = true; $('draft-text').disabled = false; $('draft-text').value = inquiries[$('inquiry-select').value].draft;
    $('review-check').disabled = false; $('review-check').checked = false; $('draft-approve').disabled = true;
    $('review-badge').textContent = '確認待ち'; $('review-badge').className = 'badge warn';
    $('review-message').textContent = '内容を読み、必要な修正を加えてから確認欄にチェックしてください。';
    announce('テンプレートから下書きを作成しました。内容を確認してください。');
  });
  $('draft-text').addEventListener('input', () => {
    $('review-check').checked = false; $('draft-approve').disabled = true;
    $('review-badge').textContent = '確認待ち'; $('review-badge').className = 'badge warn';
    $('review-message').textContent = '文面が変わったため、もう一度内容を確認して承認してください。';
  });
  $('review-check').addEventListener('change', () => {
    $('draft-approve').disabled = !generated || !$('review-check').checked || !$('draft-text').value.trim();
    if (generated && $('review-badge').textContent === '確認済み') {
      $('review-badge').textContent = '確認待ち'; $('review-badge').className = 'badge warn';
      $('review-message').textContent = '確認欄が変更されました。内容を確認して、もう一度承認してください。';
    }
  });
  $('draft-approve').addEventListener('click', () => {
    if (!generated || !$('review-check').checked || !$('draft-text').value.trim()) return;
    $('review-badge').textContent = '確認済み'; $('review-badge').className = 'badge ok'; $('draft-approve').disabled = true;
    $('review-message').textContent = 'この文面を確認済みにしました。外部への送信は行っていません。編集すると再確認が必要になります。';
    announce('下書きを確認済みにしました。外部には送信されません。');
  });
  $('review-reset').addEventListener('click', () => { resetReview(true); announce('下書きの確認を初期状態に戻しました。'); });
  resetReview(true);
})();
