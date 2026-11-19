/** Abspieler für eine Reise: Zeitleiste, Stationen, Play/Pause, Kamera folgt dem Schiff. */
const DURATION_S = 70; // ganze Reise bei normalem Tempo

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createJourney({ el, route, map }) {
  const { stops } = route.route;
  const path = route.path;
  el.innerHTML = `
    <header class="pl-head">
      <div class="pl-cap" aria-hidden="true"></div>
      <h2>${esc(route.route.name)} <small>${esc(route.route.years)}</small></h2>
      <button class="pl-close" id="player-close" aria-label="Reise schließen">✕</button>
    </header>
    <div class="pl-stop">
      <div class="pl-year" id="pl-year"></div>
      <div class="pl-title" id="pl-title"></div>
      <p class="pl-text" id="pl-text"></p>
    </div>
    <div class="pl-track">
      <input type="range" id="pl-range" min="0" max="1000" value="0" aria-label="Position auf der Reise">
      <div class="pl-ticks" aria-hidden="true">${stops.map((s, i) => `<span style="left:${(path.tOfStop(i) * 100).toFixed(2)}%" class="${s.jump ? 'jump' : ''}"></span>`).join('')}</div>
    </div>
    <div class="pl-controls">
      <button id="player-prev" aria-label="Vorherige Station">◀</button>
      <button id="player-play" class="pl-play" aria-label="Abspielen">Abspielen</button>
      <button id="player-next" aria-label="Nächste Station">▶</button>
      <span class="pl-note">Route angenähert · gestrichelt = Abkürzung</span>
    </div>`;

  const $ = id => el.querySelector('#' + id);
  const range = $('pl-range'), play = $('player-play');
  let t = 0, playing = false, open = false, shownStop = -1, last = 0;

  function showStop(i) {
    if (i === shownStop) return;
    shownStop = i;
    const s = stops[i];
    $('pl-year').textContent = s.year;
    $('pl-title').textContent = s.title;
    $('pl-text').textContent = s.text;
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  function setT(v, { follow = false } = {}) {
    t = Math.min(1, Math.max(0, v));
    const p = route.setProgress(t, true);
    range.value = Math.round(t * 1000);
    // aktuelle Station = zuletzt erreichter Meilenstein (nie über die letzte Station hinaus)
    showStop(Math.min(stops.length - 1, Math.max(0, path.reachedStops(t) - 1)));
    if (follow) map.follow(p.pos, p.jump ? 26000 : 14000);
    return p;
  }
  function setPlaying(v) {
    playing = v;
    if (playing && t >= 1) setT(0);
    play.textContent = playing ? 'Pause' : 'Abspielen';
    play.setAttribute('aria-label', playing ? 'Pause' : 'Abspielen');
  }
  function goToStop(i) {
    i = Math.max(0, Math.min(stops.length - 1, i));
    setPlaying(false);
    setT(path.tOfStop(i));
    showStop(i);
    map.flyTo(stops[i].pos, { distance: i === stops.length - 1 ? 3000 : 12000 });
  }

  play.addEventListener('click', () => setPlaying(!playing));
  $('player-prev').addEventListener('click', () => goToStop(shownStop - 1));
  $('player-next').addEventListener('click', () => goToStop(shownStop + 1));
  $('player-close').addEventListener('click', () => api.close());
  range.addEventListener('input', () => { setPlaying(false); const p = setT(range.value / 1000); map.follow(p.pos, null, true); });

  map.onFrame((cam, time) => {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (open && playing) {
      setT(t + dt / DURATION_S, { follow: true });
      if (t >= 1) setPlaying(false);
    }
  });

  const api = {
    open() {
      open = true;
      el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('journey-open');
      if (t >= 1) t = 0;
      setT(t);
      map.flyTo([22000, -15000], { distance: 62000 });
    },
    close() {
      open = false; setPlaying(false);
      el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('journey-open');
      route.setProgress(1, false);
    },
    goToStop,
    pause() { if (playing) setPlaying(false); },
    get isOpen() { return open; },
    state: () => ({ t, playing, open, stop: shownStop, lit: route.lit, ship3d: route.ship3d }),
  };
  return api;
}
