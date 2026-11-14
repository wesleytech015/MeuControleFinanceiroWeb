const WINDOW_MS = 15 * 60 * 1000;

function recoveryWindow(record, now) {
  const time = now.getTime();
  const blockedUntil = record.bloqueado_ate && new Date(record.bloqueado_ate).getTime();
  if (blockedUntil > time) return { blocked: true };
  const startedAt = record.inicio_janela && new Date(record.inicio_janela).getTime();
  const expired = blockedUntil || startedAt == null || time >= startedAt + WINDOW_MS;
  return { blocked: false, attempts: expired ? 0 : record.tentativas, startedAt: expired ? null : new Date(startedAt) };
}

function failedAttempt(state, now) {
  const attempts = state.attempts + 1;
  return { attempts, startedAt: state.startedAt || now, blockedUntil: attempts >= 5 ? new Date(now.getTime() + WINDOW_MS) : null };
}

module.exports = { recoveryWindow, failedAttempt, WINDOW_MS };
