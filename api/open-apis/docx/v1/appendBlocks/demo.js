// /api/open-apis/docx/v1/appendBlocks/demo
// 作用：不需要 body；从查询串里取 document_id（或用 block_id 同值），写入一段示例内容。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const document_id = url.searchParams.get('document_id') || url.searchParams.get('doc') || '';
    const block_id = url.searchParams.get('block_id') || document_id;

    if (!document_id) {
      return res.status(400).json({ error: 'missing_document_id', hint: 'append ?document_id=xxxxx' });
    }

    const children = [
      {
        block_type: "heading1",
        heading1: { elements: [{ text_run: { content: "会议纪要\n", text_element_style: {} } }] }
      },
      {
        block_type: "paragraph",
        paragraph: { elements: [{ text_run: { content: "这是 demo 端点写入的正文。\n", text_element_style: {} } }] }
      },
      {
        block_type: "bullet",
        bullet: { elements: [{ text_run: { content: "要点 1\n", text_element_style: {} } }] }
      },
      {
        block_type: "bullet",
        bullet: { elements: [{ text_run: { content: "要点 2\n", text_element_style: {} } }] }
      }
    ];

    const target = `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify({ children })
    });

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
