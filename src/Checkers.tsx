import { useState, useCallback, useEffect, useMemo, useRef } from "react";

// ============================================================
// Types
// ============================================================

type Color = "pink" | "blue";
type Pos = [number, number];
type Piece = { id: number; color: Color; king: boolean };
type Square = Piece | null;
type Board = Square[][];
type Move = {
  from: Pos;
  to: Pos;
  captures: Pos[];
  crowned: boolean;
};
type Turn = { steps: Move[]; resultBoard: Board };
type Difficulty = "easy" | "medium" | "hard";
type GameMode = Difficulty | "friend";
type Snapshot = { board: Board; turn: Color };

// ============================================================
// Engine
// ============================================================

const SIZE = 8;
const DIRS: Pos[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const opposite = (c: Color): Color => (c === "pink" ? "blue" : "pink");
const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const isDark = (r: number, c: number) => (r + c) % 2 === 1;
const forwardDr = (color: Color) => (color === "pink" ? -1 : 1);
const crownRow = (color: Color) => (color === "pink" ? 0 : SIZE - 1);

function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((sq) => (sq ? { ...sq } : null)));
}

function initialBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  let id = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isDark(r, c)) continue;
      if (r < 3) b[r][c] = { id: id++, color: "blue", king: false };
      else if (r > 4) b[r][c] = { id: id++, color: "pink", king: false };
    }
  }
  return b;
}

// All single-jump captures from (r, c). `firstJump` true = forward-only for men.
function getCapturesFrom(board: Board, r: number, c: number, firstJump: boolean): Move[] {
  const piece = board[r][c];
  if (!piece) return [];
  const out: Move[] = [];

  if (piece.king) {
    for (const [dr, dc] of DIRS) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc) && !board[nr][nc]) {
        nr += dr;
        nc += dc;
      }
      if (!inBounds(nr, nc)) continue;
      const enemy = board[nr][nc];
      if (!enemy || enemy.color === piece.color) continue;
      const capR = nr;
      const capC = nc;
      nr += dr;
      nc += dc;
      while (inBounds(nr, nc) && !board[nr][nc]) {
        out.push({
          from: [r, c],
          to: [nr, nc],
          captures: [[capR, capC]],
          crowned: false,
        });
        nr += dr;
        nc += dc;
      }
    }
  } else {
    const allowed = firstJump
      ? DIRS.filter(([dr]) => dr === forwardDr(piece.color))
      : DIRS;
    for (const [dr, dc] of allowed) {
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (!inBounds(lr, lc)) continue;
      const mid = board[mr][mc];
      const landing = board[lr][lc];
      if (!mid || mid.color === piece.color || landing) continue;
      out.push({
        from: [r, c],
        to: [lr, lc],
        captures: [[mr, mc]],
        crowned: lr === crownRow(piece.color),
      });
    }
  }
  return out;
}

function getSimpleMovesFrom(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c];
  if (!piece) return [];
  const out: Move[] = [];
  if (piece.king) {
    for (const [dr, dc] of DIRS) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc) && !board[nr][nc]) {
        out.push({ from: [r, c], to: [nr, nc], captures: [], crowned: false });
        nr += dr;
        nc += dc;
      }
    }
  } else {
    const dr = forwardDr(piece.color);
    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc) || board[nr][nc]) continue;
      out.push({
        from: [r, c],
        to: [nr, nc],
        captures: [],
        crowned: nr === crownRow(piece.color),
      });
    }
  }
  return out;
}

function applyMove(board: Board, m: Move): Board {
  const nb = cloneBoard(board);
  const [fr, fc] = m.from;
  const [tr, tc] = m.to;
  const piece = nb[fr][fc]!;
  nb[fr][fc] = null;
  for (const [cr, cc] of m.captures) nb[cr][cc] = null;
  nb[tr][tc] = { id: piece.id, color: piece.color, king: piece.king || m.crowned };
  return nb;
}

function colorHasCaptures(board: Board, color: Color): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      if (getCapturesFrom(board, r, c, true).length > 0) return true;
    }
  }
  return false;
}

// Options for a player tapping a piece (single-step, with forced-capture rule per-color).
function getPieceOptions(board: Board, r: number, c: number, color: Color): Move[] {
  const piece = board[r][c];
  if (!piece || piece.color !== color) return [];
  const caps = getCapturesFrom(board, r, c, true);
  if (caps.length > 0) return caps;
  if (colorHasCaptures(board, color)) return [];
  return getSimpleMovesFrom(board, r, c);
}

// Full-turn enumeration for the AI. Each Turn carries the step sequence and final board.
function enumerateTurns(board: Board, color: Color): Turn[] {
  const turns: Turn[] = [];
  let anyCapture = false;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const firstCaps = getCapturesFrom(board, r, c, true);
      if (firstCaps.length > 0) {
        anyCapture = true;
        for (const cap of firstCaps) {
          const after = applyMove(board, cap);
          if (cap.crowned) {
            turns.push({ steps: [cap], resultBoard: after });
          } else {
            turns.push(...extendChain(after, cap.to, [cap]));
          }
        }
      }
    }
  }

  if (anyCapture) return turns;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const moves = getSimpleMovesFrom(board, r, c);
      for (const m of moves) {
        turns.push({ steps: [m], resultBoard: applyMove(board, m) });
      }
    }
  }
  return turns;
}

function extendChain(board: Board, pos: Pos, sofar: Move[]): Turn[] {
  const conts = getCapturesFrom(board, pos[0], pos[1], false);
  if (conts.length === 0) return [{ steps: sofar, resultBoard: board }];
  const out: Turn[] = [];
  for (const c of conts) {
    const after = applyMove(board, c);
    const next = [...sofar, c];
    if (c.crowned) out.push({ steps: next, resultBoard: after });
    else out.push(...extendChain(after, c.to, next));
  }
  return out;
}

function checkWinner(board: Board, toMove: Color): Color | null {
  let pink = 0;
  let blue = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === "pink") pink++;
      else blue++;
    }
  }
  if (pink === 0) return "blue";
  if (blue === 0) return "pink";
  if (enumerateTurns(board, toMove).length === 0) return opposite(toMove);
  return null;
}

// ============================================================
// AI
// ============================================================

function evalBoard(board: Board, forColor: Color): number {
  let s = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const v = p.king ? 3 : 1;
      s += p.color === forColor ? v : -v;
    }
  }
  return s;
}

function minimax(
  board: Board,
  toMove: Color,
  aiColor: Color,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const turns = enumerateTurns(board, toMove);
  if (turns.length === 0) return toMove === aiColor ? -10000 : 10000;
  if (depth === 0) return evalBoard(board, aiColor);
  if (toMove === aiColor) {
    let best = -Infinity;
    for (const t of turns) {
      const s = minimax(t.resultBoard, opposite(toMove), aiColor, depth - 1, alpha, beta);
      if (s > best) best = s;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const t of turns) {
      const s = minimax(t.resultBoard, opposite(toMove), aiColor, depth - 1, alpha, beta);
      if (s < best) best = s;
      if (best < beta) beta = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chooseAITurn(board: Board, color: Color, difficulty: Difficulty): Turn | null {
  const turns = enumerateTurns(board, color);
  if (turns.length === 0) return null;
  if (difficulty === "easy") return pickRandom(turns);

  if (difficulty === "medium") {
    let best = -Infinity;
    const bests: Turn[] = [];
    for (const t of turns) {
      const s = evalBoard(t.resultBoard, color);
      if (s > best) {
        best = s;
        bests.length = 0;
        bests.push(t);
      } else if (s === best) bests.push(t);
    }
    return pickRandom(bests);
  }

  // hard — minimax depth 4
  const depth = 4;
  let best = -Infinity;
  const bests: Turn[] = [];
  for (const t of turns) {
    const s = minimax(t.resultBoard, opposite(color), color, depth - 1, -Infinity, Infinity);
    if (s > best) {
      best = s;
      bests.length = 0;
      bests.push(t);
    } else if (s === best) bests.push(t);
  }
  return pickRandom(bests);
}

// ============================================================
// Sound
// ============================================================

function playSound(type: "move" | "capture" | "king" | "win") {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t0 = ctx.currentTime;

  if (type === "move") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t0);
    gain.gain.setValueAtTime(0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.12);
    osc.start();
    osc.stop(t0 + 0.12);
  } else if (type === "capture") {
    osc.type = "square";
    osc.frequency.setValueAtTime(660, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.18);
    gain.gain.setValueAtTime(0.22, t0);
    gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.22);
    osc.start();
    osc.stop(t0 + 0.22);
  } else if (type === "king") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, t0);
    osc.frequency.setValueAtTime(659, t0 + 0.08);
    osc.frequency.setValueAtTime(784, t0 + 0.16);
    osc.frequency.setValueAtTime(1046, t0 + 0.24);
    gain.gain.setValueAtTime(0.25, t0);
    gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.4);
    osc.start();
    osc.stop(t0 + 0.4);
  } else {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(523, t0);
    osc.frequency.setValueAtTime(659, t0 + 0.12);
    osc.frequency.setValueAtTime(784, t0 + 0.24);
    osc.frequency.setValueAtTime(1046, t0 + 0.36);
    gain.gain.setValueAtTime(0.3, t0);
    gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.6);
    osc.start();
    osc.stop(t0 + 0.6);
  }
}

// ============================================================
// Component
// ============================================================

const AI_COLOR: Color = "blue";

function getModeFromHash(): GameMode | null {
  const sub = window.location.hash.replace("#", "").split("/")[1];
  if (sub === "easy" || sub === "medium" || sub === "hard" || sub === "friend") return sub;
  return null;
}

function Checkers({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<GameMode | null>(getModeFromHash);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<Color>("pink");
  const [selected, setSelected] = useState<Pos | null>(null);
  const [chainSquare, setChainSquare] = useState<Pos | null>(null);
  const [history, setHistory] = useState<Snapshot[]>(() => [
    { board: initialBoard(), turn: "pink" },
  ]);
  const [winner, setWinner] = useState<Color | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const aiTimers = useRef<number[]>([]);

  const isAIMode = mode === "easy" || mode === "medium" || mode === "hard";

  const clearAITimers = useCallback(() => {
    aiTimers.current.forEach((id) => window.clearTimeout(id));
    aiTimers.current = [];
  }, []);

  const resetGame = useCallback(() => {
    clearAITimers();
    const fresh = initialBoard();
    setBoard(fresh);
    setTurn("pink");
    setSelected(null);
    setChainSquare(null);
    setHistory([{ board: fresh, turn: "pink" }]);
    setWinner(null);
    setAiThinking(false);
  }, [clearAITimers]);

  // Sync mode with hash and reset state when mode changes via hash
  useEffect(() => {
    const onHashChange = () => {
      const m = getModeFromHash();
      setMode(m);
      clearAITimers();
      const fresh = initialBoard();
      setBoard(fresh);
      setTurn("pink");
      setSelected(null);
      setChainSquare(null);
      setHistory([{ board: fresh, turn: "pink" }]);
      setWinner(null);
      setAiThinking(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [clearAITimers]);

  useEffect(() => () => clearAITimers(), [clearAITimers]);

  const selectMode = useCallback((m: GameMode) => {
    window.location.hash = `checkers/${m}`;
    setMode(m);
  }, []);

  const backToModeSelect = useCallback(() => {
    clearAITimers();
    window.location.hash = "checkers";
    setMode(null);
    const fresh = initialBoard();
    setBoard(fresh);
    setTurn("pink");
    setSelected(null);
    setChainSquare(null);
    setHistory([{ board: fresh, turn: "pink" }]);
    setWinner(null);
    setAiThinking(false);
  }, [clearAITimers]);

  // Highlighted destinations under the current selection (or chain).
  const legalDests = useMemo<Pos[]>(() => {
    if (!selected) return [];
    if (chainSquare) {
      const [r, c] = chainSquare;
      return getCapturesFrom(board, r, c, false).map((m) => m.to);
    }
    const [r, c] = selected;
    return getPieceOptions(board, r, c, turn).map((m) => m.to);
  }, [selected, chainSquare, board, turn]);

  const finishTurn = useCallback(
    (resultBoard: Board) => {
      const next = opposite(turn);
      setTurn(next);
      setSelected(null);
      setChainSquare(null);
      setHistory((h) => [...h, { board: resultBoard, turn: next }]);
      const w = checkWinner(resultBoard, next);
      if (w) {
        setWinner(w);
        window.setTimeout(() => playSound("win"), 300);
      }
    },
    [turn],
  );

  const onSquareTap = useCallback(
    (r: number, c: number) => {
      if (winner || aiThinking) return;
      if (isAIMode && turn === AI_COLOR) return;
      if (!isDark(r, c)) return;

      // Mid-chain: only the chain piece can act, only legal continuations.
      if (chainSquare) {
        const [csr, csc] = chainSquare;
        if (r === csr && c === csc) return;
        const conts = getCapturesFrom(board, csr, csc, false);
        const move = conts.find((m) => m.to[0] === r && m.to[1] === c);
        if (!move) return;
        const after = applyMove(board, move);
        setBoard(after);
        playSound("capture");
        if (move.crowned) {
          window.setTimeout(() => playSound("king"), 120);
          finishTurn(after);
          return;
        }
        const more = getCapturesFrom(after, move.to[0], move.to[1], false);
        if (more.length > 0) {
          setChainSquare(move.to);
          setSelected(move.to);
        } else {
          finishTurn(after);
        }
        return;
      }

      // No active chain.
      if (selected) {
        const [sr, sc] = selected;
        if (r === sr && c === sc) {
          setSelected(null);
          return;
        }
        const opts = getPieceOptions(board, sr, sc, turn);
        const move = opts.find((m) => m.to[0] === r && m.to[1] === c);
        if (move) {
          const after = applyMove(board, move);
          setBoard(after);
          if (move.captures.length > 0) playSound("capture");
          else playSound("move");
          if (move.crowned) {
            window.setTimeout(() => playSound("king"), 120);
            finishTurn(after);
            return;
          }
          if (move.captures.length > 0) {
            const more = getCapturesFrom(after, move.to[0], move.to[1], false);
            if (more.length > 0) {
              setChainSquare(move.to);
              setSelected(move.to);
              return;
            }
          }
          finishTurn(after);
          return;
        }
        // Tapped another own piece — try to reselect.
        const p = board[r][c];
        if (p && p.color === turn && getPieceOptions(board, r, c, turn).length > 0) {
          setSelected([r, c]);
          return;
        }
        setSelected(null);
        return;
      }

      // No selection yet.
      const p = board[r][c];
      if (!p || p.color !== turn) return;
      if (getPieceOptions(board, r, c, turn).length === 0) return;
      setSelected([r, c]);
    },
    [board, turn, selected, chainSquare, winner, aiThinking, isAIMode, finishTurn],
  );

  // AI driver: when it's AI's turn, wait 600ms, compute, then animate steps.
  useEffect(() => {
    if (!isAIMode || winner || turn !== AI_COLOR) return;
    setAiThinking(true);
    setSelected(null);
    setChainSquare(null);

    const startDelay = window.setTimeout(() => {
      const difficulty = mode as Difficulty;
      const chosen = chooseAITurn(board, AI_COLOR, difficulty);
      if (!chosen) {
        setAiThinking(false);
        return;
      }
      let work = board;
      const playStep = (i: number) => {
        const m = chosen.steps[i];
        work = applyMove(work, m);
        setBoard(work);
        if (m.captures.length > 0) playSound("capture");
        else playSound("move");
        if (m.crowned) window.setTimeout(() => playSound("king"), 120);
        if (i + 1 < chosen.steps.length) {
          const id = window.setTimeout(() => playStep(i + 1), 450);
          aiTimers.current.push(id);
        } else {
          setAiThinking(false);
          const next = opposite(AI_COLOR);
          setTurn(next);
          setHistory((h) => [...h, { board: work, turn: next }]);
          const w = checkWinner(work, next);
          if (w) {
            setWinner(w);
            window.setTimeout(() => playSound("win"), 300);
          }
        }
      };
      playStep(0);
    }, 600);
    aiTimers.current.push(startDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, isAIMode, winner, mode]);

  const onUndo = useCallback(() => {
    if (chainSquare || aiThinking) return;
    const steps = isAIMode ? 2 : 1;
    if (history.length <= steps) return;
    const newHist = history.slice(0, -steps);
    const restore = newHist[newHist.length - 1];
    setHistory(newHist);
    setBoard(restore.board);
    setTurn(restore.turn);
    setSelected(null);
    setChainSquare(null);
    setWinner(null);
  }, [history, isAIMode, chainSquare, aiThinking]);

  // ============================================================
  // Render
  // ============================================================

  // Mode select
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700">דמקה</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-5 w-full">
          <button
            onClick={() => selectMode("easy")}
            className="w-64 sm:w-80 py-4 sm:py-6 rounded-2xl bg-green-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-3xl">🤖</span>
            מול מחשב (קל)
          </button>
          <button
            onClick={() => selectMode("medium")}
            className="w-64 sm:w-80 py-4 sm:py-6 rounded-2xl bg-orange-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-orange-500 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-3xl">🤖</span>
            מול מחשב (בינוני)
          </button>
          <button
            onClick={() => selectMode("hard")}
            className="w-64 sm:w-80 py-4 sm:py-6 rounded-2xl bg-red-500 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-3xl">🤖</span>
            מול מחשב (קשה)
          </button>
          <button
            onClick={() => selectMode("friend")}
            className="w-64 sm:w-80 py-4 sm:py-6 rounded-2xl bg-blue-400 text-white text-xl sm:text-2xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-3xl">👫</span>2 שחקנים
          </button>
        </div>
      </div>
    );
  }

  // Flatten pieces with stable ids for animated render.
  const pieces: Array<{ id: number; color: Color; king: boolean; r: number; c: number }> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (p) pieces.push({ id: p.id, color: p.color, king: p.king, r, c });
    }
  }

  const selKey = selected ? `${selected[0]},${selected[1]}` : "";
  const destKeys = new Set(legalDests.map(([r, c]) => `${r},${c}`));

  const turnLabel = winner
    ? winner === "pink"
      ? isAIMode
        ? "🎉 ניצחת!"
        : "🎉 ניצח ורוד!"
      : isAIMode
        ? "😢 הפסדת"
        : "🎉 ניצח כחול!"
    : aiThinking
      ? "...תור המחשב"
      : turn === "pink"
        ? isAIMode
          ? "תורך"
          : "תור ורוד"
        : isAIMode
          ? "תור המחשב"
          : "תור כחול";

  const canUndo =
    !winner && !chainSquare && !aiThinking && history.length > (isAIMode ? 2 : 1);

  return (
    <div className="h-dvh overflow-hidden flex flex-col items-center bg-gray-200 p-3 sm:p-6" dir="rtl">
      <div className="w-full max-w-lg relative flex items-center justify-center mb-3 sm:mb-5">
        <button
          onClick={backToModeSelect}
          className="absolute right-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-400 text-white text-sm sm:text-base font-bold shadow hover:bg-gray-500 transition-colors"
        >
          → חזרה
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">דמקה</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-base sm:text-xl font-bold">
        <span
          className={
            winner === "pink"
              ? "text-green-600"
              : winner === "blue"
                ? "text-red-500"
                : turn === "pink"
                  ? "text-pink-600"
                  : "text-blue-600"
          }
        >
          {turnLabel}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-3 sm:gap-4">
        <div
          dir="ltr"
          className="relative w-[min(92vw,70vh,520px)] aspect-square rounded-xl overflow-hidden shadow-2xl bg-amber-100"
        >
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {Array.from({ length: SIZE * SIZE }).map((_, i) => {
              const r = Math.floor(i / SIZE);
              const c = i % SIZE;
              const dark = isDark(r, c);
              const key = `${r},${c}`;
              const isSelected = selKey === key;
              const isDestSquare = destKeys.has(key);
              return (
                <button
                  key={i}
                  onClick={() => onSquareTap(r, c)}
                  disabled={!dark || !!winner || aiThinking}
                  className={`relative ${
                    dark ? "bg-amber-700" : "bg-amber-50"
                  } ${
                    isSelected ? "ring-4 ring-inset ring-yellow-300" : ""
                  } disabled:cursor-default`}
                >
                  {isDestSquare && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="block w-1/3 h-1/3 rounded-full bg-yellow-300/80 shadow-md" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {pieces.map((p) => (
            <div
              key={p.id}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: `${100 / SIZE}%`,
                height: `${100 / SIZE}%`,
                transform: `translate(${p.c * 100}%, ${p.r * 100}%)`,
                transition: "transform 320ms ease-out",
              }}
            >
              <div className="w-full h-full p-[6%] flex items-center justify-center">
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center shadow-lg ${
                    p.color === "pink"
                      ? "bg-pink-400 border-4 border-pink-600"
                      : "bg-blue-400 border-4 border-blue-600"
                  }`}
                >
                  {p.king && (
                    <span className="text-[min(4vw,2rem)] leading-none">👑</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {winner ? (
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={resetGame}
              className="px-5 py-3 sm:px-6 sm:py-3 rounded-2xl bg-green-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-green-500 transition-colors"
            >
              שחק שוב
            </button>
            <button
              onClick={backToModeSelect}
              className="px-5 py-3 sm:px-6 sm:py-3 rounded-2xl bg-gray-400 text-white text-lg sm:text-xl font-bold shadow-lg hover:bg-gray-500 transition-colors"
            >
              שינוי מצב
            </button>
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-yellow-400 text-white text-base sm:text-lg font-bold shadow hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              ↶ בטל
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-red-400 text-white text-base sm:text-lg font-bold shadow hover:bg-red-500 transition-colors"
            >
              משחק חדש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkers;
