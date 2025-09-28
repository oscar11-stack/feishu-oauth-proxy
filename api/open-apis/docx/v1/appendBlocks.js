// 简化版：从 Body 读取 document_id / block_id / children，代理到飞书真实写入端点
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { document_id, block_id, children, index } = body || {};
    if (!document_id || !block_id || !children) {
      return res.status(400).json({ error: 'missing_params', need: ['document_id', 'block_id', 'children'] });
    }

    const target = `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    // 透传用户身份令牌：Authorization: Bearer <user_access_token>
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(index !== undefined ? { index, children } : { children })
    });

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (e) {
    res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
