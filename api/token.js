// 作用：代替 ChatGPT 去飞书换 user_access_token / refresh_token
//      关键点：先拿 app_access_token，然后带 Authorization: Bearer <app_access_token>
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  // 先拿 app_access_token
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

  // 透传 ChatGPT 发来的 JSON（可能是 {grant_type:"authorization_code", code:"..."} 或 {grant_type:"refresh_token", refresh_token:"..."}）
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const userResp = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${appData.app_access_token}`
    },
    body: raw
  });

  const text = await userResp.text();
  try { return res.status(200).json(JSON.parse(text)); }
  catch { return res.status(200).send(text); }
}
