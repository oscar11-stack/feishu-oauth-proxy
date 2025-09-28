// 作用：把来自 ChatGPT 的授权请求转发（302）到飞书的授权页，并原样带上所有查询参数
export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const qs = url.search || ''; // 包含 ?client_id=...&redirect_uri=...&scope=...
  const target = `https://open.feishu.cn/open-apis/authen/v1/index${qs}`;
  res.setHeader('Location', target);
  res.status(302).end();
}
