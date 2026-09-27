import { useEffect } from 'react';
import { Stage } from './scene/Stage';
import { installKeyboard } from './input/keyboard';
import { useStore } from './state/store';

const SHORTCUTS: [string, string][] = [
  ['A W S E D F T G Y H U J K', 'play notes'],
  ['- / =', 'octave down / up'],
  ['Space', 'play / stop'],
  ['Z X C V B', 'KICK · SNARE · HAT · CLAP · NOTES'],
  ['N', 'next sound'],
  ['Backspace', 'clear selected track'],
  ['Knobs', 'drag up/down or scroll'],
  ['Steps', 'click to turn beats on/off'],
];

export default function App() {
  const showKeys = useStore((s) => s.showKeys);
  const showHelp = useStore((s) => s.showHelp);
  const audioReady = useStore((s) => s.audioReady);
  const uiSound = useStore((s) => s.uiSound);
  const set = useStore((s) => s.set);
  useEffect(() => installKeyboard(), []);

  const toggle = (key: 'showKeys' | 'uiSound', value: boolean) => {
    set({ [key]: !value });
    try {
      localStorage.setItem(`pulse16.${key}`, value ? '0' : '1');
    } catch {
      /* private mode: preference just isn't remembered */
    }
  };

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">
          PULSE-16 <b>BASIC</b>
        </div>
        <div className="actions">
          <button onClick={() => toggle('uiSound', uiSound)} aria-pressed={uiSound}>
            Click sounds {uiSound ? 'on' : 'off'}
          </button>
          <button onClick={() => toggle('showKeys', showKeys)} aria-pressed={showKeys}>
            {showKeys ? 'Hide' : 'Show'} keys
          </button>
          <button onClick={() => set({ showHelp: !showHelp })}>? Shortcuts</button>
        </div>
      </header>
      <main className="stage">
        <Stage />
        {!audioReady && <div className="hint">Click any control or press a key to start sound</div>}
      </main>
      {showHelp && (
        <div className="overlay" onClick={() => set({ showHelp: false })}>
          <div className="help" onClick={(e) => e.stopPropagation()}>
            <h2>Keyboard shortcuts</h2>
            <dl>
              {SHORTCUTS.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <button onClick={() => set({ showHelp: false })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
