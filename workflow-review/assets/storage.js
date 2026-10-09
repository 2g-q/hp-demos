// Only allowlisted primitive input values are stored. No workbook serialization or remote save.
const validText = value => typeof value === 'string' && value.length <= 32767 && !value.startsWith('=') && !/[\u0000-\u0009\u000b-\u001f\u007f\ufffe\uffff]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);
export function createStore(kind, fixture) {
  const base = new URL(document.body.dataset.workflowPage === 'home' ? './' : '../', location.href).pathname;
  const key = `workflow-review:v1:${base}:${fixture.fixtureSHA256}:${kind}`;
  const addresses = Object.keys(fixture.values);
  function validate(values) {
    if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).join() !== addresses.join()) throw Error('保存された入力欄が一致しません');
    for (const address of addresses) {
      const value = values[address];
      if (kind === 'ledger' && address === 'A4') {
        if (value !== null && !(typeof value === 'string' && /^-?(?:0|[1-9][0-9]{0,14})$/.test(value) && value !== '-0')) throw Error('保存された工番の型が一致しません');
      } else if (!validText(value)) throw Error('保存された文字列が正しくありません');
    }
  }
  function read() {
    let raw;
    try { raw = localStorage.getItem(key); } catch { throw Error('このブラウザでは保存領域を利用できません'); }
    if (raw === null) return {revision: 0, values: structuredClone(fixture.values)};
    let value;
    try { value = JSON.parse(raw); } catch { throw Error('保存されたデータを確認できません'); }
    if (!value || typeof value !== 'object' || value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || Object.keys(value).join() !== 'version,revision,values') throw Error('保存版を確認できません');
    validate(value.values);
    return value;
  }
  return {
    read,
    async save(expectedRevision, values) {
      validate(values);
      if (!navigator.locks?.request) throw Error('このブラウザでは安全な保存を利用できません');
      return navigator.locks.request(key, async () => {
        const current = read();
        if (current.revision !== expectedRevision) throw Error('別画面で更新済み。入力は残っています。控えて読み直してください');
        if (JSON.stringify(current.values) === JSON.stringify(values)) return current;
        const next = {version: 1, revision: current.revision + 1, values: structuredClone(values)};
        if (!Number.isSafeInteger(next.revision)) throw Error('保存版の上限に達しました');
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { throw Error('ブラウザに保存できません。容量・保存設定を確認してください。入力は残っています'); }
        try {
          const observed = read();
          if (JSON.stringify(observed) !== JSON.stringify(next)) throw Error();
          return observed;
        } catch {
          const error = Error('保存結果を確認できません。「保存版の確認」を押してください');
          error.saveUncertain = true;
          throw error;
        }
      });
    }
  };
}
