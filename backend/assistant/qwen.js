function configuration(env = process.env) {
  if (env.QWEN_ENABLED !== 'true') return null;
  if (!env.QWEN_API_KEY?.trim() || !/^qwen[a-z0-9.-]+$/.test(env.QWEN_MODEL || '')) {
    throw new Error('Configure QWEN_API_KEY e QWEN_MODEL no servidor.');
  }
  if (!/^[a-zA-Z0-9-]+$/.test(env.QWEN_WORKSPACE_ID || '')) throw new Error('Configure QWEN_WORKSPACE_ID.');
  return { apiKey: env.QWEN_API_KEY, model: env.QWEN_MODEL, workspace: env.QWEN_WORKSPACE_ID };
}
function createQwen(config, request = fetch) {
  if (!config) return null;
  return async ({ system, input }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await request(`https://${config.workspace}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model: config.model, stream: false, enable_thinking: false,
          messages: [{ role: 'system', content: system + '\nRetorne exclusivamente JSON.' }, { role: 'user', content: JSON.stringify(input) }],
          response_format: { type: 'json_object' }, max_tokens: 1024 }),
      });
      // No automatic retries: quota errors and failures must not multiply provider calls.
      if (!response.ok) throw new Error('provider');
      const body = await response.json();
      const candidate = body.choices?.[0];
      if (candidate?.finish_reason !== 'stop' || candidate.message?.tool_calls?.length) throw new Error('blocked');
      const text = candidate.message?.content;
      if (typeof text !== 'string' || !text || text.length > 12000) throw new Error('invalid');
      return JSON.parse(text);
    } catch {
      // Never propagate provider bodies, keys or prompts to callers/logs.
      throw new Error('Assistente indisponível. Use os comandos de receita/despesa ou tente mais tarde.');
    } finally { clearTimeout(timer); }
  };
}
module.exports = { configuration, createQwen };
