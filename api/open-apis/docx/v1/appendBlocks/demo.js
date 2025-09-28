// 零输入 Demo：不需要 Body；即使 query 里是占位值，也会写入到 REAL_DOC_ID 这份文档。
const REAL_DOC_ID = 'JksNdLP4koA7DMxwpdfckPYPngg'; // 这里改成你的真实 document_id

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
    const url = new URL(req.url, `https://${req.headers.host}`);
    let document_id = url.searchParams.get('document_id') || url.searchParams.get('doc') || '';
    const PLACEHOLDERS = new Set(['', 'demo-doc-id', 'demo-doc-001', 'docx_dummy_id_123']);
    if (PLACEHOLDERS.has(document_id)) document_id = REAL_DOC_ID;
    const block_id = url.searchParams.get('block_id') || document_id;

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

    // Try 1：children/batch_create（权威端点）
    let result = await callFeishu(
      `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`,
      headers,
      { children }
    );
    console.log('[append demo try-1]', result.path, result.status, result.text.slice(0, 200));
    if (result.status === 200) return res.status(200).send(result.text);

    // Try 2（兜底）：blocks/batch_create（部分租户历史版本）
    result = await callFeishu(
      `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/batch_create`,
      headers,
      { parent_id: block_id, children }
    );
    console.log('[append demo try-2]', result.path, result.status, result.text.slice(0, 200));
    if (result.status === 200) return res.status(200).send(result.text);

    // 两次都没成功
    return res.status(502).json({
      error: 'feishu_append_failed',
      note: 'Tried both endpoints but neither returned 200.',
      doc: document_id,
      try1: 'children/batch_create',
      try2: 'blocks/batch_create',
      last_status: result.status,
      last_preview: result.text.slice(0, 500)
    });
  } catch (e) {
    console.log('[append demo exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
