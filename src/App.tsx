import { useEffect, useState, type ReactNode } from 'react';
import { Button, Kbd, Label, Modal, Switch, Toast, toast } from '@heroui/react';
import { Stage } from './scene/Stage';
import { installKeyboard } from './input/keyboard';
import { useStore } from './state/store';
import { beatFromHash } from './state/share';
import { ExportDialog } from './ui/ExportDialog';
import { ShareDialog } from './ui/ShareDialog';

const SHORTCUTS: [string[], string][] = [
  [['A', 'W', 'S', 'E', 'D', 'F', 'T', 'G', 'Y', 'H', 'U', 'J', 'K'], 'play notes'],
  [['-', '='], 'octave down / up'],
  [['Space'], 'play / stop'],
  [['Z', 'X', 'C', 'V', 'B'], 'KICK · SNARE · HAT · CLAP · NOTES'],
  [['N'], 'next sound'],
  [['Backspace'], 'clear selected track'],
];

let hashChecked = false; // StrictMode runs effects twice; load the shared beat once

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Switch isSelected={checked} onChange={onChange} size="sm">
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label>{children}</Label>
      </Switch.Content>
    </Switch>
  );
}

export default function App() {
  const showKeys = useStore((s) => s.showKeys);
  const showHelp = useStore((s) => s.showHelp);
  const uiSound = useStore((s) => s.uiSound);
  const audioReady = useStore((s) => s.audioReady);
  const set = useStore((s) => s.set);
  const [dialog, setDialog] = useState<'export' | 'share' | null>(null);

  useEffect(() => installKeyboard(), []);
  useEffect(() => {
    if (hashChecked) return;
    hashChecked = true;
    const shared = beatFromHash();
    if (shared === 'invalid') toast.danger("That share link looks broken — showing the demo beat instead");
    else if (shared) {
      set(shared);
      toast.success('Loaded a shared beat — press Space to play it');
    }
  }, [set]);

  const toggle = (key: 'showKeys' | 'uiSound', value: boolean) => {
    set({ [key]: value });
    try {
      localStorage.setItem(`pulse16.${key}`, value ? '1' : '0');
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
          <Toggle checked={uiSound} onChange={(v) => toggle('uiSound', v)}>
            Click sounds
          </Toggle>
          <Toggle checked={showKeys} onChange={(v) => toggle('showKeys', v)}>
            Key hints
          </Toggle>
          <Button variant="ghost" size="sm" onPress={() => set({ showHelp: true })}>
            Shortcuts
          </Button>
          <Button variant="secondary" size="sm" onPress={() => setDialog('share')}>
            Share
          </Button>
          <Button variant="primary" size="sm" onPress={() => setDialog('export')}>
            Export
          </Button>
        </div>
      </header>
      <main className="stage">
        <Stage />
        {!audioReady && <div className="hint">Click any control or press a key to start sound</div>}
      </main>

      <Modal isOpen={showHelp} onOpenChange={(open) => set({ showHelp: open })}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Keyboard shortcuts</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <dl className="shortcuts">
                  {SHORTCUTS.map(([keys, what]) => (
                    <div key={what}>
                      <dt>
                        {keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </dt>
                      <dd>{what}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Knobs</dt>
                    <dd>drag up/down or scroll</dd>
                  </div>
                  <div>
                    <dt>Steps</dt>
                    <dd>click to turn beats on/off</dd>
                  </div>
                </dl>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onPress={() => set({ showHelp: false })}>
                  Got it
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'share' && <ShareDialog onClose={() => setDialog(null)} />}
      <Toast.Provider placement="bottom" />
    </div>
  );
}
