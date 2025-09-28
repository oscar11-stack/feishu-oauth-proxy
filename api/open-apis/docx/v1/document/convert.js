// convert.js —— 双端点兜底 + 详细日志
// 目标：先试 blocks/markdownToBlocks，失败则回退到 document/convert。
// 并把上游状态与响应内容打印到 Runtime Logs，方便定位。

async function callFeishu(path, req) {
  const target = `https://open.feishu.cn${path}`;
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

  const body =
    ['GET','HEAD'].includes(req.method)
      ? undefined
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  const r = await fetch(target, { method: 'POST', headers, body });
  const text = await r.text();
  return { status: r.status, text, path };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    // 1) 尝试新版端点：blocks/markdownToBlocks
    let result = await callFeishu('/open-apis/docx/v1/blocks/markdownToBlocks', req);
    console.log('[convert try-1]', result.path, result.status, result.text?.slice(0, 200));

    if (result.status === 200) {
      // 成功：直接把飞书返回原样透传
      return res.status(200).send(result.text);
    }

    // 2) 兜底：老端点 document/convert（需要 content 与 content_type）
    result = await callFeishu('/open-apis/docx/v1/document/convert', req);
    console.log('[convert try-2]', result.path, result.status, result.text?.slice(0, 200));

    // 如果这里成功，原样返回；否则把两次尝试的关键信息返回给前端调试
    if (result.status === 200) {
      return res.status(200).send(result.text);
    } else {
      return res.status(502).json({
        error: 'feishu_convert_failed',
        note: 'Tried both endpoints but neither returned 200.',
        try1: 'blocks/markdownToBlocks',
        try2: 'document/convert',
        try2_status: result.status,
        try2_preview: result.text?.slice(0, 500)
      });
    }
  } catch (e) {
    console.log('[convert exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
