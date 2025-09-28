async function proxyFeishu(req, res, path) {
  const target = `https://open.feishu.cn${path}`;
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  const body = ['GET','HEAD'].includes(req.method)
    ? undefined
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  const r = await fetch(target, { method: req.method, headers, body });
  const t = await r.text();
  res.status(r.status).send(t);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  const { document_id, block_id } = req.query; // Vercel 动态路由参数
  const path = `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;
  return proxyFeishu(req, res, path);
}
