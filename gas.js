const SHEET_NAME = '見積もり履歴';
const SS_ID = '1LqOgK8KnCIs2SbOpBfGVCGIOTSUcCuGIEfQppbc_5YI';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SS_ID);
    let sh = ss.getSheetByName(SHEET_NAME);

    // シートがなければ作成
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(['ID', '日付', 'クライアント名', '規模', '合計工数(h)', '合計金額(税抜)', '単価', 'TOP', '固定', 'カスタム投稿', '通常投稿', 'フォーム', 'WP構築', 'デバッグ', '備考']);
      sh.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#4f7ef8').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }

    const id = Utilities.getUuid().substring(0, 8);
    sh.appendRow([
      id,
      data.date,
      data.client,
      data.scale,
      data.totalH,
      data.totalYen,
      data.rate,
      data.qty.top || 0,
      data.qty.fixed || 0,
      data.qty.custom || 0,
      data.qty.post || 0,
      data.qty.form || 0,
      data.fx.wp ? 1 : 0,
      data.fx.debug ? 1 : 0,
      data.notes || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', id }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sh = ss.getSheetByName(SHEET_NAME);

    if (!sh || sh.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 15).getValues();
    const data = rows.map(r => ({
      id: r[0],
      date: r[1],
      client: r[2],
      scale: r[3],
      totalH: r[4],
      totalYen: r[5],
      rate: r[6],
      qty: { top: r[7], fixed: r[8], custom: r[9], post: r[10], form: r[11] },
      fx: { wp: r[12] === 1, debug: r[13] === 1 },
      notes: r[14]
    }));

    // 検索フィルタ
    const q = e.parameter.q || '';
    const filtered = q
      ? data.filter(d => d.client.includes(q) || d.scale.includes(q))
      : data;

    // 新しい順
    filtered.reverse();

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', data: filtered }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
