import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdtemp, rm, cp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const profile = await mkdtemp(`${tmpdir()}/pitchshift-smoke-`);
// Grant the local fixture access in a disposable test copy only. Production
// continues to require the user's action via activeTab, with no host permissions.
const extension = resolve(profile, 'extension');
await cp(resolve('dist'), extension, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json'), 'utf8'));
manifest.host_permissions = ['https://www.youtube.com/*'];
await writeFile(resolve(extension, 'manifest.json'), JSON.stringify(manifest));
const context = await chromium.launchPersistentContext(profile, { executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(), headless: true, args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
try {
 const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
 const id = new URL(worker.url()).host;
 const page = await context.newPage();
 await page.goto(`chrome-extension://${id}/popup.html`);
 await page.locator('#message.error').waitFor();
 assert.equal(await page.locator('#rewind').isDisabled(), true);
 // Real scripting API against a deterministic video page, not a Chrome API mock.
 await context.route('https://www.youtube.com/**', route => route.fulfill({
   contentType: 'text/html', body: '<title>Regression video - YouTube</title><video class="html5-main-video"></video>'
 }));
 const videoPage = await context.newPage();
 await videoPage.goto('https://www.youtube.com/watch?v=pitchshift-test');
 const tabId = await worker.evaluate(async () => (await chrome.tabs.query({url:'https://www.youtube.com/*'}))[0].id);
 const request = (action, value) => page.evaluate(({tabId, action, value}) => chrome.runtime.sendMessage({target:'background',tabId,action,value}), {tabId,action,value});
 const initial = await request('status');
 assert.equal(initial.ok, true, initial.error);
 assert.deepEqual(initial.state, {pitch:0,speed:1,title:'Regression video'});
 const changed = await request('speed', 0.75);
 assert.equal(changed.ok, true, changed.error);
 assert.equal(await videoPage.locator('video').evaluate(video => video.playbackRate), 0.75);
 const reset = await request('reset');
 assert.equal(reset.ok, true, reset.error);
 assert.equal(reset.state.speed, 1);
 assert.equal(await videoPage.locator('video').evaluate(video => video.playbackRate), 1);
 console.log('Real scripting API: status without value, speed, and reset without value passed.');
 const state = await worker.evaluate(async () => {
  await chrome.offscreen.createDocument({ url:'offscreen.html', reasons:['USER_MEDIA'], justification:'Smoke test audio document messaging' });
  const response = await chrome.runtime.sendMessage({target:'offscreen',action:'status'});
  await chrome.offscreen.closeDocument();
  return response;
 });
 assert.deepEqual(state, {ok:true,state:{tabId:null,pitch:0}});
 const frequency = await page.evaluate(async () => {
   const audio = new OfflineAudioContext(2, 48000, 48000);
   await audio.audioWorklet.addModule('worklet.js');
   const pitch = new AudioWorkletNode(audio, 'pitchshift', {outputChannelCount:[2]});
   pitch.port.postMessage(12);
   const oscillator = audio.createOscillator(); oscillator.frequency.value = 440;
   oscillator.connect(pitch).connect(audio.destination); oscillator.start();
   const result = (await audio.startRendering()).getChannelData(0);
   let crossings=0;
   for(let i=24001;i<48000;i++) if(result[i-1]<=0 && result[i]>0) crossings++;
   return crossings*2;
 });
 assert.ok(Math.abs(frequency - 880) < 30, `Worklet octave output: ${frequency}Hz`);
 console.log(`Real AudioWorklet rendered 440Hz → ${frequency}Hz at +12 semitones.`);
 console.log('Real MV3 extension loaded; service worker, popup and offscreen messaging passed.');
} finally { await context.close(); await rm(profile,{recursive:true,force:true}); }
