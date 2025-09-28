// /api/open-apis/docx/v1/appendBlocks
// 兼容：既支持 Body，也支持 Query；缺少 children 时自动注入一段默认文本。
// block_id 默认 = document_id；写最新修订（Document-Revision-Id: -1）
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    // 解析 Body
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // 解析 Query（防止 Test 把参数放在 params/query 里）
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = Object.fromEntries(url.searchParams.entries());

    const document_id = bodyObj.document_id || q.document_id || q.doc || '';
    const rawBlockId = bodyObj.block_id || q.block_id || '';
    const index = (bodyObj.index !== undefined ? bodyObj.index : (q.index !== undefined ? Number(q.index) : undefined));
    let children = bodyObj.children;

    if (!document_id) {
      return res.status(400).json({ error: 'missing_params', need: ['document_id'] });
    }
    const block_id = rawBlockId || document_id;

    // 如果没传 children，注入一个默认段落，确保能写成功
    if (!children) {
      children = [
        {
          block_type: 'paragraph',
          paragraph: { elements: [{ text_run: { content: '默认写入：来自 appendBlocks 的测试文本。\n', text_element_style: {} } }] }
        }
      ];
    }

    const target = `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Document-Revision-Id': '-1'
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const payload = (index !== undefined) ? { index, children } : { children };

    const upstream = await fetch(target, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
