import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server = createServer(async (req, res) => {
  try { const path = req.url === '/' ? '/popup.html' : req.url; const data = await readFile(`dist${path}`); res.setHeader('Content-Type', path.endsWith('.js') ? 'application/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html'); res.end(data); } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || chromium.executablePath(), headless: true, args: ['--no-sandbox'] });
try {
 const page = await browser.newPage({ viewport: { width: 370, height: 800 }, deviceScaleFactor: 2 });
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await page.addInitScript(() => {
   let state = { pitch: 0, speed: 1, title: 'カラオケ練習 / Acoustic session' };
   window.chrome = { storage: { local: { get: async () => ({}), set: async () => {} } }, tabs: { query: async () => [{ id: 1, url: 'https://www.youtube.com/watch?v=test' }] }, runtime: { sendMessage: async ({ action, value }) => {
    if (action === 'pitch') state.pitch = value;
    if (action === 'speed') state.speed = value;
    if (action === 'reset') { state.pitch = 0; state.speed = 1; }
    return { ok: true, state: { ...state } };
   } } };
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#controls:enabled').waitFor();
 await page.locator('#pitch-up').click(); assert.equal(await page.locator('#pitch-value').textContent(), '+1');
 await page.locator('[data-speed="0.75"]').click(); assert.equal(await page.locator('#speed-value').textContent(), '0.75');
 await page.locator('#seconds').fill('99'); await page.locator('#seconds').blur(); assert.equal(await page.locator('#seconds').inputValue(), '60');
 await page.locator('[data-seconds="10"]').click(); await page.locator('#rewind').click(); assert.match(await page.locator('#message').textContent(), /10秒巻き戻しました/);
 await page.locator('#reset').click(); assert.equal(await page.locator('#pitch-value').textContent(), '0'); assert.equal(await page.locator('#speed-value').textContent(), '1.00');
 for(let i=0;i<12;i++) await page.locator('#pitch-up').click(); assert.equal(await page.locator('#pitch-up').isDisabled(), true);
 await page.locator('#reset').click();
 assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 370), true);
 console.log('Popup height:', await page.evaluate(() => document.body.scrollHeight));
 await mkdir('docs', { recursive: true }); await page.screenshot({ path: 'docs/popup.png', fullPage: true });
 const unsupported = await browser.newPage();
 await unsupported.addInitScript(() => { window.chrome = {storage:{local:{get:async()=>({})}},tabs:{query:async()=>[{id:1,url:'https://example.com'}]}}; });
 await unsupported.goto(`http://127.0.0.1:${server.address().port}`);
 await unsupported.locator('#message.error').waitFor();
 assert.equal(await unsupported.locator('#rewind').isDisabled(), true);
 await page.evaluate(() => { chrome.runtime.sendMessage = async () => ({ok:false,error:'音声接続エラー'}); });
 await page.locator('#pitch-up').click();
 assert.equal(await page.locator('#pitch-value').textContent(), '0');
 assert.match(await page.locator('#message').textContent(), /音声接続エラー/);
 assert.equal(await page.locator('#reset').isEnabled(), true);
 assert.ok(await page.evaluate(() => document.body.scrollHeight <= 600), 'Popup fits Chrome height limit');
 assert.deepEqual(errors, []);
 console.log('Browser popup integration passed (Chrome API test double).');
} finally { await browser.close(); server.close(); }
