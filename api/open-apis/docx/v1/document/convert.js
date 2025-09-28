async function proxyFeishu(req, res, path) { /* 同上 helper */ }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  return proxyFeishu(req, res, '/open-apis/docx/v1/document/convert');
}
