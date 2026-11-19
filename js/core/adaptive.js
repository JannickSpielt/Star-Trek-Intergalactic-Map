/**
 * Automatische Qualitätsanpassung: Bleibt die Bildzeit über ein Fenster von 60 Bildern
 * im Median über dem Ziel (~40 fps), wird eine Stufe heruntergeschaltet. Nur abwärts,
 * damit die Darstellung nicht hin- und herspringt. Ausreißer (Laden) und Pausen
 * (Tab im Hintergrund) zählen nicht.
 */
export function createAdaptive({ maxLevel = 3, targetMs = 24, window = 60, settle = 30, onChange = () => {} } = {}) {
  let level = 0;
  let buf = [];
  let cooldown = 0; // nach einer Umstellung erst einige Bilder abwarten
  return {
    get level() { return level; },
    frame(ms) {
      if (level >= maxLevel || ms > 250) return;
      if (cooldown > 0) { cooldown--; return; }
      buf.push(ms);
      if (buf.length < window) return;
      const median = [...buf].sort((a, b) => a - b)[buf.length >> 1];
      buf = [];
      if (median > targetMs) { level++; cooldown = settle; onChange(level); }
    },
  };
}
