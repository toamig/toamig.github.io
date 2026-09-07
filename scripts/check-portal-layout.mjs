import puppeteer from 'puppeteer';

/**
 * Sweeps the viewport widths the site actually meets and checks the playroom holds together:
 * the caption is never painted over by the handheld, every point inside the shell silhouette
 * enters the console, and nothing spills sideways.
 */
const url = process.env.PORTAL_URL || 'http://localhost:4321/';
const browser = await puppeteer.launch({ headless: true });
const problems = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => problems.push(`page error: ${error.message}`));
  for (const [width, height] of [[1920, 1080], [1600, 900], [1440, 900], [1280, 800], [1180, 800], [1100, 800], [1024, 700], [1000, 800], [950, 800], [860, 800], [800, 800], [740, 850], [700, 850], [640, 850], [560, 850], [480, 850], [430, 850], [390, 844], [360, 780], [320, 740]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`${url}#playroom`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 550));
    const report = await page.evaluate(() => {
      const room = document.getElementById('playroom');
      const flight = document.getElementById('device-flight');
      const caption = room.querySelector('.playroom-caption');
      const shell = caption.getBoundingClientRect();
      // Pieces of the shell are inset outside the flight box, so the painted extent is the
      // union of the flight and its outermost parts, not the flight rect alone.
      const painted = [flight, ...flight.querySelectorAll('.handheld-back, .handheld-face, .handheld-shoulder')]
        .map(el => el.getBoundingClientRect())
        .reduce((a, r) => ({ top: Math.min(a.top, r.top), bottom: Math.max(a.bottom, r.bottom), left: Math.min(a.left, r.left), right: Math.max(a.right, r.right) }),
                { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity });
      const capCovered = shell.top < painted.bottom - 1 && shell.bottom > painted.top + 1 && shell.left < painted.right - 1 && shell.right > painted.left + 1;
      const flightBox = flight.getBoundingClientRect();
      let enters = 0, dead = 0;
      for (const fy of [0.25, 0.45, 0.65, 0.8]) for (const fx of [0.2, 0.4, 0.6, 0.8]) {
        const el = document.elementFromPoint(flightBox.left + flightBox.width * fx, flightBox.top + flightBox.height * fy);
        if (el?.closest('[data-enter-console]')) enters++; else dead++;
      }
      return {
        capCovered, enters, dead,
        capBelowSection: Math.round(shell.bottom - room.getBoundingClientRect().bottom),
        // The shell is rotated in 3D and bleeds a few pixels past the viewport by design;
        // global.css clips that at the root, so what matters is the document's own flow.
        overflowX: document.body.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const flags = [];
    if (report.capCovered) flags.push('caption under device');
    if (report.dead) flags.push(`${report.dead}/16 dead click points`);
    if (report.capBelowSection > 0) flags.push(`caption ${report.capBelowSection}px past section`);
    if (report.overflowX > 0) flags.push(`horizontal overflow ${report.overflowX}px`);
    if (flags.length) problems.push(`${width}x${height}: ${flags.join(', ')}`);
    console.log(`${String(width).padStart(4)}x${height}  enters ${report.enters}/16  ${flags.length ? 'FAIL ' + flags.join(', ') : 'ok'}`);
  }
} finally {
  await browser.close();
}
if (problems.length) { console.error('\nProblems:\n' + problems.join('\n')); process.exitCode = 1; }
else console.log('\nAll widths clean.');
