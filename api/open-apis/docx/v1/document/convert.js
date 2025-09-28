// /api/open-apis/docx/v1/document/convert
// 策略：先调用飞书官方 convert；若返回非 200（如 404），本地降级把 Markdown 转为合法 blocks（block_type=2 + text）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    // 解析 body
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const content = bodyObj.content || '';
    const content_type = (bodyObj.content_type || 'markdown').toLowerCase();

    // 先尝试官方端点
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const upstream = await fetch(
      'https://open.feishu.cn/open-apis/docx/v1/document/convert',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, content_type })
      }
    );

    const upstreamText = await upstream.text();
    if (upstream.status === 200) {
      // 官方成功，原样返回
      return res.status(200).send(upstreamText);
    }

    // ===== 降级：本地把 Markdown 转成 blocks（最保守：全部转为“文本段落”） =====
    const blocks = mdToParagraphBlocks(content || '');
    return res.status(200).json({
      code: 0,
      msg: 'fallback_convert_succeeded',
      data: { children: blocks },
      upstream_status: upstream.status
    });

  } catch (e) {
    return res.status(500).json({ error: 'proxy_exception', detail: String(e) });
  }
}

/**
 * 把 Markdown 文本按行/空行切段，全部转换为“文本段落” block
 * 结构：block_type=2 + text.elements[].text_run.content（结尾加 \n）
 * - 列表行（-,*,数字.）用 "• " 前缀
 * - 标题行（#、##、###）直接当普通段落输出文本
 */
function mdToParagraphBlocks(md) {
  const lines = String(md).split(/\r?\n/);
  const blocks = [];
  let buffer = [];

  const flushParagraph = () => {
    if (buffer.length === 0) return;
    const text = buffer.join('\n') + '\n';
    blocks.push(makeTextBlock(text));
    buffer = [];
  };

  for (let raw of lines) {
    const line = raw || '';
    if (line.trim() === '') { // 空行 -> 结束一个段落
      flushParagraph();
      continue;
    }
    // 列表符号转为“• ”（不使用 bullet 类型，统一用文本段落以保证兼容）
    if (/^\s*[-*]\s+/.test(line)) {
      buffer.push(line.replace(/^\s*[-*]\s+/, '• '));
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      buffer.push(line.replace(/^\s*\d+\.\s+/, '• '));
      continue;
    }
    // 标题行：去掉 # 前缀，当普通段落
    if (/^\s*#{1,6}\s+/.test(line)) {
      buffer.push(line.replace(/^\s*#{1,6}\s+/, ''));
      continue;
    }
    buffer.push(line);
  }
  flushParagraph();
  return blocks;
}

function makeTextBlock(text) {
  return {
    block_type: 2, // 文本段落
    text: {
      elements: [
        { text_run: { content: text, text_element_style: {} } }
      ],
      style: {}
    }
  };
}
