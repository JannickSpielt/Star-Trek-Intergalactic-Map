/** Prozedurale Planetenbilder (2D-Canvas) – eigene Darstellungen, keine Vorlagen. */

const PALETTES = {
  desert: [['#5a2a12', '#a8552a', '#d98b4a', '#f2c58a'], ['#4a2414', '#8f4a2a', '#c97b48', '#e8b07a']],
  ocean: [['#06204a', '#0c4c8c', '#2f8fc9', '#d9e8d2'], ['#082a3a', '#0f5e70', '#3aa1a8', '#e6efe0']],
  ice: [['#4a6c8c', '#8fb6d4', '#cfe4f2', '#ffffff'], ['#3d5a78', '#7ea6c8', '#c4dcee', '#f4fbff']],
  gas: [['#6b3d22', '#b8794a', '#e6c08f', '#f6e6c8'], ['#3a3f6b', '#6b78b8', '#a9b8e6', '#e6ecff']],
  city: [['#1d2a1f', '#3f5a3a', '#7a8a5a', '#d6c99a'], ['#24282e', '#4a525e', '#8a93a0', '#ffd27a']],
  jungle: [['#0f2a14', '#2a6a2a', '#5aa04a', '#c8e0a0'], ['#12301c', '#2f7a46', '#6ab86a', '#e0f0c0']],
  lava: [['#1a0806', '#5a140a', '#c8401a', '#ffb03a'], ['#200a08', '#6a1a0c', '#e0601e', '#ffd04a']],
  barren: [['#2a2724', '#5a544c', '#8f877a', '#c8bfae'], ['#262a2e', '#4e5660', '#868f98', '#c0c8cf']],
  storm: [['#20262e', '#4a5664', '#8a98a8', '#d8e0e8'], ['#2a1f2e', '#5a4a66', '#9a88aa', '#e2d8ee']],
  station: [['#1a1e26', '#5a6474', '#b8c4d4', '#ffcc88']],
  wormhole: [['#0a1440', '#2a5ad8', '#8ac8ff', '#fff2c8']],
  nebula: [['#1a0830', '#6a2a9a', '#ff6ab0', '#ffe0f0']],
  debris: [['#141414', '#3a3530', '#7a6a5a', '#ff8a4a']],
};

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Reine, deterministische Bildparameter aus Ort-ID und Stil. */
export function artParams(place) {
  const seed = hashString(place.id);
  const pals = PALETTES[place.art] ?? PALETTES.barren;
  const palette = pals[seed % pals.length];
  const rings = place.art === 'gas' || (['barren', 'ice'].includes(place.art) && seed % 5 === 0);
  const clouds = { ocean: 0.55, jungle: 0.45, storm: 0.9, city: 0.25, ice: 0.2, desert: 0.08 }[place.art] ?? 0;
  return { style: place.art, seed, palette, rings, clouds, tilt: ((seed >> 8) % 40 - 20) / 100 };
}

/* ── Rauschen ── */
function makeNoise(seed) {
  const perm = new Uint8Array(512);
  let s = seed || 1;
  const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y, z) => { const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : (h & 15) === 12 || (h & 15) === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
  const n3 = (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  };
  return (x, y, z, oct = 5) => { let a = 0.5, f = 1, s2 = 0; for (let i = 0; i < oct; i++) { s2 += a * n3(x * f, y * f, z * f); a *= 0.5; f *= 2.02; } return s2; };
}

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function ramp(pal, t) {
  t = Math.min(0.999, Math.max(0, t)) * (pal.length - 1);
  const i = Math.floor(t), f = t - i, a = pal[i], b = pal[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Erzeugt eine abgerollte Oberflächentextur (Länge × Breite). */
function surfaceMap(params, W = 384, H = 192) {
  const n = makeNoise(params.seed), nc = makeNoise(params.seed ^ 0x9e3779b9);
  const pal = params.palette.map(hex);
  const data = new Float32Array(W * H * 5);
  const st = params.style;
  for (let y = 0; y < H; y++) {
    const lat = (y / H - 0.5) * Math.PI;
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * Math.PI * 2;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      let h = n(px * 1.6 + 7, py * 1.6, pz * 1.6) * 0.5 + 0.5;
      let c, emit = 0;
      if (st === 'gas') {
        const band = Math.sin(py * 14 + n(px * 2, py * 2, pz * 2, 3) * 3.2) * 0.5 + 0.5;
        c = ramp(pal, band * 0.8 + h * 0.2);
      } else if (st === 'ocean' || st === 'jungle') {
        const land = h > (st === 'ocean' ? 0.56 : 0.44);
        c = land ? ramp(pal, 0.55 + (h - 0.5) * 1.2) : ramp(pal, h * 0.55);
        if (Math.abs(py) > 0.84 + n(px * 6, py * 6, pz * 6, 2) * 0.12) c = [235, 242, 248];
      } else if (st === 'ice') {
        c = ramp(pal, 0.35 + h * 0.7);
        const crack = Math.abs(n(px * 5, py * 5, pz * 5, 2));
        if (crack < 0.025) c = ramp(pal, 0.1);
      } else if (st === 'lava') {
        const cr = Math.abs(n(px * 3, py * 3, pz * 3, 4));
        c = ramp(pal, 0.1 + h * 0.25);
        if (cr < 0.06) { c = ramp(pal, 0.85 + (0.06 - cr) * 2); emit = 1; }
      } else if (st === 'city') {
        const land = h > 0.47;
        c = land ? ramp(pal, 0.35 + h * 0.4) : [18, 40, 70];
        if (land && n(px * 18, py * 18, pz * 18, 2) > 0.18) emit = 0.7;
      } else if (st === 'desert') {
        c = ramp(pal, h * 0.6 + (Math.sin(py * 9 + h * 6) * 0.5 + 0.5) * 0.4);
      } else if (st === 'storm') {
        const sw = n(px * 2 + Math.sin(py * 6), py * 3, pz * 2, 4) * 0.5 + 0.5;
        c = ramp(pal, sw);
      } else {
        const crater = Math.abs(n(px * 4, py * 4, pz * 4, 3));
        c = ramp(pal, h * 0.8 + (crater < 0.05 ? -0.2 : 0));
      }
      let cl = 0;
      if (params.clouds) cl = Math.max(0, (nc(px * 2.5, py * 3.5, pz * 2.5, 5) * 0.5 + 0.5) - (1 - params.clouds * 0.62)) * 2.4;
      const i = (y * W + x) * 5;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = Math.min(1, cl); data[i + 4] = emit;
    }
  }
  return { data, W, H };
}

/**
 * Bereitet einen rotierenden Planeten vor: alles außer der Drehung wird einmal
 * pro Pixel vorberechnet, ein Frame ist danach nur noch eine Tabellen-Abfrage.
 */
export function createPainter(params, S) {
  const map = surfaceMap(params);
  const R = S * 0.36, cx = S / 2, cy = S / 2;
  const accent = hex(params.palette[params.palette.length - 1]);
  const L = [-0.55, -0.35, 0.76]; // Lichtrichtung
  const base = new Uint8ClampedArray(S * S * 4); // Atmosphärensaum (statisch)
  const idx = [], baseU = [], row = [], shade = [], night = [], rim = [];
  const ct = Math.cos(params.tilt), st = Math.sin(params.tilt);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x - cx) / R, ny = (y - cy) / R, rr = nx * nx + ny * ny;
      const o = (y * S + x) * 4;
      if (rr > 1) {
        const e = Math.sqrt(rr) - 1;
        if (e < 0.09 && params.style !== 'barren') {
          const a = Math.pow(1 - e / 0.09, 2) * 0.55;
          const lit = Math.max(0, (-nx * L[0] - ny * L[1]) / Math.sqrt(rr)) * 0.8 + 0.2;
          base[o] = 140 + accent[0] * 0.45; base[o + 1] = 170 + accent[1] * 0.3; base[o + 2] = 255; base[o + 3] = a * 255 * lit;
        }
        continue;
      }
      const nz = Math.sqrt(1 - rr);
      const ty = ny * ct - nx * st, tx = nx * ct + ny * st;
      const lat = Math.asin(Math.max(-1, Math.min(1, -ty))), lon = Math.atan2(tx, nz);
      const v = lat / Math.PI + 0.5;
      const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      idx.push(o);
      baseU.push(lon / (Math.PI * 2));
      row.push(Math.min(map.H - 1, Math.floor(v * map.H)) * map.W);
      shade.push(0.06 + lam * 1.05);
      night.push(1 - Math.min(1, lam * 4));
      rim.push(Math.pow(1 - nz, 3) * 0.45);
    }
  }
  const n = idx.length;
  const I = Int32Array.from(idx), U = Float32Array.from(baseU), RW = Int32Array.from(row);
  const SH = Float32Array.from(shade), NI = Float32Array.from(night), RM = Float32Array.from(rim);
  const D = map.data, W = map.W;
  return {
    size: S, radius: R,
    /** Schreibt einen Frame (Drehwinkel rot in Radiant) in data (RGBA, S×S). */
    frame(rot, data) {
      data.set(base);
      const off = rot / (Math.PI * 2);
      for (let k = 0; k < n; k++) {
        let u = U[k] + off; u -= Math.floor(u);
        const mi = (RW[k] + ((u * W) | 0)) * 5;
        const cloud = D[mi + 3], emit = D[mi + 4] * NI[k], sh = SH[k], rm = RM[k];
        const r = D[mi] + (245 - D[mi]) * cloud, g = D[mi + 1] + (248 - D[mi + 1]) * cloud, b = D[mi + 2] + (255 - D[mi + 2]) * cloud;
        const o = I[k];
        data[o] = r * sh + emit * 255 + rm * 120;
        data[o + 1] = g * sh + emit * 190 + rm * 160;
        data[o + 2] = b * sh + emit * 90 + rm * 255;
        data[o + 3] = 255;
      }
    },
  };
}

/** Zeichnet einen rotierenden Planeten (≈30 fps, bei reduzierter Bewegung still). Gibt eine Stop-Funktion zurück. */
export function renderPlanet(canvas, params) {
  const css = canvas.clientWidth || 200;
  const S = Math.round(Math.min(360, css * Math.min(2, window.devicePixelRatio || 1)));
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d');
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, stopped = false, last = 0;

  if (['station', 'wormhole', 'nebula', 'debris'].includes(params.style)) {
    const t0 = performance.now();
    const loop = now => {
      if (stopped) return;
      if (now - last > 33) { last = now; drawSpecial(g, S, params, still ? 0 : (now - t0) / 1000); }
      if (!still) raf = requestAnimationFrame(loop);
    };
    loop(performance.now() + 100);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }

  const painter = createPainter(params, S);
  const img = g.createImageData(S, S);
  const t0 = performance.now();
  const draw = now => {
    if (stopped) return;
    if (now - last > 33) {
      last = now;
      painter.frame(still ? 0 : ((now - t0) / 1000) * 0.12, img.data);
      g.putImageData(img, 0, 0);
      if (params.rings) drawRings(g, S, painter.radius, params);
    }
    if (!still) raf = requestAnimationFrame(draw);
  };
  draw(performance.now() + 100);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

function drawRings(g, S, R, params) {
  g.save();
  g.translate(S / 2, S / 2); g.rotate(params.tilt - 0.35); g.scale(1, 0.28);
  for (let i = 0; i < 26; i++) {
    const rr = R * (1.25 + i * 0.03);
    g.beginPath(); g.arc(0, 0, rr, Math.PI * 1.02, Math.PI * 1.98, true);
    g.strokeStyle = `rgba(230,210,180,${0.05 + ((params.seed >> i) & 3) * 0.05})`; g.lineWidth = 2.2; g.stroke();
  }
  g.restore();
}

function drawSpecial(g, S, params, t) {
  const c = S / 2;
  g.clearRect(0, 0, S, S);
  const [p0, p1, p2, p3] = params.palette;
  if (params.style === 'wormhole') {
    for (let i = 0; i < 70; i++) {
      const a = i * 0.45 + t * 1.4, r = (i / 70) * S * 0.42;
      g.beginPath(); g.arc(c + Math.cos(a) * r * 0.2, c + Math.sin(a) * r * 0.2, r, a, a + 1.6);
      g.strokeStyle = i % 3 ? p2 : p3; g.globalAlpha = 0.18 + (1 - i / 70) * 0.5; g.lineWidth = 2.5; g.stroke();
    }
    g.globalAlpha = 1;
    const gr = g.createRadialGradient(c, c, 0, c, c, S * 0.16);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, p3); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  } else if (params.style === 'station') {
    // abstrakte Raumstation: Ringe, Speichen, Lichter
    g.save(); g.translate(c, c); g.rotate(t * 0.15); g.scale(1, 0.62);
    g.lineCap = 'round';
    const ring = (r, w, col) => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
    ring(S * 0.38, 7, p1); ring(S * 0.38, 2, p2);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * S * 0.1, Math.sin(a) * S * 0.1); g.lineTo(Math.cos(a) * S * 0.38, Math.sin(a) * S * 0.38); g.strokeStyle = p1; g.lineWidth = 4; g.stroke(); }
    ring(S * 0.22, 5, p1);
    g.beginPath(); g.arc(0, 0, S * 0.1, 0, Math.PI * 2); g.fillStyle = p2; g.fill();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const on = (Math.floor(t * 2) + i) % 4 === 0; g.beginPath(); g.arc(Math.cos(a) * S * 0.38, Math.sin(a) * S * 0.38, on ? 3 : 1.6, 0, Math.PI * 2); g.fillStyle = on ? p3 : '#fff'; g.fill(); }
    g.restore();
  } else {
    // Nebel / Trümmerfeld
    let s = params.seed;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const gr = g.createRadialGradient(c, c, 0, c, c, S * 0.45);
    gr.addColorStop(0, params.style === 'nebula' ? p2 + '88' : p1 + '66'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 160; i++) {
      const a = rnd() * Math.PI * 2 + t * 0.05 * (rnd() - 0.5), r = Math.sqrt(rnd()) * S * 0.4;
      g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r * 0.7, 1 + rnd() * 3.5, 0, Math.PI * 2);
      g.fillStyle = rnd() > 0.85 ? p3 : p2; g.globalAlpha = 0.4 + rnd() * 0.6; g.fill();
    }
    g.globalAlpha = 1;
  }
}
