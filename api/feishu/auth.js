// 把 ChatGPT 的标准 OAuth2 参数 适配为飞书 /authen/v1/index 需要的参数
// - ChatGPT 会传 client_id / redirect_uri / state / response_type=code
// - 飞书需要 app_id / redirect_uri / state（可选）/ response_type=code
export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const qp = new URLSearchParams(url.search || '');

  // 从查询里取 redirect_uri、state；client_id 不用，改用环境变量更稳
  const redirectUri = qp.get('redirect_uri') || '';
  const state = qp.get('state') || '';

  // 你的飞书 App ID 放在 Vercel 环境变量 FEISHU_APP_ID
  const appId = process.env.FEISHU_APP_ID;
  if (!appId) {
    res.status(500).send('FEISHU_APP_ID not configured on server');
    return;
  }

  // 重新拼出飞书授权页地址（使用 app_id）
  const target = new URL('https://open.feishu.cn/open-apis/authen/v1/index');
  target.searchParams.set('app_id', appId);
  if (redirectUri) target.searchParams.set('redirect_uri', redirectUri);
  if (state) target.searchParams.set('state', state);
  target.searchParams.set('response_type', 'code');

  // 302 跳转
  res.setHeader('Location', target.toString());
  res.status(302).end();
}
