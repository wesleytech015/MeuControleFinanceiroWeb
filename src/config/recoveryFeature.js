// Habilitação explícita apenas em desenvolvimento/homologação, nunca em build de produção.
export function isRecoveryFeatureEnabled(
  enabled = import.meta.env?.VITE_RECOVERY_ENABLED,
  production = import.meta.env?.PROD ?? false,
) {
  return !production && enabled === 'true';
}
