import { resolveDocId } from '../../../_docx_id.js';

// /api/open-apis/docx/v1/appendBlocks
// 既支持 Body，也支持 Query；缺 children 时写默认一行；自动探测有效 document_id；
// block_id 默认 = document_id；使用 children/batch_create，携带 Document-Revision-Id: -1。
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = Object.fromEntries(url.searchParams.entries());

    const inputId = bodyObj.document_id || q.document_id || q.doc || '';
    const rawBlockId = bodyObj.block_id || q.block_id || '';
    const index = (bodyObj.index !== undefined ? bodyObj.index
                  : (q.index !== undefined ? Number(q.index) : undefined));
    let children = bodyObj.children;

    if (!inputId) return res.status(400).json({ error: 'missing_params', need: ['document_id'] });

    const auth = req.headers.authorization || '';
    const { finalId, tried } = await resolveDocId(inputId, auth);
    if (!finalId) return res.status(404).json({ error: 'doc_not_found', tried });

    const document_id = finalId;
    const block_id = rawBlockId ? (await resolveDocId(rawBlockId, auth)).finalId || finalId : finalId;

    if (!children) {
      children = [
        { block_type: 'paragraph',
          paragraph: { elements: [{ text_run: { content: '默认写入：appendBlocks 测试文本。\n', text_element_style: {} } }] } }
      ];
    }

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Document-Revision-Id': '-1'
    };
    if (auth) headers['Authorization'] = auth;

    const payload = (index !== undefined) ? { index, children } : { children };
    const r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`,
      { method: 'POST', headers, body: JSON.stringify(payload) }
    );
    const t = await r.text();
    return res.status(r.status).send(t);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
