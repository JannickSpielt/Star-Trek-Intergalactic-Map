// Zusätzliche E2E-Prüfungen, nach Task gruppiert.
export default async function ({ page, check, assert, sleep, settle, brightness, shot, browser, openPage, ready, devices }) {
  // ── Task 7: Overlays ──
  await check('overlay layers exist', async () => {
    const keys = await page.evaluate(() => Object.keys(window.__map.layers).sort());
    for (const k of ['borders', 'grid', 'regions', 'territories', 'wormhole']) assert.ok(keys.includes(k), `missing ${k}`);
  });
  await check('federation territory tints the view around Sol blue', async () => {
    await page.evaluate(() => window.__map.flyTo('sol', { distance: 9000 }));
    await settle(page); await sleep(400);
    const b = await brightness(page, 640, 400, 120);
    assert.ok(b.b > b.r + 4, `r ${b.r.toFixed(1)} b ${b.b.toFixed(1)}`);
  });
  await shot(page, '02-foederation');

  // ── Task 8: Marker, Labels, Auswahl ──
  await page.evaluate(() => window.__map.flyTo('romulus', { distance: 500 }));
  await settle(page); await sleep(500);
  await check('Romulus and Remus labels are visible and do not overlap', async () => {
    const r = await page.evaluate(() => ['romulus', 'remus'].map(id => { const el = document.querySelector(`.label[data-id="${id}"]`); if (!el || el.style.opacity === '0') return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }));
    assert.ok(r[0] && r[1], 'label missing');
    const [a, b] = r;
    assert.ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h), 'overlap');
  });
  await shot(page, '03-romulus');
  await check('clicking a marker selects the place', async () => {
    const p = await page.evaluate(() => window.__map.screenOf('romulus'));
    await page.mouse.click(p.x, p.y);
    await sleep(200);
    assert.equal(await page.evaluate(() => window.__map.state().selected), 'romulus');
  });
  await check('dragging does not select', async () => {
    await page.evaluate(() => window.__map.select(null));
    const p = await page.evaluate(() => window.__map.screenOf('remus'));
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    await page.mouse.move(p.x + 60, p.y + 20, { steps: 6 }); await page.mouse.up();
    await sleep(200);
    assert.equal(await page.evaluate(() => window.__map.state().selected), null);
  });

  // ── Task 9: Rahmen & Navigation ──
  await check('bookmark flies to Bajor', async () => {
    await page.click('#bookmarks button:has-text("Bajor")');
    await sleep(200); await settle(page);
    const t = await page.evaluate(() => window.__map.state().target);
    const b = await page.evaluate(() => window.__map.place('bajor').pos);
    assert.ok(Math.hypot(t[0] - b[0], t[1] - b[1]) < 300, `off by ${Math.hypot(t[0] - b[0], t[1] - b[1])}`);
  });
  await check('layer toggle hides territories', async () => {
    await page.click('#tab-layers');
    await page.click('#layers button:has-text("Reiche")');
    assert.equal(await page.evaluate(() => window.__map.layers.territories.visible), false);
    await page.click('#layers button:has-text("Reiche")');
    assert.equal(await page.evaluate(() => window.__map.layers.territories.visible), true);
    await page.click('#tab-goals');
  });
  await check('status bar shows quadrant at Sol', async () => {
    await page.evaluate(() => window.__map.flyTo('sol'));
    await settle(page); await sleep(300);
    const qt = await page.textContent("#readout-quadrant"); const st = await page.evaluate(() => window.__map.state()); assert.match(qt, /Alpha/, `got "${qt}" target ${st.target} flying ${st.flying}`);
    assert.match(await page.textContent('#scale-label'), /LJ/);
  });

  // ── Task 10: Infofenster ──
  await check('selecting Vulcan opens the info panel with facts', async () => {
    await page.evaluate(() => window.__map.focus('vulcan'));
    await page.waitForSelector('#info.open', { timeout: 5000 });
    const text = await page.textContent('#info');
    assert.match(text, /Vulcan/); assert.match(text, /Alpha/); assert.match(text, /TOS/);
    const href = await page.getAttribute('#info a.ma-link', 'href');
    assert.ok(href.startsWith('https://memory-alpha.fandom.com/de/wiki/Spezial:Suche?') && href.includes('search=Vulcan') && href.includes('go=Go'), href);
  });
  await check('planet image is drawn', async () => {
    await sleep(400);
    const filled = await page.evaluate(() => { const c = document.querySelector('#info canvas'); const d = c.getContext('2d').getImageData(c.width / 2 - 10, c.height / 2 - 10, 20, 20).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return s / (d.length / 4); });
    assert.ok(filled > 200, `alpha ${filled}`);
  });
  await settle(page); await sleep(300);
  await shot(page, '04-info-vulcan');
  await check('closing the panel clears the selection', async () => {
    await page.click('#info-close');
    assert.equal(await page.evaluate(() => window.__map.state().selected), null);
  });

  // ── Task 11: Suche, Mini-Map, Mobil ──
  await check('search "kronos" + Enter selects Qo\'noS', async () => {
    await page.fill('#search', 'kronos');
    await page.waitForSelector('#results.open li');
    await page.press('#search', 'Enter');
    await sleep(200);
    assert.equal(await page.evaluate(() => window.__map.state().selected), 'qonos');
  });
  await check('minimap click top-left jumps into the Gamma quadrant', async () => {
    await page.evaluate(() => window.__map.select(null));
    const box = await (await page.$('#minimap')).boundingBox();
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await sleep(200); await settle(page);
    const t = await page.evaluate(() => window.__map.state().target);
    assert.ok(t[0] < 0 && t[1] < 0, `target ${t}`);
  });
  await check('resizing keeps the canvas in sync', async () => {
    await page.setViewportSize({ width: 800, height: 600 });
    await sleep(400);
    const s = await page.evaluate(() => { const c = document.getElementById('map'); return [c.width, c.height, devicePixelRatio, c.clientWidth, c.clientHeight]; });
    assert.equal(s[3], 800); assert.equal(s[4], 600);
    assert.ok(Math.abs(s[0] / s[1] - 800 / 600) < 0.01, `aspect ${s[0]}x${s[1]}`);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  const m = await openPage(browser, { ...devices['iPhone 13'] });
  await ready(m.page); await sleep(800);
  await check('mobile: no horizontal scroll, menu collapsed', async () => {
    const r = await m.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, panel: getComputedStyle(document.getElementById('side-panel')).display }));
    assert.ok(r.sw <= r.w, `scrollWidth ${r.sw} > ${r.w}`);
    assert.equal(r.panel, 'none');
  });
  await check('mobile: info opens as bottom sheet', async () => {
    await m.page.evaluate(() => window.__map.focus('bajor'));
    await m.page.waitForSelector('#info.open'); await sleep(600);
    const b = await (await m.page.$('#info')).boundingBox();
    const vh = m.page.viewportSize().height;
    assert.ok(Math.abs(b.y + b.height - vh) < 2, `bottom ${b.y + b.height} vs ${vh}`);
  });
  await shot(m.page, '05-mobil-bajor');
  await check('mobile: pinch spreads fingers -> zooms in', async () => {
    await m.page.evaluate(() => window.__map.select(null));
    await sleep(500); await settle(m.page);
    const d0 = await m.page.evaluate(() => window.__map.state().distance);
    const cdp = await m.page.context().newCDPSession(m.page);
    const tp = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    await tp('touchStart', [[150, 400], [240, 400]]);
    for (let i = 1; i <= 8; i++) await tp('touchMove', [[150 - i * 10, 400], [240 + i * 10, 400]]);
    await tp('touchEnd', []);
    await sleep(200);
    const d1 = await m.page.evaluate(() => window.__map.state().distance);
    assert.ok(d1 < d0 * 0.8, `distance ${d0} -> ${d1}`);
  });
  // ── Touch-Richtung: Inhalt folgt dem Finger ──
  const cdpM = await m.page.context().newCDPSession(m.page);
  const touch = (type, pts) => cdpM.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await check('mobile: one-finger swipe right moves the map right', async () => {
    await m.page.evaluate(() => { window.__map.select(null); window.__map.flyTo('sol', { distance: 9000, tilt: 0.3, azimuth: 0 }); });
    await settle(m.page); await sleep(400);
    const a = await m.page.evaluate(() => window.__map.screenOf('sol'));
    await touch('touchStart', [[120, 420]]);
    for (let i = 1; i <= 10; i++) await touch('touchMove', [[120 + i * 12, 420]]);
    await touch('touchEnd', []);
    await sleep(200);
    const b = await m.page.evaluate(() => window.__map.screenOf('sol'));
    assert.ok(b.x - a.x > 80, `sol x ${a.x.toFixed(0)} -> ${b.x.toFixed(0)}`);
    assert.ok(Math.abs(b.y - a.y) < 30, `sol y ${a.y.toFixed(0)} -> ${b.y.toFixed(0)}`);
  });
  await check('mobile: two-finger twist does not rotate or tilt the map', async () => {
    await m.page.evaluate(() => window.__map.flyTo('sol', { distance: 9000 }));
    await settle(m.page); await sleep(300);
    const s0 = await m.page.evaluate(() => window.__map.state());
    const c = [195, 422];
    await touch('touchStart', [[c[0] - 60, c[1]], [c[0] + 60, c[1]]]);
    for (let i = 1; i <= 10; i++) { const a = (i / 10) * 0.5; await touch('touchMove', [[c[0] - 60 * Math.cos(a), c[1] - 60 * Math.sin(a) - i * 4], [c[0] + 60 * Math.cos(a), c[1] + 60 * Math.sin(a) - i * 4]]); }
    await touch('touchEnd', []);
    await sleep(200);
    const s1 = await m.page.evaluate(() => window.__map.state());
    assert.equal(s1.azimuth, s0.azimuth, 'azimuth changed');
    assert.equal(s1.tilt, s0.tilt, 'tilt changed');
  });
  // ── Handy-Fehler aus dem Nutzertest ──
  await check('mobile: swiping the sheet header down closes the info sheet', async () => {
    await m.page.evaluate(() => window.__map.focus('bajor'));
    await m.page.waitForSelector('#info.open'); await sleep(600);
    const h = await (await m.page.$('#info-title')).boundingBox();
    const x = h.x + 30, y0 = h.y + h.height / 2;   // am Titel, nicht am Griffstrich
    await touch('touchStart', [[x, y0]]);
    for (let i = 1; i <= 8; i++) await touch('touchMove', [[x, y0 + i * 18]]);
    await touch('touchEnd', []);
    await sleep(600);
    assert.equal((await m.page.$('#info.open')) !== null, false);
  });
  await check('mobile: scrolling the search results does not pick a result', async () => {
    await m.page.fill('#search', 'a');
    await m.page.waitForSelector('#results.open li'); await sleep(200);
    const b = await (await m.page.$('#results li:nth-child(2)')).boundingBox();
    const x = b.x + 40, y0 = b.y + b.height / 2;
    await touch('touchStart', [[x, y0]]);
    for (let i = 1; i <= 6; i++) await touch('touchMove', [[x, y0 - i * 10]]);
    await touch('touchEnd', []);
    await sleep(400);
    assert.equal(await m.page.evaluate(() => window.__map.state().selected), null);
    await m.page.fill('#search', '');
    await m.page.evaluate(() => document.activeElement.blur());
  });
  await check('mobile: the menu stays usable while an info sheet is open', async () => {
    await m.page.evaluate(() => window.__map.focus('vulcan'));
    await m.page.waitForSelector('#info.open'); await sleep(500);
    await m.page.tap('#menu-toggle'); await sleep(300);
    const btn = await m.page.$('#bookmarks button:has-text("Dominion")');
    const bb = await btn.boundingBox();
    const top = await m.page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.textContent, [bb.x + bb.width / 2, bb.y + bb.height / 2]);
    assert.equal(top, 'Dominion');
    await m.page.tap('#menu-toggle'); await m.page.evaluate(() => window.__map.select(null));
  });
  await check('mobile: no console errors', () => assert.deepEqual(m.errors, []));
  await m.ctx.close();


  // ── Task 12: Web-App (Manifest, Icons, Service Worker) ──
  await check('web app manifest with installable icons', async () => {
    const href = await page.getAttribute('link[rel="manifest"]', 'href');
    assert.ok(href, 'no manifest link');
    const man = await page.evaluate(async h => (await fetch(h)).json(), href);
    assert.equal(man.display, 'standalone');
    for (const size of ['192x192', '512x512']) {
      const icon = man.icons.find(i => i.sizes === size);
      assert.ok(icon, `icon ${size}`);
      const ok = await page.evaluate(async src => (await fetch(src)).ok, icon.src);
      assert.ok(ok, `icon ${icon.src} not reachable`);
    }
    assert.ok(man.icons.some(i => (i.purpose || '').includes('maskable')), 'maskable icon');
  });
  await check('service worker registers', async () => {
    const ok = await page.evaluate(async () => { const r = await navigator.serviceWorker?.getRegistration(); return !!r; });
    assert.ok(ok);
  });

  // ── Final-Review #1: keinerlei Überlappung aller sichtbaren Beschriftungen ──
  const allLabelsClear = async (pg, name) => {
    const rects = await pg.evaluate(() => [...document.querySelectorAll('#labels > div')]
      .filter(el => el.style.opacity !== '0' && getComputedStyle(el).opacity !== '0' && el.offsetParent !== null)
      .map(el => { const b = el.getBoundingClientRect(); return { t: el.textContent, x: b.x, y: b.y, w: b.width, h: b.height }; })
      .filter(r => r.w > 0 && r.x < innerWidth && r.y < innerHeight && r.x + r.w > 0 && r.y + r.h > 0));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      assert.ok(!(a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1), `${name}: "${a.t}" overlaps "${b.t}"`);
    }
  };
  for (const [id, d] of [['sol', 12000], ['bajor', 4000], ['romulus', 6000], ['sol', 60000]]) {
    await check(`no label overlaps at ${id} / ${d} LJ`, async () => {
      await page.evaluate(([i, dd]) => { window.__map.select(null); window.__map.flyTo(i, { distance: dd }); }, [id, d]);
      await settle(page); await sleep(500);
      await allLabelsClear(page, id);
    });
  }

  // ── Canon-Abstände: Namen der Nachbarsterne erscheinen erst beim Heranzoomen ──
  const labelShown = id => page.evaluate(i => { const el = document.querySelector(`.label[data-id="${i}"]`); return !!el && el.style.opacity !== '0'; }, id);
  await check('far from Sol the close neighbours are hidden', async () => {
    await page.evaluate(() => { window.__map.select(null); window.__map.flyTo('sol', { distance: 3000 }); });
    await settle(page); await sleep(500);
    assert.equal(await labelShown('sol'), true);
    assert.equal(await labelShown('alphacen'), false);
    assert.equal(await labelShown('mars'), false);
  });
  await check('zooming in reveals Vulcan, Alpha Centauri and Mars', async () => {
    await page.evaluate(() => window.__map.flyTo('sol', { distance: 45 }));
    await settle(page); await sleep(500);
    for (const id of ['vulcan', 'alphacen', 'wolf359']) assert.equal(await labelShown(id), true, id);
    await page.evaluate(() => window.__map.flyTo('sol', { distance: 12 }));
    await settle(page); await sleep(500);
    assert.equal(await labelShown('mars'), true, 'mars');
  });
  await shot(page, '06-sol-nah');
  await check('no label overlaps right at Sol', async () => { await allLabelsClear(page, 'sol-nah'); });

  // ── Position angenähert ──
  await check('info shows whether a position is approximate', async () => {
    await page.evaluate(() => window.__map.focus('qonos'));
    await page.waitForSelector('#info.open'); await sleep(300);
    assert.match(await page.textContent('#info'), /angenähert/);
    await page.evaluate(() => window.__map.focus('vulcan'));
    await sleep(500);
    assert.match(await page.textContent('#info'), /Canon/);
    await page.click('#info-close');
  });

  // ── Voyagers Heimreise ──
  await check('voyager route layer exists', async () => {
    assert.ok(await page.evaluate(() => !!window.__map.layers.voyager));
  });
  await check('Voyager bookmark opens the journey player', async () => {
    await page.click('#bookmarks button:has-text("Voyager")');
    await page.waitForSelector('#player.open', { timeout: 5000 });
    assert.match(await page.textContent('#player'), /Fürsorger/);
  });
  await check('playing moves the ship along the route', async () => {
    const t0 = await page.evaluate(() => window.__map.journey.state().t);
    await page.click('#player-play');
    await sleep(2500);
    const s1 = await page.evaluate(() => window.__map.journey.state());
    assert.ok(s1.t > t0 + 0.005, `t ${t0} -> ${s1.t}`);
    assert.ok(s1.playing);
    await page.click('#player-play');
    assert.equal(await page.evaluate(() => window.__map.journey.state().playing), false);
  });
  await check('the ship is a 3D model and passed stops light up', async () => {
    const st = await page.evaluate(() => window.__map.journey.state());
    assert.equal(st.ship3d, true);
    assert.ok(st.lit >= 1 && st.lit <= 14, `lit ${st.lit}`);
    await page.evaluate(() => window.__map.journey.goToStop(8));
    await sleep(200);
    assert.equal(await page.evaluate(() => window.__map.journey.state().lit), 9);
  });
  await check('scrubbing to a stop shows its year and title', async () => {
    await page.evaluate(() => window.__map.journey.goToStop(6));
    await sleep(300);
    const txt = await page.textContent('#player');
    assert.match(txt, /Krenim/); assert.match(txt, /2374/);
  });
  await sleep(1500);
  await shot(page, '07-voyager');
  await check('reaching the end of the journey shows the arrival and keeps rendering', async () => {
    const errsBefore = await page.evaluate(() => (window.__qaErrors = window.__qaErrors || [], 0));
    await page.evaluate(() => window.__map.journey.goToStop(12));
    await sleep(200);
    await page.click('#player-next');
    await sleep(300);
    assert.match(await page.textContent('#player'), /Ankunft/);
    // Regler ganz ans Ende ziehen
    await page.evaluate(() => { const r = document.getElementById('pl-range'); r.value = 1000; r.dispatchEvent(new Event('input')); });
    await sleep(300);
    assert.match(await page.textContent('#player'), /Ankunft/);
    // Karte zeichnet weiter: Zustand ändert sich nach einem Zoom
    const d0 = await page.evaluate(() => window.__map.state().distance);
    await page.click('#zoom-in'); await sleep(1500);
    const d1 = await page.evaluate(() => window.__map.state().distance);
    assert.ok(d1 < d0, `distance ${d0} -> ${d1}`);
  });
  await check('closing the player hides it', async () => {
    await page.click('#player-close');
    assert.equal((await page.$('#player.open')) !== null, false);
  });

  // ── Seitenleiste mit Reitern & Reichs-Infos ──
  await check('sidebar shows one tab at a time', async () => {
    await page.click('#tab-powers');
    const vis = await page.evaluate(() => ['bookmarks', 'powers', 'layers'].map(id => getComputedStyle(document.getElementById(id)).display !== 'none'));
    assert.deepEqual(vis, [false, true, false]);
    assert.ok(await page.$$eval('#powers button', b => b.length) >= 20);
  });
  await check('choosing a power opens its info', async () => {
    await page.click('#powers button:has-text("Borg")');
    await page.waitForSelector('#info.open');
    const txt = await page.textContent('#info');
    assert.match(txt, /Borg-Kollektiv/); assert.match(txt, /Unikomplex/); assert.match(txt, /Delta/);
  });
  await check('clicking empty space inside the Federation opens the Federation info', async () => {
    await page.click('#info-close');
    await page.evaluate(() => window.__map.flyTo([-900, 26600], { distance: 9000, tilt: 0.3 }));
    await settle(page); await sleep(400);
    const p = await page.evaluate(() => { for (let y = 380; y < 460; y += 6) for (let x = 560; x < 720; x += 6) { const g = window.__map.groundAt(x, y); if (!window.__map.pickAt(x, y) && g) return { x, y }; } return null; });
    assert.ok(p, 'no empty spot');
    await page.mouse.click(p.x, p.y);
    await page.waitForSelector('#info.open', { timeout: 4000 });
    assert.match(await page.textContent('#info-title'), /Föderation/i);
    await page.click('#info-close');
    await page.click('#tab-goals');
  });

  // ── 3D-Wahrzeichen ──
  await check('landmarks appear only when zoomed in', async () => {
    assert.ok(await page.evaluate(() => window.__map.landmarks.count) >= 8);
    await page.evaluate(() => { window.__map.select(null); window.__map.flyTo('ds9', { distance: 40000 }); });
    await settle(page); await sleep(400);
    assert.equal(await page.evaluate(() => window.__map.landmarks.visible('ds9')), false);
    await page.evaluate(() => window.__map.flyTo('ds9', { distance: 600 }));
    await settle(page); await sleep(800);
    assert.equal(await page.evaluate(() => window.__map.landmarks.visible('ds9')), true);
  });
  await shot(page, '11-landmark-ds9');

  // ── Qualitätsstufen zur Laufzeit ──
  await check('lowest runtime quality still renders the galaxy', async () => {
    await page.evaluate(() => { window.__map.select(null); window.__map.flyTo([0, 4000], { distance: 125000, tilt: 0.78 }); });
    await settle(page);
    await page.evaluate(() => window.__map.perf.setLevel(3));
    await sleep(800);
    const b = await brightness(page, 640, 400);
    assert.ok(b.lum > 30, `lum ${b.lum.toFixed(1)}`);
    await page.evaluate(() => window.__map.perf.setLevel(0));
  });

  // ── Steuerung ohne Drehen/Neigen ──
  await check('right-drag and ctrl-drag pan instead of rotating', async () => {
    await page.evaluate(() => { window.__map.select(null); window.__map.flyTo('sol', { distance: 9000 }); });
    await settle(page); await sleep(300);
    const s0 = await page.evaluate(() => window.__map.state());
    await page.mouse.move(640, 400); await page.mouse.down({ button: 'right' });
    await page.mouse.move(760, 360, { steps: 6 }); await page.mouse.up({ button: 'right' });
    await page.keyboard.down('Control'); await page.mouse.move(640, 400); await page.mouse.down();
    await page.mouse.move(700, 450, { steps: 6 }); await page.mouse.up(); await page.keyboard.up('Control');
    await sleep(200);
    const s1 = await page.evaluate(() => window.__map.state());
    assert.equal(s1.azimuth, s0.azimuth); assert.equal(s1.tilt, s0.tilt);
    assert.ok(Math.hypot(s1.target[0] - s0.target[0], s1.target[1] - s0.target[1]) > 1, 'did not pan');
  });
  await check('tilt follows the zoom automatically', async () => {
    const t = await page.evaluate(async () => {
      const m = window.__map; const out = [];
      for (const d of [125000, 600]) { m.flyTo('sol', { distance: d }); await new Promise(r => { const w = () => (m.state().flying ? requestAnimationFrame(w) : r()); w(); }); out.push(m.effectiveTilt()); }
      return out;
    });
    assert.ok(t[0] > 0.6, `far tilt ${t[0]}`); assert.ok(t[1] < 0.05, `near tilt ${t[1]}`);
    assert.equal(await page.$('#reset-view') !== null, false, 'reset/rotate button still there');
  });
}
