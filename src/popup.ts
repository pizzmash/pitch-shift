import { clamp, validYoutube, type Action, type Reply, type State } from './shared';
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let tabId: number, state: State = { pitch: 0, speed: 1, title: '' }, ready = false, busy = false;
let seconds = 10;
const controls = element<HTMLFieldSetElement>('controls');
const message = element('message');
function notice(text: string, error = false) { message.textContent = text; message.classList.toggle('error', error); }
function render() {
  element('pitch-value').textContent = state.pitch > 0 ? `+${state.pitch}` : String(state.pitch);
  element('speed-value').textContent = state.speed.toFixed(2);
  element('pitch-meter').style.setProperty('--pitch', `${(state.pitch + 12) / 24 * 100}%`);
  element('track-title').textContent = state.title || 'YouTubeの動画を開いてください';
  controls.disabled = !ready || busy;
  for (const [id, disabled] of [['pitch-down', state.pitch <= -12], ['pitch-up', state.pitch >= 12], ['speed-down', state.speed <= 0.25], ['speed-up', state.speed >= 2]] as const) element<HTMLButtonElement>(id).disabled = disabled;
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === state.speed)));
  document.querySelectorAll<HTMLButtonElement>('[data-seconds]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.seconds) === seconds)));
  element<HTMLInputElement>('seconds').value = String(seconds);
  element('rewind-label').textContent = `${seconds}秒 巻き戻す`;
}
async function run(action: Action, value?: number) {
  if (busy) return;
  busy = true; render(); notice('反映しています…');
  try {
    const reply: Reply = await chrome.runtime.sendMessage({ target: 'background', action, value, tabId });
    if (!reply?.ok || !reply.state) throw new Error(reply?.error || '接続できませんでした。拡張を開き直してください。');
    state = reply.state; ready = true;
    notice(action === 'rewind' ? `${seconds}秒巻き戻しました。` : state.pitch === 0 ? '準備OK。歌いやすいキーに合わせましょう。' : 'キー変更中 · パネルを閉じても練習を続けられます。');
  } catch (error) { notice(error instanceof Error ? error.message : String(error), true); }
  finally { busy = false; render(); }
}
async function setSeconds(value: number) {
  seconds = clamp(Math.round(Number.isFinite(value) ? value : 10), 1, 60); render();
  try { await chrome.storage.local.set({ rewindSeconds: seconds }); } catch { notice('巻き戻し秒数を保存できませんでした。', true); }
}
element('pitch-down').onclick = () => void run('pitch', state.pitch - 1);
element('pitch-up').onclick = () => void run('pitch', state.pitch + 1);
element('pitch-zero').onclick = () => void run('pitch', 0);
element('speed-down').onclick = () => void run('speed', clamp(Math.round((state.speed - 0.05) * 100) / 100, 0.25, 2));
element('speed-up').onclick = () => void run('speed', clamp(Math.round((state.speed + 0.05) * 100) / 100, 0.25, 2));
element('rewind').onclick = () => void run('rewind', seconds);
element('reset').onclick = () => void run('reset');
element<HTMLInputElement>('seconds').onchange = event => void setSeconds((event.target as HTMLInputElement).valueAsNumber);
document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button => { button.onclick = () => void run('speed', Number(button.dataset.speed)); });
document.querySelectorAll<HTMLButtonElement>('[data-seconds]').forEach(button => { button.onclick = () => void setSeconds(Number(button.dataset.seconds)); });
async function init() {
  try {
    const saved = await chrome.storage.local.get('rewindSeconds');
    if (typeof saved.rewindSeconds === 'number' && Number.isFinite(saved.rewindSeconds)) seconds = clamp(Math.round(saved.rewindSeconds), 1, 60);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !validYoutube(tab.url || '')) throw new Error('YouTubeの動画タブでPitchShiftを開いてください。');
    tabId = tab.id; await run('status');
  } catch (error) { notice(error instanceof Error ? error.message : String(error), true); render(); }
}
void init();
