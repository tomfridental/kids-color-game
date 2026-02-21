import { useState, useCallback } from "react";

// --- Types ---

interface Suspect {
  id: number;
  emoji: string;
  name: string;
  items: number[];
  revealed: boolean;
  eliminated: boolean;
}

interface Clue {
  id: number;
  text: string;
  itemEmoji: string;
  revealed: boolean;
}

type DieResult = "suspect" | "clue";
type GamePhase = "rolling" | "picking-suspects" | "guessing" | "won" | "lost";

// --- Constants ---

const SUSPECT_DATA: { emoji: string; name: string }[] = [
  { emoji: "🧙‍♂️", name: "הקוסם" },
  { emoji: "🧛", name: "הערפד" },
  { emoji: "🤡", name: "הליצן" },
  { emoji: "🧜‍♀️", name: "בת הים" },
  { emoji: "🦹", name: "גיבור העל" },
  { emoji: "👻", name: "הרוח" },
  { emoji: "🤖", name: "הרובוט" },
  { emoji: "🧚", name: "הפיה" },
  { emoji: "🏴‍☠️", name: "הפיראט" },
  { emoji: "🥷", name: "הנינג'ה" },
  { emoji: "👽", name: "החייזר" },
  { emoji: "🧝", name: "השדון" },
];

const ITEMS: { emoji: string; name: string }[] = [
  { emoji: "🎩", name: "כובע" },
  { emoji: "⌚", name: "שעון" },
  { emoji: "🪄", name: "שרביט" },
  { emoji: "👓", name: "משקפיים" },
  { emoji: "🔑", name: "מפתח" },
  { emoji: "💍", name: "טבעת" },
  { emoji: "📕", name: "ספר" },
  { emoji: "👑", name: "כתר" },
  { emoji: "🧣", name: "צעיף" },
  { emoji: "🛡️", name: "מגן" },
];

const MAX_FOX_STEPS = 30;
const FOX_FAIL_PENALTY = 3;
const FOX_WRONG_GUESS_PENALTY = 5;

// --- Helpers ---

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGame() {
  const itemIndices = Array.from({ length: ITEMS.length }, (_, i) => i);

  const suspects: Suspect[] = SUSPECT_DATA.map((s, idx) => {
    const suspectItems: number[] = [];
    const available = shuffle(itemIndices);
    for (const item of available) {
      if (suspectItems.length >= 3) break;
      suspectItems.push(item);
    }
    return {
      id: idx,
      emoji: s.emoji,
      name: s.name,
      items: suspectItems.sort((a, b) => a - b),
      revealed: false,
      eliminated: false,
    };
  });

  // Ensure each suspect has a unique item combination
  const seen = new Set<string>();
  for (const suspect of suspects) {
    let key = suspect.items.join(",");
    while (seen.has(key)) {
      suspect.items = shuffle(itemIndices).slice(0, 3).sort((a, b) => a - b);
      key = suspect.items.join(",");
    }
    seen.add(key);
  }

  // Pick a random thief
  const thiefId = Math.floor(Math.random() * 12);
  const thief = suspects[thiefId];

  // Reveal 2 random suspects at the start (not the thief)
  const nonThiefIndices = shuffle(
    suspects.filter((s) => s.id !== thiefId).map((s) => s.id)
  );
  suspects[nonThiefIndices[0]].revealed = true;
  suspects[nonThiefIndices[1]].revealed = true;

  // Generate clues based on thief's items
  const clues: Clue[] = [];
  let clueId = 0;

  // Positive clues: "The thief has [item]"
  for (const itemIdx of thief.items) {
    clues.push({
      id: clueId++,
      text: `לגנב יש ${ITEMS[itemIdx].name}`,
      itemEmoji: ITEMS[itemIdx].emoji,
      revealed: false,
    });
  }

  // Negative clues: "The thief doesn't have [item]"
  for (let i = 0; i < ITEMS.length; i++) {
    if (!thief.items.includes(i)) {
      clues.push({
        id: clueId++,
        text: `לגנב אין ${ITEMS[i].name}`,
        itemEmoji: ITEMS[i].emoji,
        revealed: false,
      });
    }
  }

  return { suspects, thiefId, clues: shuffle(clues) };
}

function playSound(type: "roll" | "reveal" | "eliminate" | "wrong" | "win" | "lose") {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case "roll":
      osc.type = "square";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(400, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      break;
    case "reveal":
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      break;
    case "eliminate":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      break;
    case "wrong":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      break;
    case "win":
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
      break;
    case "lose":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
      break;
  }
}

// --- Component ---

export default function DetectiveGame({ onBack }: { onBack: () => void }) {
  const [{ suspects: initSuspects, clues: initClues, thiefId: initThiefId }] = useState(() => generateGame());
  const [suspects, setSuspects] = useState<Suspect[]>(initSuspects);
  const [clues, setClues] = useState<Clue[]>(initClues);
  const [thiefId, setThiefId] = useState(initThiefId);
  const [foxSteps, setFoxSteps] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("rolling");

  // Dice state — player picks target (suspect/clue), non-matching dice auto-reroll
  const [diceTarget, setDiceTarget] = useState<DieResult | null>(null);
  const [dice, setDice] = useState<[DieResult, DieResult, DieResult]>(["suspect", "clue", "suspect"]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isRolling, setIsRolling] = useState(false);
  const [diceDisplay, setDiceDisplay] = useState<[string, string, string]>(["🎲", "🎲", "🎲"]);

  // Picking suspects state
  const [picksLeft, setPicksLeft] = useState(0);

  // Message
  const [message, setMessage] = useState("");

  const showMessage = useCallback((msg: string, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }, []);

  const advanceFox = useCallback(
    (steps: number) => {
      setFoxSteps((prev) => {
        const next = Math.min(prev + steps, MAX_FOX_STEPS);
        if (next >= MAX_FOX_STEPS) {
          setTimeout(() => {
            playSound("lose");
            setPhase("lost");
          }, 300);
        }
        return next;
      });
    },
    []
  );

  const startNewTurn = useCallback(() => {
    setRollsLeft(3);
    setDiceTarget(null);
    setDice(["suspect", "clue", "suspect"]);
    setDiceDisplay(["🎲", "🎲", "🎲"]);
    setPhase("rolling");
  }, []);

  const rollDice = useCallback((target: DieResult) => {
    if (isRolling || rollsLeft <= 0) return;
    setIsRolling(true);
    if (!diceTarget) setDiceTarget(target);
    playSound("roll");

    const icons = ["🕵️", "🔍"];
    const toIcon = (d: DieResult) => (d === "suspect" ? "🕵️" : "🔍");
    const randomDie = (): DieResult => (Math.random() < 0.5 ? "suspect" : "clue");

    // On re-rolls, only non-matching dice spin
    const alreadyMatched = dice.map((d) => d === target);
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceDisplay([
        alreadyMatched[0] ? toIcon(target) : icons[Math.floor(Math.random() * 2)],
        alreadyMatched[1] ? toIcon(target) : icons[Math.floor(Math.random() * 2)],
        alreadyMatched[2] ? toIcon(target) : icons[Math.floor(Math.random() * 2)],
      ]);
      ticks++;
      if (ticks >= 10) clearInterval(interval);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const newDice: [DieResult, DieResult, DieResult] = [
        alreadyMatched[0] ? target : randomDie(),
        alreadyMatched[1] ? target : randomDie(),
        alreadyMatched[2] ? target : randomDie(),
      ];
      setDice(newDice);
      setDiceDisplay([toIcon(newDice[0]), toIcon(newDice[1]), toIcon(newDice[2])]);
      const newRollsLeft = rollsLeft - 1;
      setRollsLeft(newRollsLeft);
      setIsRolling(false);

      // Check if all 3 match the target
      const allMatch = newDice.every((d) => d === target);
      if (allMatch) {
        if (target === "suspect") {
          const faceDown = suspects.filter((s) => !s.revealed);
          if (faceDown.length === 0) {
            showMessage("כל החשודים כבר נחשפו!");
            startNewTurn();
          } else {
            const picks = Math.min(2, faceDown.length);
            setPicksLeft(picks);
            setPhase("picking-suspects");
            showMessage(`בחר ${picks} חשודים לחשוף`);
          }
        } else {
          const unrevealed = clues.filter((c) => !c.revealed);
          if (unrevealed.length === 0) {
            showMessage("כל הרמזים כבר נחשפו!");
            startNewTurn();
          } else {
            const clue = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            setClues((prev) =>
              prev.map((c) => (c.id === clue.id ? { ...c, revealed: true } : c))
            );
            playSound("reveal");
            showMessage(`${clue.itemEmoji} ${clue.text}`);
            setTimeout(() => startNewTurn(), 1500);
          }
        }
      } else if (newRollsLeft <= 0) {
        showMessage("!הגנב ברח קצת 🦊");
        advanceFox(FOX_FAIL_PENALTY);
        setTimeout(() => startNewTurn(), 1200);
      }
    }, 800);
  }, [isRolling, rollsLeft, diceTarget, dice, suspects, clues, advanceFox, showMessage, startNewTurn]);

  const pickSuspect = (id: number) => {
    if (phase !== "picking-suspects" || picksLeft <= 0) return;
    const suspect = suspects.find((s) => s.id === id);
    if (!suspect || suspect.revealed) return;

    playSound("reveal");
    setSuspects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, revealed: true } : s))
    );
    const remaining = picksLeft - 1;
    setPicksLeft(remaining);

    if (remaining <= 0) {
      setTimeout(() => startNewTurn(), 800);
    }
  };

  const toggleEliminate = (id: number) => {
    if (phase !== "rolling") return;
    const suspect = suspects.find((s) => s.id === id);
    if (!suspect || !suspect.revealed) return;
    playSound("eliminate");
    setSuspects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, eliminated: !s.eliminated } : s))
    );
  };

  const startGuess = () => {
    setPhase("guessing");
  };

  const makeGuess = (id: number) => {
    if (id === thiefId) {
      playSound("win");
      setPhase("won");
    } else {
      playSound("wrong");
      showMessage("!לא נכון, זה לא הגנב");
      advanceFox(FOX_WRONG_GUESS_PENALTY);
      setTimeout(() => setPhase("rolling"), 1500);
    }
  };

  const resetGame = () => {
    const data = generateGame();
    setSuspects(data.suspects);
    setClues(data.clues);
    setThiefId(data.thiefId);
    setFoxSteps(0);
    setPhase("rolling");
    setRollsLeft(3);
    setDiceTarget(null);
    setDice(["suspect", "clue", "suspect"]);
    setDiceDisplay(["🎲", "🎲", "🎲"]);
    setPicksLeft(0);
    setMessage("");
  };

  // --- Win Screen ---
  if (phase === "won") {
    const thief = suspects.find((s) => s.id === thiefId)!;
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center justify-center bg-gray-200 gap-4 sm:gap-6 p-4" dir="rtl">
        <div className="text-5xl sm:text-6xl">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600">!תפסת את הגנב</h1>
        <div className="text-6xl sm:text-7xl">{thief.emoji}</div>
        <p className="text-xl sm:text-2xl text-gray-700 font-bold">{thief.name}</p>
        <p className="text-base sm:text-lg text-gray-500">
          עם {thief.items.map((i) => ITEMS[i].emoji).join(" ")}
        </p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-xl bg-green-500 text-white text-lg font-bold shadow-lg hover:bg-green-600 transition-colors"
          >
            שחק שוב
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-gray-400 text-white text-lg font-bold shadow-lg hover:bg-gray-500 transition-colors"
          >
            חזרה לתפריט
          </button>
        </div>
      </div>
    );
  }

  // --- Lose Screen ---
  if (phase === "lost") {
    const thief = suspects.find((s) => s.id === thiefId)!;
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center justify-center bg-gray-200 gap-4 sm:gap-6 p-4" dir="rtl">
        <div className="text-5xl sm:text-6xl">🦊💨</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-red-500">!הגנב ברח</h1>
        <p className="text-lg sm:text-xl text-gray-600">:הגנב היה</p>
        <div className="text-6xl sm:text-7xl">{thief.emoji}</div>
        <p className="text-xl sm:text-2xl text-gray-700 font-bold">{thief.name}</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-xl bg-green-500 text-white text-lg font-bold shadow-lg hover:bg-green-600 transition-colors"
          >
            שחק שוב
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-gray-400 text-white text-lg font-bold shadow-lg hover:bg-gray-500 transition-colors"
          >
            חזרה לתפריט
          </button>
        </div>
      </div>
    );
  }

  // --- Guess Screen ---
  if (phase === "guessing") {
    const nonEliminated = suspects.filter((s) => !s.eliminated);
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-3 sm:p-6" dir="rtl">
        <div className="w-full max-w-lg relative flex items-center justify-center mb-3">
          <button
            onClick={() => setPhase("rolling")}
            className="absolute right-0 px-3 py-1.5 rounded-xl bg-gray-400 text-white text-sm font-bold shadow hover:bg-gray-500 transition-colors"
          >
            → חזרה
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700">?מי הגנב</h1>
        </div>
        <p className="text-base sm:text-lg text-gray-500 mb-4">בחר את החשוד</p>
        <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-lg">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {nonEliminated.map((s) => (
              <button
                key={s.id}
                onClick={() => makeGuess(s.id)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-md hover:bg-yellow-100 transition-colors aspect-square"
              >
                <span className="text-3xl sm:text-4xl">{s.emoji}</span>
                <span className="text-xs sm:text-sm font-bold text-gray-700 mt-1">{s.name}</span>
                {s.revealed && (
                  <span className="text-xs mt-0.5">
                    {s.items.map((i) => ITEMS[i].emoji).join("")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Main Game Screen ---
  const hasClues = clues.filter((c) => c.revealed && c.text.includes("יש"));
  const hasNotClues = clues.filter((c) => c.revealed && c.text.includes("אין"));
  const totalRevealed = clues.filter((c) => c.revealed).length;

  return (
    <div className="h-dvh overflow-hidden flex flex-row bg-gray-200" dir="rtl">
      {/* Clues Sidebar */}
      <div className="w-44 sm:w-56 flex-shrink-0 flex flex-col border-l border-gray-300 bg-gray-100 overflow-y-auto">
        {/* Has items column */}
        <div className="flex-1 p-2.5 sm:p-3 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-bold text-green-700 mb-2 text-center">✅ יש לגנב</h3>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {hasClues.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-lg text-sm sm:text-base font-medium text-green-800"
              >
                <span className="text-lg sm:text-xl">{c.itemEmoji}</span> {c.text.replace("לגנב יש ", "")}
              </span>
            ))}
          </div>
        </div>
        {/* Doesn't have items column */}
        <div className="flex-1 p-2.5 sm:p-3">
          <h3 className="text-sm sm:text-base font-bold text-red-700 mb-2 text-center">❌ אין לגנב</h3>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {hasNotClues.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-lg text-sm sm:text-base font-medium text-red-800"
              >
                <span className="text-lg sm:text-xl">{c.itemEmoji}</span> {c.text.replace("לגנב אין ", "")}
              </span>
            ))}
          </div>
        </div>
        <div className="p-1.5 text-center text-xs sm:text-sm text-gray-400">
          {totalRevealed}/{clues.length} רמזים
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col items-center p-2 sm:p-4 overflow-hidden">
        {/* Header */}
        <div className="w-full max-w-lg relative flex items-center justify-center mb-1 sm:mb-2">
          <button
            onClick={onBack}
            className="absolute right-0 px-3 py-1.5 rounded-xl bg-gray-400 text-white text-sm font-bold shadow hover:bg-gray-500 transition-colors"
          >
            → חזרה
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-700">🔍 בלש</h1>
        </div>

        {/* Fox Progress Bar */}
        <div className="w-full max-w-lg mb-2 sm:mb-3">
          <div className="relative bg-gray-300 rounded-full h-6 sm:h-8 overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-red-400 transition-all duration-500 rounded-full"
              style={{ width: `${(foxSteps / MAX_FOX_STEPS) * 100}%` }}
            />
            <div
              className="absolute top-0 text-sm sm:text-lg transition-all duration-500"
              style={{
                right: `${(foxSteps / MAX_FOX_STEPS) * 100}%`,
                transform: "translateX(50%) translateY(-1px)",
              }}
            >
              🦊
            </div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs sm:text-sm">🏠</div>
          </div>
        </div>

        {/* Dice Area */}
        <div className="w-full max-w-lg flex flex-col items-center gap-1 sm:gap-2 mb-2">
          {/* Message */}
          <div className="h-5 sm:h-7 flex items-center justify-center">
            <p
              className={`text-sm sm:text-base font-bold text-center transition-opacity duration-300 ${
                message ? "opacity-100 text-amber-600" : "opacity-0"
              }`}
            >
              {message || "\u00A0"}
            </p>
          </div>

          {/* 3 Dice display */}
          <div className="flex items-center gap-3 sm:gap-6">
            {([0, 1, 2] as const).map((i) => {
              const matched = diceTarget && dice[i] === diceTarget;
              return (
                <div
                  key={i}
                  className={`text-3xl sm:text-5xl transition-transform ${
                    isRolling && !matched ? "animate-shake" : ""
                  } ${matched ? "opacity-100" : diceTarget ? "opacity-60" : ""}`}
                >
                  {diceDisplay[i]}
                </div>
              );
            })}
          </div>

          {/* Roll actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {phase === "rolling" && rollsLeft > 0 && !isRolling && !diceTarget && (
              <>
                <button
                  onClick={() => rollDice("suspect")}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-500 text-white text-sm sm:text-base font-bold shadow-lg hover:bg-blue-600 transition-colors"
                >
                  🕵️ חשודים
                </button>
                <button
                  onClick={() => rollDice("clue")}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500 text-white text-sm sm:text-base font-bold shadow-lg hover:bg-amber-600 transition-colors"
                >
                  🔍 רמזים
                </button>
              </>
            )}
            {phase === "rolling" && rollsLeft > 0 && !isRolling && diceTarget && (
              <button
                onClick={() => rollDice(diceTarget)}
                className="px-5 py-2 sm:px-6 sm:py-3 rounded-xl bg-amber-500 text-white text-base sm:text-lg font-bold shadow-lg hover:bg-amber-600 transition-colors"
              >
                🎲 גלגל שוב ({rollsLeft}/3)
              </button>
            )}
            {phase === "picking-suspects" && (
              <p className="text-base sm:text-lg font-bold text-blue-600">
                בחר {picksLeft} חשודים לחשוף 👆
              </p>
            )}
          </div>

        </div>

        {/* Suspect Cards Grid - 3 per row, big cards */}
        <div className="w-full max-w-2xl flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {suspects.map((s) => (
              <div
                key={s.id}
                className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 aspect-square text-center ${
                  s.eliminated
                    ? "bg-gray-400 opacity-40 scale-90"
                    : s.revealed
                      ? "bg-white shadow-md"
                      : phase === "picking-suspects" && !s.revealed
                        ? "bg-yellow-300 shadow-lg animate-pulse cursor-pointer"
                        : "bg-blue-300 shadow"
                }`}
                onClick={() => {
                  if (phase === "picking-suspects" && !s.revealed) pickSuspect(s.id);
                }}
              >
                {s.revealed ? (
                  <>
                    <span className="text-4xl sm:text-6xl leading-none">{s.emoji}</span>
                    <span className="text-base sm:text-lg font-bold text-gray-600 leading-tight mt-1">
                      {s.name}
                    </span>
                    <span className="text-2xl sm:text-4xl leading-none mt-1">
                      {s.items.map((i) => ITEMS[i].emoji).join("")}
                    </span>
                    {/* Eliminate / restore button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEliminate(s.id);
                      }}
                      className={`absolute top-1 left-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-colors ${
                        s.eliminated
                          ? "bg-green-500 text-white"
                          : "bg-red-400 text-white hover:bg-red-500"
                      }`}
                    >
                      {s.eliminated ? "↩" : "✕"}
                    </button>
                  </>
                ) : (
                  <span className="text-6xl sm:text-9xl">❓</span>
                )}
                {s.eliminated && (
                  <span className="absolute inset-0 flex items-center justify-center text-6xl sm:text-9xl text-red-500 font-bold pointer-events-none">
                    ✕
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Guess Button - bottom */}
        {phase === "rolling" && !isRolling && (
          <button
            onClick={startGuess}
            className="w-full max-w-lg mt-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm sm:text-base font-bold shadow hover:bg-red-600 transition-colors flex-shrink-0"
          >
            !אני יודע מי הגנב 🦊
          </button>
        )}
      </div>
    </div>
  );
}
