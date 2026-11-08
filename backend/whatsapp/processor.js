const { randomBytes } = require('node:crypto');
const { HELP, parseCommand, money, draftReply } = require('./commands');

// The repository executes this handler inside the same transaction as the inbox journal.
// No login token or conversation state is kept in the function instance.
async function processMessage(store, message, { now = new Date(), timeZone = 'America/Sao_Paulo', confirmationCode = () => randomBytes(6).toString('hex') } = {}) {
  const timestamp = Number(message.timestamp) * 1000;
  if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 60000 || timestamp < now.getTime() - 15 * 60000) {
    return 'Esta mensagem é antiga. Envie o comando novamente.';
  }
  let command;
  try { command = parseCommand(message.text, now, timeZone); }
  catch (error) { return error.message; }
  if (command.kind === 'link') {
    return await store.link(message.from, command.code)
      ? 'WhatsApp vinculado à sua conta. ' + HELP
      : 'Não foi possível vincular. Gere um novo código na sua conta e use o mesmo número informado.';
  }
  const account = await store.account(message.from);
  if (!account) return 'Vincule este número à sua conta pelo código gerado com seu login. Depois envie vincular SEU_CODIGO.';
  if (command.kind === 'ajuda') return HELP;
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
  const code = confirmationCode();
  await store.setDraft(account.usuario_id, command.transaction, code, new Date(now.getTime() + 10 * 60000));
  return draftReply(command.transaction, code);
}
module.exports = { processMessage };
