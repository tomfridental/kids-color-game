import { useState, useCallback, useEffect } from "react";

const LEVELS = 10;
const PROBLEMS_PER_LEVEL = 5;

interface WordDef {
  word: string;
  emoji: string;
}

const EASY_WORDS: WordDef[] = [
  { word: "Cat", emoji: "🐱" },
  { word: "Dog", emoji: "🐶" },
  { word: "Sun", emoji: "☀️" },
  { word: "Fish", emoji: "🐟" },
  { word: "Tree", emoji: "🌳" },
  { word: "Star", emoji: "⭐" },
  { word: "Moon", emoji: "🌙" },
  { word: "Bird", emoji: "🐦" },
  { word: "House", emoji: "🏠" },
  { word: "Car", emoji: "🚗" },
  { word: "Ball", emoji: "⚽" },
  { word: "Flower", emoji: "🌸" },
  { word: "Apple", emoji: "🍎" },
  { word: "Baby", emoji: "👶" },
  { word: "Hand", emoji: "✋" },
  { word: "Pig", emoji: "🐷" },
  { word: "Milk", emoji: "🥛" },
  { word: "Cereals", emoji: "🥣" },
  { word: "Cookie", emoji: "🍪" },
  { word: "Ice Cream", emoji: "🍦" },
  { word: "Elephant", emoji: "🐘" },
  { word: "TV", emoji: "📺" },
  { word: "Pancake", emoji: "🥞" },
  { word: "Ear", emoji: "👂" },
  { word: "Shoulders", emoji: "🤷" },
  { word: "Chair", emoji: "💺" },
  { word: "Food", emoji: "🍽️" },
  { word: "Water", emoji: "💧" },
];

const MEDIUM_WORDS: WordDef[] = [
  { word: "Book", emoji: "📖" },
  { word: "Horse", emoji: "🐴" },
  { word: "Rain", emoji: "🌧️" },
  { word: "Cake", emoji: "🎂" },
  { word: "Fire", emoji: "🔥" },
  { word: "Bear", emoji: "🐻" },
  { word: "Heart", emoji: "❤️" },
  { word: "Boat", emoji: "⛵" },
  { word: "Banana", emoji: "🍌" },
  { word: "Frog", emoji: "🐸" },
  { word: "Pizza", emoji: "🍕" },
  { word: "Mouse", emoji: "🐭" },
  { word: "Snow", emoji: "❄️" },
  { word: "Guitar", emoji: "🎸" },
];

const HARD_WORDS: WordDef[] = [
  { word: "Rocket", emoji: "🚀" },
  { word: "Robot", emoji: "🤖" },
  { word: "Monkey", emoji: "🐵" },
  { word: "Butterfly", emoji: "🦋" },
  { word: "Elephant", emoji: "🐘" },
  { word: "Rainbow", emoji: "🌈" },
  { word: "Dinosaur", emoji: "🦕" },
  { word: "Airplane", emoji: "✈️" },
  { word: "Umbrella", emoji: "☂️" },
  { word: "Penguin", emoji: "🐧" },
  { word: "Dolphin", emoji: "🐬" },
  { word: "Dragon", emoji: "🐉" },
  { word: "Volcano", emoji: "🌋" },
  { word: "Octopus", emoji: "🐙" },
  { word: "Diamond", emoji: "💎" },
  { word: "Unicorn", emoji: "🦄" },
  { word: "Castle", emoji: "🏰" },
  { word: "Turtle", emoji: "🐢" },
  { word: "Train", emoji: "🚂" },
  { word: "Helicopter", emoji: "🚁" },
  { word: "Lion", emoji: "🦁" },
  { word: "Shark", emoji: "🦈" },
  { word: "Watermelon", emoji: "🍉" },
  { word: "Pineapple", emoji: "🍍" },
  { word: "Crocodile", emoji: "🐊" },
  { word: "Cherry", emoji: "🍒" },
  { word: "Crab", emoji: "🦀" },
  { word: "Whale", emoji: "🐋" },
  { word: "Owl", emoji: "🦉" },
  { word: "Mushroom", emoji: "🍄" },
];

function getWordPool(level: number): WordDef[] {
  if (level <= 3) return EASY_WORDS;
  if (level <= 6) return [...EASY_WORDS, ...MEDIUM_WORDS];
  return [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS];
}

interface Round {
  correctWord: WordDef;
  options: WordDef[];
}

function generateRound(level: number): Round {
  const pool = getWordPool(level);
  const shuffled = shuffle(pool);
  const options = shuffled.slice(0, 4);
  const correctWord = options[Math.floor(Math.random() * 4)];
  return { correctWord, options };
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function speakWord(word: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function playSound(type: "correct" | "wrong") {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } else {
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
  }
}

function EnglishWords({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState<Round>(() => generateRound(1));
  const [selectedOption, setSelectedOption] = useState<WordDef | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    speakWord(round.correctWord.word);
  }, [round]);

  const nextRound = useCallback(
    (lvl: number) => {
      const r = generateRound(lvl);
      setRound(r);
      setSelectedOption(null);
      setIsCorrect(null);
    },
    []
  );

  const handleAnswer = useCallback(
    (word: WordDef) => {
      if (selectedOption !== null) return;

      setSelectedOption(word);
      const correct = word.word === round.correctWord.word;
      setIsCorrect(correct);
      playSound(correct ? "correct" : "wrong");

      if (correct) {
        const newCount = correctCount + 1;

        setTimeout(() => {
          if (newCount >= PROBLEMS_PER_LEVEL) {
            if (level >= LEVELS) {
              setCompleted(true);
            } else {
              const nextLevel = level + 1;
              setLevel(nextLevel);
              setCorrectCount(0);
              nextRound(nextLevel);
            }
          } else {
            setCorrectCount(newCount);
            nextRound(level);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
        }, 800);
      }
    },
    [selectedOption, round.correctWord.word, correctCount, level, nextRound]
  );

  if (completed) {
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center justify-center bg-gray-200 gap-6 sm:gap-8 p-4">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">
          !כל הכבוד
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600">סיימת את כל השלבים</p>
        <button
          onClick={() => {
            setLevel(1);
            setCorrectCount(0);
            setCompleted(false);
            nextRound(1);
          }}
          className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-pink-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-pink-500 transition-colors"
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
          מילים באנגלית
        </h1>
      </div>

      {/* Level indicators */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 max-w-sm sm:max-w-lg">
        {Array.from({ length: LEVELS }, (_, i) => {
          const lvl = i + 1;
          const isActive = lvl === level;
          const isDone = lvl < level;
          return (
            <button
              key={lvl}
              onClick={() => {
                setLevel(lvl);
                setCorrectCount(0);
                nextRound(lvl);
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                isDone
                  ? "bg-green-400 text-white hover:bg-green-500"
                  : isActive
                  ? "bg-blue-400 text-white scale-110"
                  : "bg-gray-300 text-gray-500 hover:bg-gray-400 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Progress within level */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: PROBLEMS_PER_LEVEL }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
              i < correctCount ? "bg-green-400" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-6 sm:gap-8">
        {/* Speaker button */}
        <button
          onClick={() => speakWord(round.correctWord.word)}
          className="bg-white rounded-3xl shadow-lg px-12 py-6 sm:px-16 sm:py-8 hover:shadow-xl transition-shadow"
        >
          <span className="text-6xl sm:text-7xl">🔊</span>
          {!window.speechSynthesis && (
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {round.correctWord.word}
            </p>
          )}
        </button>

        {/* Emoji options */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs sm:max-w-lg">
          {round.options.map((word, i) => {
            let extraClass = "";

            if (selectedOption !== null) {
              if (isCorrect && word.word === round.correctWord.word) {
                extraClass = "ring-4 ring-green-300 scale-110";
              } else if (word.word === selectedOption.word && !isCorrect) {
                extraClass = "ring-4 ring-red-300 animate-shake";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(word)}
                disabled={selectedOption !== null}
                className={`aspect-square rounded-2xl shadow-lg transition-all bg-white hover:bg-gray-100 flex items-center justify-center ${extraClass} disabled:opacity-80`}
              >
                <span className="text-7xl sm:text-[10rem]">{word.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EnglishWords;
