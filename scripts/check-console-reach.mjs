import puppeteer from 'puppeteer';

/**
 * Plays the console with nothing but a direction pad and the two face buttons, the way it is
 * meant to be used, and checks that everything a player can see they can also reach: every
 * entry in a list, every cell in a grid, the bands above and below the content, and a way back
 * out of every screen. Presses are repeated the way a player would repeat them, because a press
 * that scrolls a long screen is a move even though focus has not landed anywhere new yet.
 */
const url = process.env.CONSOLE_URL || 'http://localhost:4321/console/';
const browser = await puppeteer.launch({ headless: true });
const problems = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const note = (name, ok, detail) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) problems.push(`${name}${detail ? `: ${detail}` : ''}`);
};

try {
  const page = await browser.newPage();
  page.on('pageerror', error => problems.push(`page error: ${error.message}`));
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (await page.$eval('#boot', el => !el.hidden)) {
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('boot').hidden, { timeout: 20000 });
  }
  await pause(400);

  const focused = () => page.evaluate(() => document.activeElement?.id || '(none)');
  const view = () => page.evaluate(() => document.body.dataset.view);
  const open = async hash => {
    await page.evaluate(h => { location.hash = h; }, hash);
    await page.waitForFunction(h => location.hash === h, {}, hash);
    await pause(550);
  };
  /** Presses until focus lands somewhere new, since a press may scroll a long screen first. */
  const step = async key => {
    const before = await focused();
    for (let attempt = 0; attempt < 6; attempt++) {
      await page.keyboard.press(key);
      await pause(90);
      const now = await focused();
      if (now !== before) return now;
    }
    return before;
  };
  const walk = async (key, presses) => { let last = ''; for (let i = 0; i < presses; i++) last = await step(key); return last; };

  const items = await page.evaluate(() => {
    const data = JSON.parse(document.getElementById('library-data').textContent);
    const byCategory = {};
    for (const item of data.items) (byCategory[item.category] ||= []).push(item.id);
    return byCategory;
  });

  // Every entry in every category rail, walked end to end the way a player scrolls it.
  for (const [category, ids] of Object.entries(items)) {
    await open(`#library/${category}/${ids[0]}`);
    await page.evaluate(id => document.getElementById(`item-${id}`).focus(), ids[0]);
    const seen = new Set([await focused()]);
    for (let i = 0; i < ids.length + 4; i++) seen.add(await step('ArrowDown'));
    const missed = ids.filter(id => !seen.has(`item-${id}`));
    note(`rail reaches every ${category} entry (${ids.length})`, !missed.length, missed.join(', '));
  }

  // The panel beside the rail describes the selection, and its actions have to be reachable.
  await open('#library/games/game-0');
  await page.evaluate(() => document.getElementById('item-game-0').focus());
  const intoPanel = await step('ArrowRight');
  const onPanel = await page.evaluate(() => !!document.activeElement.closest('.feature'));
  note('the rail reaches the panel beside it', onPanel, `landed on ${intoPanel}`);
  if (onPanel) {
    const backToRail = await step('ArrowLeft');
    note('the panel returns to the rail', backToRail.startsWith('item-'), `landed on ${backToRail}`);
  }

  // Each screen has to connect upward to the system bar and downward to the control bar.
  const screens = [
    ['library', '#library/games/game-0'], ['project', '#project/game-0'], ['journal', '#journal/journal-0'],
    ['profile overview', '#profile/overview'], ['profile career', '#profile/career'], ['profile toolkit', '#profile/toolkit'],
    ['profile education', '#profile/education'], ['contact', '#contact'], ['settings', '#settings'], ['search', '#search'],
  ];
  for (const [name, hash] of screens) {
    await open(hash);
    const up = await walk('ArrowUp', 12);
    note(`${name} reaches the system bar`, await page.evaluate(() => !!document.activeElement.closest('.system-header')), `stopped at ${up}`);
    await open(hash);
    const down = await walk('ArrowDown', 18);
    note(`${name} reaches the control bar`, await page.evaluate(() => !!document.activeElement.closest('.control-bar')), `stopped at ${down}`);
  }

  // Grids are walked in both directions, so no cell is stranded.
  for (const [name, hash, selector] of [['toolkit', '#profile/toolkit', '.toolkit-grid a'], ['search results', '#search', '.search-result'], ['studios', '#profile/overview', '.profile-studio-strip button'], ['career', '#profile/career', '.company-option']]) {
    await open(hash);
    const ids = await page.evaluate(s => [...document.querySelectorAll(s)].filter(el => el.getClientRects().length).map(el => el.id), selector);
    if (!ids.length) { note(`${name} grid has cells`, false, 'none found'); continue; }
    await page.evaluate(id => document.getElementById(id).focus(), ids[0]);
    const seen = new Set([ids[0]]);
    for (const key of ['ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowRight']) {
      for (let i = 0; i < ids.length; i++) seen.add(await step(key));
    }
    const missed = ids.filter(id => !seen.has(id));
    note(`${name} grid reaches every cell (${ids.length})`, !missed.length, `${missed.length} missed`);
  }

  // Leaving: the keyboard's Escape and the controller's second face button both go back.
  for (const [name, hash] of screens.slice(1)) {
    await open(hash);
    await page.keyboard.press('Escape');
    await pause(700);
    note(`Escape leaves ${name}`, (await view()) === 'library', `landed on ${await view()}`);
  }
  await page.evaluate(() => {
    window.testPad = { connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.testPad], configurable: true });
  });
  await pause(150);
  const padPress = async index => {
    await page.evaluate(i => { window.testPad.buttons[i].pressed = true; }, index);
    await pause(90);
    await page.evaluate(i => { window.testPad.buttons[i].pressed = false; }, index);
    await pause(700);
  };
  for (const [name, hash] of screens.slice(1)) {
    await open(hash);
    await padPress(1);
    note(`the controller's back button leaves ${name}`, (await view()) === 'library', `landed on ${await view()}`);
  }
  // The shoulder buttons move between categories, and the options button opens the settings.
  await open('#library/games/game-0');
  await padPress(5);
  note('the right shoulder changes category', (await page.evaluate(() => document.body.dataset.category)) === 'plugins');
  await padPress(4);
  note('the left shoulder changes back', (await page.evaluate(() => document.body.dataset.category)) === 'games');
  await padPress(9);
  note('the options button opens the settings', (await view()) === 'settings');
} finally {
  await browser.close();
}

if (problems.length) { console.error(`\n${problems.length} problem(s):\n` + problems.join('\n')); process.exitCode = 1; }
else console.log('\nEverything is reachable with a pad, and every screen has a way back.');
