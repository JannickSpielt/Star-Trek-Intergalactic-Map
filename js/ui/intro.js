/** Ladebildschirm mit kurzer Eröffnungsfahrt in die Galaxie. */
const STEPS = ['Initialisiere Sensorgitter …', 'Lade Sternkataloge …', 'Kalibriere Subraum-Koordinaten …', 'Projiziere Territorien …', 'Bereit.'];

export function runIntro(map, finalView) {
  const el = document.getElementById('intro');
  if (!el || el.classList.contains('done')) return Promise.resolve();
  const bar = document.getElementById('intro-progress');
  const status = document.getElementById('intro-status');
  map.setCamera({ target: [9000, 16000], distance: 160000, azimuth: -0.9, tilt: 1.05 });
  return new Promise(resolve => {
    let i = 0, finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      clearInterval(timer);
      bar.style.width = '100%';
      el.classList.add('done');
      map.flyTo(finalView.target, { ...finalView, duration: 4200 });
      window.removeEventListener('keydown', finish);
      resolve();
    };
    const timer = setInterval(() => {
      status.textContent = STEPS[Math.min(i, STEPS.length - 1)];
      bar.style.width = `${Math.min(100, ((i + 1) / STEPS.length) * 100)}%`;
      if (++i > STEPS.length) finish();
    }, 420);
    document.getElementById('intro-skip').addEventListener('click', finish);
    el.addEventListener('click', finish);
    window.addEventListener('keydown', finish);
  });
}
