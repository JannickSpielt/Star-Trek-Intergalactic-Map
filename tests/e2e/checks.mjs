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
}
