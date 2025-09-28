// 作用：把 ChatGPT 调用代理到飞书 DocX 创建文档接口
async function proxyFeishu(req, res, path) {
  const target = `https://open.feishu.cn${path}`;
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  // 透传用户令牌（Authorization: Bearer <user_access_token>）由 ChatGPT 自动附带
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
  return proxyFeishu(req, res, '/open-apis/docx/v1/document/create');
}
