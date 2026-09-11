import { validYoutube, type Request, type AudioRequest, type AudioState } from './shared';
import { controlVideo } from './video';
const hasAudio = async () => (await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] })).length > 0;
const audio = async (message: Omit<AudioRequest, 'target'>): Promise<AudioState> => {
  const reply = await chrome.runtime.sendMessage({ ...message, target: 'offscreen' });
  if (!reply?.ok) throw new Error(reply?.error || '音声処理に接続できませんでした。');
  return reply.state;
};
async function handle(request: Request) {
  const tab = await chrome.tabs.get(request.tabId);
  if (!validYoutube(tab.url || '')) throw new Error('YouTubeの動画タブでPitchShiftを開いてください。');
  if (!['status', 'pitch', 'speed', 'rewind', 'reset'].includes(request.action)) throw new Error('不明な操作です。');
  if (['pitch', 'speed', 'rewind'].includes(request.action) && !Number.isFinite(request.value)) throw new Error('値を確認してください。');
  let state: AudioState = await hasAudio() ? await audio({ action: 'status' }) : { tabId: null, pitch: 0 };
  const own = state.tabId === request.tabId;
  if (request.action === 'pitch' && state.tabId !== null && !own) throw new Error('別のタブでキーを変更中です。そのタブでキーを0に戻してからお試しください。');
  // Confirm that a playable video exists before acquiring audio.
  const [result] = await chrome.scripting.executeScript({ target: { tabId: request.tabId }, func: controlVideo, args: [request.action === 'pitch' ? 'status' : request.action, request.value] });
  if (!result?.result) throw new Error('動画に接続できませんでした。ページを再読み込みしてください。');
  if (request.action === 'pitch') {
    const pitch = Math.round(Math.min(12, Math.max(-12, request.value!)));
    if (pitch === 0) { if (own) state = await audio({ action: 'stop' }); }
    else if (own) state = await audio({ action: 'pitch', value: pitch });
    else {
      if (!await hasAudio()) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: [chrome.offscreen.Reason.USER_MEDIA], justification: 'Process YouTube tab audio locally for karaoke pitch adjustment.' });
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: request.tabId });
      state = await audio({ action: 'start', streamId, tabId: request.tabId, value: pitch });
    }
  }
  if (request.action === 'reset' && own) state = await audio({ action: 'stop' });
  return { ...result.result, pitch: state.tabId === request.tabId ? state.pitch : 0 };
}
// Serialize mutations so rapid clicks or two popups cannot acquire competing streams.
let queue: Promise<unknown> = Promise.resolve();
chrome.runtime.onMessage.addListener((request: Request, sender, respond) => {
  if (request?.target !== 'background' || sender.id !== chrome.runtime.id) return;
  queue = queue.then(() => handle(request)).then(state => respond({ ok: true, state }), error => respond({ ok: false, error: error instanceof Error ? error.message : '操作に失敗しました。' }));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
  queue = queue.then(async () => { if (await hasAudio() && (await audio({ action: 'status' })).tabId === tabId) await audio({ action: 'stop' }); }).catch(() => {});
});
