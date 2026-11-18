// Zusätzliche E2E-Prüfungen, nach Task gruppiert.
export default async function ({ page, check, assert, sleep, settle, brightness, shot }) {
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
    await page.click('#layers button:has-text("Reiche")');
    assert.equal(await page.evaluate(() => window.__map.layers.territories.visible), false);
    await page.click('#layers button:has-text("Reiche")');
    assert.equal(await page.evaluate(() => window.__map.layers.territories.visible), true);
  });
  await check('status bar shows quadrant at Sol', async () => {
    await page.evaluate(() => window.__map.flyTo('sol'));
    await settle(page); await sleep(300);
    const qt = await page.textContent("#readout-quadrant"); const st = await page.evaluate(() => window.__map.state()); assert.match(qt, /Beta/, `got "${qt}" target ${st.target} flying ${st.flying}`);
    assert.match(await page.textContent('#scale-label'), /LJ/);
  });
}
