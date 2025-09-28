// /api/open-apis/docx/v1/appendBlocks/demo
// 强制写入到你的文档，不看外部传参，避免 Test 面板传来的 demo-doc-xxx 造成 404
const REAL_DOC_ID = 'JksNdLP4koA7DMxwpdfckPYPngg'; // ← 换成你的 document_id（你已是这个值）

async function callFeishu(path, headers, payload) {
  const r = await fetch(`https://open.feishu.cn${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const text = await r.text();
  return { status: r.status, text, path };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    // 固定使用真实文档 ID
    const document_id = REAL_DOC_ID;
    const block_id = REAL_DOC_ID;

    // 示例 blocks
    const children = [
      {
        block_type: 'heading1',
        heading1: { elements: [{ text_run: { content: '会议纪要\n', text_element_style: {} } }] }
      },
      {
        block_type: 'paragraph',
        paragraph: { elements: [{ text_run: { content: '这是 demo 端点写入的正文。\n', text_element_style: {} } }] }
      },
      { block_type: 'bullet', bullet: { elements: [{ text_run: { content: '要点 1\n', text_element_style: {} } }] } },
      { block_type: 'bullet', bullet: { elements: [{ text_run: { content: '要点 2\n', text_element_style: {} } }] } }
    ];

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Document-Revision-Id': '-1'
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    // 权威端点：children/batch_create（block_id = document_id）
    let result = await callFeishu(
      `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`,
      headers,
      { children }
    );
    console.log('[append demo] try children/batch_create', result.status, result.text.slice(0, 180));
    if (result.status === 200) return res.status(200).send(result.text);

    // 兜底：blocks/batch_create（历史租户）
    result = await callFeishu(
      `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/batch_create`,
      headers,
      { parent_id: block_id, children }
    );
    console.log('[append demo] try blocks/batch_create', result.status, result.text.slice(0, 180));
    return res.status(result.status).send(result.text);
  } catch (e) {
    console.log('[append demo exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
