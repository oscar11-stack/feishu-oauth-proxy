// 自动探测 Feishu DocX API 可用的 document_id 变体。
// 会依次尝试：输入原样、docx+裸token、doccn+裸token。
// 返回 { finalId, tried }，finalId 找不到则为 null。
export async function resolveDocId(inputId, authHeader) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (authHeader) headers['Authorization'] = authHeader;

  if (!inputId) return { finalId: null, tried: [] };

  const bare = inputId.replace(/^(docx|doccn)/i, '');
  const candidates = [...new Set([inputId, `docx${bare}`, `doccn${bare}`])];

  for (const cand of candidates) {
    const r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(cand)}`,
      { method: 'GET', headers }
    );
    console.log(`[resolveDocId] probe ${cand} -> ${r.status}`);
    if (r.status !== 404) return { finalId: cand, tried: candidates };
  }
  return { finalId: null, tried: candidates };
}
