export function isCardsFeatureEnabled(mode = import.meta.env.MODE) {
  return mode === "development";
}
