// /api/open-apis/docx/v1/document/convert
// 把请求代理到飞书 DocX 的“Markdown/HTML → blocks”官方端点
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    // 透传用户身份：Authorization: Bearer <user_access_token>
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const body =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

    const upstream = await fetch(
      'https://open.feishu.cn/open-apis/docx/v1/document/convert',
      { method: 'POST', headers, body }
    );

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
