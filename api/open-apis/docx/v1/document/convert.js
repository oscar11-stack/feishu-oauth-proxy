// 转发到飞书“Markdown -> Blocks”端点，并打印实际目标以便在 Vercel 日志里确认
async function proxyFeishu(req, res, path) {
  const target = `https://open.feishu.cn${path}`;
  console.log('[convert proxy] ->', target); // 看 Runtime Logs 时就能看到实际转发到了哪
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
  // ✅ 一定是 blocks/markdownToBlocks，不是 document/convert
  return proxyFeishu(req, res, '/open-apis/docx/v1/blocks/markdownToBlocks');
}
