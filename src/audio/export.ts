import * as Tone from 'tone';
import { STEPS, bpmOf, useStore } from '../state/store';
import { buildGraph, playStep } from './graph';
import { toParams } from './sounds';
import { encodeWav } from './wav';

export type ExportFormat = 'wav' | 'mp3';
export interface ExportOptions {
  loops: number; // how many times the 16-step pattern repeats
  tail: boolean; // keep the echo/reverb ring-out after the last step
  format: ExportFormat;
}

const SR = 44100;
const PRE_ROLL = 0.05; // lets the compressor/limiter settle so the first kick isn't swallowed; trimmed afterwards
const TAIL = 2.5;
const FADE = 0.05;

export const exportSeconds = ({ loops, tail }: Pick<ExportOptions, 'loops' | 'tail'>) =>
  loops * STEPS * (60 / bpmOf(useStore.getState().macros.speed) / 4) + (tail ? TAIL : 0.2);

/** Renders the current pattern offline through the same graph as live playback (so it sounds identical). */
export async function renderAudio({ loops, tail }: Pick<ExportOptions, 'loops' | 'tail'>): Promise<AudioBuffer> {
  const st = useStore.getState();
  const bpm = bpmOf(st.macros.speed);
  const stepDur = 60 / bpm / 4;
  const len = loops * STEPS * stepDur;
  const buf = await Tone.Offline(
    async ({ transport }) => {
      const g = buildGraph(toParams(st.soundIndex, st.macros));
      g.setVolume(st.macros.volume);
      await g.ready;
      transport.bpm.value = bpm;
      new Tone.Sequence((time, step) => playStep(g, st, step, time, stepDur), [...Array(STEPS).keys()], '16n').start(0).stop(len);
      transport.start(PRE_ROLL);
    },
    PRE_ROLL + exportSeconds({ loops, tail }),
    2,
    SR,
  );
  const src = buf.get()!;
  const skip = Math.round(PRE_ROLL * SR);
  const out = new AudioBuffer({ numberOfChannels: 2, length: src.length - skip, sampleRate: SR });
  const fade = Math.round(FADE * SR);
  for (let c = 0; c < 2; c++) {
    const data = src.getChannelData(c).slice(skip);
    for (let i = 0; i < fade; i++) data[data.length - 1 - i] *= i / fade; // no click at the cut
    out.copyToChannel(data, c);
  }
  return out;
}

function encodeMp3(b: AudioBuffer, onProgress: (p: number) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./mp3.worker.ts', import.meta.url), { type: 'module' });
    const left = b.getChannelData(0).slice();
    const right = b.getChannelData(1).slice();
    worker.onmessage = (e: MessageEvent<{ progress?: number; done?: Blob }>) => {
      if (e.data.progress !== undefined) onProgress(e.data.progress);
      if (e.data.done) {
        worker.terminate();
        resolve(e.data.done);
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'MP3 encoding failed'));
    };
    worker.postMessage({ left, right, sampleRate: b.sampleRate, kbps: 192 }, [left.buffer, right.buffer]);
  });
}

/** Render + encode. Progress: 0–0.5 rendering, 0.5–1 encoding. */
export async function exportFile(opts: ExportOptions, onProgress: (p: number) => void = () => {}) {
  onProgress(0.05);
  const audio = await renderAudio(opts);
  onProgress(0.5);
  const blob = opts.format === 'wav' ? encodeWav(audio) : await encodeMp3(audio, (p) => onProgress(0.5 + p * 0.5));
  onProgress(1);
  const bpm = bpmOf(useStore.getState().macros.speed);
  return { blob, name: `hex16-${bpm}bpm-${opts.loops}x.${opts.format}`, seconds: audio.duration };
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
