import { Mp3Encoder } from '@breezystack/lamejs';

// Encodes off the main thread so the synth keeps animating while an MP3 is built.
self.onmessage = (e: MessageEvent<{ left: Float32Array; right: Float32Array; sampleRate: number; kbps: number }>) => {
  const { left, right, sampleRate, kbps } = e.data;
  const toI16 = (f: Float32Array) => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = Math.max(-1, Math.min(1, f[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };
  const l = toI16(left);
  const r = toI16(right);
  const enc = new Mp3Encoder(2, sampleRate, kbps);
  const parts: Uint8Array[] = [];
  const BLOCK = 1152;
  for (let i = 0; i < l.length; i += BLOCK) {
    const chunk = enc.encodeBuffer(l.subarray(i, i + BLOCK), r.subarray(i, i + BLOCK));
    if (chunk.length) parts.push(new Uint8Array(chunk));
    if ((i / BLOCK) % 64 === 0) self.postMessage({ progress: i / l.length });
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));
  self.postMessage({ done: new Blob(parts as BlobPart[], { type: 'audio/mpeg' }) });
};
