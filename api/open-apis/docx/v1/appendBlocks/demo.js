// /api/open-apis/docx/v1/appendBlocks/demo
// 合法最小块：block_type 用数值枚举；文本段落字段名是 text（不是 paragraph）
const REAL_DOC_ID = 'JksNdLP4koA7DMxwpdfckPYPngg'; // 你的文档 token（不加前缀）

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const document_id = REAL_DOC_ID;
    const block_id    = REAL_DOC_ID; // 根 Page 的 block_id = document_id

    const children = [
      {
        "block_type": 2,
        "text": {
          "elements": [ { "text_run": { "content": "会议纪要\n", "text_element_style": {} } } ],
          "style": {}
        }
      },
      {
        "block_type": 2,
        "text": {
          "elements": [ { "text_run": { "content": "这是 Demo 端点写入的正文（合法文本段落）。\n", "text_element_style": {} } } ],
          "style": {}
        }
      },
      {
        "block_type": 2,
        "text": {
          "elements": [ { "text_run": { "content": "要点 1\n", "text_element_style": {} } } ],
          "style": {}
        }
      },
      {
        "block_type": 2,
        "text": {
          "elements": [ { "text_run": { "content": "要点 2\n", "text_element_style": {} } } ],
          "style": {}
        }
      }
    ];

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children`,
      { method: 'POST', headers, body: JSON.stringify({ children }) }
    );
    const t = await r.text();
    console.log('[append demo children]', r.status, t.slice(0, 200));
    return res.status(r.status).send(t);
  } catch (e) {
    console.log('[append demo exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
