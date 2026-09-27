import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { DEFAULT_MACROS, emptyGrid, emptyNotes, DRUMS, useStore, type PlaygroundState } from '../state/store';
import { LESSONS, PARTS } from '../tutorial/lessons';
import { TASKS, loadRecipe } from '../tutorial/tasks';
import { RECIPES } from '../tutorial/recipes';

const S = () => useStore.getState();

/** Beginner tutorial, docked next to the synth. It's an <aside>, not a dialog, so the synth and the keyboard stay playable. */
export function Tutorial({ onExport, onShare }: { onExport: () => void; onShare: () => void }) {
  const step = useStore((s) => s.tutorialStep);
  const saved = useStore((s) => s.beforeTutorial);
  const set = useStore((s) => s.set);
  const lesson = LESSONS[step];
  const task = TASKS[lesson.id];
  const base = useRef<PlaygroundState>(S());
  const baseFor = useRef(lesson.id);
  if (baseFor.current !== lesson.id) {
    // remember where the learner started this lesson, before its "done" check first runs
    baseFor.current = lesson.id;
    base.current = S();
  }
  const [done, setDone] = useState<Record<string, boolean>>({});
  const body = useRef<HTMLDivElement>(null);

  // new lesson: point at its controls and scroll to the top
  useEffect(() => {
    set({ highlight: lesson.targets ?? [] });
    body.current?.scrollTo({ top: 0 });
  }, [lesson, set]);
  useEffect(() => () => set({ highlight: [] }), [set]);

  const passed = useStore((s) => !!task?.done?.(s, base.current));
  useEffect(() => {
    if (passed) setDone((d) => (d[lesson.id] ? d : { ...d, [lesson.id]: true }));
  }, [passed, lesson.id]);

  const go = (i: number) => set({ tutorialStep: Math.max(0, Math.min(LESSONS.length - 1, i)) });
  const close = () => set({ tutorialOpen: false });
  const startFresh = () => {
    const s = S();
    if (!s.beforeTutorial) set({ beforeTutorial: { drums: s.drums, notes: s.notes, soundIndex: s.soundIndex, macros: s.macros, keyOctave: s.keyOctave } });
    set({ drums: emptyGrid(DRUMS.length), notes: emptyNotes(), soundIndex: 0, macros: DEFAULT_MACROS, keyOctave: 4, selectedTrack: 'kick', cursor: -1 });
    go(step + 1);
  };
  const restore = () => {
    if (saved) set({ ...saved, beforeTutorial: null, cursor: -1 });
  };
  const partIndex = PARTS.indexOf(lesson.part);
  const last = step === LESSONS.length - 1;

  return (
    <aside className="tut" aria-label="Tutorial">
      <header className="tut-head">
        <div>
          <div className="tut-kicker">
            Tutorial · Part {partIndex + 1} of {PARTS.length}: {lesson.part}
          </div>
          <div className="tut-progress" role="progressbar" aria-valuemin={1} aria-valuemax={LESSONS.length} aria-valuenow={step + 1}>
            {LESSONS.map((l, i) => (
              <button
                key={l.id}
                className={`tut-dot${i === step ? ' is-current' : ''}${done[l.id] ? ' is-done' : ''}${i > 0 && LESSONS[i - 1].part !== l.part ? ' is-part' : ''}`}
                aria-label={`Lesson ${i + 1}: ${l.title}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </div>
        <Button isIconOnly variant="ghost" size="sm" aria-label="Close tutorial" onPress={close}>
          ✕
        </Button>
      </header>

      <div className="tut-body" ref={body}>
        <div className="tut-count">
          {step + 1} / {LESSONS.length}
        </div>
        <h2>{lesson.title}</h2>
        {lesson.body}
        {lesson.diagram && <div className="tut-fig">{lesson.diagram}</div>}
        {lesson.tryIt && (
          <div className={`tut-try${done[lesson.id] ? ' is-done' : ''}`}>
            <b className="tut-label">{done[lesson.id] ? '✓ Nice — done' : 'Try it'}</b>
            {lesson.tryIt}
          </div>
        )}
        {lesson.tip && <p className="tut-tip">💡 {lesson.tip}</p>}

        {lesson.id === 'welcome' && (
          <div className="tut-actions">
            <Button variant="primary" onPress={startFresh}>
              Start with an empty loop
            </Button>
            <Button variant="ghost" onPress={() => go(1)}>
              Keep my current beat
            </Button>
          </div>
        )}
        {lesson.id === 'recipes' && (
          <div className="tut-actions">
            {RECIPES.map((r) => (
              <Button key={r.name} size="sm" variant="secondary" onPress={() => loadRecipe(r)}>
                Load {r.name}
              </Button>
            ))}
          </div>
        )}
        {lesson.id === 'save' && (
          <div className="tut-actions">
            <Button size="sm" variant="primary" onPress={onExport}>
              Export
            </Button>
            <Button size="sm" variant="secondary" onPress={onShare}>
              Share
            </Button>
          </div>
        )}
        {last && saved && (
          <div className="tut-actions">
            <Button size="sm" variant="secondary" onPress={restore}>
              Restore the beat I had before
            </Button>
          </div>
        )}
      </div>

      <footer className="tut-foot">
        <Button size="sm" variant="ghost" isDisabled={step === 0} onPress={() => go(step - 1)}>
          Back
        </Button>
        {task?.showMe && (
          <Button size="sm" variant="secondary" onPress={task.showMe}>
            Show me
          </Button>
        )}
        {last ? (
          <Button size="sm" variant="primary" onPress={close}>
            Finish
          </Button>
        ) : (
          <Button size="sm" variant="primary" onPress={() => go(step + 1)}>
            Next
          </Button>
        )}
      </footer>
    </aside>
  );
}
