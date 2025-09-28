import { } from 'node:module'; // 占位避免空导入告警
async function proxyFeishu(req, res, path) { /* 把上面 helper 粘这里 */ }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  return proxyFeishu(req, res, '/open-apis/docx/v1/document/create');
}
