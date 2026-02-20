import { useState, useCallback } from "react";

const LEVELS = 20;
const PROBLEMS_PER_LEVEL = 5;

interface Problem {
  a: number;
  b: number;
  operator: "+" | "-";
  answer: number;
}

function getLevelConfig(level: number) {
  if (level <= 3) return { maxSum: 5, minAnswer: 0, minOperand: 0, allowSubtract: false };
  if (level <= 8) return { maxSum: 10, minAnswer: 0, minOperand: 0, allowSubtract: false };
  if (level <= 15) return { maxSum: 10, minAnswer: 0, minOperand: 0, allowSubtract: true };
  return { maxSum: 20, minAnswer: 11, minOperand: 2, allowSubtract: false };
}

function generateProblem(level: number): Problem {
  const { maxSum, minAnswer, minOperand, allowSubtract } = getLevelConfig(level);
  const operator = allowSubtract && Math.random() < 0.5 ? "-" : "+";

  // 95% chance to use at least 1 (rarely allows 0)
  const effectiveMin = minOperand === 0 && Math.random() < 0.95 ? 1 : minOperand;

  if (operator === "+") {
    const a = effectiveMin + Math.floor(Math.random() * (maxSum - effectiveMin + 1));
    const bMin = Math.max(effectiveMin, minAnswer - a);
    const bMax = maxSum - a;
    if (bMin > bMax) return generateProblem(level);
    const b = bMin + Math.floor(Math.random() * (bMax - bMin + 1));
    return { a, b, operator, answer: a + b };
  } else {
    const a = effectiveMin + Math.floor(Math.random() * (maxSum - effectiveMin + 1));
    const b = effectiveMin + Math.floor(Math.random() * (a - effectiveMin + 1));
    return { a, b, operator, answer: a - b };
  }
}

function generateOptions(correctAnswer: number, maxSum: number): number[] {
  const options = new Set<number>([correctAnswer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong =
      Math.random() < 0.5
        ? correctAnswer + offset
        : correctAnswer - offset;

    if (wrong >= 0 && wrong <= maxSum) {
      options.add(wrong);
    }
  }

  return shuffle([...options]);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playSound(type: "correct" | "wrong") {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } else {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(350, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  }
}

function getMaxSum(level: number): number {
  return getLevelConfig(level).maxSum;
}

const OPTION_COLORS = [
  { bg: "bg-blue-400", hover: "hover:bg-blue-500" },
  { bg: "bg-pink-400", hover: "hover:bg-pink-500" },
  { bg: "bg-yellow-400", hover: "hover:bg-yellow-500" },
  { bg: "bg-purple-400", hover: "hover:bg-purple-500" },
];

function MathGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(1));
  const [options, setOptions] = useState<number[]>(() => {
    const p = generateProblem(1);
    return generateOptions(p.answer, getMaxSum(1));
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  const nextProblem = useCallback((lvl: number) => {
    const p = generateProblem(lvl);
    setProblem(p);
    setOptions(generateOptions(p.answer, getMaxSum(lvl)));
    setSelectedOption(null);
    setIsCorrect(null);
  }, []);

  const handleAnswer = useCallback(
    (value: number) => {
      if (selectedOption !== null) return; // Already answered

      setSelectedOption(value);
      const correct = value === problem.answer;
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
              nextProblem(nextLevel);
            }
          } else {
            setCorrectCount(newCount);
            nextProblem(level);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
        }, 800);
      }
    },
    [selectedOption, problem.answer, correctCount, level, nextProblem]
  );

  if (completed) {
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center justify-center bg-gray-200 gap-6 sm:gap-8 p-4">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">!כל הכבוד</h1>
        <p className="text-xl sm:text-2xl text-gray-600">סיימת את כל השלבים</p>
        <button
          onClick={() => {
            setLevel(1);
            setCorrectCount(0);
            setCompleted(false);
            nextProblem(1);
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
    <div className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-4 sm:p-8" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-lg relative flex items-center justify-center mb-4 sm:mb-8">
        <button
          onClick={onBack}
          className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
        >
          → חזרה
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">משחק חשבון</h1>
      </div>

      {/* Level indicators */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-12 max-w-sm sm:max-w-lg">
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
                nextProblem(lvl);
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
      <div className="flex gap-2 mb-4 sm:mb-8">
        {Array.from({ length: PROBLEMS_PER_LEVEL }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
              i < correctCount ? "bg-green-400" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Problem display */}
      <div className="bg-white rounded-3xl shadow-lg px-16 py-12 mb-8 sm:mb-12">
        <p className="text-6xl font-bold text-gray-800 text-center" dir="ltr">
          {problem.a} {problem.operator} {problem.b} = ?
        </p>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {options.map((value, i) => {
          const color = OPTION_COLORS[i];
          let extraClass = "";

          if (selectedOption !== null) {
            if (isCorrect && value === problem.answer) {
              extraClass = "bg-green-500 hover:bg-green-500 ring-4 ring-green-300 scale-110";
            } else if (value === selectedOption && !isCorrect) {
              extraClass = "bg-red-500 hover:bg-red-500 ring-4 ring-red-300 animate-shake";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(value)}
              disabled={selectedOption !== null}
              className={`w-36 h-36 rounded-2xl text-white text-5xl font-bold shadow-lg transition-all ${
                extraClass || `${color.bg} ${color.hover}`
              } disabled:opacity-80`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MathGame;
