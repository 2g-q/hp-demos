(() => {
  const menu = document.getElementById('mn');
  const toggle = document.getElementById('bg');
  if (menu && toggle) {
    const sync = () => toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')));
    new MutationObserver(sync).observe(menu, {attributes:true, attributeFilter:['class']});
    sync();
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'sample-dialog';
  dialog.setAttribute('aria-labelledby', 'sample-dialog-title');
  dialog.innerHTML = '<button type="button" class="sample-close" aria-label="閉じる">×</button><h2 id="sample-dialog-title">ご相談フォームのサンプル</h2><p>架空の企業・店舗の制作例です。実際の送信や予約は行いません。</p><form><label>お名前（架空の内容でお試しください）<input required placeholder="サンプル 太郎" autocomplete="off"></label><label>ご相談の内容<select><option>サービスについて</option><option>予約について</option><option>料金について</option></select></label><button type="submit">入力内容を確認する</button><output role="status" aria-live="polite"></output></form>';
  document.body.appendChild(dialog);
  dialog.querySelector('.sample-close').onclick = () => dialog.close();
  document.querySelectorAll('a[href="#"]').forEach(a => {
    a.removeAttribute('onclick');
    a.addEventListener('click', e => {e.preventDefault();dialog.showModal();});
  });
  dialog.querySelector('form').addEventListener('submit',e => {
    e.preventDefault();dialog.querySelector('output').textContent='入力を確認しました。サンプルのため送信・予約はしていません。';
  });
  document.querySelectorAll('.cform').forEach(form => {
    form.removeAttribute('onsubmit');
    form.addEventListener('submit',e => {
      e.preventDefault();if(!form.reportValidity())return;
      let out=form.querySelector('output');if(!out){out=document.createElement('output');out.setAttribute('role','status');form.appendChild(out);}
      out.textContent='入力を確認しました。サンプルのため外部には送信していません。';
    });
  });
})();
