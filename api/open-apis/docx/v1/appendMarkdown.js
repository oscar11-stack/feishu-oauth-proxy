// /api/open-apis/docx/v1/appendMarkdown
// 输入：{ document_id, markdown }  ->  转块（官方 or 本地降级） -> 追加写入 /children
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const document_id = body.document_id;
    const markdown = body.markdown || '';
    if (!document_id) return res.status(400).json({ error: 'missing_params', need: ['document_id','markdown'] });

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    // 1) 先尝试官方 convert
    let conv = await fetch('https://open.feishu.cn/open-apis/docx/v1/document/convert', {
      method: 'POST', headers, body: JSON.stringify({ content: markdown, content_type: 'markdown' })
    });
    let text = await conv.text();

    let children;
    if (conv.status === 200) {
      // 兼容不同返回字段名：data.children / data.blocks
      try {
        const obj = JSON.parse(text);
        const data = obj.data || obj;
        children = data.children || data.blocks || [];
        if (!Array.isArray(children)) children = [];
      } catch { children = []; }
    }
    // 2) 官方不可用 -> 本地降级（把 md 每段转为文本段落）
    if (!children || children.length === 0) {
      children = mdToParagraphBlocks(markdown);
    }

    // 3) 追加写入（父块 = 根 Page = document_id）
    const target = `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(document_id)}/children`;
    const up = await fetch(target, { method: 'POST', headers, body: JSON.stringify({ children }) });
    const upText = await up.text();
    return res.status(up.status).send(upText);
  } catch (e) {
    return res.status(500).json({ error: 'appendMarkdown_exception', detail: String(e) });
  }
}

function mdToParagraphBlocks(md) {
  const lines = String(md).split(/\r?\n/);
  const out = [];
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    out.push(makeTextBlock(buf.join('\n') + '\n'));
    buf = [];
  };
  for (let raw of lines) {
    const line = raw || '';
    if (line.trim() === '') { flush(); continue; }
    if (/^\s*[-*]\s+/.test(line)) { buf.push(line.replace(/^\s*[-*]\s+/, '• ')); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { buf.push(line.replace(/^\s*\d+\.\s+/, '• ')); continue; }
    if (/^\s*#{1,6}\s+/.test(line)) { buf.push(line.replace(/^\s*#{1,6}\s+/, '')); continue; }
    buf.push(line);
  }
  flush();
  return out;
}

function makeTextBlock(text) {
  return {
    block_type: 2,
    text: { elements: [ { text_run: { content: text, text_element_style: {} } } ], style: {} }
  };
}
