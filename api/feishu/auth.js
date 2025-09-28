// 302 到飞书授权页，原样透传所有查询参数（client_id、redirect_uri、scope等）
export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const qs = url.search; // ?client_id=...&redirect_uri=...&scope=...
  const target = `https://open.feishu.cn/open-apis/authen/v1/index${qs}`;
  res.setHeader('Location', target);
  res.status(302).end();
}
