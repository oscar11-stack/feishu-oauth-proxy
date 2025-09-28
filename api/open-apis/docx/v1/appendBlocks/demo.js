// /api/open-apis/docx/v1/appendBlocks/demo
// 说明：飞书 DocX 的 block_type 需要数值枚举；此处全部用最保守的「段落」(paragraph)。
// 提醒：把 REAL_DOC_ID 改成你的文档 token（链接 /docx/ 后面的那串，不加前缀）。
const REAL_DOC_ID = 'JksNdLP4koA7DMxwpdfckPYPngg';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const document_id = REAL_DOC_ID;
    const block_id = REAL_DOC_ID; // 根 Page 的 block_id = document_id

    // 最小合法 children：全部为「段落」；block_type 用数值 1（常见实现中 1=paragraph）
    const children = [
      {
        "block_type": 1,
        "paragraph": {
          "elements": [
            { "text_run": { "content": "会议纪要\n", "text_element_style": {} } }
          ]
        }
      },
      {
        "block_type": 1,
        "paragraph": {
          "elements": [
            { "text_run": { "content": "这是 Demo 端点写入的正文（数值型 block_type）\n", "text_element_style": {} } }
          ]
        }
      },
      {
        "block_type": 1,
        "paragraph": {
          "elements": [
            { "text_run": { "content": "要点 1\n", "text_element_style": {} } }
          ]
        }
      },
      {
        "block_type": 1,
        "paragraph": {
          "elements": [
            { "text_run": { "content": "要点 2\n", "text_element_style": {} } }
          ]
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
