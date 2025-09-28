// /api/open-apis/docx/v1/appendBlocks/demo
// 忽略外部传参，直接把示例 blocks 写入到你的这份文档（document_id = 裸 token）
const REAL_DOC_ID = 'JksNdLP4koA7DMxwpdfckPYPngg'; // ⚠️ 保留为你的 token（不加任何前缀）

async function call(path, headers, payload) {
  const r = await fetch(`https://open.feishu.cn${path}`, { method: 'POST', headers, body: JSON.stringify(payload) });
  const t = await r.text();
  return { status: r.status, t, path };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const document_id = REAL_DOC_ID;
    const block_id    = REAL_DOC_ID; // 根 Page

    const children = [
      { block_type: 'heading1', heading1: { elements: [{ text_run: { content: '会议纪要\n', text_element_style: {} } }] } },
      { block_type: 'paragraph', paragraph: { elements: [{ text_run: { content: '这是 demo 端点写入的正文。\n', text_element_style: {} } }] } },
      { block_type: 'bullet', bullet: { elements: [{ text_run: { content: '要点 1\n', text_element_style: {} } }] } },
      { block_type: 'bullet', bullet: { elements: [{ text_run: { content: '要点 2\n', text_element_style: {} } }] } }
    ];

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Document-Revision-Id': '-1'
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const r = await call(
      `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`,
      headers, { children }
    );
    console.log('[append demo] children/batch_create', r.status, r.t.slice(0, 200));
    return res.status(r.status).send(r.t);
  } catch (e) {
    console.log('[append demo exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
