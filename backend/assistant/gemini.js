function configuration(env = process.env) {
  if (env.GEMINI_ENABLED !== 'true') return null;
  if (!env.GEMINI_API_KEY?.trim() || !/^gemini-[a-z0-9.-]+$/.test(env.GEMINI_MODEL || '')) {
    throw new Error('Configure GEMINI_API_KEY e GEMINI_MODEL no servidor.');
  }
  return { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL };
}
function createGemini(config, request = fetch) {
  if (!config) return null;
  return async ({ system, input, schema }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, maxOutputTokens: 1024 } }),
      });
      // No automatic retries: quota errors and failures must not multiply provider calls.
      if (!response.ok) throw new Error('provider');
      const body = await response.json();
      const candidate = body.candidates?.[0];
      if (body.promptFeedback?.blockReason || candidate?.finishReason !== 'STOP') throw new Error('blocked');
      const text = candidate.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('');
      if (!text || text.length > 12000) throw new Error('invalid');
      return JSON.parse(text);
    } catch {
      // Never propagate provider bodies, keys or prompts to callers/logs.
      throw new Error('Assistente indisponível. Use os comandos de receita/despesa ou tente mais tarde.');
    } finally { clearTimeout(timer); }
  };
}
module.exports = { configuration, createGemini };
