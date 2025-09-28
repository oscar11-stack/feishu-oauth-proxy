// 把 blocks 写入 DocX 文档（Body 里传 document_id / block_id / children / index）
// block_id 不传则默认用 document_id（根 Page 的 block_id = document_id）
// 带上 Document-Revision-Id: -1 写入最新版本
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { document_id, block_id: rawBlockId, children, index } = bodyObj;

    if (!document_id || !children) {
      return res.status(400).json({ error: 'missing_params', need: ['document_id', 'children'] });
    }
    const block_id = rawBlockId || document_id;

    const target = `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Document-Revision-Id': '-1'               // 写入最新版本
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const payload = index !== undefined ? { index, children } : { children };

    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
