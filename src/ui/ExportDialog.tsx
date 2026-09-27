import { useState } from 'react';
import { download, exportFile, exportSeconds, type ExportFormat } from '../audio/export';

const LOOPS = [1, 2, 4, 8];

/** Export the current beat as WAV or MP3 (rendered offline, so it's glitch-free and faster than real time). */
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const [loops, setLoops] = useState(4);
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [tail, setTail] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    setProgress(0);
    try {
      const { blob, name } = await exportFile({ loops, tail, format }, setProgress);
      download(blob, name);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
      setProgress(null);
    }
  };

  return (
    <div className="overlay" onClick={progress === null ? onClose : undefined}>
      <div className="help" role="dialog" aria-label="Export" onClick={(e) => e.stopPropagation()}>
        <h2>Export your beat</h2>
        <fieldset>
          <legend>Length</legend>
          {LOOPS.map((n) => (
            <label key={n}>
              <input type="radio" name="loops" checked={loops === n} onChange={() => setLoops(n)} /> {n}× loop ({exportSeconds({ loops: n, tail: false }).toFixed(0)}s)
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Format</legend>
          <label>
            <input type="radio" name="format" checked={format === 'wav'} onChange={() => setFormat('wav')} /> WAV (best quality)
          </label>
          <label>
            <input type="radio" name="format" checked={format === 'mp3'} onChange={() => setFormat('mp3')} /> MP3 (small, easy to share)
          </label>
        </fieldset>
        <label className="check">
          <input type="checkbox" checked={tail} onChange={(e) => setTail(e.target.checked)} /> Let the echo ring out at the end
        </label>
        {progress !== null && <progress value={progress} max={1} />}
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button onClick={onClose} disabled={progress !== null}>
            Cancel
          </button>
          <button className="primary" onClick={run} disabled={progress !== null}>
            {progress === null ? 'Export' : 'Exporting…'}
          </button>
        </div>
      </div>
    </div>
  );
}
