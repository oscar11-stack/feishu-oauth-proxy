async function proxyFeishu(req, res, path) { /* 同上 helper */ }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  const { document_id, block_id } = req.query; // Vercel 动态路由
  const path = `/open-apis/docx/v1/documents/${encodeURIComponent(document_id)}/blocks/${encodeURIComponent(block_id)}/children/batch_create`;
  return proxyFeishu(req, res, path);
}
