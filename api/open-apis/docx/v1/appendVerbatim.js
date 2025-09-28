// /api/open-apis/docx/v1/appendVerbatim
// 输入: { document_id: string, chunks: string[], batch_size?: number }
// 功能: 将纯文本分批转换为合法 blocks（block_type=2 + text），逐批追加到根 Page(children)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const document_id = body.document_id;
    let chunks = body.chunks || [];
    const batchSize = Math.min(Math.max(Number(body.batch_size || 15), 1), 20); // 1~20

    if (!document_id) return res.status(400).json({ error: 'missing_document_id' });
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'missing_chunks', hint: 'appendVerbatim requires chunks: string[]' });
    }

    // 统一把每段末尾补 \n，避免拼接丢行
    chunks = chunks.map(s => String(s).endsWith('\n') ? String(s) : String(s) + '\n');

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const mkBlock = (text) => ({
      block_type: 2,
      text: {
        elements: [ { text_run: { content: text, text_element_style: {} } } ],
        style: {}
      }
    });

    const results = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize).map(mkBlock);
      const r = await fetch(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(document_id)}/children`,
        { method: 'POST', headers, body: JSON.stringify({ children: slice }) }
      );
      const t = await r.text();
      results.push({ status: r.status, text: t });
      if (r.status !== 200) {
        return res.status(502).json({ error: 'append_failed', at_batch: i / batchSize + 1, status: r.status, preview: t.slice(0, 500) });
      }
    }

    return res.status(200).json({ code: 0, msg: 'ok', batches: results.length });
  } catch (e) {
    return res.status(500).json({ error: 'appendVerbatim_exception', detail: String(e) });
  }
}
