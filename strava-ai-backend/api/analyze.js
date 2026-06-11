const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 將初始化放在 try-catch 內，避免環境變數缺失導致伺服器直接崩潰
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("後端缺少 ANTHROPIC_API_KEY 環境變數");
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { prompt } = body;
    console.log('收到請求, prompt 長度:', prompt?.length);

    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt' });
    }

    // ✅ 修正模型名稱：改為 Anthropic 實際支援的模型名稱
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6', 
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.find(c => c.type === 'text')?.text ?? '';
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error('錯誤訊息:', error.message);
    // 確保這裡一定回傳 JSON
    return res.status(500).json({ error: '分析失敗', detail: error.message });
  }
};