import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

/**
 * Drives the console home page the way a player would (keyboard, then a standard controller)
 * and checks that every screen stays inline, focus lands where a player expects, preferences
 * persist, legacy links still resolve, and the layout fits the screen at common sizes.
 * Screenshots land in .cache/console-qa for a visual pass.
 */
const url = process.env.CONSOLE_URL || 'http://localhost:4321/console/';
const origin = new URL(url).origin;
const output = '.cache/console-qa';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const failures = [];
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  const page = await browser.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failures.push(`${response.status()} ${response.url()}`); });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const state = () => page.evaluate(() => ({
    view: document.body.dataset.view, category: document.body.dataset.category, hash: location.hash, active: document.activeElement.id,
    boot: !document.getElementById('boot').hidden, phase: document.getElementById('boot').dataset.phase,
  }));
  const view = name => page.waitForFunction(v => document.body.dataset.view === v, {}, name);
  const shot = async name => { await pause(700); await page.screenshot({ path: `${output}/${name}.png` }); };
  const press = async (key, times = 1) => { for (let i = 0; i < times; i++) await page.keyboard.press(key); };
  let current;

  // Startup.
  await page.goto(url, { waitUntil: 'networkidle0' });
  current = await state();
  check('First visit shows the startup screen', current.boot && ['waiting', 'playing'].includes(current.phase));
  check('Nothing on the page is a dialog or popup', await page.evaluate(() => !document.querySelector('dialog, [role="dialog"], [aria-modal]')));
  check('No console-maker branding leaks into the page', await page.evaluate(() => !/playstation|sony|dualsense|xross/i.test(document.documentElement.outerHTML)));
  await page.screenshot({ path: `${output}/intro.png` });
  if (current.phase === 'waiting') {
    await page.mouse.click(720, 200);
    await page.waitForFunction(() => document.getElementById('boot').dataset.phase === 'playing');
    check('Clicking anywhere on the startup screen begins the sequence', true);
  }
  await pause(1800);
  await page.screenshot({ path: `${output}/intro-playing.png` });
  await press('Enter');
  await page.waitForFunction(() => document.getElementById('boot').hidden);
  check('Enter skips the startup and lands on the first game', (await state()).active === 'item-game-0');
  await shot('home');

  // Library: rail, category bar, artwork.
  await press('ArrowDown');
  current = await state();
  check('Down moves along the rail', current.active === 'item-game-1' && current.hash === '#library/games/game-1');
  await page.waitForFunction(() => document.body.classList.contains('has-art') && [...document.querySelectorAll('.world-art')].some(el => el.classList.contains('is-visible') && el.style.backgroundImage.includes('game-1')));
  check('Artwork follows the selection', true);
  await shot('game');
  check('The rail has no scrollbar and slides the list instead', await page.evaluate(() => getComputedStyle(document.getElementById('item-rail')).overflowY === 'clip' && /translateY\(-?\d+px\)/.test(document.getElementById('rail-track').style.transform)));
  const railShift = () => page.$eval('#rail-track', el => parseFloat(el.style.transform.replace(/[^-\d.]/g, '')));
  const shiftBefore = await railShift();
  await press('ArrowDown');
  check('Moving down slides the list up and keeps the selection anchored', (await railShift()) < shiftBefore && (await state()).active === 'item-game-2');
  await press('ArrowUp');
  await press('ArrowUp', 2);
  check('Up past the first item reaches the category bar', (await state()).active === 'category-games');
  await press('ArrowRight');
  current = await state();
  check('Right on the category bar switches category and keeps the bar focused', current.category === 'plugins' && current.active === 'category-plugins');
  check('Switching category animates the rail in', await page.evaluate(() => document.getAnimations().some(a => a.animationName === 'rail-enter')));
  await press('ArrowDown');
  check('Down from the category bar enters the rail', (await state()).active === 'item-plugin-0');
  await shot('plugins');
  await press('ArrowRight');
  current = await state();
  check('Right on the rail switches category and focuses its item', current.category === 'creations' && current.active === 'item-polyglyph');
  await press('ArrowLeft');
  await press('End');
  check('End reaches the last plugin', (await state()).active === 'item-plugin-4');
  await press('Home');
  check('Home reaches the first plugin', (await state()).active === 'item-plugin-0');

  // Project screen.
  await press('Enter');
  await view('project');
  current = await state();
  check('Enter opens the project screen with its primary action focused', current.active === 'project-link' && current.hash === '#project/plugin-0');
  check('Plugin projects link to their documentation', await page.$eval('#project-link', el => el.getAttribute('href') === '/Plugins/CascadeCombatSystem'));
  check('The project screen is inline with a back control', await page.evaluate(() => !document.getElementById('screen-topbar').hidden && document.getElementById('library-screen').hidden));
  check('Screens hide their scrollbars', await page.evaluate(() => [...document.querySelectorAll('.app-screen')].every(s => getComputedStyle(s).scrollbarWidth === 'none')));
  await shot('project');
  await press('Escape');
  await view('library');
  check('Escape returns to the library and restores focus', (await state()).active === 'item-plugin-0');

  // Profile.
  await page.click('.system-header [data-open="profile"]');
  await view('profile');
  check('Profile opens on the overview tab', (await state()).active === 'profile-tab-overview');
  await shot('profile');
  await press('ArrowRight');
  current = await state();
  check('Right switches profile tabs', current.hash === '#profile/career' && current.active === 'profile-tab-career');
  await press('ArrowDown');
  check('Down from the tabs reaches the career list', await page.evaluate(() => !!document.activeElement.closest('.company-list')));
  await press('ArrowDown');
  check('Moving along the studios shows each one without confirming', await page.evaluate(() => document.activeElement.dataset.career === document.querySelector('[data-career-panel]:not([hidden])').dataset.careerPanel && document.activeElement.dataset.career !== '0'));
  await shot('career');
  await press('Escape');
  await view('library');

  // Journal.
  await page.evaluate(() => { location.hash = '#journal/journal-0'; });
  await view('journal');
  current = await state();
  check('Journal opens on its first photograph with the controls focused', current.active === 'photo-next' && await page.$eval('#photo-position', el => el.textContent === '1 / 4'));
  await press('ArrowRight');
  check('Right moves to the next photograph', await page.$eval('#photo-position', el => el.textContent === '2 / 4'));
  check('The photograph backdrop matches the photograph', await page.evaluate(() => document.getElementById('journal-backdrop').getAttribute('src') === document.getElementById('journal-image').getAttribute('src')));
  await page.waitForFunction(() => document.getElementById('journal-image').complete);
  await shot('journal');
  await press('Escape');
  await view('library');

  // Search.
  await page.click('.system-header [data-open="search"]');
  await view('search');
  check('Search focuses its field', (await state()).active === 'library-search');
  await page.type('#library-search', 'Dakar');
  check('Search filters the whole library', await page.evaluate(() => [...document.querySelectorAll('[data-search-item]')].filter(el => !el.hidden).length === 1));
  await shot('search');
  await press('ArrowDown');
  await press('Enter');
  await view('project');
  current = await state();
  check('A search result opens its project', current.hash === '#project/game-0' && current.category === 'games');
  check('Game projects link to the store in a new tab', await page.$eval('#project-link', el => el.href.includes('/1839940/') && el.target === '_blank'));
  await shot('project-game');
  await press('Escape');
  await view('search');
  check('Back from a project returns to the search with the query kept', await page.$eval('#library-search', el => el.value === 'Dakar'));
  await page.evaluate(() => { document.getElementById('library-search').value = ''; });
  await page.type('#library-search', 'zzzznoresults');
  check('An empty search explains itself', await page.$eval('#search-empty', el => !el.hidden));
  await press('Escape');
  await view('library');

  // Contact.
  await page.click('.control-bar [data-open="contact"]');
  await view('contact');
  check('Contact focuses the email address', (await state()).active === 'email-link');
  await shot('contact');
  await press('Escape');
  await view('library');

  // Settings and persistence.
  await page.click('.system-header [data-open="settings"]');
  await view('settings');
  check('Settings focuses the first switch', (await state()).active === 'sound-setting');
  await page.click('#motion-setting');
  check('The motion switch stops animations', await page.evaluate(() => document.body.classList.contains('motion-off')));
  await page.focus('#sound-setting');
  await press('Enter');
  check('Enter toggles a settings switch', await page.$eval('#sound-setting', el => !el.checked));
  await shot('settings');
  await press('Escape');
  await view('library');
  await page.click('#home-control');
  current = await state();
  check('The home control returns to the first game', current.active === 'item-game-0' && current.category === 'games');
  await page.reload({ waitUntil: 'networkidle0' });
  check('The startup is skipped on a return visit', !(await state()).boot);
  check('Preferences persist on reload', await page.evaluate(() => document.body.classList.contains('motion-off') && !document.querySelector('#sound-setting').checked && document.querySelector('#sound-control').getAttribute('aria-pressed') === 'false'));
  await page.click('.system-header [data-open="settings"]');
  await page.click('#motion-setting');
  await page.click('#sound-setting');
  check('Preferences can be restored', await page.evaluate(() => !document.body.classList.contains('motion-off') && document.querySelector('#sound-setting').checked));
  await page.click('#replay-boot');
  await page.waitForFunction(() => !document.getElementById('boot').hidden);
  check('The startup can be replayed from settings', true);
  if ((await state()).phase === 'waiting') await page.mouse.click(720, 120);
  await page.waitForFunction(() => document.getElementById('boot').dataset.phase === 'playing');
  await pause(1900);
  await page.screenshot({ path: `${output}/intro-mark.png` });
  await pause(4900);
  await page.screenshot({ path: `${output}/intro-field.png` });
  await pause(720);
  await page.screenshot({ path: `${output}/intro-burst.png` });
  await page.waitForFunction(() => document.getElementById('boot').hidden, { timeout: 15000 });
  check('The startup finishes on its own and keeps the screen', (await state()).view === 'settings' && await page.$eval('#boot', el => el.style.opacity === ''));
  await press('Escape');
  await view('library');

  // Controller.
  await page.click('#home-control');
  await page.evaluate(() => {
    window.testPad = { connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.testPad], configurable: true });
  });
  await pause(80);
  check('A standard controller is detected', await page.$eval('#controller-status', el => el.textContent.includes('Controller connected')));
  const padPress = async index => {
    await page.evaluate(i => { window.testPad.buttons[i].pressed = true; }, index);
    await pause(70);
    await page.evaluate(i => { window.testPad.buttons[i].pressed = false; }, index);
    await pause(70);
  };
  await padPress(13);
  check('The D-pad moves along the rail', (await state()).active === 'item-game-1');
  await padPress(5);
  check('The right shoulder switches category', (await state()).category === 'plugins');
  await padPress(4);
  check('The left shoulder switches back', (await state()).category === 'games');
  await padPress(0);
  await view('project');
  check('The confirm button opens the project', true);
  await padPress(1);
  await view('library');
  check('The back button returns to the library', (await state()).active === 'item-game-1');
  await padPress(9);
  await view('settings');
  check('The options button opens settings', true);
  await padPress(9);
  await view('library');
  check('The options button closes settings again', (await state()).active === 'item-game-1');
  await page.evaluate(() => { window.testPad.axes[1] = -0.8; });
  await pause(70);
  await page.evaluate(() => { window.testPad.axes[1] = 0; });
  await pause(70);
  check('The left stick moves along the rail', (await state()).active === 'item-game-0');
  await page.evaluate(() => { window.testPad.connected = false; });
  await pause(80);
  check('Disconnecting the controller returns the keyboard status', await page.$eval('#controller-status', el => el.textContent.includes('Keyboard ready')));

  // Layout.
  const layouts = [];
  for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720], [1920, 1080], [2560, 1440], [390, 844], [320, 740]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.click('#home-control');
    await page.evaluate(() => window.scrollTo(0, 0));
    await pause(350);
    const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
    check(`No horizontal overflow at ${width}px`, layout.scrollWidth === width);
    if (width >= 1000) check(`Home fits the ${width} by ${height} screen`, layout.scrollHeight === height);
    layouts.push(layout);
    await page.screenshot({ path: `${output}/home-${width}.png`, fullPage: true });
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  for (const [name, hash] of [['mobile-project', '#project/game-0'], ['mobile-profile', '#profile/overview'], ['mobile-journal', '#journal/journal-0'], ['mobile-settings', '#settings']]) {
    await page.evaluate(h => { location.hash = h; }, hash);
    await pause(500);
    check(`No horizontal overflow on ${name}`, await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  await page.setViewport({ width: 1280, height: 640, deviceScaleFactor: 1 });
  await page.evaluate(() => { location.hash = '#profile/career'; });
  await view('profile');
  await pause(300);
  check('A screen that continues below shows the cue instead of a scrollbar', await page.evaluate(() => { const s = document.getElementById('screen-profile'); return s.scrollHeight > s.clientHeight + 6 && s.classList.contains('more-below') && !document.getElementById('scroll-hint').hidden; }));
  await page.evaluate(() => { const s = document.getElementById('screen-profile'); s.scrollTo({ top: s.scrollHeight, behavior: 'instant' }); });
  await pause(120);
  check('The cue disappears at the end of the screen', await page.evaluate(() => !document.getElementById('screen-profile').classList.contains('more-below') && document.getElementById('scroll-hint').hidden));
  await page.screenshot({ path: `${output}/career-short.png` });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Reduced motion, legacy links, deep links.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('about:blank');
  await page.goto(url, { waitUntil: 'networkidle0' });
  check('Reduced motion skips the startup and stills the scene', await page.evaluate(() => document.getElementById('boot').hidden && document.body.classList.contains('motion-off')));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const open = async hash => { await page.goto('about:blank'); await page.goto(`${url}${hash}`, { waitUntil: 'networkidle0' }); return state(); };
  check('The legacy contact link opens contact', (await open('#contact')).view === 'contact');
  check('The legacy experience link opens the career tab', (await open('#experience')).view === 'profile' && await page.$eval('#profile-career', el => !el.hidden));
  check('The legacy building link opens the plugins', (await open('#building')).category === 'plugins');
  await open('#plugin-1');
  check('Deep links select the category and item', await page.evaluate(() => document.body.dataset.category === 'plugins' && document.getElementById('item-plugin-1').getAttribute('aria-selected') === 'true'));
  check('A deep-linked project opens directly', (await open('#project/game-2')).view === 'project' && await page.$eval('#project-title', el => el.textContent === 'Road Kings'));

  // Without JavaScript.
  const noScript = await browser.newPage();
  noScript.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failures.push(`${response.status()} ${response.url()}`); });
  await noScript.setJavaScriptEnabled(false);
  await noScript.goto(url, { waitUntil: 'networkidle0' });
  check('Contact remains available without JavaScript', await noScript.$('.no-script a[href^="mailto:"]'));
  check('Project links remain available without JavaScript', await noScript.evaluate(() => document.querySelectorAll('.no-script a[href^="http"], .no-script a[href^="/"]').length >= 20));
  check('No runtime errors or local asset failures', failures.length === 0);
  console.log(JSON.stringify({ checks, layouts, failures }, null, 2));
  await fs.writeFile(`${output}/results.json`, JSON.stringify({ checks, layouts, failures }, null, 2));
} catch (error) {
  console.error(`Failed after ${checks.length} checks: ${error.message}`);
  if (failures.length) console.error(failures.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
