// The beginner tutorial: 5 parts, one lesson per screen. Each lesson teaches one idea, shows it in a diagram,
// then asks the learner to try it on the synth. `targets` are the synth parts to highlight (node names).
import type { ReactNode } from 'react';
import {
  C,
  DRUM_COLORS,
  EchoSpace,
  KeyboardDiagram,
  LengthEnvelope,
  LoopRing,
  NoteEntryFlow,
  OctaveDiagram,
  PitchLadder,
  SaveShare,
  ScreenDiagram,
  SoundTiles,
  SpeedScale,
  StepGrid,
  StepsAndBeats,
  SynthMap,
  ToneCurve,
} from './diagrams';
import { RECIPES } from './recipes';

export interface Lesson {
  id: string;
  part: string;
  title: string;
  body: ReactNode;
  diagram?: ReactNode;
  tryIt?: ReactNode;
  tip?: ReactNode;
  targets?: string[];
}

const K = (k: string) => <kbd className="tut-kbd">{k}</kbd>;
const KICK = { label: 'KICK', color: DRUM_COLORS.KICK, on: [1, 5, 9, 13] };
const CLAP = { label: 'CLAP', color: DRUM_COLORS.CLAP, on: [5, 13] };
const HAT = { label: 'HAT', color: DRUM_COLORS.HAT, on: [3, 7, 11, 15] };
const steps = (n: number[]) => n.map((i) => `step_${i - 1}`);

export const PARTS = ['Meet HEX-16', 'Rhythm', 'Melody', 'Sound', 'Go further'];

export const LESSONS: Lesson[] = [
  /* ------------------------------------------------------------ 1 · Meet HEX-16 */
  {
    id: 'welcome',
    part: PARTS[0],
    title: 'Welcome — what you will make',
    body: (
      <>
        <p>
          HEX‑16 is a <b>drum machine and a small synthesizer</b> in one. In about ten minutes you will build a full loop from
          nothing: a drum beat, a melody on top, and your own sound — then save it or send it to a friend.
        </p>
        <p>You don't need to know music. Every idea is explained as we go, and you can always press <b>Show me</b>.</p>
        <ol className="tut-legend">
          <li><b>Screen</b> — tells you what's happening</li>
          <li><b>Sound knobs</b> — PITCH · TONE · LENGTH · ECHO · SPACE</li>
          <li><b>SPEED and VOLUME</b></li>
          <li><b>SOUND</b> (change instrument) and <b>CLEAR</b> (empty a track)</li>
          <li><b>Track pads</b> — KICK · SNARE · HAT · CLAP · NOTES</li>
          <li><b>16 step keys</b> — where you place the sounds in time</li>
          <li><b>PLAY / STOP</b></li>
          <li><b>OCT − / OCT +</b> — move the keyboard lower or higher</li>
          <li><b>Keyboard</b> — play notes (or use your computer keys)</li>
        </ol>
      </>
    ),
    diagram: <SynthMap />,
    tip: <>Your current beat is saved when the tutorial starts. You can bring it back at the end.</>,
  },
  {
    id: 'screen',
    part: PARTS[0],
    title: 'Reading the screen',
    body: (
      <>
        <p>
          The red screen is your dashboard. <b>Top line:</b> the track you are editing, the instrument sound, and the speed.
          <b> Middle line:</b> the keyboard's octave and the last note you played. <b>Bottom line:</b> the 16 steps of the track
          you are editing — filled squares are hits, and the underline shows where the music is right now.
        </p>
        <p>When you turn a knob, the middle line briefly shows its name and level, so you always know what you changed.</p>
      </>
    ),
    diagram: <ScreenDiagram />,
    targets: ['screen'],
  },
  {
    id: 'loop',
    part: PARTS[0],
    title: 'The loop and the playhead',
    body: (
      <>
        <p>
          HEX‑16 plays a <b>loop</b>: one short piece of music, 16 steps long, that repeats forever. When the last step ends,
          the first one starts again — so anything you add keeps playing round and round.
        </p>
        <p>
          The red light running across the step keys is the <b>playhead</b>. It shows which step is playing right now.
        </p>
      </>
    ),
    diagram: <LoopRing />,
    tryIt: <>Press <b>▶■ PLAY</b> (or {K('Space')}). Leave it playing for the rest of the tutorial — you can change everything while it runs.</>,
    targets: ['btn_play'],
  },

  /* ------------------------------------------------------------ 2 · Rhythm */
  {
    id: 'beats',
    part: PARTS[1],
    title: 'Steps and beats',
    body: (
      <>
        <p>
          Almost all pop, dance and hip‑hop music is counted in <b>4 beats</b>: “1, 2, 3, 4”. On HEX‑16 each beat is split into
          4 steps, so <b>16 steps = 4 beats = 1 bar</b>.
        </p>
        <p>
          The step keys are coloured in groups of four to make this easy: <b>red = beat 1, orange = beat 2, yellow = beat 3,
          white = beat 4</b>. The first key of each colour is the beat itself; the three after it are the in‑between spots
          musicians count as “e”, “&” and “a”.
        </p>
      </>
    ),
    diagram: <StepsAndBeats />,
    tryIt: <>With the loop playing, count “1, 2, 3, 4” out loud as the playhead reaches the first key of each colour.</>,
    targets: steps([1, 5, 9, 13]),
  },
  {
    id: 'kick',
    part: PARTS[1],
    title: 'The kick — the heartbeat',
    body: (
      <>
        <p>
          The <b>kick</b> is the deep “boom” drum. It tells your body where the beat is. Putting a kick on every beat —
          steps 1, 5, 9 and 13 — is called <b>four on the floor</b>, the foundation of house, disco and a lot of pop.
        </p>
        <p>
          The track pads choose which drum the step keys edit. The chosen pad glows and its name appears on the screen.
        </p>
      </>
    ),
    diagram: <StepGrid rows={[KICK]} focus="KICK" caption="kick on every beat: 1 · 5 · 9 · 13" />,
    tryIt: <>Tap the <b>KICK</b> pad ({K('Z')}), then click step keys <b>1, 5, 9 and 13</b>. Click a lit step again to turn it off.</>,
    tip: <>Made a mess? <b>CLEAR</b> ({K('⌫')}) empties the selected track.</>,
    targets: ['track_kick', ...steps([1, 5, 9, 13])],
  },
  {
    id: 'clap',
    part: PARTS[1],
    title: 'The clap — the backbeat',
    body: (
      <>
        <p>
          Beats 2 and 4 are called the <b>backbeat</b>. A clap or snare on them is what makes people nod their head — you hear it
          in almost every pop song. The kick keeps the pulse, the clap answers on 2 and 4: that push‑and‑pull is the basic groove.
        </p>
      </>
    ),
    diagram: <StepGrid rows={[KICK, CLAP]} focus="CLAP" caption="clap on beats 2 and 4 = steps 5 and 13" />,
    tryIt: <>Tap <b>CLAP</b> ({K('V')}), then turn on steps <b>5 and 13</b>. The kick you made stays — every drum has its own track.</>,
    tip: <>Prefer a sharper sound? Try the same steps on <b>SNARE</b> ({K('X')}) instead.</>,
    targets: ['track_clap', ...steps([5, 13])],
  },
  {
    id: 'hats',
    part: PARTS[1],
    title: 'Hi‑hats — the groove',
    body: (
      <>
        <p>
          The <b>hi‑hat</b> is the short “tss”. It fills the space between the big drums. Put it on the <b>“&”</b> of each beat —
          halfway between the kicks — and the beat starts to bounce.
        </p>
        <p>Now look at all three rows together: that is a complete dance beat.</p>
      </>
    ),
    diagram: <StepGrid rows={[KICK, HAT, CLAP]} focus="HAT" caption="kick + clap + off-beat hats = a full beat" />,
    tryIt: <>Tap <b>HAT</b> ({K('C')}), then turn on steps <b>3, 7, 11 and 15</b>.</>,
    tip: <>Hats on <i>every</i> step feel busy and energetic; hats on every other step feel relaxed. Try both.</>,
    targets: ['track_hat', ...steps([3, 7, 11, 15])],
  },

  /* ------------------------------------------------------------ 3 · Melody */
  {
    id: 'keyboard',
    part: PARTS[2],
    title: 'The keyboard and your computer keys',
    body: (
      <>
        <p>
          The keyboard has 13 keys — one <b>octave</b>, from C to the next C. The white keys play the <b>C major scale</b>:
          C D E F G A B C, the “do re mi fa so la ti do” you may know. The black keys are the notes in between.
        </p>
        <p>
          Your computer keyboard is laid out the same way: the middle row <b>A S D F G H J K</b> are the white keys, and
          <b> W E T Y U</b> above them are the black keys. The letters are printed on the synth's keys (turn on Key hints).
        </p>
      </>
    ),
    diagram: <KeyboardDiagram mark={[0, 1, 2, 3, 4, 5, 6, 7]} caption="white keys = C major scale: it always sounds nice" />,
    tryIt: <>Play the white keys from {K('A')} to {K('K')} in order — you just played a scale.</>,
    targets: ['key_0', 'key_2', 'key_4', 'key_5', 'key_7', 'key_9', 'key_11', 'key_12'],
  },
  {
    id: 'octaves',
    part: PARTS[2],
    title: 'Octaves — higher and lower',
    body: (
      <>
        <p>
          The same note name exists low and high: a low C and a high C sound “the same, but higher”. That distance is an
          <b> octave</b>. <b>OCT −</b> and <b>OCT +</b> move the whole keyboard down or up one octave; the screen shows which one
          you're on (OCT 1 to OCT 6).
        </p>
        <p>Low octaves are good for bass lines, middle ones for melodies, high ones for sparkly parts.</p>
      </>
    ),
    diagram: <OctaveDiagram />,
    tryIt: <>Press <b>OCT +</b> ({K('=')}) and play a few keys, then <b>OCT −</b> ({K('-')}) twice and play again. Hear the difference?</>,
    targets: ['btn_oct0', 'btn_oct1'],
  },
  {
    id: 'write-notes',
    part: PARTS[2],
    title: 'Writing a melody into the loop',
    body: (
      <>
        <p>
          The <b>NOTES</b> track works like the drum tracks, but each step holds a note. Tap <b>NOTES</b>, click a step key (its
          light blinks — that's the cursor), then press a key. The note is written into that step and the cursor jumps to the
          next step, so you can type a melody note after note.
        </p>
        <p>Click the blinking step again to empty it. Press the same key on a step that already has it to remove the note.</p>
      </>
    ),
    diagram: <NoteEntryFlow />,
    tryIt: <>Tap <b>NOTES</b> ({K('B')}), click step <b>1</b>, then press any <b>4 keys</b>. Listen to your melody loop.</>,
    targets: ['track_notes', 'step_0'],
  },
  {
    id: 'chords',
    part: PARTS[2],
    title: 'Notes that sound good together',
    body: (
      <>
        <p>
          A <b>chord</b> is a few notes that sound good together. The easiest one is <b>C major</b>: C, E and G — on your computer
          that's {K('A')} {K('D')} {K('G')}. Playing a chord's notes one after another instead of all at once is called an
          <b> arpeggio</b>, and it makes a great melody.
        </p>
      </>
    ),
    diagram: (
      <>
        <KeyboardDiagram mark={[0, 2, 4]} caption="C major chord = C · E · G" />
        <StepGrid rows={[{ label: 'NOTES', color: C.orange, on: [1, 5, 9, 13] }]} caption="arpeggio: C on 1, E on 5, G on 9, E on 13" />
      </>
    ),
    tryIt: <>On the NOTES track, press <b>CLEAR</b> ({K('⌫')}) to start clean. Then click step <b>1</b> and write {K('A')} · click step <b>5</b>, write {K('D')} · step <b>9</b>, {K('G')} · step <b>13</b>, {K('D')}.</>,
    tip: <>More friendly chords: F major = {K('F')} {K('H')} {K('K')} · A minor = {K('D')} {K('H')} {K('K')} · G major = {K('S')} {K('G')} {K('J')}.</>,
    targets: ['key_0', 'key_4', 'key_7'],
  },

  /* ------------------------------------------------------------ 4 · Sound */
  {
    id: 'sound',
    part: PARTS[3],
    title: 'Change the instrument',
    body: (
      <>
        <p>
          The notes you wrote stay the same — the <b>sound</b> playing them can change. <b>SOUND</b> switches between four
          instruments, and the screen shows the name.
        </p>
      </>
    ),
    diagram: <SoundTiles />,
    tryIt: <>While the loop plays, press <b>SOUND</b> ({K('N')}) a few times and pick your favourite.</>,
    tip: <>BASS sounds best in low octaves (OCT 2–3); LEAD and KEYS in the middle (OCT 4–5).</>,
    targets: ['btn_sound'],
  },
  {
    id: 'tone',
    part: PARTS[3],
    title: 'TONE — dark or bright',
    body: (
      <>
        <p>
          Every sound is made of a low “body” and higher “fizz”. <b>TONE</b> decides how much fizz gets through. Turn it left and
          everything gets darker and muffled, like music through a wall; turn it right and it gets bright and crisp.
        </p>
        <p>
          Knobs work by <b>dragging up or down</b>, or with the <b>scroll wheel</b> while the mouse is over them. They click in
          small steps, like a real knob.
        </p>
      </>
    ),
    diagram: <ToneCurve />,
    tryIt: <>Slowly turn <b>TONE</b> all the way left, then all the way right, while the loop plays. DJs do this to build tension.</>,
    targets: ['knob_tone'],
  },
  {
    id: 'length',
    part: PARTS[3],
    title: 'LENGTH — short or long',
    body: (
      <>
        <p>
          <b>LENGTH</b> sets how long every sound rings after it starts. Short sounds are tight and punchy; long sounds are
          smooth and flowing. It changes the drums and the notes together.
        </p>
      </>
    ),
    diagram: <LengthEnvelope />,
    tryIt: <>Turn <b>LENGTH</b> left for a tight, bouncy beat — then right for a long, dreamy one.</>,
    targets: ['knob_length'],
  },
  {
    id: 'echo-space',
    part: PARTS[3],
    title: 'ECHO and SPACE — make it bigger',
    body: (
      <>
        <p>
          <b>ECHO</b> repeats each sound a moment later, quieter each time — like shouting in a canyon. <b>SPACE</b> places the
          music in a room: a little makes it feel natural, a lot makes it sound like a cathedral.
        </p>
        <p>A little of each goes a long way. If the beat starts to sound blurry, turn them back down.</p>
      </>
    ),
    diagram: <EchoSpace />,
    tryIt: <>Turn <b>ECHO</b> up halfway and listen to the repeats. Then add some <b>SPACE</b>.</>,
    targets: ['knob_echo', 'knob_space'],
  },
  {
    id: 'speed-pitch',
    part: PARTS[3],
    title: 'SPEED, PITCH and VOLUME',
    body: (
      <>
        <p>
          <b>SPEED</b> is the tempo, counted in <b>BPM</b> — beats per minute. The same beat feels completely different at 90
          (laid‑back hip‑hop) and at 124 (house). The screen shows the exact number.
        </p>
        <p>
          <b>PITCH</b> moves your whole melody up or down in small steps called <b>semitones</b> (12 semitones = one octave); the
          screen shows it as P+3, P−2 and so on. Drums don't change. <b>VOLUME</b> sets the overall loudness.
        </p>
      </>
    ),
    diagram: (
      <>
        <SpeedScale />
        <PitchLadder />
      </>
    ),
    tryIt: <>Drag <b>SPEED</b> down to about 90 BPM, then up to about 124. Then turn <b>PITCH</b> a few clicks and listen to the melody move.</>,
    targets: ['knob_speed', 'knob_pitch', 'knob_volume'],
  },

  /* ------------------------------------------------------------ 5 · Go further */
  {
    id: 'recipes',
    part: PARTS[4],
    title: 'Beat recipes to try',
    body: (
      <>
        <p>
          Styles of music are mostly recognised by where the drums sit and how fast they go. Copy one of these, then change a
          step or two to make it yours.
        </p>
      </>
    ),
    diagram: (
      <div className="tut-recipes">
        {RECIPES.map((r) => (
          <div key={r.name}>
            <h4>
              {r.name} · {r.bpm} BPM
            </h4>
            <StepGrid
              rows={(
                [
                  ['KICK', r.kick],
                  ['SNARE', r.snare],
                  ['CLAP', r.clap],
                  ['HAT', r.hat],
                ] as [keyof typeof DRUM_COLORS, number[] | undefined][]
              )
                .filter(([, on]) => on)
                .map(([label, on]) => ({ label, color: DRUM_COLORS[label], on: on! }))}
            />
          </div>
        ))}
      </div>
    ),
    tryIt: <>Pick a recipe and build it (or press <b>Load this beat</b>). Then move one kick to a different step and hear how the feel changes.</>,
  },
  {
    id: 'save',
    part: PARTS[4],
    title: 'Save it and share it',
    body: (
      <>
        <p>
          <b>Export</b> (top right) turns your loop into an audio file you can keep, post or put in a video. Choose how many
          times the loop repeats, and WAV (best quality) or MP3 (small, easy to send).
        </p>
        <p>
          <b>Share</b> gives you a link. Whoever opens it gets your exact beat on their own HEX‑16 — drums, melody, sound and
          knob settings — and can keep changing it.
        </p>
      </>
    ),
    diagram: <SaveShare />,
    tryIt: <>Press <b>Share</b> and copy your link, or <b>Export</b> an MP3.</>,
    tip: <>Press {K('?')} any time to see every keyboard shortcut.</>,
  },
  {
    id: 'glossary',
    part: PARTS[4],
    title: 'Words to know',
    body: (
      <dl className="tut-glossary">
        <dt>Loop</dt><dd>A short piece of music that repeats.</dd>
        <dt>Step</dt><dd>One of the 16 slots in the loop where a sound can play.</dd>
        <dt>Beat</dt><dd>The pulse you tap your foot to. 4 beats per bar here.</dd>
        <dt>Bar</dt><dd>One full round of 4 beats — 16 steps.</dd>
        <dt>BPM</dt><dd>Beats per minute: how fast the music goes.</dd>
        <dt>Backbeat</dt><dd>Beats 2 and 4, usually a clap or snare.</dd>
        <dt>Off‑beat</dt><dd>The spots between the beats (“&”), often hi‑hats.</dd>
        <dt>Note</dt><dd>A single musical sound with a pitch, like C or G.</dd>
        <dt>Octave</dt><dd>The jump from one note to the same note higher (12 semitones).</dd>
        <dt>Semitone</dt><dd>The smallest step between two keys, white or black.</dd>
        <dt>Scale</dt><dd>A set of notes that fit together — the white keys are C major.</dd>
        <dt>Chord</dt><dd>Several notes that sound good together, like C · E · G.</dd>
        <dt>Arpeggio</dt><dd>A chord's notes played one after another.</dd>
        <dt>Tone / filter</dt><dd>How bright or dark a sound is.</dd>
        <dt>Echo / delay</dt><dd>Repeats of a sound, each quieter.</dd>
        <dt>Space / reverb</dt><dd>The sound of a room around the music.</dd>
      </dl>
    ),
  },
];
