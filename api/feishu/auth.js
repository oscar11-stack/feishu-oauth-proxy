// api/feishu/auth.js
// 作用：把 ChatGPT 的 OAuth 请求 302 到飞书授权页；严格编码 redirect_uri，并在 Runtime Logs 打印定位信息。
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const qp = new URLSearchParams(url.search || '');

    const redirectUri = qp.get('redirect_uri') || '';
    const state = qp.get('state') || '';
    const appId = process.env.FEISHU_APP_ID;

    if (!appId) {
      console.log('[auth] missing FEISHU_APP_ID');
      return res.status(500).send('FEISHU_APP_ID not configured on server');
    }
    if (!redirectUri) {
      console.log('[auth] missing redirect_uri from client');
      return res.status(400).send('missing redirect_uri');
    }

    // 严格编码 redirect_uri
    const target = `https://open.feishu.cn/open-apis/authen/v1/index`
      + `?app_id=${encodeURIComponent(appId)}`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`
      + `&response_type=code`
      + (state ? `&state=${encodeURIComponent(state)}` : '');

    console.log('[auth] 302 ->', target); // 到 Vercel Runtime Logs 可见
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Location', target);
    return res.status(302).end();
  } catch (e) {
    console.log('[auth] exception', e);
    return res.status(500).send('auth proxy exception');
  }
}
