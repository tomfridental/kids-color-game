import { useState, useCallback, useEffect } from "react";

const LEVELS = 10;
const PROBLEMS_PER_LEVEL = 5;

interface ColorDef {
  name: string;
  bg: string;
  hover: string;
}

const ALL_COLORS: ColorDef[] = [
  { name: "Red", bg: "bg-[red]", hover: "hover:bg-[#cc0000]" },
  { name: "Blue", bg: "bg-[blue]", hover: "hover:bg-[#0000cc]" },
  { name: "Green", bg: "bg-[green]", hover: "hover:bg-[#006600]" },
  { name: "Yellow", bg: "bg-[yellow]", hover: "hover:bg-[#cccc00]" },
  { name: "Orange", bg: "bg-[orange]", hover: "hover:bg-[#cc8400]" },
  { name: "Purple", bg: "bg-[purple]", hover: "hover:bg-[#660066]" },
  { name: "Pink", bg: "bg-[pink]", hover: "hover:bg-[#ff85a2]" },
  { name: "Brown", bg: "bg-[brown]", hover: "hover:bg-[#8b2500]" },
  { name: "Black", bg: "bg-[black]", hover: "hover:bg-[#222222]" },
  { name: "White", bg: "bg-[white]", hover: "hover:bg-[#e0e0e0]" },
  { name: "Gray", bg: "bg-[gray]", hover: "hover:bg-[#6e6e6e]" },
  { name: "Light Blue", bg: "bg-[lightblue]", hover: "hover:bg-[#87cefa]" },
];

function getColorPool(): ColorDef[] {
  return ALL_COLORS;
}

interface Round {
  correctColor: ColorDef;
  options: ColorDef[];
}

function generateRound(): Round {
  const pool = getColorPool();
  const shuffled = shuffle(pool);
  const options = shuffled.slice(0, 4);
  const correctColor = options[Math.floor(Math.random() * 4)];
  return { correctColor, options };
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function speakColor(colorName: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(colorName);
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

function ColorGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState<Round>(() => generateRound());
  const [selectedOption, setSelectedOption] = useState<ColorDef | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    speakColor(round.correctColor.name);
  }, [round]);

  const nextRound = useCallback(() => {
    const r = generateRound();
    setRound(r);
    setSelectedOption(null);
    setIsCorrect(null);
  }, []);

  const handleAnswer = useCallback(
    (color: ColorDef) => {
      if (selectedOption !== null) return;

      setSelectedOption(color);
      const correct = color.name === round.correctColor.name;
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
              nextRound();
            }
          } else {
            setCorrectCount(newCount);
            nextRound();
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
        }, 800);
      }
    },
    [selectedOption, round.correctColor.name, correctCount, level, nextRound]
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
            nextRound();
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
          משחק צבעים
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
                nextRound();
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

      {/* Main content area - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-6 sm:gap-8">
        {/* Speaker button */}
        <button
          onClick={() => speakColor(round.correctColor.name)}
          className="bg-white rounded-3xl shadow-lg px-12 py-6 sm:px-16 sm:py-8 hover:shadow-xl transition-shadow"
        >
          <span className="text-6xl sm:text-7xl">🔊</span>
          {!window.speechSynthesis && (
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {round.correctColor.name}
            </p>
          )}
        </button>

        {/* Color options - single row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-lg">
          {round.options.map((color, i) => {
            let extraClass = "";

            if (selectedOption !== null) {
              if (isCorrect && color.name === round.correctColor.name) {
                extraClass = "ring-4 ring-green-300 scale-110";
              } else if (color.name === selectedOption.name && !isCorrect) {
                extraClass = "ring-4 ring-red-300 animate-shake";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(color)}
                disabled={selectedOption !== null}
                className={`aspect-square rounded-2xl shadow-lg transition-all ${color.bg} ${color.hover} ${extraClass} disabled:opacity-80`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ColorGame;
