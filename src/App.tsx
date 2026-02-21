import { useState, useEffect, useCallback } from "react";
import MathGame from "./Math";
import ColorGame from "./ColorGame";
import TicTacToe from "./TicTacToe";
import MemoryGame from "./MemoryGame";
import HebrewLetters from "./HebrewLetters";
import DetectiveGame from "./DetectiveGame";

type Screen = "home" | "math" | "color" | "tictactoe" | "memory" | "letters" | "detective";

const SCREENS = new Set<string>(["home", "math", "color", "tictactoe", "memory", "letters", "detective"]);

function getScreenFromHash(): Screen {
  const hash = window.location.hash.replace("#", "").split("/")[0];
  return SCREENS.has(hash) ? (hash as Screen) : "home";
}

function App() {
  const [screen, setScreen] = useState<Screen>(getScreenFromHash);

  const navigate = useCallback((s: Screen) => {
    window.location.hash = s === "home" ? "" : s;
    setScreen(s);
  }, []);

  useEffect(() => {
    const onHashChange = () => setScreen(getScreenFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (screen === "math") {
    return <MathGame onBack={() => navigate("home")} />;
  }

  if (screen === "color") {
    return <ColorGame onBack={() => navigate("home")} />;
  }

  if (screen === "tictactoe") {
    return <TicTacToe onBack={() => navigate("home")} />;
  }

  if (screen === "memory") {
    return <MemoryGame onBack={() => navigate("home")} />;
  }

  if (screen === "letters") {
    return <HebrewLetters onBack={() => navigate("home")} />;
  }

  if (screen === "detective") {
    return <DetectiveGame onBack={() => navigate("home")} />;
  }

  return (
    <div className="flex flex-col items-center bg-gray-200 px-4 pt-2 pb-4 sm:p-8 justify-center" style={{ height: "100dvh" }}>
      <img src="/logo.svg" alt="משחקי ילדים" className="w-64 sm:w-96 mb-6 sm:mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-8 w-full max-w-sm sm:max-w-2xl">
        <button
          onClick={() => navigate("math")}
          className="aspect-square rounded-2xl bg-blue-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">➕</span>
          <span>חשבון</span>
        </button>
        <button
          onClick={() => navigate("color")}
          className="aspect-square rounded-2xl bg-pink-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-pink-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">🎨</span>
          <span>צבעים</span>
        </button>
        <button
          onClick={() => navigate("tictactoe")}
          className="aspect-square rounded-2xl bg-green-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-green-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">❌⭕</span>
          <span>איקס עיגול</span>
        </button>
        <button
          onClick={() => navigate("memory")}
          className="aspect-square rounded-2xl bg-purple-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-purple-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">🧠</span>
          <span>זיכרון</span>
        </button>
        <button
          onClick={() => navigate("letters")}
          className="aspect-square rounded-2xl bg-orange-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-orange-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">🔤</span>
          <span>אותיות</span>
        </button>
        <button
          onClick={() => navigate("detective")}
          className="aspect-square rounded-2xl bg-red-400 text-white text-lg sm:text-2xl font-bold shadow-lg hover:bg-red-500 transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <span className="text-6xl opacity-90">🔍</span>
          <span>בלש</span>
        </button>
      </div>
    </div>
  );
}

export default App;
