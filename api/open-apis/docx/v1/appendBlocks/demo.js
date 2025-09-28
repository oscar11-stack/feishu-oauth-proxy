import { resolveDocId } from '../../../../_docx_id.js';

// 你要写入的“那份文档”的链接里 /docx/ 后面的那串（裸 token）
// 比如 https://feishu.cn/docx/JksNdL...  =>  就是 'JksNdL...'
const YOUR_BARE_TOKEN = 'JksNdLP4koA7DMxwpdfckPYPngg';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const auth = req.headers.authorization || '';
    // 自动探测可用 document_id（可能是原样，也可能是加了 docx/doccn 前缀）
    const { finalId, tried } = await resolveDocId(YOUR_BARE_TOKEN, auth);
    if (!finalId) return res.status(404).json({ error: 'doc_not_found', tried });

    const document_id = finalId;
    const block_id = finalId; // 先按官方规则用根 Page = document_id

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
    if (auth) headers['Authorization'] = auth;

    // 先试权威端点
    let r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`,
      { method: 'POST', headers, body: JSON.stringify({ children }) }
    );
    let t = await r.text();
    console.log('[demo] children/batch_create ->', r.status, t.slice(0, 200));
    if (r.status === 200) return res.status(200).send(t);

    // 兜底再试批量创建（部分租户历史兼容）
    r = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/batch_create`,
      { method: 'POST', headers, body: JSON.stringify({ parent_id: block_id, children }) }
    );
    t = await r.text();
    console.log('[demo] blocks/batch_create ->', r.status, t.slice(0, 200));
    return res.status(r.status).send(t);
  } catch (e) {
    console.log('[demo exception]', e);
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}
