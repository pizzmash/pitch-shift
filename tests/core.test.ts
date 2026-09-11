import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PitchShifter } from '../src/dsp';
import { validYoutube } from '../src/shared';
import { controlVideo } from '../src/video';

test('only exact HTTPS YouTube hosts are accepted', () => {
  assert.equal(validYoutube('https://www.youtube.com/watch?v=abc'), true);
  for (const url of ['https://youtube.com.attacker.test', 'http://youtube.com', 'https://music.youtube.com', 'bad']) assert.equal(validYoutube(url), false);
});
for (const rate of [44100, 48000]) for (const pitch of [-12, -5, 0, 7, 12]) test(`DSP ${pitch} semitones at ${rate} Hz`, () => {
  const dsp = new PitchShifter(rate); dsp.setPitch(pitch);
  const rendered: number[] = [];
  for (let offset = 0; offset < rate * 2; offset += 128) {
    const input = Float32Array.from({ length: 128 }, (_, i) => Math.sin(2 * Math.PI * 440 * (offset + i) / rate));
    const output = [new Float32Array(128), new Float32Array(128)];
    dsp.process([input, input], output);
    assert.deepEqual(output[0], output[1]);
    assert.ok(output[0].every(x => Number.isFinite(x) && Math.abs(x) <= 1.001));
    if (offset >= rate) rendered.push(...output[0]);
  }
  let crossings = 0;
  for (let i = 1; i < rendered.length; i++) if (rendered[i-1] <= 0 && rendered[i] > 0) crossings++;
  const measured = crossings * rate / rendered.length;
  const expected = 440 * 2 ** (pitch / 12);
  assert.ok(Math.abs(measured - expected) / expected < 0.03, `${measured} expected ${expected}`);
});
test('video controls preserve pitch, clamp speed and respect seekable ranges', () => {
  const video = { playbackRate: 1, preservesPitch: false, currentTime: 12, seekable: { length: 1, start: () => 5, end: () => 100 } };
  Object.assign(globalThis, { document: { title: 'Practice - YouTube', querySelector: () => video } });
  assert.equal(controlVideo('speed', 0.75).speed, 0.75); assert.equal(video.preservesPitch, true);
  controlVideo('rewind', 30); assert.equal(video.currentTime, 5);
  controlVideo('speed', 99); assert.equal(video.playbackRate, 2);
  controlVideo('reset'); assert.equal(video.playbackRate, 1);
  video.seekable.length = 0; assert.throws(() => controlVideo('rewind', 10), /巻き戻せません/);
  Object.assign(globalThis, { document: { querySelector: () => null } });
  assert.throws(() => controlVideo('status'), /動画を開いて/);
});
