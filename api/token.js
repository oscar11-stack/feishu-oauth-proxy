// Vercel serverless function: Feishu OAuth proxy (标准化返回给 ChatGPT)
// 作用：先取 app_access_token，再带 Bearer 头去飞书换 user_access_token，
//      然后把飞书 {code:0, data:{...}} => 转成标准 OAuth 顶层字段返回

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  // 1) 先拿 app_access_token（应用级）
  const appResp = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  const appData = await appResp.json();
  if (appData.code !== 0 || !appData.app_access_token) {
    return res.status(500).json({ error: 'get_app_access_token_failed', detail: appData });
  }

  // 2) 用 app_access_token 去换 user_access_token（把 ChatGPT 传来的 body 透传）
  const incoming = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const userResp = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${appData.app_access_token}`
    },
    body: incoming
  });

  // 3) 读取飞书返回并“改造”为标准 OAuth 顶层格式
  let rawText = await userResp.text();
  let feishu;
  try { feishu = JSON.parse(rawText); }
  catch {
    // 非 JSON 兜底：直接回传给 ChatGPT 看错误
    return res.status(200).send(rawText);
  }

  if (feishu.code !== 0 || !feishu.data) {
    // 飞书错误时，原样抛回
    return res.status(200).json(feishu);
  }

  const d = feishu.data;
  // 按 ChatGPT 期望的字段名返回（顶层）
  const normalized = {
    access_token: d.access_token,
    token_type: d.token_type || 'Bearer',
    expires_in: d.expires_in,                 // 秒
    refresh_token: d.refresh_token,
    refresh_token_expires_in: d.refresh_expires_in, // 有些客户端不会用到，但保留
    scope: (req.body && req.body.scope) || undefined,
    // 额外附带一些飞书用户信息（不是必须），方便调试
    user_id: d.user_id,
    open_id: d.open_id,
    tenant_key: d.tenant_key
  };

  return res.status(200).json(normalized);
}
