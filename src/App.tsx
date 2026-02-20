import { useState } from "react";
import MathGame from "./Math";
import ColorGame from "./ColorGame";
import TicTacToe from "./TicTacToe";
import MemoryGame from "./MemoryGame";
import HebrewLetters from "./HebrewLetters";

type Screen = "home" | "math" | "color" | "tictactoe" | "memory" | "letters";

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  if (screen === "math") {
    return <MathGame onBack={() => setScreen("home")} />;
  }

  if (screen === "color") {
    return <ColorGame onBack={() => setScreen("home")} />;
  }

  if (screen === "tictactoe") {
    return <TicTacToe onBack={() => setScreen("home")} />;
  }

  if (screen === "memory") {
    return <MemoryGame onBack={() => setScreen("home")} />;
  }

  if (screen === "letters") {
    return <HebrewLetters onBack={() => setScreen("home")} />;
  }

  return (
    <div className="flex flex-col items-center bg-gray-200 px-4 pt-2 pb-4 sm:p-8 justify-center" style={{ height: "100dvh" }}>
      <h1 className="text-3xl sm:text-5xl font-bold text-gray-700 mb-6 sm:mb-20">
        משחקי פרידנטל
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-md sm:max-w-2xl">
        <button
          onClick={() => setScreen("math")}
          className="aspect-square rounded-2xl bg-blue-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-5xl sm:text-6xl opacity-90">➕</span>
          <span>חשבון</span>
        </button>
        <button
          onClick={() => setScreen("color")}
          className="aspect-square rounded-2xl bg-pink-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-pink-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-5xl sm:text-6xl opacity-90">🎨</span>
          <span>צבעים</span>
        </button>
        <button
          onClick={() => setScreen("tictactoe")}
          className="aspect-square rounded-2xl bg-green-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-green-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-5xl sm:text-6xl opacity-90">❌⭕</span>
          <span>איקס עיגול</span>
        </button>
        <button
          onClick={() => setScreen("memory")}
          className="aspect-square rounded-2xl bg-purple-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-purple-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-5xl sm:text-6xl opacity-90">🧠</span>
          <span>זיכרון</span>
        </button>
        <button
          onClick={() => setScreen("letters")}
          className="aspect-square rounded-2xl bg-orange-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-orange-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-5xl sm:text-6xl opacity-90">🔤</span>
          <span>אותיות</span>
        </button>
      </div>
    </div>
  );
}

export default App;
