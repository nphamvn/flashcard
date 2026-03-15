import { useState, useCallback } from 'react';

const TESTS = [1, 2, 3, 4, 5] as const;
const QUESTIONS_PER_TEST = 100;

type Mode = 'all-random' | 'test-sorted' | 'test-random';

interface Card {
  test: number;
  no: number;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(testNo: number, order: 'sorted' | 'random'): Card[] {
  const cards: Card[] = Array.from({ length: QUESTIONS_PER_TEST }, (_, i) => ({
    test: testNo,
    no: i + 1,
  }));
  return order === 'random' ? shuffle(cards) : cards;
}

function buildAllRandom(): Card[] {
  const cards: Card[] = TESTS.flatMap(t =>
    Array.from({ length: QUESTIONS_PER_TEST }, (_, i) => ({ test: t, no: i + 1 }))
  );
  return shuffle(cards);
}

function imgPath(test: number, no: number, side: 'question' | 'answer'): string {
  return `/data/${test}/${no}/${side === 'question' ? 'q' : 'a'}.png`;
}

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);

  const startMode = useCallback((m: Mode, test?: number) => {
    const d =
      m === 'all-random' ? buildAllRandom() :
      m === 'test-sorted' ? buildDeck(test!, 'sorted') :
      buildDeck(test!, 'random');
    setDeck(d);
    setIndex(0);
    setFlipped(false);
    setImgError(false);
    setMode(m);
    setSelectedTest(test ?? null);
  }, []);

  const navigate = (dir: -1 | 1) => {
    setFlipped(false);
    setImgError(false);
    setIndex(i => Math.max(0, Math.min(deck.length - 1, i + dir)));
  };

  const flip = () => {
    setFlipped(f => !f);
    setImgError(false);
  };

  const reset = () => { setMode(null); setSelectedTest(null); };

  // ── Home screen ──────────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center px-4 py-14 font-sans">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <span className="text-2xl">🗂</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Flashcards</h1>
          <p className="mt-1 text-slate-400 text-sm">500 questions across 5 tests</p>
        </div>

        {/* All-random card */}
        <button
          onClick={() => startMode('all-random')}
          className="w-full max-w-sm mb-8 group relative rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-colors p-6 text-left shadow-lg shadow-indigo-900/40 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <div className="text-lg font-bold text-white">Random — All 500</div>
              <div className="text-indigo-200 text-sm">Shuffle all questions from every test</div>
            </div>
          </div>
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 group-hover:translate-x-1 transition-transform">→</span>
        </button>

        {/* Per-test section */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Or choose a test</p>
        <div className="w-full max-w-sm flex flex-col gap-3">
          {TESTS.map(t => (
            <div key={t} className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3">
              <span className="text-slate-300 font-bold w-14">Test {t}</span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => startMode('test-sorted', t)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                >
                  In Order
                </button>
                <button
                  onClick={() => startMode('test-random', t)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  Random
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Study screen ─────────────────────────────────────────────────────────────
  const card = deck[index];
  const side = flipped ? 'answer' : 'question';
  const modeLabel =
    mode === 'all-random' ? 'All 500 · Random' :
    mode === 'test-sorted' ? `Test ${selectedTest} · In Order` :
    `Test ${selectedTest} · Random`;
  const progress = ((index + 1) / deck.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center px-4 py-8 font-sans">

      {/* Top bar */}
      <div className="w-full max-w-2xl flex items-center gap-3 mb-6">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 transition-all cursor-pointer"
        >
          ← Back
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-indigo-400">{modeLabel}</span>
        <span className="text-sm font-mono text-slate-500">
          {index + 1}<span className="text-slate-700">/{deck.length}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl h-1 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        onClick={flip}
        className="w-full max-w-2xl min-h-96 rounded-2xl border border-slate-700/60 bg-slate-800/50 backdrop-blur cursor-pointer flex flex-col items-center justify-center relative overflow-hidden shadow-2xl hover:border-indigo-500/40 transition-colors select-none"
      >
        {/* Side badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-xs font-bold tracking-wide ${flipped ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
          {flipped ? 'ANSWER' : 'QUESTION'}
        </div>

        {/* Card info */}
        <div className="absolute top-3 right-3 text-xs text-slate-600 font-mono">
          T{card.test}·Q{card.no}
        </div>

        {imgError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <span className="text-4xl">🖼</span>
            <span className="font-semibold">{flipped ? 'Answer' : 'Question'} image not found</span>
            <span className="text-xs text-slate-600">Test {card.test} · Q{card.no}</span>
          </div>
        ) : (
          <img
            key={`${card.test}-${card.no}-${side}`}
            src={imgPath(card.test, card.no, side)}
            alt={side}
            className="max-w-full max-h-[420px] object-contain p-6"
            onError={() => setImgError(true)}
          />
        )}

        {/* Flip hint */}
        <div className="absolute bottom-3 right-4 text-xs text-slate-600">
          {flipped ? 'click to see question' : 'click to flip'}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate(-1)}
          disabled={index === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          ← Prev
        </button>
        <button
          onClick={flip}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${flipped ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/30'}`}
        >
          {flipped ? 'Show Question' : 'Show Answer'}
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={index === deck.length - 1}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
