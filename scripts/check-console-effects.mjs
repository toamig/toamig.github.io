import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const url=process.env.CONSOLE_URL || 'http://localhost:4321/console/';
const browser=await puppeteer.launch({headless:true,args:['--autoplay-policy=document-user-activation-required']});
const checks=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const directory='.cache/console-qa';
await fs.mkdir(directory,{recursive:true});

try {
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:900});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(url,{waitUntil:'networkidle0'});
  check('Sound is enabled before the first interaction',await page.$eval('#boot-sound',el=>el.getAttribute('aria-pressed')==='true'));
  if (await page.$eval('#boot',el=>el.dataset.phase==='waiting')) await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.getElementById('boot').dataset.phase==='playing');
  await page.waitForFunction(()=>Number(document.getElementById('boot-canvas').dataset.time)>=5.8);
  check('The particle field uses the GPU',await page.$eval('#boot-canvas',el=>el.dataset.renderer==='webgl'));
  check('The startup audio is running with the picture',await page.evaluate(()=>document.documentElement.dataset.audioState==='running' && document.documentElement.dataset.startupAudio==='played'));
  await page.screenshot({path:`${directory}/effects-blue.png`});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenTime=Number(await page.$eval('#boot-canvas',el=>el.dataset.time));
  await pause(260);
  check('The particle renderer pauses when the page is hidden',hiddenTime===Number(await page.$eval('#boot-canvas',el=>el.dataset.time)));
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await pause(50);
  check('Returning to the page catches up to the sound playhead',Number(await page.$eval('#boot-canvas',el=>el.dataset.time))-hiddenTime>.25);
  const frameTimes=await page.evaluate(()=>new Promise(resolve=>{
    const samples=[];let previous=performance.now();
    const tick=now=>{samples.push(now-previous);previous=now;if(samples.length>=100)resolve(samples.slice(1));else requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }));
  await page.waitForFunction(()=>Number(document.getElementById('boot-canvas').dataset.time)>=8.75);
  await page.screenshot({path:`${directory}/effects-arrival.png`});
  await page.$eval('#boot-canvas',el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>document.getElementById('boot-canvas').dataset.renderer==='canvas');
  check('Losing the GPU context preserves the running sequence',Number(await page.$eval('#boot-canvas',el=>el.dataset.time))>=8.75);
  await page.waitForFunction(()=>document.getElementById('boot').hidden);
  const endTime=await page.$eval('#boot-canvas',el=>el.dataset.time);
  await pause(120);
  check('The startup renderer stops after the reveal',endTime===await page.$eval('#boot-canvas',el=>el.dataset.time));

  await page.keyboard.press('ArrowDown');await pause(65);
  const reversalJump=await page.evaluate(()=>{
    const position=()=>new DOMMatrix(getComputedStyle(document.getElementById('rail-track')).transform).m42;
    const before=position();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
    return Math.abs(position()-before);
  });
  check('Reversing the rail keeps its current position',reversalJump<2);
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
  await pause(750);
  check('Rapid inputs settle on the requested item',await page.evaluate(()=>document.activeElement.id==='item-game-3' && Math.abs(new DOMMatrix(getComputedStyle(document.getElementById('rail-track')).transform).m42-parseFloat(document.getElementById('rail-track').style.transform.replace(/[^-\d.]/g,'')))<.5));
  await page.mouse.move(210,450);await page.mouse.wheel({deltaY:100});await pause(180);
  check('The wheel advances one item without scrolling the page',await page.evaluate(()=>document.activeElement.id==='item-game-4' && scrollY===0));
  await page.click('.system-header [data-open="profile"]');await pause(600);
  check('Studio logos are visible on the profile landing screen',await page.evaluate(()=>{
    const strip=document.querySelector('.profile-studio-strip').getBoundingClientRect();
    return strip.bottom<document.querySelector('.control-bar').getBoundingClientRect().top && strip.top>0 && !document.getElementById('screen-profile').classList.contains('more-below');
  }));
  await page.screenshot({path:`${directory}/effects-profile.png`});

  await page.setViewport({width:390,height:844,hasTouch:true,isMobile:true});
  await page.click('#home-control');await pause(650);
  const rail=await page.$eval('#item-rail',el=>{const r=el.getBoundingClientRect();return {x:r.x+100,y:r.y+120};});
  const client=await page.createCDPSession();
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rail.x,y:rail.y}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rail.x,y:rail.y-45}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await pause(700);
  check('A vertical swipe advances the rail without a ghost click',await page.$eval('[data-item].is-selected',el=>el.dataset.item==='game-1'));

  const fallback=await browser.newPage();
  fallback.on('pageerror',error=>errors.push(error.message));
  await fallback.evaluateOnNewDocument(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'||type==='webgl'?null:original.call(this,type,...args);};
  });
  await fallback.goto(url,{waitUntil:'networkidle0'});
  if(await fallback.$eval('#boot',el=>el.dataset.phase==='waiting'))await fallback.keyboard.press('Enter');
  await fallback.waitForFunction(()=>document.getElementById('boot-canvas').dataset.renderer==='canvas');
  await fallback.waitForFunction(()=>Number(document.getElementById('boot-canvas').dataset.time)>6);
  check('The fallback draws visible particles when WebGL is unavailable',await fallback.$eval('#boot-canvas',el=>el.getContext('2d').getImageData(0,0,el.width,el.height).data.some((value,i)=>i%4!==3 && value>35)));
  await fallback.keyboard.press('Enter');await fallback.waitForFunction(()=>document.getElementById('boot').hidden);
  check('Skipping the fallback restores menu focus',await fallback.evaluate(()=>document.activeElement.id==='item-game-0' && !document.getElementById('os-shell').inert));

  const reduced=await browser.newPage();const effectsRequests=[];
  reduced.on('request',request=>{if(/console-boot-vfx|three\.js/.test(request.url()))effectsRequests.push(request.url());});
  await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await reduced.goto(url,{waitUntil:'networkidle0'});
  check('Reduced motion avoids downloading the GPU effects',effectsRequests.length===0 && await reduced.$eval('#boot',el=>el.hidden));
  check('No shader or runtime errors',errors.length===0);
  const sorted=frameTimes.sort((a,b)=>a-b);
  const results={checks,errors,frameMilliseconds:{median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]}};
  await fs.writeFile(`${directory}/effects-results.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} catch(error) {
  console.error(`Effects check failed after ${checks.length} checks: ${error.message}`);
  if(errors.length)console.error(errors.join('\n'));
  process.exitCode=1;
} finally { await browser.close(); }
