import { PitchShifter } from './dsp';
declare const sampleRate: number;
declare class AudioWorkletProcessor { port: MessagePort; }
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;
class PitchProcessor extends AudioWorkletProcessor {
  private shifter = new PitchShifter(sampleRate);
  constructor() { super(); this.port.onmessage = event => { if (Number.isFinite(event.data)) this.shifter.setPitch(event.data); }; }
  process(inputs: Float32Array[][], outputs: Float32Array[][]) { this.shifter.process(inputs[0] ?? [], outputs[0]); return true; }
}
registerProcessor('pitchshift', PitchProcessor);
