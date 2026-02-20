import { useState, useCallback, useEffect } from "react";

const LEVELS = [
  { rows: 2, cols: 2 },
  { rows: 2, cols: 3 },
  { rows: 2, cols: 4 },
  { rows: 3, cols: 4 },
  { rows: 4, cols: 4 },
  { rows: 4, cols: 5 },
];

const ALL_EMOJIS = [
  "🐶", "🐱", "🐸", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
  "🐷", "🐵", "🐔", "🐧", "🐢", "🦋", "🐙", "🦄", "🐳", "🐬",
];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateBoard(level: number): Card[] {
  const { rows, cols } = LEVELS[level];
  const pairCount = (rows * cols) / 2;
  const emojis = shuffle(ALL_EMOJIS).slice(0, pairCount);
  const pairs = shuffle([...emojis, ...emojis]);
  return pairs.map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

function playSound(type: "flip" | "match" | "wrong" | "win") {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  if (type === "flip") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } else if (type === "match") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } else if (type === "wrong") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(350, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } else {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.7);
  }
}

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [cards, setCards] = useState<Card[]>(() => generateBoard(0));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { cols } = LEVELS[level];

  const startLevel = useCallback((lvl: number) => {
    setLevel(lvl);
    setCards(generateBoard(lvl));
    setFlippedIds([]);
    setLocked(false);
    setMoves(0);
    setCompleted(false);
  }, []);

  // Check if all cards are matched
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setTimeout(() => {
        playSound("win");
        setCompleted(true);
      }, 500);
    }
  }, [cards]);

  const handleCardClick = useCallback(
    (id: number) => {
      if (locked) return;
      const card = cards[id];
      if (card.flipped || card.matched) return;

      playSound("flip");
      const newCards = cards.map((c) =>
        c.id === id ? { ...c, flipped: true } : c
      );
      const newFlipped = [...flippedIds, id];
      setCards(newCards);
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);
        const [firstId, secondId] = newFlipped;
        const first = newCards[firstId];
        const second = newCards[secondId];

        if (first.emoji === second.emoji) {
          // Match
          setTimeout(() => {
            playSound("match");
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, matched: true }
                  : c
              )
            );
            setFlippedIds([]);
            setLocked(false);
          }, 500);
        } else {
          // No match
          setTimeout(() => {
            playSound("wrong");
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, flipped: false }
                  : c
              )
            );
            setFlippedIds([]);
            setLocked(false);
          }, 800);
        }
      }
    },
    [cards, flippedIds, locked]
  );

  if (completed) {
    const isLastLevel = level >= LEVELS.length - 1;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 gap-6 p-4">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">!כל הכבוד</h1>
        <p className="text-xl sm:text-2xl text-gray-600">
          סיימת ב-{moves} מהלכים
        </p>
        {!isLastLevel && (
          <button
            onClick={() => startLevel(level + 1)}
            className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-blue-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-blue-500 transition-colors"
          >
            שלב הבא
          </button>
        )}
        <button
          onClick={() => startLevel(level)}
          className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-green-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-green-500 transition-colors"
        >
          שחק שוב
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-gray-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-gray-500 transition-colors"
        >
          חזרה לתפריט
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-200 p-4 sm:p-8" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-lg relative flex items-center justify-center mb-4 sm:mb-8">
        <button
          onClick={onBack}
          className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
        >
          → חזרה
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">משחק זיכרון</h1>
      </div>

      {/* Level indicators */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        {LEVELS.map((_, i) => {
          const isActive = i === level;
          const isDone = i < level;
          return (
            <button
              key={i}
              onClick={() => startLevel(i)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                isDone
                  ? "bg-green-400 text-white hover:bg-green-500"
                  : isActive
                    ? "bg-blue-400 text-white scale-110"
                    : "bg-gray-300 text-gray-500 hover:bg-gray-400 hover:text-white"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Moves counter */}
      <p className="text-lg sm:text-xl text-gray-500 font-bold mb-4 sm:mb-6">
        מהלכים: {moves}
      </p>

      {/* Card grid */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl text-3xl sm:text-5xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center ${
              card.matched
                ? "bg-green-300 scale-95 opacity-70"
                : card.flipped
                  ? "bg-white scale-105"
                  : "bg-purple-400 hover:bg-purple-500 hover:scale-105"
            }`}
            disabled={card.flipped || card.matched || locked}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MemoryGame;
