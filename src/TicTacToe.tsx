import { useState, useCallback, useEffect } from "react";

type Cell = "X" | "O" | null;
type Board = Cell[];

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

function getComputerMove(board: Board): number {
  const available = board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i !== -1);

  // 40% of the time, just pick a random spot
  if (Math.random() < 0.4) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // 60% of the time, play smart: block player win or take a win
  for (const [a, b, c] of WINNING_LINES) {
    const cells = [board[a], board[b], board[c]];
    if (cells.filter((c) => c === "O").length === 2 && cells.includes(null)) {
      return [a, b, c][cells.indexOf(null)];
    }
  }

  for (const [a, b, c] of WINNING_LINES) {
    const cells = [board[a], board[b], board[c]];
    if (cells.filter((c) => c === "X").length === 2 && cells.includes(null)) {
      return [a, b, c][cells.indexOf(null)];
    }
  }

  return available[Math.floor(Math.random() * available.length)];
}

function playSound(type: "correct" | "wrong" | "place") {
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
  } else if (type === "wrong") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(350, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } else {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  }
}

type GameMode = "computer" | "friend";

function getModeFromHash(): GameMode | null {
  const sub = window.location.hash.replace("#", "").split("/")[1];
  if (sub === "computer" || sub === "friend") return sub;
  return null;
}

function TicTacToe({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<GameMode | null>(getModeFromHash);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [result, setResult] = useState<"X" | "O" | "draw" | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState({ x: 0, o: 0, draws: 0 });

  // Sync mode with hash
  useEffect(() => {
    const onHashChange = () => {
      const hashMode = getModeFromHash();
      setMode(hashMode);
      if (!hashMode) {
        setBoard(Array(9).fill(null));
        setIsXTurn(true);
        setGameOver(false);
        setWinLine(null);
        setResult(null);
        setLocked(false);
        setScore({ x: 0, o: 0, draws: 0 });
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectMode = useCallback((m: GameMode) => {
    window.location.hash = `tictactoe/${m}`;
    setMode(m);
  }, []);

  const backToModeSelect = useCallback(() => {
    window.location.hash = "tictactoe";
    setMode(null);
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setGameOver(false);
    setWinLine(null);
    setResult(null);
    setLocked(false);
    setScore({ x: 0, o: 0, draws: 0 });
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setGameOver(false);
    setWinLine(null);
    setResult(null);
    setLocked(false);
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || gameOver || locked) return;

      const currentMark: Cell = mode === "computer" ? "X" : isXTurn ? "X" : "O";
      const newBoard = [...board];
      newBoard[index] = currentMark;
      playSound("place");

      // Check if current player won
      const { winner, line } = checkWinner(newBoard);
      if (winner) {
        setBoard(newBoard);
        setGameOver(true);
        setWinLine(line);
        setResult(winner);
        setScore((s) => winner === "X" ? { ...s, x: s.x + 1 } : { ...s, o: s.o + 1 });
        playSound("correct");
        return;
      }

      // Check for draw
      if (isBoardFull(newBoard)) {
        setBoard(newBoard);
        setGameOver(true);
        setResult("draw");
        setScore((s) => ({ ...s, draws: s.draws + 1 }));
        return;
      }

      if (mode === "friend") {
        // Two-player: just switch turns
        setBoard(newBoard);
        setIsXTurn(!isXTurn);
        return;
      }

      // Computer mode: computer's turn
      setBoard(newBoard);
      setLocked(true);

      setTimeout(() => {
        const computerMove = getComputerMove(newBoard);
        const afterComputer = [...newBoard];
        afterComputer[computerMove] = "O";
        playSound("place");

        const { winner: compWin, line: compLine } = checkWinner(afterComputer);
        if (compWin) {
          setBoard(afterComputer);
          setGameOver(true);
          setWinLine(compLine);
          setResult("O");
          setScore((s) => ({ ...s, o: s.o + 1 }));
          playSound("wrong");
          setLocked(false);
          return;
        }

        if (isBoardFull(afterComputer)) {
          setBoard(afterComputer);
          setGameOver(true);
          setResult("draw");
          setScore((s) => ({ ...s, draws: s.draws + 1 }));
          setLocked(false);
          return;
        }

        setBoard(afterComputer);
        setLocked(false);
      }, 500);
    },
    [board, gameOver, locked, mode, isXTurn]
  );

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-4 sm:p-8" dir="rtl">
        <div className="w-full max-w-lg relative flex items-center justify-center mb-4 sm:mb-8">
          <button
            onClick={onBack}
            className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
          >
            → חזרה
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
            איקס עיגול
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8">
          <button
            onClick={() => selectMode("computer")}
            className="w-56 sm:w-72 py-6 sm:py-8 rounded-2xl bg-green-400 text-white text-2xl sm:text-3xl font-bold shadow-lg hover:bg-green-500 transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-4xl sm:text-5xl">🤖</span>
            נגד המחשב
          </button>
          <button
            onClick={() => selectMode("friend")}
            className="w-56 sm:w-72 py-6 sm:py-8 rounded-2xl bg-blue-400 text-white text-2xl sm:text-3xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-4xl sm:text-5xl">👫</span>
            נגד חבר
          </button>
        </div>
      </div>
    );
  }

  const isWinX = result === "X";
  const isWinO = result === "O";

  return (
    <div className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-4 sm:p-8" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-lg relative flex items-center justify-center mb-4 sm:mb-8">
        <button
          onClick={backToModeSelect}
          className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
        >
          → חזרה
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
          איקס עיגול
        </h1>
      </div>

      {/* Score */}
      <div className="flex gap-6 sm:gap-10 mb-4 sm:mb-6 text-base sm:text-lg font-bold">
        {mode === "computer" ? (
          <>
            <span className="text-green-600">ניצחונות: {score.x}</span>
            <span className="text-gray-500">תיקו: {score.draws}</span>
            <span className="text-red-500">הפסדים: {score.o}</span>
          </>
        ) : (
          <>
            <span className="text-blue-500">X: {score.x}</span>
            <span className="text-gray-500">תיקו: {score.draws}</span>
            <span className="text-pink-500">O: {score.o}</span>
          </>
        )}
      </div>

      {/* Main content area - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-4 sm:gap-6">
        {/* Board */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-[min(95vw,24rem)]">
          {board.map((cell, i) => {
            const isWinCell = winLine?.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={!!cell || gameOver || locked}
                className={`aspect-square rounded-2xl text-[14vw] sm:text-8xl font-bold shadow-lg transition-all flex items-center justify-center overflow-hidden leading-none ${
                  isWinCell
                    ? isWinX
                      ? "bg-green-400 ring-4 ring-green-300 scale-105"
                      : "bg-red-400 ring-4 ring-red-300 scale-105"
                    : cell
                      ? "bg-white"
                      : "bg-white hover:bg-gray-100 hover:scale-105"
                } disabled:cursor-default`}
              >
                {cell === "X" && (
                  <span className="text-blue-500">X</span>
                )}
                {cell === "O" && (
                  <span className="text-pink-500">O</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Game result */}
        {gameOver && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl sm:text-4xl font-bold">
              {result === "draw" && (
                <span className="text-gray-600">🤝 תיקו!</span>
              )}
              {mode === "computer" && isWinX && (
                <span className="text-green-600">🎉 ניצחת!</span>
              )}
              {mode === "computer" && isWinO && (
                <span className="text-red-500">😢 הפסדת</span>
              )}
              {mode === "friend" && isWinX && (
                <span className="text-blue-500">🎉 !X ניצח</span>
              )}
              {mode === "friend" && isWinO && (
                <span className="text-pink-500">🎉 !O ניצח</span>
              )}
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-green-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-green-500 transition-colors"
            >
              שחק שוב
            </button>
          </div>
        )}

        {/* Turn indicator */}
        {!gameOver && (
          <p className="text-lg sm:text-xl text-gray-500 font-bold">
            {mode === "computer"
              ? locked ? "...תור המחשב" : "!תורך - שים X"
              : isXTurn ? "X תור" : "O תור"
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default TicTacToe;
