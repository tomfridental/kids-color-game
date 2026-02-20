import { useState, useCallback } from "react";

interface Word {
  emoji: string;
  word: string; // Hebrew word (RTL)
}

const LEVELS: Word[][] = [
  // Level 1: 2-3 letter words
  [
    { emoji: "🐶", word: "כלב" },
    { emoji: "🐱", word: "חתול" },
    { emoji: "🐟", word: "דג" },
    { emoji: "🌳", word: "עץ" },
    { emoji: "🏠", word: "בית" },
  ],
  // Level 2: 3-4 letter words
  [
    { emoji: "🌸", word: "פרח" },
    { emoji: "📖", word: "ספר" },
    { emoji: "🌙", word: "ירח" },
    { emoji: "☀️", word: "שמש" },
    { emoji: "🍎", word: "תפוח" },
  ],
  // Level 3: 4 letter words
  [
    { emoji: "🦋", word: "פרפר" },
    { emoji: "🍌", word: "בננה" },
    { emoji: "🐘", word: "פיל" },
    { emoji: "⭐", word: "כוכב" },
    { emoji: "🎈", word: "בלון" },
  ],
  // Level 4: 4-5 letter words
  [
    { emoji: "🍉", word: "אבטיח" },
    { emoji: "🐢", word: "צב" },
    { emoji: "🦁", word: "אריה" },
    { emoji: "🌈", word: "קשת" },
    { emoji: "🎂", word: "עוגה" },
  ],
  // Level 5: mixed
  [
    { emoji: "🚗", word: "מכונית" },
    { emoji: "✈️", word: "מטוס" },
    { emoji: "🍦", word: "גלידה" },
    { emoji: "🐓", word: "תרנגול" },
    { emoji: "🌻", word: "חמנייה" },
  ],
];

const HEBREW_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getLetterChoices(word: string): string[] {
  const wordLetters = word.split("");
  const extras = new Set<string>();

  // Calculate how many extras we need for an even total (2 clean rows)
  const minExtras = Math.max(4, wordLetters.length);
  const total = wordLetters.length + minExtras;
  const targetExtras = total % 2 === 0 ? minExtras : minExtras + 1;

  while (extras.size < targetExtras) {
    const randomLetter =
      HEBREW_LETTERS[Math.floor(Math.random() * HEBREW_LETTERS.length)];
    if (!wordLetters.includes(randomLetter)) {
      extras.add(randomLetter);
    }
  }

  return shuffle([...wordLetters, ...extras]);
}

function playSound(type: "correct" | "wrong" | "place" | "win") {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  if (type === "place") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } else if (type === "correct") {
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
    oscillator.frequency.exponentialRampToValueAtTime(
      180,
      ctx.currentTime + 0.3
    );
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

function HebrewLetters({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [filled, setFilled] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>(() =>
    getLetterChoices(LEVELS[0][0].word)
  );
  const [shakeWrong, setShakeWrong] = useState(false);
  const [wordComplete, setWordComplete] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentWord = LEVELS[level][wordIndex];
  const letters = currentWord.word.split("");

  const nextWord = useCallback(
    (lvl: number, idx: number) => {
      const w = LEVELS[lvl][idx];
      setFilled([]);
      setChoices(getLetterChoices(w.word));
      setShakeWrong(false);
      setWordComplete(false);
    },
    []
  );

  const handleLetterClick = useCallback(
    (letter: string) => {
      if (wordComplete) return;

      const nextIndex = filled.length;
      const expected = letters[nextIndex];

      if (letter === expected) {
        playSound("place");
        const newFilled = [...filled, letter];
        setFilled(newFilled);

        if (newFilled.length === letters.length) {
          // Word complete
          setWordComplete(true);
          playSound("correct");

          setTimeout(() => {
            const nextIdx = wordIndex + 1;
            if (nextIdx >= LEVELS[level].length) {
              // Level complete
              const nextLvl = level + 1;
              if (nextLvl >= LEVELS.length) {
                setCompleted(true);
              } else {
                setLevel(nextLvl);
                setWordIndex(0);
                nextWord(nextLvl, 0);
              }
            } else {
              setWordIndex(nextIdx);
              nextWord(level, nextIdx);
            }
          }, 1200);
        }
      } else {
        playSound("wrong");
        setShakeWrong(true);
        setTimeout(() => setShakeWrong(false), 500);
      }
    },
    [filled, letters, wordComplete, wordIndex, level, nextWord]
  );

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 gap-6 p-4">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">
          !כל הכבוד
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600">
          סיימת את כל השלבים
        </p>
        <button
          onClick={() => {
            setLevel(0);
            setWordIndex(0);
            setCompleted(false);
            nextWord(0, 0);
          }}
          className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-blue-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-blue-500 transition-colors"
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
    <div
      className="min-h-screen flex flex-col items-center bg-gray-200 p-4 sm:p-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="w-full max-w-lg relative flex items-center justify-center mb-4 sm:mb-8">
        <button
          onClick={onBack}
          className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
        >
          → חזרה
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
          אותיות
        </h1>
      </div>

      {/* Level indicators */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        {LEVELS.map((_, i) => {
          const isActive = i === level;
          const isDone = i < level;
          return (
            <button
              key={i}
              onClick={() => {
                setLevel(i);
                setWordIndex(0);
                nextWord(i, 0);
              }}
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

      {/* Progress dots */}
      <div className="flex gap-2 mb-6 sm:mb-8">
        {LEVELS[level].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
              i < wordIndex
                ? "bg-green-400"
                : i === wordIndex
                  ? "bg-blue-400"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Emoji image */}
      <div className="text-8xl sm:text-9xl mb-6 sm:mb-8">
        {currentWord.emoji}
      </div>

      {/* Letter blanks */}
      <div
        className={`flex gap-3 sm:gap-4 mb-8 sm:mb-10 ${shakeWrong ? "animate-shake" : ""}`}
        dir="rtl"
      >
        {letters.map((letter, i) => {
          const isFilled = i < filled.length;
          return (
            <div
              key={i}
              className={`w-12 h-14 sm:w-20 sm:h-22 flex items-center justify-center text-3xl sm:text-5xl font-bold border-b-4 transition-all ${
                isFilled
                  ? wordComplete
                    ? "border-green-400 text-green-600 scale-110"
                    : "border-blue-400 text-gray-800"
                  : "border-gray-400"
              }`}
            >
              {isFilled ? filled[i] : ""}
            </div>
          );
        })}
      </div>

      {/* Letter choices */}
      <div
        className="grid gap-3 sm:gap-4 w-full"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(choices.length / 2)}, minmax(0, 1fr))`,
          maxWidth: `${Math.ceil(choices.length / 2) * 5}rem`,
        }}
      >
        {choices.map((letter, i) => (
          <button
            key={i}
            onClick={() => handleLetterClick(letter)}
            disabled={wordComplete}
            className="aspect-square rounded-2xl bg-orange-400 hover:bg-orange-500 text-white text-4xl sm:text-5xl font-bold shadow-lg transition-all hover:scale-110 disabled:opacity-60 disabled:hover:scale-100"
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HebrewLetters;
