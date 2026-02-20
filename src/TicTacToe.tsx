import { useState, useCallback } from "react";

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

  // 70% of the time, just pick a random spot
  if (Math.random() < 0.7) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // 30% of the time, play smart: block player win or take a win
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

function TicTacToe({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setWinLine(null);
    setResult(null);
    setLocked(false);
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || gameOver || locked) return;

      const newBoard = [...board];
      newBoard[index] = "X";
      playSound("place");

      // Check if player won
      const { winner: playerWin, line: playerLine } = checkWinner(newBoard);
      if (playerWin) {
        setBoard(newBoard);
        setGameOver(true);
        setWinLine(playerLine);
        setResult("win");
        setScore((s) => ({ ...s, wins: s.wins + 1 }));
        playSound("correct");
        return;
      }

      // Check for draw after player move
      if (isBoardFull(newBoard)) {
        setBoard(newBoard);
        setGameOver(true);
        setResult("draw");
        setScore((s) => ({ ...s, draws: s.draws + 1 }));
        return;
      }

      // Computer's turn
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
          setResult("lose");
          setScore((s) => ({ ...s, losses: s.losses + 1 }));
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
    [board, gameOver, locked]
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-200 p-4 sm:p-8" dir="rtl">
      {/* Header */}
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

      {/* Score */}
      <div className="flex gap-6 sm:gap-10 mb-6 sm:mb-10 text-base sm:text-lg font-bold">
        <span className="text-green-600">ניצחונות: {score.wins}</span>
        <span className="text-gray-500">תיקו: {score.draws}</span>
        <span className="text-red-500">הפסדים: {score.losses}</span>
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-10 w-[min(95vw,36rem)]">
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={!!cell || gameOver || locked}
              className={`aspect-square rounded-2xl text-[22vw] sm:text-9xl font-bold shadow-lg transition-all flex items-center justify-center ${
                isWinCell
                  ? result === "win"
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
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="text-3xl sm:text-4xl font-bold">
            {result === "win" && (
              <span className="text-green-600">🎉 ניצחת!</span>
            )}
            {result === "lose" && (
              <span className="text-red-500">😢 הפסדת</span>
            )}
            {result === "draw" && (
              <span className="text-gray-600">🤝 תיקו!</span>
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
          {locked ? "...תור המחשב" : "!תורך - שים X"}
        </p>
      )}
    </div>
  );
}

export default TicTacToe;
