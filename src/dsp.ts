/** Two overlapping variable-delay grains. Shared phase preserves stereo imaging. */
export class PitchShifter {
  private buffers: Float32Array[];
  private write = 0;
  private phase = 0;
  private ratio = 1;
  private target = 1;
  private readonly span: number;
  constructor(sampleRate: number, channels = 2) {
    this.span = Math.round(sampleRate * 0.08);
    this.buffers = Array.from({ length: channels }, () => new Float32Array(this.span + 256));
  }
  setPitch(semitones: number) { this.target = 2 ** (Math.max(-12, Math.min(12, semitones)) / 12); }
  process(input: Float32Array[], output: Float32Array[]) {
    const size = this.buffers[0].length;
    for (let i = 0; i < output[0].length; i++) {
      this.ratio += (this.target - this.ratio) * 0.002;
      this.phase = (this.phase + (1 - this.ratio) / this.span + 1) % 1;
      const p2 = (this.phase + 0.5) % 1;
      const weight = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.phase);
      for (let c = 0; c < output.length; c++) {
        const buffer = this.buffers[c % this.buffers.length];
        const sample = input[c]?.[i] ?? input[0]?.[i] ?? 0;
        buffer[this.write] = sample;
        const read = (phase: number) => {
          const position = (this.write - 2 - phase * this.span + size) % size;
          const index = Math.floor(position), fraction = position - index;
          return buffer[index] * (1 - fraction) + buffer[(index + 1) % size] * fraction;
        };
        output[c][i] = Math.abs(this.ratio - 1) < 0.00001 ? sample : read(this.phase) * weight + read(p2) * (1 - weight);
      }
      this.write = (this.write + 1) % size;
    }
  }
}
