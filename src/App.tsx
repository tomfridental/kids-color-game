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
      <div className="flex flex-wrap justify-center gap-8 sm:gap-20">
        <button
          onClick={() => setScreen("math")}
          className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-blue-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-blue-500 transition-colors"
        >
          חשבון
        </button>
        <button
          onClick={() => setScreen("color")}
          className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-pink-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-pink-500 transition-colors"
        >
          צבעים
        </button>
        <button
          onClick={() => setScreen("tictactoe")}
          className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-green-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-green-500 transition-colors"
        >
          איקס עיגול
        </button>
      </div>
    </div>
  );
}

export default App;
