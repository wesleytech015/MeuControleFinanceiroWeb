const { randomBytes } = require('node:crypto');
const { HELP, parseCommand, money, draftReply } = require('./commands');

// The repository executes this handler inside the same transaction as the inbox journal.
// No login token or conversation state is kept in the function instance.
async function processMessage(store, message, { now = new Date(), timeZone = 'America/Sao_Paulo', assistant = null, confirmationCode = () => randomBytes(6).toString('hex') } = {}) {
  const timestamp = Number(message.timestamp) * 1000;
  if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 60000 || timestamp < now.getTime() - 15 * 60000) {
    return 'Esta mensagem é antiga. Envie o comando novamente.';
  }
  let command;
  try { command = parseCommand(message.text, now, timeZone); }
  catch (error) {
    if (typeof message.text !== 'string' || message.text.length > 600) return HELP;
    if (/^ia (ativar|desativar)$/i.test(message.text.trim())) command = { kind: message.text.trim().toLowerCase() };
    else if (assistant && !/^(vincular|confirmar|sim)\b/i.test(message.text.trim()) && !/^(despesa|receita|compra|gastei|recebi)\s+(?:R\$\s*)?[-\d]/i.test(message.text.trim())) command = { kind: 'free' };
    else return error.message;
  }
  if (command.kind === 'link') {
    const linked = await store.link(message.from, command.code);
    if (linked && assistant) {
      const account = await store.account(message.from);
      if (account) await store.setAiConsent(account.usuario_id, false);
    }
    return linked
      ? 'WhatsApp vinculado à sua conta. ' + HELP
      : 'Não foi possível vincular. Gere um novo código na sua conta e use o mesmo número informado.';
  }
  const account = await store.account(message.from);
  if (!account) return 'Vincule este número à sua conta pelo código gerado com seu login. Depois envie vincular SEU_CODIGO.';
  if (command.kind === 'ia ativar' || command.kind === 'ia desativar') {
    if (!assistant && command.kind !== 'ia desativar') return 'A IA não está habilitada neste ambiente. Os comandos de receita e despesa continuam disponíveis.';
    const enabled = command.kind === 'ia ativar';
    await store.setAiConsent(account.usuario_id, enabled);
    return enabled ? 'IA ativada. Mensagens livres serão enviadas ao Google Gemini. Não envie dados sensíveis. Use ia desativar para interromper. Toda gravação ainda exige confirmação.' : 'IA desativada. Mensagens livres não serão enviadas ao Gemini.';
  }
  if (command.kind === 'ajuda') return HELP + ' IA opcional: ia ativar autoriza enviar mensagens livres ao Google Gemini; ia desativar interrompe.';
  if (command.kind === 'cancelar') {
    await store.clearDraft(account.usuario_id);
    return 'Lançamento pendente cancelado. Nenhuma movimentação foi cadastrada por este comando.';
  }
  if (command.kind === 'resumo') {
    const totals = await store.totals(account.usuario_id);
    return `Todo o período: receitas ${money(totals.receitas)}; despesas ${money(totals.despesas)}; saldo das movimentações ${money(totals.saldo)}. Não representa saldo bancário.`;
  }
  const pending = await store.draft(account.usuario_id);
  if (command.kind === 'confirm') {
    if (!pending || pending.code !== command.code || new Date(pending.expires_at) <= now) return 'Confirmação inválida ou expirada. Envie o lançamento novamente.';
    const id = await store.save(account.usuario_id, pending.transaction);
    await store.clearDraft(account.usuario_id);
    return `Movimentação ${id} cadastrada: ${money(pending.transaction.valor)}. Atualize o aplicativo para conferir.`;
  }
  if (pending && new Date(pending.expires_at) > now) return 'Já existe um lançamento aguardando confirmação. Confirme com o código recebido ou envie cancelar antes de criar outro.';
  if (command.kind === 'free') {
    if (!await store.aiConsent(account.usuario_id)) return 'A IA é opcional. ia ativar autoriza enviar mensagens livres ao Google Gemini. Não envie dados sensíveis. Comandos estruturados continuam disponíveis.';
    if (!await store.consumeAiBudget(account.usuario_id)) return 'Limite da IA atingido nesta hora. Use receita, despesa ou resumo; tente a IA mais tarde.';
    try {
      const result = await assistant(message.text, { now, timeZone });
      if (result.kind === 'reply') return result.text;
      if (result.kind !== 'draft') return HELP;
      // The provider is never allowed to create a confirm command or save directly.
      command = result;
    } catch { return 'Assistente indisponível. Nada foi gravado. Use os comandos de receita/despesa ou tente mais tarde.'; }
  }
  const code = confirmationCode();
  await store.setDraft(account.usuario_id, command.transaction, code, new Date(now.getTime() + 10 * 60000));
  return draftReply(command.transaction, code);
}
module.exports = { processMessage };
