// Explicit manual smoke test: one provider request, no user data and no database.
require('../config/environment').loadEnvironment();
const { configuration, createQwen } = require('../assistant/qwen');
const { createAssistant } = require('../assistant/service');
async function main() {
  const config = configuration();
  if (!config) throw Error('Qwen desabilitado. Configure o ambiente privado após confirmar a cota gratuita no Model Studio.');
  const assistant = createAssistant(createQwen(config));
  const result = await assistant('O saldo representa dinheiro disponível no banco?', { now: new Date(), timeZone: 'America/Sao_Paulo' });
  if (result.kind !== 'reply' || !result.text.includes('Fontes:')) throw Error('O provedor não retornou uma resposta RAG com fonte válida.');
  console.log('Qwen respondeu com fonte validada. Nenhum dado de usuário ou telefone foi enviado; nenhuma gravação foi feita.');
}
main().catch(() => { console.error('Teste Qwen não concluído. Confira habilitação, chave, modelo e cota no ambiente privado. Nenhum segredo é exibido.'); process.exitCode = 1; });
