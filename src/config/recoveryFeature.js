// Opt-in explícito no build. A flag da interface não habilita o endpoint do backend.
export function isRecoveryFeatureEnabled(enabled = import.meta.env?.VITE_RECOVERY_ENABLED) {
  return enabled === 'true';
}
