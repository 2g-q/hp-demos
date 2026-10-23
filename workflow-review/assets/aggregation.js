// Selected received formulas only. This is not an allocator, tax engine or store.
function cell(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new Error('集計元の値を確認できません');
}
export function sumCells(values) {
  if (!Array.isArray(values)) throw new Error('集計範囲がありません');
  let total = 0;
  for (const value of values) { cell(value); if (typeof value === 'number') total += value; }
  if (!Number.isFinite(total)) throw new Error('集計結果を確認できません');
  return total;
}
export function countaCells(values) {
  if (!Array.isArray(values)) throw new Error('数量の元範囲がありません');
  return values.reduce((n, value) => { cell(value); return n + (value === null ? 0 : 1); }, 0);
}
function uniqueRows(rows) {
  if (!Array.isArray(rows)) throw new Error('明細がありません');
  const ids = new Set(), positions = new Set();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('明細IDが不正または重複しています');
    if (!Number.isInteger(row.row) || row.row < 4 || row.row > 101 || positions.has(row.row)) throw new Error('元行が不正または重複しています');
    ids.add(row.id); positions.add(row.row);
    if (typeof row.name !== 'string' || !(row.code === null || typeof row.code === 'string')) throw new Error('明細の識別項目が不正です');
    for (const key of ['s', 'v', 'w', 'x', 'y']) cell(row[key]);
  }
}
export function ledgerClassification(rows) {
  uniqueRows(rows);
  const included = rows.filter(row => row.row <= 100);
  const details = Array.from({length:17}, (_, i) => 'C' + (i + 1)).concat('C99').map(code => ({
    code, value:sumCells(included.filter(row => (row.code || '').toUpperCase() === code).map(row => row.v))
  }));
  const regular = sumCells(details.slice(0, 17).map(row => row.value)), other = details[17].value;
  const categories = [regular + other, ...['w', 'x', 'y'].map(key => sumCells(included.map(row => row[key])))];
  const lineDetails = rows.map(row => ({...row, total:sumCells([row.v, row.w, row.x, row.y])}));
  const invoiceNet = sumCells(rows.map(row => row.s)), allocation = sumCells(lineDetails.map(row => row.total));
  return {details, regular, other, categories, total:sumCells(categories), invoiceNet, allocation, lineDetails,
    unmatchedConstruction:sumCells(included.map(row => row.v)) - categories[0]};
}
export function monthlyExample(rows) {
  if (!Array.isArray(rows)) throw new Error('計算例の明細がありません');
  const ids = new Set();
  const details = rows.map(row => {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.name !== 'string') throw new Error('計算例の明細が不正または重複しています');
    ids.add(row.id);
    // Fixed per-source cell formulas, not a staff rate selected by the UI.
    if (!['08.03!D41', '08.03!Q41'].includes(row.formulaCell)) throw new Error('未確認の単価式です');
    const rate = row.formulaCell === '08.03!D41' ? 38500 : 44000;
    const width = row.formulaCell === '08.03!D41' ? 3 : 4;
    if (!Array.isArray(row.cells) || row.cells.length !== width * 31) throw new Error('元の数量範囲が不足しています');
    cell(row.external); // Known blank/text keeps Excel range-SUM semantics, never inferred as a numeric input.
    const count = countaCells(row.cells), amount = count * rate;
    return {...row, sourceRange:width===3?'D9:F39':'Q9:T39', count, rate, amount, total:sumCells([amount, row.external])};
  });
  return {details, amount:sumCells(details.map(row => row.amount)), external:sumCells(details.map(row => row.external)), total:sumCells(details.map(row => row.total))};
}
