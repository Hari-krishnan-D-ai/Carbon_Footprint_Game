/**
 * Pure, side-effect-free game math. Kept separate from the Zustand store so
 * the scoring rules can be unit tested (see /tests) without touching React,
 * Three.js, or the network.
 */

export const HEALTH_MIN = 0;
export const HEALTH_MAX = 100;

export const clamp = (value, min = HEALTH_MIN, max = HEALTH_MAX) =>
  Math.min(max, Math.max(min, value));

/**
 * Town Hall health reacts immediately and symmetrically to the reported
 * impact score (-25..+25). It's the "right now" snapshot of the player's
 * latest action.
 */
export const applyImpactToHealth = (currentHealth, impactScore) =>
  clamp(currentHealth + impactScore);

/**
 * The Atmosphere's pollution factor is deliberately asymmetric: smog builds
 * fast on a bad action but only clears slowly on a good one. This mirrors
 * how emissions linger — it's meant to be felt, not just read as a mirrored
 * health bar.
 */
export const applyImpactToPollution = (currentPollution, impactScore) => {
  if (impactScore < 0) {
    return clamp(currentPollution + Math.abs(impactScore) * 1.5);
  }
  if (impactScore > 0) {
    return clamp(currentPollution - impactScore * 0.5);
  }
  return clamp(currentPollution);
};

export const classifyHealth = (health) => {
  if (health >= 75) return 'thriving';
  if (health >= 40) return 'strained';
  return 'critical';
};

/**
 * Defensive clamp + coercion for whatever the model hands back. Anything
 * malformed collapses to a neutral, non-disruptive event rather than
 * throwing or corrupting state.
 */
export const sanitizeImpactResult = (raw) => {
  const rawScore = Number(raw?.impactScore);
  const impactScore = !Number.isNaN(rawScore) ? clamp(rawScore, -25, 25) : 0;
  const category = typeof raw?.category === 'string' && raw.category.trim() ? raw.category.trim() : 'unknown';
  const remedy = typeof raw?.remedy === 'string' && raw.remedy.trim() ? raw.remedy.trim() : 'Stand your ground!';
  return { impactScore, category, remedy };
};
