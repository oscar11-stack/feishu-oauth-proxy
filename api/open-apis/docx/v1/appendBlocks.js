// /api/open-apis/docx/v1/appendBlocks
// 兼容：Body 或 Query；若缺 children 自动写一段段落；block_type 用数值枚举；官方端点 /children
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = Object.fromEntries(url.searchParams.entries());

    const document_id = bodyObj.document_id || q.document_id || q.doc || '';
    const rawBlockId  = bodyObj.block_id    || q.block_id    || '';
    const index = (bodyObj.index !== undefined ? bodyObj.index
                  : (q.index !== undefined ? Number(q.index) : undefined));
    let children = bodyObj.children;

    if (!document_id) return res.status(400).json({ error: 'missing_params', need: ['document_id'] });

    const block_id = rawBlockId || document_id; // 根 Page = document_id

    // 若调用方没给 children，注入最小合法的「段落」block（block_type 用数值 1）
    if (!children) {
      children = [
        {
          "block_type": 1,
          "paragraph": {
            "elements": [
              { "text_run": { "content": "默认写入：appendBlocks 数值型 block_type 段落。\n", "text_element_style": {} } }
            ]
          }
        }
      ];
    }

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const payload = (index !== undefined) ? { index, children } : { children };

    const r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children`,
      { method: 'POST', headers, body: JSON.stringify(payload) }
    );
    const t = await r.text();
    return res.status(r.status).send(t);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
