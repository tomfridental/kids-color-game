import { useState } from "react";
import MathGame from "./Math";
import ColorGame from "./ColorGame";
import TicTacToe from "./TicTacToe";

type Screen = "home" | "math" | "color" | "tictactoe";

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 gap-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-700 mb-20">משחקי פרידנטל</h1>
      <div className="flex flex-wrap justify-start sm:justify-center gap-8 sm:gap-20 max-w-[26rem] sm:max-w-none">
        <button
          onClick={() => setScreen("math")}
          className="w-48 h-48 rounded-2xl bg-blue-400 text-white text-2xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-6xl opacity-90">➕</span>
          <span>חשבון</span>
        </button>
        <button
          onClick={() => setScreen("color")}
          className="w-48 h-48 rounded-2xl bg-pink-400 text-white text-2xl font-bold shadow-lg hover:bg-pink-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-6xl opacity-90">🎨</span>
          <span>צבעים</span>
        </button>
        <button
          onClick={() => setScreen("tictactoe")}
          className="w-48 h-48 rounded-2xl bg-green-400 text-white text-2xl font-bold shadow-lg hover:bg-green-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <span className="text-6xl opacity-90">❌⭕</span>
          <span>איקס עיגול</span>
        </button>
      </div>
    </div>
  );
}

export default App;
