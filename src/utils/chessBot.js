import { Chess } from 'chess.js';

const VALS = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PT = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const NT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];
const BT = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];
const RT = [
   0,  0,  0,  5,  5,  0,  0,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   5, 10, 10, 10, 10, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const QT = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];
const KT = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];
const TABLES = { p: PT, n: NT, b: BT, r: RT, q: QT, k: KT };

function sqIdx(sq, color) {
  const f = sq.charCodeAt(0) - 97;
  const r = 8 - parseInt(sq[1]);
  const i = r * 8 + f;
  return color === 'w' ? 63 - i : i;
}

function evaluate(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -99999 : 99999;
  if (chess.isDraw()) return 0;
  let score = 0;
  chess.board().forEach((row, r) => {
    row.forEach((p, f) => {
      if (!p) return;
      const sq = String.fromCharCode(97 + f) + (8 - r);
      const val = (VALS[p.type] || 0) + ((TABLES[p.type] || [])[sqIdx(sq, p.color)] || 0);
      score += p.color === 'w' ? val : -val;
    });
  });
  return score;
}

function minimax(chess, depth, alpha, beta, max) {
  if (depth === 0 || chess.isGameOver()) return evaluate(chess);
  const moves = chess.moves({ verbose: true }).sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
  if (max) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false)); chess.undo();
      alpha = Math.max(alpha, best); if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m); best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true)); chess.undo();
      beta = Math.min(beta, best); if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBotMove(fen, diff) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  if (diff === 'beginner') {
    const caps = moves.filter((m) => m.captured);
    return Math.random() < 0.5 && caps.length ? caps[Math.floor(Math.random() * caps.length)] : moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = diff === 'intermediate' ? 2 : diff === 'hard' ? 3 : diff === 'veryhard' ? 4 : 1;
  const max = chess.turn() === 'w';
  let best = moves[0], bestVal = max ? -Infinity : Infinity;
  for (const m of moves) {
    chess.move(m);
    const val = minimax(chess, depth - 1, -Infinity, Infinity, !max);
    chess.undo();
    if (max ? val > bestVal : val < bestVal) { bestVal = val; best = m; }
  }
  return best;
}

export const diffLabel = (d) => ({
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  hard:         'Hard',
  veryhard:     'Very Hard',
}[d] || d);
