import { Chess } from 'chess.js';

// Positional weight tables for chess pieces to give the local fallback engine positional awareness.
// Represented from White's perspective (flip for Black).
const PAWN_WEIGHTS = [
  [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
  [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
  [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
  [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
  [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
  [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
  [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const KNIGHT_WEIGHTS = [
  [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
  [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
  [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
  [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
  [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
  [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
  [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
  [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const BISHOP_WEIGHTS = [
  [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
  [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
  [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
  [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
  [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
  [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
  [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
  [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const ROOK_WEIGHTS = [
  [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
  [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [0.0,   0.0,  0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

const QUEEN_WEIGHTS = [
  [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
  [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
  [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
  [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
  [0.0,   0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
  [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
  [-1.0,  0.0,  0.5,  0.0,  0.0,  0.5,  0.0, -1.0],
  [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const KING_MIDGAME_WEIGHTS = [
  [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
  [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
  [ 2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
  [ 2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
];

// Helper to evaluate static board state. Positive = White advantage, Negative = Black advantage.
export function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (!square) continue;

      let pieceVal = 0;
      let posWeight = 0;

      // Base weight assignment
      switch (square.type) {
        case 'p':
          pieceVal = 100;
          posWeight = square.color === 'w' ? PAWN_WEIGHTS[r][c] : PAWN_WEIGHTS[7 - r][c];
          break;
        case 'n':
          pieceVal = 320;
          posWeight = square.color === 'w' ? KNIGHT_WEIGHTS[r][c] : KNIGHT_WEIGHTS[7 - r][c];
          break;
        case 'b':
          pieceVal = 330;
          posWeight = square.color === 'w' ? BISHOP_WEIGHTS[r][c] : BISHOP_WEIGHTS[7 - r][c];
          break;
        case 'r':
          pieceVal = 500;
          posWeight = square.color === 'w' ? ROOK_WEIGHTS[r][c] : ROOK_WEIGHTS[7 - r][c];
          break;
        case 'q':
          pieceVal = 900;
          posWeight = square.color === 'w' ? QUEEN_WEIGHTS[r][c] : QUEEN_WEIGHTS[7 - r][c];
          break;
        case 'k':
          pieceVal = 20000;
          posWeight = square.color === 'w' ? KING_MIDGAME_WEIGHTS[r][c] : KING_MIDGAME_WEIGHTS[7 - r][c];
          break;
      }

      const totalVal = pieceVal + posWeight * 10;
      if (square.color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

// Simple Minimax search with Alpha-Beta pruning
export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): { score: number; move: string | null } {
  if (depth === 0 || chess.isGameOver()) {
    return { score: evaluateBoard(chess), move: null };
  }

  const moves = chess.moves();
  if (moves.length === 0) {
    if (chess.isCheck()) {
      // Checkmate: value depends on whose turn it is
      return { score: isMaximizingPlayer ? -100000 : 100000, move: null };
    }
    // Stalemate / Draw
    return { score: 0, move: null };
  }

  let bestMove: string | null = null;

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    // Sort moves to help Alpha-Beta prune faster (prioritize captures/checks)
    const sortedMoves = [...moves].sort((a, b) => {
      const aCapture = a.includes('x') ? 1 : 0;
      const bCapture = b.includes('x') ? 1 : 0;
      return bCapture - aCapture;
    });

    for (const move of sortedMoves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false).score;
      chess.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // beta prune
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    const sortedMoves = [...moves].sort((a, b) => {
      const aCapture = a.includes('x') ? 1 : 0;
      const bCapture = b.includes('x') ? 1 : 0;
      return bCapture - aCapture;
    });

    for (const move of sortedMoves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true).score;
      chess.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // alpha prune
      }
    }
    return { score: minEval, move: bestMove };
  }
}

// Find best heuristic move for a given FEN and depth (default 2 for speed)
export function getBestHeuristicMove(fen: string, depth = 2, playingAs: 'w' | 'b' = 'b'): string {
  const chess = new Chess(fen);
  const isMaximizing = playingAs === 'w';
  const result = minimax(chess, depth, -Infinity, Infinity, isMaximizing);
  
  // Backup random move if minimax returned nothing
  if (!result.move) {
    const moves = chess.moves();
    return moves[Math.floor(Math.random() * moves.length)] || '';
  }
  return result.move;
}

// Generate strategic commentary parameters
export interface ChessTelemetry {
  materialDifference: number; // Positive = White up, Negative = Black up
  isUserCheck: boolean;
  isAiCheck: boolean;
  whiteMaterial: number;
  blackMaterial: number;
  aiThreatCount: number;
  boardPieceCount: number;
}

export function getChessTelemetry(chess: Chess, aiColor: 'w' | 'b' = 'b'): ChessTelemetry {
  const board = chess.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let pieceCount = 0;

  const points: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (square) {
        pieceCount++;
        const pts = points[square.type] || 0;
        if (square.color === 'w') {
          whiteMaterial += pts;
        } else {
          blackMaterial += pts;
        }
      }
    }
  }

  const matDiff = whiteMaterial - blackMaterial;

  return {
    materialDifference: matDiff,
    isUserCheck: chess.turn() === 'w' && chess.isCheck(),
    isAiCheck: chess.turn() === 'b' && chess.isCheck(),
    whiteMaterial,
    blackMaterial,
    aiThreatCount: 0, // Placeholder
    boardPieceCount: pieceCount
  };
}
