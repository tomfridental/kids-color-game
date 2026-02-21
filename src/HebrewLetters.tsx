import { useState, useCallback } from "react";

interface Word {
  emoji: string;
  word: string;
  en: string;
}

const WORDS_PER_LEVEL = 5;

const LEVELS: Word[][] = [
  // Level 1: 2-3 letter words
  [
    { emoji: "🐶", word: "כלב", en: "dog" },
    { emoji: "🐟", word: "דג", en: "fish" },
    { emoji: "🌳", word: "עץ", en: "tree" },
    { emoji: "🌈", word: "קשת", en: "rainbow" },
    { emoji: "🐘", word: "פיל", en: "elephant" },
    { emoji: "🏠", word: "בית", en: "house" },
    { emoji: "🐻", word: "דב", en: "bear" },
    { emoji: "🥛", word: "חלב", en: "milk" },
    { emoji: "🌊", word: "גל", en: "wave" },
  ],
  // Level 2: 3-4 letter words
  [
    { emoji: "🌸", word: "פרח", en: "flower" },
    { emoji: "📖", word: "ספר", en: "book" },
    { emoji: "🌙", word: "ירח", en: "moon" },
    { emoji: "☀️", word: "שמש", en: "sun" },
    { emoji: "🍎", word: "תפוח", en: "apple" },
    { emoji: "🐴", word: "סוס", en: "horse" },
    { emoji: "🐑", word: "כבש", en: "sheep" },
    { emoji: "🍞", word: "לחם", en: "bread" },
    { emoji: "🌍", word: "עולם", en: "world" },
  ],
  // Level 3: 4 letter words
  [
    { emoji: "🦋", word: "פרפר", en: "butterfly" },
    { emoji: "🍌", word: "בננה", en: "banana" },
    { emoji: "⭐", word: "כוכב", en: "star" },
    { emoji: "🐱", word: "חתול", en: "cat" },
    { emoji: "🎈", word: "בלון", en: "balloon" },
    { emoji: "🍇", word: "ענבים", en: "grapes" },
    { emoji: "🐸", word: "צפרדע", en: "frog" },
    { emoji: "🎵", word: "שיר", en: "song" },
  ],
  // Level 4: 4-5 letter words
  [
    { emoji: "🍉", word: "אבטיח", en: "watermelon" },
    { emoji: "🐢", word: "צב", en: "turtle" },
    { emoji: "🦁", word: "אריה", en: "lion" },
    { emoji: "🎂", word: "עוגה", en: "cake" },
    { emoji: "🔴", word: "אדום", en: "red" },
    { emoji: "🎒", word: "תיק", en: "bag" },
    { emoji: "🪑", word: "כיסא", en: "chair" },
  ],
  // Level 5: long words
  [
    { emoji: "🚗", word: "מכונית", en: "car" },
    { emoji: "✈️", word: "מטוס", en: "airplane" },
    { emoji: "🍦", word: "גלידה", en: "ice cream" },
    { emoji: "🐓", word: "תרנגול", en: "rooster" },
    { emoji: "🌻", word: "חמנייה", en: "sunflower" },
    { emoji: "🍫", word: "שוקולד", en: "chocolate" },
    { emoji: "🖥️", word: "מחשב", en: "computer" },
  ],
];

function pickLevelWords(level: number): Word[] {
  return shuffle(LEVELS[level]).slice(0, WORDS_PER_LEVEL);
}

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
  const uniqueLetters = [...new Set(word.split(""))];
  const extras = new Set<string>();

  // Calculate how many extras we need for an even total (2 clean rows)
  const minExtras = Math.max(4, uniqueLetters.length);
  const total = uniqueLetters.length + minExtras;
  const targetExtras = total % 2 === 0 ? minExtras : minExtras + 1;

  while (extras.size < targetExtras) {
    const randomLetter =
      HEBREW_LETTERS[Math.floor(Math.random() * HEBREW_LETTERS.length)];
    if (!uniqueLetters.includes(randomLetter)) {
      extras.add(randomLetter);
    }
  }

  return shuffle([...uniqueLetters, ...extras]);
}

function speakEnglish(word: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function speakLetter(letter: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(letter);
  utterance.lang = "he-IL";
  utterance.rate = 0.7;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
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

const INITIAL_WORDS = pickLevelWords(0);

function HebrewLetters({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [levelWords, setLevelWords] = useState<Word[]>(INITIAL_WORDS);
  const [filled, setFilled] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>(() =>
    getLetterChoices(INITIAL_WORDS[0].word)
  );
  const [shakeWrong, setShakeWrong] = useState(false);
  const [wordComplete, setWordComplete] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentWord = levelWords[wordIndex];
  const letters = currentWord.word.split("");

  const startLevel = useCallback((lvl: number) => {
    const words = pickLevelWords(lvl);
    setLevelWords(words);
    setFilled([]);
    setChoices(getLetterChoices(words[0].word));
    setShakeWrong(false);
    setWordComplete(false);
  }, []);

  const nextWord = useCallback(
    (_lvl: number, idx: number) => {
      setFilled([]);
      setChoices(getLetterChoices(levelWords[idx].word));
      setShakeWrong(false);
      setWordComplete(false);
    },
    [levelWords]
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
            if (nextIdx >= WORDS_PER_LEVEL) {
              // Level complete
              const nextLvl = level + 1;
              if (nextLvl >= LEVELS.length) {
                setCompleted(true);
              } else {
                setLevel(nextLvl);
                setWordIndex(0);
                startLevel(nextLvl);
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
    [filled, letters, wordComplete, wordIndex, level, nextWord, startLevel]
  );

  if (completed) {
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center justify-center bg-gray-200 gap-6 p-4">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">
          !כל הכבוד
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600">סיימת את כל השלבים</p>
        <button
          onClick={() => {
            setLevel(0);
            setWordIndex(0);
            setCompleted(false);
            startLevel(0);
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
      className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-4 sm:p-8"
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">אותיות</h1>
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
      <div className="flex gap-2 mb-4">
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

      {/* Main content area - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-4 sm:gap-6">
        {/* Emoji image — easter egg: tap to hear in English */}
        <button
          onClick={() => speakEnglish(currentWord.en)}
          className="text-7xl sm:text-8xl"
        >
          {currentWord.emoji}
        </button>

        {/* Letter blanks */}
        <div
          className={`flex gap-3 sm:gap-4 ${shakeWrong ? "animate-shake" : ""}`}
          dir="rtl"
        >
          {letters.map((_, i) => {
            const isFilled = i < filled.length;
            return (
              <div
                key={i}
                className={`w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center text-3xl sm:text-4xl font-bold border-b-4 transition-all ${
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
          className="grid gap-2 sm:gap-3 w-full"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(
              choices.length / 2
            )}, minmax(0, 1fr))`,
            maxWidth: `${Math.ceil(choices.length / 2) * 6}rem`,
          }}
        >
          {choices.map((letter, i) => (
            <div key={i} className="flex items-center gap-1">
              <button
                onClick={() => speakLetter(letter)}
                className="text-base sm:text-lg opacity-50 hover:opacity-100 transition-opacity shrink-0"
              >
                🔊
              </button>
              <button
                onClick={() => handleLetterClick(letter)}
                disabled={wordComplete}
                className="aspect-square flex-1 rounded-2xl bg-orange-400 hover:bg-orange-500 text-white text-3xl sm:text-4xl font-bold shadow-lg transition-all hover:scale-110 disabled:opacity-60 disabled:hover:scale-100"
              >
                {letter}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HebrewLetters;
