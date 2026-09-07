import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const url=process.env.PORTFOLIO_URL || 'http://localhost:4321/';
const browser=await puppeteer.launch({headless:true,args:['--autoplay-policy=document-user-activation-required']});
const directory='.cache/console-qa';
const checks=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await fs.mkdir(directory,{recursive:true});
try {
  const page=await browser.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(new URL(url).origin))errors.push(`${response.status()} ${response.url()}`);});
  await page.setViewport({width:1440,height:900});
  await page.goto(url,{waitUntil:'networkidle2'});
  check('The professional portfolio is the default homepage',await page.$('.front-page .hero-tagline') && !await page.$('#os-shell'));
  check('The hero offers a player entrance',await page.$('.hero-playroom-link[href="#playroom"]'));
  check('The professional content and contact links are preserved',await page.evaluate(()=>['about','experience','projects','building','technologies','education','contact'].every(id=>document.getElementById(id))));
  check('The console frame is lazy-loaded below the portfolio',await page.$eval('#console-frame',el=>!el.hasAttribute('src')));
  await page.screenshot({path:`directory/portal-hero.png`.replace('directory',directory)});
  await page.click('.hero-playroom-link');
  await page.waitForFunction(()=>document.getElementById('device-screen').classList.contains('is-ready'));
  await pause(700);
  await page.screenshot({path:`${directory}/portal-desktop.png`});
  let child=await (await page.$('#console-frame')).contentFrame();
  check('The handheld contains the real console route',child.url().includes('/console/?embedded=1'));
  check('The docked console is silent and inactive',await child.evaluate(()=>document.documentElement.dataset.docked==='true' && document.getElementById('os-shell').inert && !document.documentElement.dataset.audioState));
  const scrollBefore=await page.evaluate(()=>scrollY);
  await page.click('.playroom-enter');
  await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='entering');
  await pause(600);await page.screenshot({path:`${directory}/portal-zoom.png`});
  check('Entering expands the physical screen',await page.$eval('#device-flight',el=>new DOMMatrix(getComputedStyle(el).transform).a>1));
  check('The camera move scales the handheld render surface',await page.$eval('#console-frame',el=>el.clientWidth===1280&&el.clientHeight===720));
  await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='active');
  await child.waitForFunction(()=>document.getElementById('boot').dataset.phase==='playing');
  check('One click unlocks startup sound inside the screen',await child.evaluate(()=>document.documentElement.dataset.audioState==='running' && document.documentElement.dataset.startupAudio==='played'));
  check('Entry keeps the same console document alive',child===await(await page.$('#console-frame')).contentFrame());
  check('The legacy page is inert while the console is active',await page.evaluate(()=>document.querySelector('body > header').inert && getComputedStyle(document.documentElement).overflowY==='hidden'));
  // Once it is open the console gets the window itself. Scaling a fixed surface to cover the
  // window used to crop the system bar off the top and the control bar off the bottom.
  check('The open console fills the window exactly',await page.evaluate(()=>{const f=document.getElementById('console-frame').getBoundingClientRect();return f.x===0&&f.y===0&&Math.abs(f.width-innerWidth)<2&&Math.abs(f.height-innerHeight)<2;}));
  check('The open console lays out for the real window',await child.evaluate(()=>innerWidth===parent.innerWidth&&innerHeight===parent.innerHeight));
  check('Both of the console bars are inside the window',await child.evaluate(()=>document.querySelector('.system-header').getBoundingClientRect().top>=-1&&document.querySelector('.control-bar').getBoundingClientRect().bottom<=innerHeight+1));
  await page.keyboard.press('Enter');await child.waitForFunction(()=>document.getElementById('boot').hidden);
  await page.keyboard.press('ArrowDown');
  check('Keyboard input reaches the console after entry',await child.evaluate(()=>document.activeElement.id==='item-game-1'));
  await page.keyboard.press('Enter');await child.waitForFunction(()=>document.body.dataset.view==='project');
  await page.keyboard.press('Escape');await child.waitForFunction(()=>document.body.dataset.view==='library');
  check('Console Back restores the selected item',await child.evaluate(()=>document.activeElement.id==='item-game-1'));
  await child.click('.system-header [data-open="profile"]');
  await child.click('#portfolio-exit');
  await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');
  check('Return zooms out to the same portfolio position',Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<3);
  check('Returning restores keyboard focus and background interaction',await page.evaluate(()=>document.activeElement.matches('.playroom-enter') && !document.querySelector('body > header').inert));
  // Returning re-arms the dormant console, which reloads the frame, so take a fresh handle.
  await page.waitForFunction(()=>document.getElementById('device-screen').classList.contains('is-ready'));
  child=await (await page.$('#console-frame')).contentFrame();
  check('Returning readies a fresh dormant console',await child.evaluate(()=>document.documentElement.dataset.docked==='true' && document.body.dataset.view==='library'));
  await page.click('.playroom-enter');await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='active');
  child=await (await page.$('#console-frame')).contentFrame();
  await child.waitForFunction(()=>document.getElementById('boot').dataset.phase==='playing');
  check('Re-entering creates a fresh console intro',await child.evaluate(()=>document.body.dataset.view==='library'&&!document.getElementById('boot').hidden));
  await page.goBack();await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');
  check('Browser Back leaves the console in one step',await page.evaluate(()=>location.hash==='#playroom'));
  await page.goForward();await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='active');
  child=await (await page.$('#console-frame')).contentFrame();
  check('Browser Forward re-enters the console',await child.evaluate(()=>!document.documentElement.dataset.docked));
  // Forward re-enters through a reloaded frame, so a fresh startup is covering the screen.
  await child.waitForFunction(()=>document.getElementById('boot').dataset.phase==='playing');
  await page.keyboard.press('Enter');await child.waitForFunction(()=>document.getElementById('boot').hidden);
  // Dispatched inside the frame: the screen sits behind two nested scales, and synthesised
  // pointer coordinates do not survive that reliably once the frame has been reloaded.
  await child.evaluate(()=>document.getElementById('portfolio-exit').click());
  await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');
  check('Exiting after a forward navigation still returns to the portfolio',await page.evaluate(()=>location.hash==='#playroom'));

  await page.click('.playroom-enter');await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='entering');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');
  check('Escape can cancel the camera move without trapping the page',await page.evaluate(()=>!document.documentElement.classList.contains('portal-open')));

  await page.setViewport({width:390,height:844,hasTouch:true,isMobile:true});
  await page.$eval('#playroom',el=>el.scrollIntoView({block:'center',behavior:'instant'}));await pause(700);
  await page.waitForFunction(()=>document.getElementById('device-screen').classList.contains('is-ready'));
  child=await (await page.$('#console-frame')).contentFrame();
  check('The handheld fits a mobile viewport',await page.evaluate(()=>{const r=document.getElementById('device-flight').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && document.documentElement.scrollWidth===innerWidth;}));
  await page.screenshot({path:`${directory}/portal-mobile.png`});
  await page.click('.playroom-enter');await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='active');
  check('Entering on mobile hands the console the phone viewport',await child.evaluate(()=>innerWidth===parent.innerWidth && document.documentElement.scrollWidth===innerWidth));
  await child.waitForFunction(()=>document.getElementById('boot').dataset.phase==='playing');
  await page.keyboard.press('Enter');await child.waitForFunction(()=>document.getElementById('boot').hidden);
  await child.evaluate(()=>document.getElementById('portfolio-exit').click());await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');

  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.click('.playroom-enter');await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='active');
  child=await (await page.$('#console-frame')).contentFrame();
  check('Reduced motion still enters the console',await child.evaluate(()=>document.getElementById('boot').hidden));
  await child.evaluate(()=>document.getElementById('portfolio-exit').click());await page.waitForFunction(()=>document.getElementById('device-flight').dataset.portalState==='docked');
  await page.goto(`${url}#library/games/game-2`,{waitUntil:'networkidle2'});
  await page.waitForFunction(()=>location.pathname==='/console/');
  await page.waitForFunction(()=>document.getElementById('item-game-2')?.getAttribute('aria-selected')==='true');
  check('Existing console deep links still resolve',await page.evaluate(()=>document.getElementById('item-game-2').getAttribute('aria-selected')==='true'));
  const plain=await browser.newPage();await plain.setJavaScriptEnabled(false);
  await plain.goto(url,{waitUntil:'networkidle2'});
  check('The professional site and console link work without JavaScript',await plain.$('#contact a[href^="mailto:"]') && await plain.$('.playroom-enter[href="/console/"]'));
  check('No local asset failures or runtime errors',errors.length===0);
  await fs.writeFile(`${directory}/portal-results.json`,JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({checks,errors},null,2));
}catch(error){console.error(`Portal check failed after ${checks.length} checks:`,error);if(errors.length)console.error(errors.join('\n'));process.exitCode=1;}
finally{await browser.close();}
