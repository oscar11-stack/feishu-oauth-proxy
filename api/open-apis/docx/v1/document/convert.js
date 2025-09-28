// 把 ChatGPT 的调用代理到飞书 DocX：Markdown/HTML -> Blocks
async function proxyFeishu(req, res, path) {
  const target = `https://open.feishu.cn${path}`;
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  // 透传用户身份 Authorization
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

  const body = ['GET','HEAD'].includes(req.method)
    ? undefined
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  const r = await fetch(target, { method: 'POST', headers, body });
  const text = await r.text();
  res.status(r.status).send(text);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  // 官方端点：/document/convert
  return proxyFeishu(req, res, '/open-apis/docx/v1/document/convert');
}
