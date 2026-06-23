import React from 'react';

interface ChessPieceProps {
  type: string; // 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
  color: 'w' | 'b';
  className?: string;
  themePreset?: 'classic' | 'mint' | 'cyber' | 'c64' | 'artistic';
}

// 12x12 pixel art matrices (11 rows, 12 characters each)
// '.' = transparent
// 'x' = outline
// '+' = body color (base)
// 'o' = accent/highlight/trim detail
// 'h' = light source highlight (top-left shining)
// 's' = depth shadow (bottom-right shading)
const PIECE_GRIDS: Record<string, string[]> = {
  p: [
    "....xxxx....",
    "...xh++sx...",
    "..xh++++ssx.",
    "..xh++oo+sx.",
    "...xh++ssx...",
    "....xxxx....",
    "....x++x....",
    "...xh++sx...",
    "..xh++++ssx.",
    ".xh++++++ssx",
    "xxxxxxxxxxxx"
  ],
  r: [
    "x.x..xx..x.x",
    "xhx++xx++xsx",
    "xxxxxxxxxxxx",
    ".xh++++++ssx",
    ".xh+o+oo+ssx",
    ".xh++++++ssx",
    ".xh++++++ssx",
    ".xh++++++ssx",
    ".xh++++++ssx",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx"
  ],
  n: [
    ".....xxxx...",
    "....xh++sxx.",
    "...xh+++ssx.",
    "..xh+o+++ssx",
    "..xh+++x+ssx",
    "..xh+++sxxx.",
    "...xh++ssx..",
    "..xh+++ssx..",
    ".xh++++ssx..",
    "xxxxxxxxxx..",
    "xxxxxxxxxxxx"
  ],
  b: [
    ".....xx.....",
    "....xhsx....",
    "...xhxossx...",
    "..xhsxxhsx..",
    "..xh++++ssx..",
    "..xhsxxhsx..",
    "...xh++ssx...",
    "....xhsx....",
    "...xh++ssx...",
    "..xh++++ssx..",
    "xxxxxxxxxxxx"
  ],
  q: [
    "x...x..x...x",
    "xh..xhsx..sx",
    "xx.xxxxxx.xx",
    ".xh+++++ssx.",
    ".xh+o++oo+sx.",
    "..xh++++ssx..",
    "..xh++++ssx..",
    "..xh++++ssx..",
    ".xh+++++ssx.",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx"
  ],
  k: [
    ".....xx.....",
    "....xxxx....",
    ".....xx.....",
    "..xxxxxxxx..",
    ".xh+++++ssx.",
    ".xh+o+oossx.",
    ".xh+++++ssx.",
    "..xh++++ssx..",
    "..xh++++ssx..",
    ".xh+++++ssx.",
    "xxxxxxxxxxxx"
  ]
};

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = "", themePreset = "artistic" }) => {
  const normType = type.toLowerCase();
  const grid = PIECE_GRIDS[normType] || PIECE_GRIDS.p;

  // Custom theme-based colors for premium retro feel
  let colors = {
    outline: color === 'w' ? '#1a1c23' : '#08080d',
    body: color === 'w' ? '#f8fafc' : '#334155',
    accent: color === 'w' ? '#e2e8f0' : '#1e293b',
    highlight: color === 'w' ? '#ffffff' : '#475569',
    shadow: color === 'w' ? '#cbd5e1' : '#0f172a',
  };

  if (themePreset === 'cyber') {
    colors = {
      outline: color === 'w' ? '#090014' : '#12001a',
      body: color === 'w' ? '#00f0ff' : '#ff007f', // Electric Cyan / High-voltage Magenta
      accent: color === 'w' ? '#00b0ff' : '#d90429', // Neon Cyan shadow / Neon red shade
      highlight: color === 'w' ? '#ffffff' : '#ffeaf2', // Pure shine / pink-white highlight
      shadow: color === 'w' ? '#005282' : '#5a0036', // Deep cobalt shade / dark violet shadow
    };
  } else if (themePreset === 'classic') {
    colors = {
      outline: color === 'w' ? '#2e1400' : '#100600',
      body: color === 'w' ? '#fdfaf6' : '#704214', // Clean Ivory / Rich Walnut Wood
      accent: color === 'w' ? '#f0d370' : '#b5835a', // Gold / Honey wood base
      highlight: color === 'w' ? '#ffffff' : '#9a683a', // Shiny reflection / light wood
      shadow: color === 'w' ? '#d6c5b0' : '#401e00', // Cream shadow / black wood shadow
    };
  } else if (themePreset === 'mint') {
    colors = {
      outline: color === 'w' ? '#001200' : '#000600',
      body: color === 'w' ? '#e0f8d0' : '#306230', // Mint light / gameboy dark green
      accent: color === 'w' ? '#a8e090' : '#104010', // Mid green / shadow green accent
      highlight: color === 'w' ? '#ffffff' : '#88c070', // Glowing screen white / reflection
      shadow: color === 'w' ? '#88c070' : '#081a08', // Shady green / deep green-black
    };
  } else if (themePreset === 'c64') {
    colors = {
      outline: color === 'w' ? '#0a0b10' : '#050508',
      body: color === 'w' ? '#a0b0ff' : '#454a75', // Commodore Blue / Dark steel indigo
      accent: color === 'w' ? '#7080df' : '#343859', // Medium slate / dark navy highlight
      highlight: color === 'w' ? '#e0e8ff' : '#7080df', // Blue-white / Indigo light reflections
      shadow: color === 'w' ? '#454a75' : '#1c1e30', // Dark iris-blue shadow / deepest indigo
    };
  } else if (themePreset === 'artistic') {
    colors = {
      outline: color === 'w' ? '#1e293b' : '#0c0502',
      body: color === 'w' ? '#fcfaf2' : '#3e2723', // Canvas cream / elegant mahogany brown
      accent: color === 'w' ? '#e2e8f0' : '#8d6e63', // Soft platinum white / golden ochre
      highlight: color === 'w' ? '#ffffff' : '#d7ccc8', // pure white / light cream reflection
      shadow: color === 'w' ? '#94a3b8' : '#1d0f0a', // slate shadow / black-brown deep shadow
    };
  }

  return (
    <svg
      viewBox="0 0 12 11"
      className={`w-full h-full select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {grid.map((row, y) => {
        return row.split('').map((char, x) => {
          if (char === '.') return null;
          let fill = colors.outline;
          if (char === '+') fill = colors.body;
          if (char === 'o') fill = colors.accent;
          if (char === 'h') fill = colors.highlight;
          if (char === 's') fill = colors.shadow;

          return (
            <rect
              key={`${y}-${x}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          );
        });
      })}
    </svg>
  );
};
