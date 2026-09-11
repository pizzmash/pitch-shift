import type { AudioRequest, AudioState } from './shared';
let context: AudioContext | undefined;
let stream: MediaStream | undefined;
let node: AudioWorkletNode | undefined;
let state: AudioState = { tabId: null, pitch: 0 };
async function stop() {
  const oldContext = context;
  stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
  node?.disconnect();
  context = undefined; stream = undefined; node = undefined;
  state = { tabId: null, pitch: 0 };
  await oldContext?.close();
}
async function handle(message: AudioRequest) {
  if (message.action === 'stop') await stop();
  if (message.action === 'start') {
    await stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: message.streamId } } as MediaTrackConstraints, video: false });
      context = new AudioContext();
      await context.audioWorklet.addModule('worklet.js');
      node = new AudioWorkletNode(context, 'pitchshift', { outputChannelCount: [2] });
      node.onprocessorerror = () => { void stop(); };
      node.port.postMessage(message.value);
      context.createMediaStreamSource(stream).connect(node).connect(context.destination);
      await context.resume();
      stream.getTracks().forEach(track => { track.onended = () => { void stop(); }; });
      state = { tabId: message.tabId!, pitch: message.value! };
    } catch (error) { await stop(); throw error; }
  }
  if (message.action === 'pitch') {
    if (!node) throw new Error('音声処理が終了しました。もう一度キーを変更してください。');
    node.port.postMessage(message.value); state.pitch = message.value!;
  }
  return state;
}
chrome.runtime.onMessage.addListener((message: AudioRequest, sender, respond) => {
  if (message?.target !== 'offscreen' || sender.id !== chrome.runtime.id) return;
  void handle(message).then(state => respond({ ok: true, state }), error => respond({ ok: false, error: String(error) }));
  return true;
});
