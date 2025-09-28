// Vercel serverless function: Feishu OAuth proxy
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  // 1) 获取 app_access_token（飞书要求后续调用带该 Bearer 头）
  const appResp = await fetch("https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal/", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  const appData = await appResp.json();
  if (!appResp.ok || appData.code !== 0 || !appData.app_access_token) {
    return res.status(500).json({ error: "get_app_access_token_failed", detail: appData });
  }

  // 2) 透传 ChatGPT 的换令牌请求体（authorization_code / refresh_token）
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_request', detail: 'body must be JSON' });
  }

  const userResp = await fetch("https://open.feishu.cn/open-apis/authen/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Bearer ${appData.app_access_token}`
    },
    body: JSON.stringify(body)
  });

  const text = await userResp.text();
  // 尽量原样返回（有时飞书返回非严格 JSON）
  try {
    return res.status(200).json(JSON.parse(text));
  } catch {
    return res.status(200).send(text);
  }
}
