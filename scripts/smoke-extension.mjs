import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const profile = await mkdtemp(`${tmpdir()}/pitchshift-smoke-`);
const extension = resolve('dist');
const context = await chromium.launchPersistentContext(profile, { executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(), headless: true, args: ['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
try {
 const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
 const id = new URL(worker.url()).host;
 const page = await context.newPage();
 await page.goto(`chrome-extension://${id}/popup.html`);
 await page.locator('#message.error').waitFor();
 assert.equal(await page.locator('#rewind').isDisabled(), true);
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
