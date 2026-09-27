import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { Button, Kbd, Label, Modal, Switch, Toast, toast } from '@heroui/react';
import { installKeyboard } from './input/keyboard';
import { useStore } from './state/store';
import { beatFromHash } from './state/share';
import { ExportDialog } from './ui/ExportDialog';
import { ShareDialog } from './ui/ShareDialog';
import { DesktopGate } from './ui/DesktopGate';
import { StageErrorBoundary } from './ui/StageErrorBoundary';
import { Tutorial } from './ui/Tutorial';

// The 3D synth (three.js, model, audio engine) loads on demand, so gated phones never download it.
const Stage = lazy(() => import('./scene/Stage').then((m) => ({ default: m.Stage })));

const SMALL_SCREEN = '(max-width: 759px), (pointer: coarse) and (max-width: 1023px)';

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

const session = (key: string) => {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

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
  const tutorialOpen = useStore((s) => s.tutorialOpen);
  const [tutorialSeen, setTutorialSeen] = useState(() => {
    try {
      return localStorage.getItem('hex16.tutorialSeen') === '1';
    } catch {
      return true;
    }
  });
  const set = useStore((s) => s.set);
  const [dialog, setDialog] = useState<'export' | 'share' | null>(null);
  const small = useMedia(SMALL_SCREEN);
  const [tryAnyway, setTryAnyway] = useState(() => session('hex16.tryAnyway'));
  const gated = small && !tryAnyway;

  useEffect(() => (gated ? undefined : installKeyboard()), [gated]);
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
      localStorage.setItem(`hex16.${key}`, value ? '1' : '0');
    } catch {
      /* private mode: preference just isn't remembered */
    }
  };

  if (gated)
    return (
      <>
        <DesktopGate
          onTryAnyway={() => {
            setTryAnyway(true);
            try {
              sessionStorage.setItem('hex16.tryAnyway', '1');
            } catch {
              /* fine: they'll just see the gate again next visit */
            }
          }}
        />
        <Toast.Provider placement="bottom" />
      </>
    );

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">
          HEX<b>-16</b>
        </div>
        <div className="actions">
          <Toggle checked={uiSound} onChange={(v) => toggle('uiSound', v)}>
            Click sounds
          </Toggle>
          <Toggle checked={showKeys} onChange={(v) => toggle('showKeys', v)}>
            Key hints
          </Toggle>
          <Button
            variant={tutorialOpen ? 'secondary' : 'ghost'}
            size="sm"
            className={tutorialSeen ? undefined : 'is-new'}
            onPress={() => {
              set({ tutorialOpen: !tutorialOpen });
              if (!tutorialSeen) {
                setTutorialSeen(true);
                try {
                  localStorage.setItem('hex16.tutorialSeen', '1');
                } catch {
                  /* private mode */
                }
              }
            }}
          >
            Tutorial
          </Button>
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
      <div className="work">
        <main className="stage">
          <StageErrorBoundary>
            <Suspense fallback={<div className="hint">Loading the synth…</div>}>
              <Stage />
            </Suspense>
          </StageErrorBoundary>
          {!audioReady && <div className="hint">Click any control or press a key to start sound</div>}
        </main>
        {tutorialOpen && <Tutorial onExport={() => setDialog('export')} onShare={() => setDialog('share')} />}
      </div>

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
