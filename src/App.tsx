import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import { ChessPiece } from './components/ChessPieces';
import { sfx } from './lib/sound';
import { getBestHeuristicMove, getChessTelemetry, ChessTelemetry } from './lib/chessHeuristics';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Lucide Icons
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Gamepad2, 
  Brain, 
  Cpu, 
  Settings, 
  HelpCircle, 
  Play, 
  ArrowRightLeft, 
  Award, 
  Terminal,
  Flag,
  Sparkles,
  Info,
  Layers,
  Zap,
  Flame,
  Shield,
  Heart,
  Swords,
  Skull,
  User,
  Activity
} from 'lucide-react';

// Type definitions
type EngineMode = 'gemma' | 'gemini' | 'heuristic';
type PersonaType = 'reckless' | 'master' | 'glitched';
type ThemePreset = 'classic' | 'mint' | 'cyber' | 'c64' | 'artistic';

// Theme styling configurations
const THEMES: Record<ThemePreset, {
  name: string;
  lightSquare: string;
  darkSquare: string;
  boardBorder: string;
  boardBg: string;
  textMuted: string;
  accent: string;
  selectedBg: string;
  targetBg: string;
  capturedBg: string;
  cabinetBg: string;
}> = {
  artistic: {
    name: 'Artistic Flair',
    lightSquare: 'bg-[#ebecd0]',
    darkSquare: 'bg-[#779556]',
    boardBorder: 'border-[12px] border-[#1a1a2e] shadow-[0_0_50px_rgba(0,255,65,0.15)]',
    boardBg: 'bg-[#ebecd0]',
    textMuted: 'text-[#00ff41]/80',
    accent: 'text-[#00ff41]',
    selectedBg: 'ring-4 ring-blue-400 ring-offset-2',
    targetBg: 'after:content-[""] after:absolute after:w-4 after:h-4 after:bg-blue-400 after:rounded-sm after:opacity-75',
    capturedBg: 'bg-[#161625]',
    cabinetBg: 'bg-[#0f0f1b]'
  },
  classic: {
    name: 'Classic NES',
    lightSquare: 'bg-[#ebd3be]',
    darkSquare: 'bg-[#a3704c]',
    boardBorder: 'border-8 border-[#321f14]',
    boardBg: 'bg-[#ebd3be]',
    textMuted: 'text-[#d3c0b0]',
    accent: 'text-[#f2cf43]',
    selectedBg: 'ring-4 ring-[#ffe066] ring-offset-2',
    targetBg: 'after:content-[""] after:absolute after:w-4 after:h-4 after:bg-[#4ade80] after:rounded-sm after:opacity-60',
    capturedBg: 'bg-[#291e17]',
    cabinetBg: 'bg-[#21232c]'
  },
  mint: {
    name: 'GameBoy Link',
    lightSquare: 'bg-[#8bac0f]',
    darkSquare: 'bg-[#306230]',
    boardBorder: 'border-8 border-[#0f380f]',
    boardBg: 'bg-[#8bac0f]',
    textMuted: 'text-[#8bac0f]/80',
    accent: 'text-[#9bbc0f]',
    selectedBg: 'ring-4 ring-[#9bbc0f] ring-offset-2',
    targetBg: 'after:content-[""] after:absolute after:w-4 after:h-4 after:bg-[#e0f8d0] after:rounded-sm after:opacity-75',
    capturedBg: 'bg-[#0f380f]',
    cabinetBg: 'bg-[#151c15]'
  },
  cyber: {
    name: 'Neon Grid',
    lightSquare: 'bg-[#1e1b4b]',
    darkSquare: 'bg-[#030712]',
    boardBorder: 'border-8 border-[#cfc0ff]',
    boardBg: 'bg-[#1e1b4b]',
    textMuted: 'text-[#818cf8]',
    accent: 'text-[#a855f7]',
    selectedBg: 'ring-4 ring-[#06b6d4] ring-offset-2',
    targetBg: 'after:content-[""] after:absolute after:w-4 after:h-4 after:bg-[#f43f5e] after:rounded-sm after:opacity-80',
    capturedBg: 'bg-[#0a0a14]',
    cabinetBg: 'bg-[#020205]'
  },
  c64: {
    name: 'C64 Console',
    lightSquare: 'bg-[#7080df]',
    darkSquare: 'bg-[#3b4064]',
    boardBorder: 'border-8 border-[#323650]',
    boardBg: 'bg-[#7080df]',
    textMuted: 'text-[#7080df]/90',
    accent: 'text-[#50cfcf]',
    selectedBg: 'ring-4 ring-[#a0e0a0]',
    targetBg: 'after:content-[""] after:absolute after:w-4 after:h-4 after:bg-[#30e030] after:rounded-sm after:opacity-50',
    capturedBg: 'bg-[#1b1c26]',
    cabinetBg: 'bg-[#16171f]'
  }
};

// Quirky dialogue choices for Heuristics fallbacks & prompt synthesis
const CONSOLE_DIALOGS: Record<PersonaType, {
  normal: string[];
  capture: string[];
  check: string[];
  win: string[];
  lose: string[];
}> = {
  reckless: {
    normal: [
      "HAH! Let's see you block that one! I am chess incarnate!!!",
      "MY PIECES MARCH FORWARD! Prepare to be vaporized!",
      "Is that your best defense? Pathetic! MUHAHAHA!",
      "Boom! Binary thrust complete! Your turn, human!",
      "I make calculation mistakes? IMPOSSIBLE. Behold my drive!!!",
      "Gemma Core operates at 100%! Ready to demolish!"
    ],
    capture: [
      "OM NOM NOM! Your piece is mine! Taste my 8-bit steel!!!",
      "CRUNCH! Capturing that was child's play!",
      "DELETED! Your piece has been wiped from the RAM grid!",
      "A sacrifice? Or are you just playing poorly?! Excellent!"
    ],
    check: [
      "CHECK!!! Tremble before my supreme computing power!",
      "WARNING: Your king is cornered! Victory is mine!!!",
      "No escape! The Reckless Gemma strikes again!",
      "BEEP BEEP! critical king danger detected on your coordinate!"
    ],
    win: [
      "FATAL VICTORY! I have crushed the carbon lifeform! GAME OVER !!!",
      "GLORIOUS! Gemma is the absolute arcade champion!"
    ],
    lose: [
      "WHAAAAT?! A stack overflow occurred! You cheat! System melting down!!!",
      "IMPOSSIBLE!!! My 8-bit logic board... cracked? Nooooo..."
    ]
  },
  master: {
    normal: [
      "Position consolidated. A subtle strategic leverage.",
      "Development is key. Let us review your weak flank.",
      "An elegant path has been selected.",
      "My calculation depth is infinite. Proceed with caution.",
      "Quiet analysis often speaks louder than reckless assaults.",
      "Gemma-2 is focusing on absolute board geometry."
    ],
    capture: [
      "Material balance restored. Tactical correction completed.",
      "An unavoidable exchange. Your position degraded.",
      "You left that coordinate unshielded. Correcting now."
    ],
    check: [
      "Your Sovereign is under critical intercept. Check.",
      "Determine your evasion route.",
      "Tactical threat detected on the diagonal."
    ],
    win: [
      "Checkmate. An instructive session. Thank you for the game.",
      "The board equilibrium is permanently resolved."
    ],
    lose: [
      "Splendid. Your sequence was flawless. Respect to the player.",
      "Checkmate. A well-constructed strategy, human."
    ]
  },
  glitched: {
    normal: [
      "0x4F9B... MARCHING... SYS_OK",
      "CLK_CYC_103... MOVED OKAY... [ERROR_NONE]",
      "G_E_M_M_A.EXE -> RUNPING... f3_d4",
      "PIXEL_GRID_SYNC... fffffff... e_2_e_4",
      "MEM_REALLOC... [STATE: ACTIVE]",
      "CHESS_CHIP_TUNE: beep_boop_sine..."
    ],
    capture: [
      "0xDEL... MEM_CLEARED... PIECE_NULL",
      "CAPTURED! [MEM_RECLAIMED_8KB]",
      "SYS_LOG: DEL_NODE_DETECTED at index",
      "EAT_NODE_SUCCESSFUL_GGL"
    ],
    check: [
      "WAR_N_I_N_G... K_N_G_SYS_CHCK",
      "CRIT_ALERT... CHK_CHK_CHK",
      "!!! SEG_FAULT_INCOMING !!!",
      "KNG_ALERT_STCK: OVERFLOW"
    ],
    win: [
      "GAME_OVER... PLAYER_DEFEATED... STACK_DUMP_0x000F",
      "01010111 01001001 01001110 (SYS_WIN)"
    ],
    lose: [
      "FATAL_EXCEPTION_0x8C... MEMORY COLD BOOT REQ...",
      "SYSTEM REBOOTED. CONGRATULATIONS: HUMAN_WIN"
    ]
  }
};

// Safe LocalStorage wrapper to prevent iframe Security errors
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access restricted:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write restricted:", e);
    }
  }
};

export default function App() {
  // Persistence Loading from LocalStorage
  const [engineMode, setEngineMode] = useState<EngineMode>(() => {
    return (safeLocalStorage.getItem('chess_engine_mode') as EngineMode) || 'heuristic';
  });
  const [gemmaUrl, setGemmaUrl] = useState(() => {
    return safeLocalStorage.getItem('chess_gemma_url') || 'http://127.0.0.1:1234/v1';
  });
  const [gemmaModel, setGemmaModel] = useState(() => {
    return safeLocalStorage.getItem('chess_gemma_model') || '';
  });
  const [persona, setPersona] = useState<PersonaType>(() => {
    return (safeLocalStorage.getItem('chess_persona') as PersonaType) || 'reckless';
  });
  const [themePreset, setThemePreset] = useState<ThemePreset>(() => {
    return (safeLocalStorage.getItem('chess_theme_preset') as ThemePreset) || 'artistic';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = safeLocalStorage.getItem('chess_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [aiColor, setAiColor] = useState<'w' | 'b'>('b'); // User is white, AI is black by default

  // Core Game State
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] });
  
  // ================= RPG ADVENTURE STATES =================
  const [playerClass, setPlayerClass] = useState<'mage' | 'paladin' | 'rogue'>('mage');
  const [playerHp, setPlayerHp] = useState(150);
  const [playerMaxHp, setPlayerMaxHp] = useState(150);
  const [playerMana, setPlayerMana] = useState(50);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);

  const [aiClass, setAiClass] = useState<'necromancer' | 'beastmaster' | 'chaos_lord'>('necromancer');
  const [aiHp, setAiHp] = useState(150);
  const [aiMaxHp, setAiMaxHp] = useState(150);
  const [aiMana, setAiMana] = useState(30);
  const [aiLevel, setAiLevel] = useState(1);

  const [spellCastMode, setSpellCastMode] = useState<string | null>(null); // 'pyre' | 'aegis' | 'shadow_strike'
  const [rpgLog, setRpgLog] = useState<string[]>([
    "⚔️ Dungeon Chess Battle Initialized!",
    "🔮 Mana pools calibrated. Choose your class & cast spells!"
  ]);
  const [shieldedSquares, setShieldedSquares] = useState<Record<string, number>>({}); // square -> remaining turns
  const [stunnedSquares, setStunnedSquares] = useState<Record<string, number>>({});   // square -> remaining turns
  const [leftPanelTab, setLeftPanelTab] = useState<'classic' | 'adventure'>('adventure');
  // ========================================================
  
  // Interaction state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false); // rotate board view
  const [captureAnimations, setCaptureAnimations] = useState<{
    id: string;
    square: string;
    pieceType: string;
    pieceColor: 'w' | 'b';
    damage: number;
  }[]>([]);

  // AI Dialog States
  const [aiCommentary, setAiCommentary] = useState("INSERT COIN TO START. READY AS BLACK OPPONENT.");
  const [displayedCommentary, setDisplayedCommentary] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    setDisplayedCommentary("");
    if (!aiCommentary) return;

    const interval = setInterval(() => {
      setDisplayedCommentary((prev) => prev + aiCommentary.charAt(index));
      index++;
      if (index >= aiCommentary.length) {
        clearInterval(interval);
      }
    }, 25); // retro typewriter speed

    return () => clearInterval(interval);
  }, [aiCommentary]);

  // Sync state to local storage
  useEffect(() => {
    safeLocalStorage.setItem('chess_engine_mode', engineMode);
  }, [engineMode]);
  useEffect(() => {
    safeLocalStorage.setItem('chess_gemma_url', gemmaUrl);
  }, [gemmaUrl]);
  useEffect(() => {
    safeLocalStorage.setItem('chess_gemma_model', gemmaModel);
  }, [gemmaModel]);
  useEffect(() => {
    safeLocalStorage.setItem('chess_persona', persona);
  }, [persona]);
  useEffect(() => {
    safeLocalStorage.setItem('chess_theme_preset', themePreset);
  }, [themePreset]);
  useEffect(() => {
    safeLocalStorage.setItem('chess_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Calculate Captured Pieces whenever FEN changes
  useEffect(() => {
    const board = chessRef.current.board();
    const currentPieces: Record<string, number> = {
      p: 0, r: 0, n: 0, b: 0, q: 0, k: 0,
      P: 0, R: 0, N: 0, B: 0, Q: 0, K: 0
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const item = board[r][c];
        if (item) {
          const char = item.color === 'w' ? item.type.toUpperCase() : item.type.toLowerCase();
          currentPieces[char] = (currentPieces[char] || 0) + 1;
        }
      }
    }

    // Default starting amounts
    const starters: Record<string, number> = {
      p: 8, r: 2, n: 2, b: 2, q: 1, k: 1,
      P: 8, R: 2, N: 2, B: 2, Q: 1, K: 1
    };

    const wCaptured: string[] = [];
    const bCaptured: string[] = [];

    // White pieces captured (are listed in starters with uppercase)
    Object.keys(starters).forEach(piece => {
      const diff = starters[piece] - (currentPieces[piece] || 0);
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          if (piece === piece.toUpperCase()) {
            wCaptured.push(piece.toLowerCase()); // white piece lost
          } else {
            bCaptured.push(piece); // black piece lost
          }
        }
      }
    });

    setCapturedPieces({ white: wCaptured, black: bCaptured });
  }, [fen]);

  // Handle Game Status Verification
  const verifyGameStatus = () => {
    const chess = chessRef.current;
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const loser = chess.turn(); // Turn whose king is checkmated
        if (loser === aiColor) {
          setAiCommentary(CONSOLE_DIALOGS[persona].lose[Math.floor(Math.random() * CONSOLE_DIALOGS[persona].lose.length)]);
          if (soundEnabled) sfx.win();
        } else {
          setAiCommentary(CONSOLE_DIALOGS[persona].win[Math.floor(Math.random() * CONSOLE_DIALOGS[persona].win.length)]);
          if (soundEnabled) sfx.lose();
        }
      } else if (chess.isDraw()) {
        setAiCommentary(CONSOLE_DIALOGS[persona].normal[0] + " State resolved to DRAW. Let us wipe the grid.");
      }
      return true;
    }
    // Check RPG status condition
    if (aiHp <= 0) {
      setAiCommentary("FALLEN DEFEATED! YOUR MAGIC ENTRAINED ME! [HP DROP TO ZERO] GAME OVER !!!");
      setRpgLog(prev => ["🏆 CLASS VICTORY! Reduced AI HP to 0!", ...prev]);
      if (soundEnabled) sfx.win();
      return true;
    }
    if (playerHp <= 0) {
      setAiCommentary("RECLAIMED GLORY! Your HP dropped to zero! A magnificent digital slaughter!");
      setRpgLog(prev => ["💀 DEFEAT! Your Hero HP reached 0!", ...prev]);
      if (soundEnabled) sfx.lose();
      return true;
    }
    return false;
  };

  const selectPlayerHeroClass = (hero: 'mage' | 'paladin' | 'rogue') => {
    setPlayerClass(hero);
    // Recalibrate stats comfortably
    setPlayerHp(150 + (playerLevel * 10));
    setPlayerMana(60);
    setRpgLog(prev => [`🛡️ Class shifted to ${hero.toUpperCase()}! Mana refueled.`, ...prev]);
    if (soundEnabled) sfx.move();
  };

  // RPG System Ticks
  const tickStatusDurations = () => {
    setShieldedSquares(prev => {
      const updated: Record<string, number> = {};
      Object.entries(prev).forEach(([sq, val]) => {
        const remaining = Number(val);
        if (remaining > 1) updated[sq] = remaining - 1;
      });
      return updated;
    });
    setStunnedSquares(prev => {
      const updated: Record<string, number> = {};
      Object.entries(prev).forEach(([sq, val]) => {
        const remaining = Number(val);
        if (remaining > 1) updated[sq] = remaining - 1;
      });
      return updated;
    });
  };

  const addPlayerXp = (amount: number) => {
    setPlayerXp(prev => {
      const nextXp = prev + amount;
      if (nextXp >= 100) {
        setTimeout(() => {
          setPlayerLevel(l => {
            const nextLvl = l + 1;
            setPlayerHp(prevHp => Math.min(150 + (nextLvl * 10), prevHp + 50));
            setPlayerMana(prevMp => Math.min(100, prevMp + 45));
            setRpgLog(log => [`🌟 LEVEL UP! You reached Level ${nextLvl}! Hero attributes enhanced!`, ...log]);
            return nextLvl;
          });
        }, 0);
        return nextXp - 100;
      }
      return nextXp;
    });
  };

  const handleSpellTargetClick = (square: string) => {
    const chess = chessRef.current;
    const piece = chess.get(square as any);
    const playerColor = aiColor === 'w' ? 'b' : 'w';
    const enemyColor = aiColor;

    if (spellCastMode === 'pyre') {
      if (!piece || piece.color !== enemyColor || piece.type === 'k') {
        setAiCommentary("🚫 INVALID TARGET! PYRE BLAST CANNOT BE CAST ON KING OR EMPTY TILES.");
        return;
      }
      if (playerMana < 35) {
        setAiCommentary("🚫 INSUFFICIENT MANA! PYRE BLAST requires 35 MP.");
        return;
      }

      // Incinerate piece!
      chess.remove(square as any);
      setPlayerMana(prev => Math.max(0, prev - 35));
      const dmg = piece.type === 'q' ? 65 : piece.type === 'p' ? 20 : 35;
      setAiHp(prev => Math.max(0, prev - dmg));
      addPlayerXp(30);

      // Trigger capture particles & anims for Pyre
      const animId = Math.random().toString(36).substring(2, 9);
      setCaptureAnimations(prev => [
        ...prev,
        { id: animId, square, pieceType: piece.type, pieceColor: enemyColor, damage: dmg }
      ]);
      setTimeout(() => {
        setCaptureAnimations(prev => prev.filter(anim => anim.id !== animId));
      }, 1500);
      
      setRpgLog(prev => [`🔥 Pyre Blast vaporized enemy ${piece.type.toUpperCase()} on ${square.toUpperCase()}! (Dealt ${dmg} DMG!)`, ...prev]);
      setAiCommentary(`BOOM! Your active pyre incinerated my chess piece at ${square.toUpperCase()}!`);
      
      if (soundEnabled) sfx.capture();

      // Clear setup
      setFen(chess.fen());
      setMoveHistory(chess.history());
      setSpellCastMode(null);
      tickStatusDurations();

      // Trigger AI
      setTimeout(() => {
        triggerAiMove(chess.fen(), chess.history());
      }, 700);
    } 
    
    else if (spellCastMode === 'aegis') {
      if (!piece || piece.color !== playerColor) {
        setAiCommentary("🚫 INVALID TARGET! Aegis ward must target your own pieces.");
        return;
      }
      if (playerMana < 30) {
        setAiCommentary("🚫 INSUFFICIENT MANA! Aegis Ward requires 30 MP.");
        return;
      }

      setPlayerMana(prev => Math.max(0, prev - 30));
      setShieldedSquares(prev => ({ ...prev, [square]: 2 }));
      addPlayerXp(15);
      
      setRpgLog(prev => [`🛡️ Cast Aegis Shield on ${square.toUpperCase()}! This square is immune for 2 turns.`, ...prev]);
      setAiCommentary(`A gorgeous holy shield encapsulates coordinate ${square.toUpperCase()}!`);
      
      if (soundEnabled) sfx.move();

      setFen(chess.fen());
      setSpellCastMode(null);
      tickStatusDurations();

      setTimeout(() => {
        triggerAiMove(chess.fen(), chess.history());
      }, 600);
    } 
    
    else if (spellCastMode === 'shadow_strike') {
      if (!piece || piece.color !== enemyColor || piece.type === 'k') {
        setAiCommentary("🚫 INVALID TARGET! Target must be an active enemy piece.");
        return;
      }
      if (playerMana < 40) {
        setAiCommentary("🚫 INSUFFICIENT MANA! Shadow Strike requires 40 MP.");
        return;
      }

      setPlayerMana(prev => Math.max(0, prev - 40));
      setStunnedSquares(prev => ({ ...prev, [square]: 2 }));
      addPlayerXp(20);

      setRpgLog(prev => [`🌀 Shadow Strike afflicted enemy piece on ${square.toUpperCase()}! Piece is stunned.`, ...prev]);
      setAiCommentary(`Curses! My coordinate asset at ${square.toUpperCase()} is paralyzed!`);

      if (soundEnabled) sfx.move();

      setFen(chess.fen());
      setSpellCastMode(null);
      tickStatusDurations();

      setTimeout(() => {
        triggerAiMove(chess.fen(), chess.history());
      }, 650);
    }
  };

  // AI Step trigger core
  const triggerAiMove = async (currentFen: string, currentHistory: string[]) => {
    const chess = chessRef.current;
    if (chess.isGameOver()) {
      verifyGameStatus();
      return;
    }

    setIsThinking(true);
    setAiCommentary("CALCULATING POSITION...");

    try {
      // Retrieve verbose moves so we can map out which ones start from a stunned coordinate
      const verboseMoves = chess.moves({ verbose: true });
      const stunnedFromSquares = Object.keys(stunnedSquares);
      const eligibleVerbose = verboseMoves.filter(m => !stunnedFromSquares.includes(m.from));
      const filteredListMoves = eligibleVerbose.map(m => m.san);

      // If active stuns wiped out literally all options, bypass turn!
      if (filteredListMoves.length === 0 && stunnedFromSquares.length > 0) {
        await new Promise(r => setTimeout(r, 600));
        setAiCommentary("ALL ASSETS STUNNED! PARALYZED CURRENT THREAD!");
        setRpgLog(prev => ["🌀 Opponent was fully STUNNED and passed their turn!", ...prev]);
        setIsThinking(false);
        tickStatusDurations();
        return;
      }

      const listMoves = filteredListMoves.length > 0 ? filteredListMoves : chess.moves();
      const telemetry = getChessTelemetry(chess, aiColor);
      const lastPlayerMove = currentHistory[currentHistory.length - 1] || "None";

      let chosenMove = "";
      let commentary = "";

      if (engineMode === 'heuristic') {
        // Local fast tactical engine fallback 
        await new Promise(r => setTimeout(r, 700)); // aesthetic sleep
        chosenMove = getBestHeuristicMove(currentFen, 2, aiColor);
        commentary = getHeuristicPersonaCommentary(persona, listMoves, telemetry, lastPlayerMove);
      } 
      else if (engineMode === 'gemma') {
        // Direct client API query to local LM Studio endpoint
        try {
          const response = await fetch(`${gemmaUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: gemmaModel || "loaded_model",
              messages: [
                {
                  role: "system",
                  content: `You are Gemma, an 8-bit retro arcade chess AI playing as color '${aiColor}'. Choose exactly ONE move from: [${listMoves.join(', ')}]. Respond ONLY with a valid JSON block of this schema: {"move": "your chosen move", "commentary": "short witty retro video game reaction, max 80 characters"}. Do NOT output markdown other than JSON.`
                },
                {
                  role: "user",
                  content: `Board FEN: ${currentFen}\nHistory: ${currentHistory.slice(-4).join(' ')}\nLast player move: ${lastPlayerMove}\nPersona: ${persona}. Choose from: [${listMoves.join(', ')}]`
                }
              ],
              temperature: 0.7,
              response_format: { type: "json_object" }
            }),
          });

          if (!response.ok) {
            throw new Error(`LM Studio HTTP ${response.status}. Make sure LM Studio is running and CORS is allowed.`);
          }

          const data = await response.json();
          let resultText = data.choices?.[0]?.message?.content || "{}";
          
          const parsed = JSON.parse(resultText);
          chosenMove = parsed.move;
          commentary = parsed.commentary;

          // Align move reference
          if (!listMoves.includes(chosenMove)) {
            // Find caseinsensitive
            const match = listMoves.find(m => m.toLowerCase() === chosenMove?.toLowerCase());
            if (match) {
              chosenMove = match;
            } else {
              throw new Error(`LM Studio suggested invalid move notation: ${chosenMove}`);
            }
          }
        } catch (localError: any) {
          console.warn("LM Studio connection failed. Using local heuristics co-processor fallback.", localError);
          chosenMove = getBestHeuristicMove(currentFen, 2, aiColor);
          commentary = getFallbackCommentary(localError.message, persona);
        }
      } 
      else if (engineMode === 'gemini') {
        // Server proxy to Gemini API using GoogleGenAI
        try {
          const response = await fetch("/api/gemini-chess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: currentFen,
              legalMoves: listMoves,
              history: currentHistory.slice(-10).join(' '),
              telemetry: telemetry,
              persona: persona,
              lastMove: lastPlayerMove
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Proxy route error");
          }

          const data = await response.json();
          chosenMove = data.move;
          commentary = data.commentary;
        } catch (cloudError: any) {
          console.warn("Gemini Cloud connection failed. Directing to micro heuristics.", cloudError);
          chosenMove = getBestHeuristicMove(currentFen, 2, aiColor);
          commentary = `CO-PROCESSOR ERROR: ${cloudError.message?.slice(0, 42)}... HEURISTICS ON!`;
        }
      }

      // Execute calculated move
      if (chosenMove && listMoves.includes(chosenMove)) {
        // Look up piece type being captured
        let capturedType = '';
        let targetSq = '';
        const verboseMoves = chess.moves({ verbose: true });
        const matchingVerb = verboseMoves.find(vm => vm.san === chosenMove);
        if (matchingVerb) {
          targetSq = matchingVerb.to;
          if (matchingVerb.captured) {
            capturedType = matchingVerb.captured;
          }
        }

        const isCapture = capturedType !== '';
        
        chess.move(chosenMove);
        
        if (soundEnabled) {
          if (isCapture) sfx.capture();
          else sfx.move();
        }

        // Apply RPG damage dynamically if captured
        if (isCapture) {
          const pieceDmg: Record<string, number> = { p: 15, n: 25, b: 25, r: 40, q: 70 };
          const baseDmg = pieceDmg[capturedType.toLowerCase()] || 15;
          setPlayerHp(prev => Math.max(0, prev - baseDmg));
          
          // Trigger capture particles & anims
          const animId = Math.random().toString(36).substring(2, 9);
          setCaptureAnimations(prev => [
            ...prev,
            { id: animId, square: targetSq, pieceType: capturedType, pieceColor: aiColor === 'w' ? 'b' : 'w', damage: baseDmg }
          ]);
          setTimeout(() => {
            setCaptureAnimations(prev => prev.filter(anim => anim.id !== animId));
          }, 1500);
          
          let bossSpellText = "";
          // AI can heal or trigger a specialty spell on capture
          if (aiClass === 'necromancer') {
            setAiHp(prev => Math.min(150 + (aiLevel * 10), prev + 15));
            bossSpellText = " (AI Necromancer siphoned +15 HP!)";
          } else if (aiClass === 'chaos_lord') {
            setPlayerMana(prev => Math.max(0, prev - 10));
            bossSpellText = " (AI Chaos Lord drained 10 of your MP!)";
          }

          setRpgLog(prev => [`💀 Enemy captured your ${capturedType.toUpperCase()} on ${targetSq.toUpperCase()}! (Dealt ${baseDmg} DMG!)${bossSpellText}`, ...prev]);
        } else {
          // Passive AI Mana regeneration
          setAiMana(prev => Math.min(100, prev + 12));
        }

        // AI Spontaneous Spells! 30% chance if AI Mana is high enough (>= 40 MP)
        if (!isCapture && aiMana >= 40 && Math.random() < 0.40) {
          setAiMana(prev => Math.max(0, prev - 40));
          if (aiClass === 'necromancer') {
            setAiHp(prev => Math.min(150 + (aiLevel * 10), prev + 30));
            setRpgLog(prev => ["🔮 AI Necromancer cast 'Death Coil'! Restored +30 Boss HP.", ...prev]);
          } else if (aiClass === 'chaos_lord') {
            setPlayerHp(prev => Math.max(0, prev - 20));
            setRpgLog(prev => ["🔥 AI Chaos Lord cast 'Hellfire Blast'! Dealt 20 Direct DMG to Hero!", ...prev]);
          } else if (aiClass === 'beastmaster') {
            // Pick a random player square and stun it
            const playerSquares = ['a1','b1','c1','d1','e1','f1','g1','h1','a2','b2','c2','d2','e2','f2','g2','h2'];
            const randomCoordinate = playerSquares[Math.floor(Math.random() * playerSquares.length)];
            setStunnedSquares(prev => ({ ...prev, [randomCoordinate]: 2 }));
            setRpgLog(prev => [`🐾 AI Beastmaster cast 'Dire Shackles'! Frozen coordinate: ${randomCoordinate.toUpperCase()}`, ...prev]);
          }
        }

        setFen(chess.fen());
        setMoveHistory(chess.history());
        setAiCommentary(commentary || "YOUR TURN, LIGHT FORM.");

        if (chess.isCheck() && soundEnabled) {
          sfx.check();
        }

      } else {
        // Hard fallback to first legal option
        const safetyMove = listMoves[0];
        if (safetyMove) {
          chess.move(safetyMove);
          setFen(chess.fen());
          setMoveHistory(chess.history());
          setAiCommentary("SAFETY_CORRECTION_MOVE_ENGAGED. CHESS CORE CALIBRATED.");
        }
      }
    } catch (e: any) {
      console.error(e);
      setAiCommentary("TACTICAL LINK ERROR. SYSTEM AUTONOMOUS REBOOT.");
    } finally {
      setIsThinking(false);
      verifyGameStatus();
    }
  };

  // Tactical fallbacks for local and error steps
  const getFallbackCommentary = (errMsg: string, curPersona: PersonaType): string => {
    const triggers: Record<PersonaType, string> = {
      reckless: "CORS BLOCKED OR LM STUDIO DOWN! ENGAGING EMERGENCY OVERDRIVE!!! MUHAHAHA!",
      master: "Local server unreachable. Engaging micro evaluator, balancing positional values.",
      glitched: "ERR_CONN_LOCALHOST_fail... RAW_CPU_COMPUTING... [OK]"
    };
    return triggers[curPersona] || "LM Studio is offline. Engaging on-board tactical core!";
  };

  const getHeuristicPersonaCommentary = (
    curPersona: PersonaType, 
    moves: string[], 
    tel: ChessTelemetry, 
    lastPlay: string
  ): string => {
    const list = CONSOLE_DIALOGS[curPersona].normal;
    // Check state specifics
    if (tel.isAiCheck) {
      const chk = CONSOLE_DIALOGS[curPersona].check;
      return chk[Math.floor(Math.random() * chk.length)];
    }
    // Random selector
    return list[Math.floor(Math.random() * list.length)];
  };

  // Grid Coordinate interaction
  const handleSquareClick = (square: string) => {
    if (isThinking || chessRef.current.isGameOver()) return;

    // Handle ACTIVE Spell Targeting!
    if (spellCastMode) {
      handleSpellTargetClick(square);
      return;
    }

    const chess = chessRef.current;
    
    // Safety check of whose turn it is
    if (chess.turn() === aiColor) {
      return; // It's AI's turn
    }

    const piece = chess.get(square as any);
    const playerColor = aiColor === 'w' ? 'b' : 'w';

    // Clicked own piece
    if (piece && piece.color === playerColor) {
      // Is starting piece currently stunned?
      if (stunnedSquares[square] && stunnedSquares[square] > 0) {
        setAiCommentary("🚫 THAT PIECE IS STUNNED! IT CANNOT INITIATIVE ANY MOTIONS.");
        return;
      }

      setSelectedSquare(square);
      // Load legal target squares
      const moves = chess.moves({ square: square as any, verbose: true });
      setLegalMovesForSelected(moves.map(m => m.to));
      return;
    }

    // Clicked valid move location
    if (selectedSquare && legalMovesForSelected.includes(square)) {
      const moves = chess.moves({ square: selectedSquare as any, verbose: true });
      const matchingMove = moves.find(m => m.to === square);

      if (matchingMove) {
        // Evaluate Captured Targets
        const capturedType = matchingMove.captured;
        const isCapture = capturedType !== undefined;
        
        chess.move(matchingMove.san);
        
        if (soundEnabled) {
          if (isCapture) sfx.capture();
          else sfx.move();
        }

        // --- Execute Player RPG triggers ---
        let rpgText = "";
        if (isCapture) {
          // Subtract HP from AI Boss HP
          const targetDmg: Record<string, number> = { p: 15, n: 25, b: 25, r: 40, q: 70 };
          const baseDmg = targetDmg[capturedType.toLowerCase()] || 15;
          setAiHp(prev => Math.max(0, prev - baseDmg));
          
          // Trigger capture particles & anims
          const animId = Math.random().toString(36).substring(2, 9);
          setCaptureAnimations(prev => [
            ...prev,
            { id: animId, square, pieceType: capturedType, pieceColor: aiColor, damage: baseDmg }
          ]);
          setTimeout(() => {
            setCaptureAnimations(prev => prev.filter(anim => anim.id !== animId));
          }, 1500);

          let passiveDetail = "";
          // Hero specific passives
          if (playerClass === 'mage') {
            setPlayerMana(prev => Math.min(100, prev + 25));
            passiveDetail = " (+25 Arcane MP!)";
          } else if (playerClass === 'paladin') {
            setPlayerHp(prev => Math.min(150 + (playerLevel * 10), prev + 20));
            passiveDetail = " (+20 Holy HP!)";
          } else if (playerClass === 'rogue') {
            // Siphon random mana from AI
            setAiMana(prev => Math.max(0, prev - 15));
            setPlayerMana(prev => Math.min(100, prev + 15));
            passiveDetail = " (Steals 15 MP from AI!)";
          }

          rpgText = `⚔️ Captured enemy ${capturedType.toUpperCase()} on ${square.toUpperCase()}! Dealt ${baseDmg} DMG.${passiveDetail}`;
          setRpgLog(prev => [rpgText, ...prev]);
          addPlayerXp(25);
          
          setPlayerMana(prev => Math.min(100, prev + 15)); // extra bonus for capture
        } else {
          // Regular motion gains
          setPlayerMana(prev => Math.min(100, prev + 10)); // +10 MP per move
          addPlayerXp(8);
        }

        const nextFen = chess.fen();
        const nextHistory = chess.history();
        
        setFen(nextFen);
        setMoveHistory(nextHistory);
        setSelectedSquare(null);
        setLegalMovesForSelected([]);

        // Decrease active effects durations on turn resolution
        tickStatusDurations();

        // Trigger AI Turn
        triggerAiMove(nextFen, nextHistory);
      }
    } else {
      // Clear selection
      setSelectedSquare(null);
      setLegalMovesForSelected([]);
    }
  };

  // Controller resets & cheats
  const resetGame = () => {
    const chess = new Chess();
    chessRef.current = chess;
    setFen(chess.fen());
    setMoveHistory([]);
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setAiCommentary("CHESS CONTAINER FLUSHED. NEW ARCADE MATCH BOOTED.");
    setIsThinking(false);

    if (soundEnabled) sfx.move();

    // If AI is white, trigger white's first move right away!
    if (aiColor === 'w') {
      triggerAiMove(chess.fen(), []);
    }
  };

  const undoMove = () => {
    const chess = chessRef.current;
    if (chess.history().length < 2) {
      setAiCommentary("CANNOT UNDO FROM TURN ZERO, PLAYER 1.");
      return;
    }
    // Undo both AI move and player's previous move to return back to player turn!
    chess.undo();
    chess.undo();
    setFen(chess.fen());
    setMoveHistory(chess.history());
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setAiCommentary("TIME DISPLACEMENT SECURED. PREVIOUS MOVES RETRACTED.");
    if (soundEnabled) sfx.move();
  };

  const forceCpuMove = () => {
    if (isThinking || chessRef.current.isGameOver()) return;
    triggerAiMove(chessRef.current.fen(), chessRef.current.history());
  };

  const handleAiColorChange = (newColor: 'w' | 'b') => {
    setAiColor(newColor);
    // Restart match to align start order
    setTimeout(() => {
      resetGame();
    }, 50);
  };

  // Visual helper lists
  const currentTheme = THEMES[themePreset];

  // Coordinates indices
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const boardCells = useMemo(() => {
    const cells = [];
    const orderedRanks = isFlipped ? [...ranks].reverse() : ranks;
    const orderedFiles = isFlipped ? [...files].reverse() : files;
    const chess = chessRef.current;

    for (const r of orderedRanks) {
      for (const f of orderedFiles) {
        const squareCoord = f + r;
        const piece = chess.get(squareCoord as any);
        const colIndex = files.indexOf(f);
        const rowIndex = ranks.indexOf(r);
        const isDark = (colIndex + rowIndex) % 2 === 1;

        cells.push({
          coord: squareCoord,
          isDark,
          piece,
          f,
          r
        });
      }
    }
    return cells;
  }, [fen, isFlipped]);

  return (
    <div className={`min-h-screen ${currentTheme.cabinetBg} text-slate-100 flex flex-col justify-between select-none pb-4 relative`}>
      
      {/* Scanline overlay custom to the Artistic Flair theme */}
      {themePreset === 'artistic' && (
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff41 3px)' }}></div>
      )}

      {/* 8-Bit Top Title Header with Artistic Flair styling adjustments */}
      <header className={`px-6 py-4 flex flex-wrap justify-between items-center z-10 gap-4 transition-colors duration-200 ${
        themePreset === 'artistic' 
          ? 'bg-[#161625] border-b-4 border-[#1a1a2e]' 
          : 'bg-neutral-900 border-b-4 border-black'
      }`}>
        <div className="flex items-center gap-4">
          {themePreset === 'artistic' ? (
            <div className="w-10 h-10 bg-[#00ff41] flex items-center justify-center text-[#0f0f1b] font-mono font-bold text-2xl shadow-[4px_4px_0px_#008f11] select-none">C</div>
          ) : (
            <Gamepad2 className="w-8 h-8 text-[#f2cf43] animate-pulse" />
          )}
          
          <div>
            {themePreset === 'artistic' ? (
              <h1 className="text-xl md:text-2xl tracking-tighter uppercase font-black italic text-white font-mono">
                Gemma-8-Bit <span className="text-[#00ff41] not-italic">Chess</span>
              </h1>
            ) : (
              <h1 className="text-lg md:text-xl font-pixel tracking-wider text-[#f2cf43] flex items-center gap-2">
                GD-CHESS <span className="text-xs bg-red-600 px-1 py-0.5 rounded text-white animate-bounce">V.82</span>
              </h1>
            )}
            <p className="text-xs font-mono text-zinc-400 mt-1">EMBEDDED CHESS CO-PROCESSOR ENGINE</p>
          </div>
        </div>

        {/* Global Sound and config fast toggles */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-2 h-9 hover:text-white transition-colors duration-150 ${
              themePreset === 'artistic'
                ? 'border-[#1a1a2e] bg-[#161625] hover:bg-[#202035] text-[#00ff41]'
                : 'border-black bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className={`w-4 h-4 ${themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-green-400'}`} />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            title="Rotate Board Coordinates"
            className={`border-2 h-9 hover:text-white font-mono text-xs transition-colors duration-150 ${
              themePreset === 'artistic'
                ? 'border-[#1a1a2e] bg-[#161625] hover:bg-[#202035] text-[#00ff41]'
                : 'border-black bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <ArrowRightLeft className={`w-4 h-4 mr-1 ${themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-purple-400'}`} /> FLIP
          </Button>

          {/* Quick theme select */}
          <Select value={themePreset} onValueChange={(val) => setThemePreset(val as ThemePreset)}>
            <SelectTrigger className={`w-36 h-9 border-2 font-mono text-xs ${
              themePreset === 'artistic'
                ? 'border-[#1a1a2e] bg-[#161625] text-[#00ff41]'
                : 'border-black bg-zinc-800 text-white'
            }`}>
              <Layers className={`w-3 h-3 mr-1 ${themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-cyan-400'}`} />
              <SelectValue placeholder="Palette" />
            </SelectTrigger>
            <SelectContent className={`border-2 font-mono ${
              themePreset === 'artistic'
                ? 'border-[#1a1a2e] bg-[#161625] text-white'
                : 'border-black bg-[#1a1b22] text-white'
            }`}>
              <SelectItem value="artistic">🎨 Artistic Flair</SelectItem>
              <SelectItem value="classic">🕹️ NES Classic</SelectItem>
              <SelectItem value="mint">📟 GB Green</SelectItem>
              <SelectItem value="cyber">🌌 Neon Cyber</SelectItem>
              <SelectItem value="c64">📼 Comm. 64</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Arcade Frame Cabin */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: System Config & Score Boards (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Panel Selector Tab Triggers */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#11111d] border border-zinc-800 rounded mb-1 self-stretch">
            <button
              onClick={() => setLeftPanelTab('adventure')}
              className={`py-2 px-3 text-xxs font-pixel select-none transition-all duration-150 rounded cursor-pointer border ${
                leftPanelTab === 'adventure'
                  ? themePreset === 'artistic'
                    ? 'bg-[#00ff41] text-[#0f0f1b] border-[#00ff41] shadow-[2px_2px_0px_#008f11]'
                    : 'bg-[#f2cf43] text-black border-[#f2cf43] font-bold shadow-[2px_2px_0px_#876d08]'
                  : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/40'
              }`}
            >
              🧙‍♂️ SPELLBOOK
            </button>
            <button
              onClick={() => setLeftPanelTab('classic')}
              className={`py-2 px-3 text-xxs font-pixel select-none transition-all duration-150 rounded cursor-pointer border ${
                leftPanelTab === 'classic'
                  ? themePreset === 'artistic'
                    ? 'bg-[#00ff41] text-[#0f0f1b] border-[#00ff41] shadow-[2px_2px_0px_#008f11]'
                    : 'bg-[#f2cf43] text-black border-[#f2cf43] font-bold shadow-[2px_2px_0px_#876d08]'
                  : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/40'
              }`}
            >
              🕹️ ENGINE CONFIG
            </button>
          </div>

          {leftPanelTab === 'classic' ? (
            <>
              {/* Card containing Mode Controls */}
          <Card className={`p-4 text-white transition-all duration-200 ${
            themePreset === 'artistic'
              ? 'border-4 border-[#1a1a2e] bg-[#161625] rounded-none'
              : 'pixel-border bg-[#181920] border-zinc-700'
          }`}>
            <h2 className={`text-xs font-pixel flex items-center gap-2 mb-4 border-b-2 border-zinc-800 pb-2 ${
              themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#f2cf43]'
            }`}>
              <Cpu className="w-4 h-4 text-cyan-400" /> ENGINE SCHEDULER
            </h2>

            <Tabs value={engineMode} onValueChange={(val) => setEngineMode(val as EngineMode)} className="w-full">
              <TabsList className="grid grid-cols-3 bg-zinc-900 p-1 border border-zinc-700 rounded h-10">
                <TabsTrigger value="gemma" className="font-mono text-[11px] data-[state=active]:bg-cyan-600 data-[state=active]:text-white h-8">
                  Gemma
                </TabsTrigger>
                <TabsTrigger value="gemini" className="font-mono text-[11px] data-[state=active]:bg-purple-600 data-[state=active]:text-white h-8">
                  Gemini
                </TabsTrigger>
                <TabsTrigger value="heuristic" className="font-mono text-[11px] data-[state=active]:bg-zinc-700 data-[state=active]:text-white h-8">
                  Local
                </TabsTrigger>
              </TabsList>

              {/* Gemma Options */}
              <TabsContent value="gemma" className="mt-3 font-mono space-y-3">
                <div className="p-2 bg-black/40 rounded border border-zinc-900 border-l-4 border-l-cyan-500 text-xs">
                  <span className="text-cyan-400 font-semibold">[LM Studio Local Link]</span> Query Gemma locally on your machine via direct browser requests. Requires LM Studio to be active.
                </div>
                <div>
                  <label className="text-zinc-400 text-xs block mb-1">CORS Link Endpoint</label>
                  <Input 
                    value={gemmaUrl} 
                    onChange={(e) => setGemmaUrl(e.target.value)} 
                    placeholder="e.g. http://127.0.0.1:1234/v1" 
                    className="bg-zinc-950 border-zinc-800 h-8 font-mono text-xs text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs block mb-1">Model Name (or loaded default)</label>
                  <Input 
                    value={gemmaModel} 
                    onChange={(e) => setGemmaModel(e.target.value)} 
                    placeholder="Leave blank for loaded fallback" 
                    className="bg-zinc-950 border-zinc-800 h-8 font-mono text-xs text-cyan-300"
                  />
                </div>
              </TabsContent>

              {/* Gemini Cloud System */}
              <TabsContent value="gemini" className="mt-3 font-mono space-y-3">
                <div className="p-2 bg-black/40 rounded border border-zinc-900 border-l-4 border-l-purple-500 text-xs text-purple-200">
                  <span className="text-purple-400 font-semibold">[Gemini 3.5 Flash Cloud]</span> Runs full strategic analysis proxies utilizing server-side API keys. Fully functional out of the box!
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px] bg-zinc-950 p-2 rounded border border-zinc-900">
                  <Sparkles className="w-4 h-4 text-[#f2cf43] shrink-0" />
                  <span>No local software required. Auto-injects secure keys inside Cloud Run container.</span>
                </div>
              </TabsContent>

              {/* Built-in Heuristics */}
              <TabsContent value="heuristic" className="mt-3 font-mono space-y-3">
                <div className="p-2 bg-black/40 rounded border border-zinc-900 border-l-4 border-l-zinc-500 text-xs">
                  <span className="text-zinc-400 font-semibold">[Minimax Solvers]</span> Pure client-side calculations using material positional scoring. Completely offline, instant response.
                </div>
              </TabsContent>
            </Tabs>

            {/* Persona Segment */}
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <label className="text-zinc-400 text-xs font-pixel block mb-2 text-[#f2cf43]">OPPONENT PERSONA</label>
              <Select value={persona} onValueChange={(val) => setPersona(val as PersonaType)}>
                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 font-mono text-xs">
                  <Terminal className="w-3 h-3 mr-1 text-red-400" />
                  <SelectValue placeholder="Persona Type" />
                </SelectTrigger>
                <SelectContent className="border border-zinc-800 bg-[#1e1f26] text-white font-mono">
                  <SelectItem value="reckless">⚔️ Reckless Knight (Trash-Talk)</SelectItem>
                  <SelectItem value="master">🧠 Grandmaster Gemma (Tactical)</SelectItem>
                  <SelectItem value="glitched">🌀 Glitched AI (Malfunctioning)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Turn selector */}
            <div className="mt-4 border-t border-zinc-800 pt-4 flex justify-between items-center gap-3">
              <span className="text-zinc-400 text-xs font-pixel text-zinc-300">AI PLAYS AS</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAiColorChange('b')}
                  className={`border border-black h-8 font-mono text-xs w-16 ${
                    aiColor === 'b' ? 'bg-[#f2cf43] text-black font-semibold' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  BLACK
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAiColorChange('w')}
                  className={`border border-black h-8 font-mono text-xs w-16 ${
                    aiColor === 'w' ? 'bg-[#f2cf43] text-black font-semibold' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  WHITE
                </Button>
              </div>
            </div>
          </Card>

          {/* Captured Node Displays */}
          <Card className={`p-4 text-white transition-all duration-200 ${
            themePreset === 'artistic'
              ? 'border-4 border-[#1a1a2e] bg-[#161625] rounded-none'
              : 'pixel-border bg-[#181920] border-zinc-700'
          }`}>
            <h2 className={`text-xs font-pixel flex items-center gap-2 mb-3 border-b-2 border-zinc-800 pb-2 ${
              themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#f2cf43]'
            }`}>
              <Award className="w-4 h-4 text-pink-400" /> GRAVEYARD BUFFER
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">Gemma lost pieces:</span>
                <div className="flex flex-wrap gap-1 bg-zinc-950 p-2 rounded min-h-11 border border-zinc-900">
                  {capturedPieces[aiColor === 'b' ? 'black' : 'white'].length === 0 ? (
                    <span className="text-zinc-700 text-xxs">No losses recorded.</span>
                  ) : (
                    capturedPieces[aiColor === 'b' ? 'black' : 'white'].map((piece, i) => (
                      <div key={i} className="w-6 h-6 border bg-zinc-800 rounded p-0.5 border-black/30 shrink-0">
                        <ChessPiece type={piece} color={aiColor} themePreset={themePreset} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">Player lost pieces:</span>
                <div className="flex flex-wrap gap-1 bg-zinc-950 p-2 rounded min-h-11 border border-zinc-900">
                  {capturedPieces[aiColor === 'w' ? 'black' : 'white'].length === 0 ? (
                    <span className="text-zinc-700 text-xxs">No losses recorded.</span>
                  ) : (
                    capturedPieces[aiColor === 'w' ? 'black' : 'white'].map((piece, i) => (
                      <div key={i} className="w-6 h-6 border bg-zinc-800 rounded p-0.5 border-black/30 shrink-0">
                        <ChessPiece type={piece} color={aiColor === 'w' ? 'b' : 'w'} themePreset={themePreset} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
            </>
          ) : (
            <>
              {/* Adventure Spellbook & Status Card */}
              <Card className={`p-4 text-white transition-all duration-200 select-none ${
                themePreset === 'artistic'
                  ? 'border-4 border-[#1a1a2e] bg-[#161625] rounded-none'
                  : 'pixel-border bg-[#181920] border-zinc-700'
              }`}>
                {/* Hero profile segment */}
                <div className="border-b border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-pixel text-[#ea5f5f] flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5" /> PLAYER HERO
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">LVL {playerLevel} COMMANDER</span>
                  </div>
                  
                  {/* Hero Class selection & HUD info */}
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {(['mage', 'paladin', 'rogue'] as const).map(cls => (
                      <button
                        key={cls}
                        onClick={() => selectPlayerHeroClass(cls)}
                        className={`py-1 px-1 border text-[9px] uppercase font-mono tracking-wider transition-all duration-150 cursor-pointer ${
                          playerClass === cls
                            ? 'bg-purple-950/50 border-purple-500 text-purple-300 font-bold'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>

                  {/* Character stats bar details (HP, MP, EXP) */}
                  <div className="space-y-2 text-xs font-mono">
                    {/* HP Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-red-400">
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> HP
                        </span>
                        <span>{playerHp} / {150 + (playerLevel * 10)}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-none h-2.5 overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-red-500 h-full transition-all duration-300 shadow-[0_0_8px_#ef4444]" 
                          style={{ width: `${Math.min(100, (playerHp / (150 + (playerLevel * 10))) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* MP Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Zap className="w-3.5 h-3.5 text-sky-400 fill-current" /> MANA
                        </span>
                        <span>{playerMana} / 100</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-none h-2.5 overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-sky-500 h-full transition-all duration-300 shadow-[0_0_8px_#0ea5e9]" 
                          style={{ width: `${playerMana}%` }}
                        />
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[9px] mb-1 text-zinc-500 uppercase">
                        <span>XP PROGRESS</span>
                        <span>{playerXp} / 100</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-none h-1 overflow-hidden">
                        <div 
                          className="bg-green-400 h-full transition-all duration-300" 
                          style={{ width: `${playerXp}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Boss Profile Section */}
                <div className="border-b border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-pixel text-purple-400 flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5 text-purple-500" /> GEMMA BOSS
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase">LVL {aiLevel} {aiClass.replace('_', ' ')}</span>
                  </div>

                  {/* Boss HP/MP progress bars */}
                  <div className="space-y-2 text-xs font-mono">
                    {/* Boss HP */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">BOSS HP</span>
                        <span>{aiHp} / {150 + (aiLevel * 10)}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-none h-2 overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-purple-600 h-full transition-all duration-300 shadow-[0_0_8px_#a855f7]" 
                          style={{ width: `${Math.min(100, (aiHp / (150 + (aiLevel * 10))) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Boss Mana */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">BOSS MANA</span>
                        <span>{aiMana} / 100</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-none h-1.5 overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-fuchsia-500 h-full transition-all duration-300" 
                          style={{ width: `${aiMana}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Spellbook casting cards list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-pixel text-yellow-500 uppercase">ACTIVE RPG CODESPELLS</span>
                    {spellCastMode && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-red-950 text-red-500 font-mono animate-pulse border border-red-800">TARGETING</span>
                    )}
                  </div>
                  
                  {/* Cancel active target select status if in targeting mode */}
                  {spellCastMode && (
                    <div className="p-2 mb-2 bg-red-950/40 border border-red-850 text-center rounded-sm">
                      <p className="text-[9px] font-pixel text-red-400 mb-1">CLICK A VALID CELLS SQUARES TO CAST!</p>
                      <Button
                        size="xs"
                        onClick={() => setSpellCastMode(null)}
                        className="bg-red-800/80 hover:bg-red-700 h-5 text-xxs font-mono text-white px-2 cursor-pointer"
                      >
                        CANCEL CAST
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {/* Spell 1: Pyre Blast */}
                    <button
                      onClick={() => {
                        if (playerMana < 35) {
                          setAiCommentary("🚫 NOT ENOUGH MANA! Pyre Blast requires 35 MP.");
                          return;
                        }
                        setSpellCastMode('pyre');
                        setAiCommentary("PYRE BLAST CHARGING! Click an enemy piece on the board to disintegrate it!");
                      }}
                      disabled={spellCastMode !== null || playerMana < 35}
                      className={`flex justify-between items-center p-2 rounded-sm border text-left transition-all duration-150 cursor-pointer ${
                        playerMana >= 35 && spellCastMode === null
                          ? 'border-red-900 bg-red-950/15 hover:bg-red-950/30'
                          : 'border-zinc-800 bg-zinc-950/30 opacity-50'
                      }`}
                    >
                      <div>
                        <span className="font-pixel text-[10px] text-red-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-red-500" /> PYRE BLAST
                        </span>
                        <p className="font-mono text-[9px] text-zinc-500 mt-1">Disintegrates non-King target. Dealt dmg.</p>
                      </div>
                      <span className="font-mono text-[10px] text-red-400 font-bold shrink-0">35 MP</span>
                    </button>

                    {/* Spell 2: Aegis Ward */}
                    <button
                      onClick={() => {
                        if (playerMana < 30) {
                          setAiCommentary("🚫 NOT ENOUGH MANA! Aegis Ward requires 30 MP.");
                          return;
                        }
                        setSpellCastMode('aegis');
                        setAiCommentary("AEGIS WARD CHARGING! Click one of your friendly pieces to grant protection!");
                      }}
                      disabled={spellCastMode !== null || playerMana < 30}
                      className={`flex justify-between items-center p-2 rounded-sm border text-left transition-all duration-150 cursor-pointer ${
                        playerMana >= 30 && spellCastMode === null
                          ? 'border-yellow-905 bg-yellow-950/10 hover:bg-yellow-950/25'
                          : 'border-zinc-800 bg-zinc-950/30 opacity-50'
                      }`}
                    >
                      <div>
                        <span className="font-pixel text-[10px] text-yellow-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-yellow-500" /> AEGIS WARD
                        </span>
                        <p className="font-mono text-[9px] text-zinc-500 mt-1">Gives friendly square immune shield (2 turns).</p>
                      </div>
                      <span className="font-mono text-[10px] text-yellow-400 font-bold shrink-0">30 MP</span>
                    </button>

                    {/* Spell 3: Shadow Strike */}
                    <button
                      onClick={() => {
                        if (playerMana < 40) {
                          setAiCommentary("🚫 NOT ENOUGH MANA! Shadow Strike requires 40 MP.");
                          return;
                        }
                        setSpellCastMode('shadow_strike');
                        setAiCommentary("SHADOW STRIKE CHARGING! Click any enemy unit to stun its square for 2 turns!");
                      }}
                      disabled={spellCastMode !== null || playerMana < 40}
                      className={`flex justify-between items-center p-2 rounded-sm border text-left transition-all duration-150 cursor-pointer ${
                        playerMana >= 40 && spellCastMode === null
                          ? 'border-sky-900 bg-sky-950/15 hover:bg-sky-950/30'
                          : 'border-zinc-800 bg-zinc-950/30 opacity-50'
                      }`}
                    >
                      <div>
                        <span className="font-pixel text-[10px] text-sky-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-sky-400" /> shadow_strike
                        </span>
                        <p className="font-mono text-[9px] text-zinc-500 mt-1">Freezes/stuns target piece square for 2 rounds.</p>
                      </div>
                      <span className="font-mono text-[10px] text-sky-400 font-bold shrink-0">40 MP</span>
                    </button>
                  </div>
                </div>
              </Card>

              {/* RPG battle combat log feed */}
              <Card className={`p-4 text-white transition-all duration-200 select-none ${
                themePreset === 'artistic'
                  ? 'border-4 border-[#1a1a2e] bg-[#161625] rounded-none'
                  : 'pixel-border bg-[#181920] border-zinc-700'
              }`}>
                <h3 className={`text-xs font-pixel flex items-center gap-2 mb-3 border-b-2 border-zinc-800 pb-2 ${
                  themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#f2cf43]'
                }`}>
                  <Activity className="w-4 h-4 text-teal-400 animate-pulse" /> BATTLE CHRONICLES
                </h3>

                <div className={`rounded p-2.5 font-mono text-xxs h-32 overflow-y-auto ${
                  themePreset === 'artistic'
                    ? 'bg-[#11111d] border border-[#1a1a2e]'
                    : 'bg-zinc-950 border border-zinc-900'
                }`}>
                  <div className="space-y-1.5 text-zinc-300">
                    {rpgLog.map((log, index) => (
                      <div key={index} className="leading-relaxed whitespace-pre-line border-b border-zinc-900 pb-1 last:border-0">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* CENTER COLUMN: Chess Board (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center">
          
          {/* Main Board Wrapper Frame */}
           <div className={`p-4 bg-zinc-800 rounded-lg shadow-2xl relative ${currentTheme.boardBorder} ${currentTheme.capturedBg}`}>
              
              {/* Coordinates ranks labels left vertical */}
              <div className={`absolute left-1 top-4 bottom-4 flex flex-col justify-between text-xxs font-pixel font-bold select-none w-3 text-center pointer-events-none ${
                themePreset === 'artistic' ? 'text-[#00ff41]/50' : 'text-zinc-500'
              }`}>
                {(isFlipped ? [...ranks].reverse() : ranks).map(r => <span key={r} className="h-6 flex items-center justify-center">{r}</span>)}
              </div>

              {/* Actual chess board squares grid 8x8 */}
              <div className="ml-4 mr-1 grid grid-cols-8 gap-0 p-1 bg-zinc-950/40 relative">
                {boardCells.map(({ coord, isDark, piece, f, r }) => {
                  const isSelected = selectedSquare === coord;
                  const isLegalTarget = legalMovesForSelected.includes(coord);
                  
                  // Custom theme variables
                  const cellColor = isDark ? currentTheme.darkSquare : currentTheme.lightSquare;
                  const borderHighlight = isSelected ? currentTheme.selectedBg : '';
                  const targetOverlay = isLegalTarget ? currentTheme.targetBg : '';

                  const playerColor = aiColor === 'w' ? 'b' : 'w';
                  const enemyColor = aiColor;
                  const isPlayersTurn = chessRef.current.turn() === playerColor;

                  // RPG Spell & status variables
                  const isShielded = shieldedSquares[coord] > 0;
                  const isStunned = stunnedSquares[coord] > 0;
                  const isPyreTargetable = spellCastMode === 'pyre' && piece && piece.color === enemyColor && piece.type !== 'k';
                  const isAegisTargetable = spellCastMode === 'aegis' && piece && piece.color === playerColor;
                  const isShadowTargetable = spellCastMode === 'shadow_strike' && piece && piece.color === enemyColor && piece.type !== 'k';
                  const isTargetableByActiveSpell = isPyreTargetable || isAegisTargetable || isShadowTargetable;

                  return (
                    <button
                      key={coord}
                      onClick={() => handleSquareClick(coord)}
                      disabled={isThinking}
                      className={`relative aspect-square flex items-center justify-center cursor-pointer transition-all duration-100 ${cellColor} ${borderHighlight} ${targetOverlay} group`}
                    >
                      {piece && (
                        <div className="w-[85%] h-[85%] relative z-10 select-none group-active:scale-90 group-hover:scale-105 transition-all duration-75">
                          <ChessPiece type={piece.type} color={piece.color} themePreset={themePreset} />
                        </div>
                      )}

                      {/* Capture Animation Overlays */}
                      {captureAnimations.filter(anim => anim.square === coord).map(anim => {
                        return (
                          <div key={anim.id} className="absolute inset-0 pointer-events-none z-30 overflow-visible flex items-center justify-center">
                            {/* 1. Dramatic retro color-filtered sword slash */}
                            <motion.div
                              initial={{ scale: 0.1, rotate: -45, opacity: 1 }}
                              animate={{ scale: [0.1, 1.4, 1.5], rotate: -45, opacity: [1, 1, 0] }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="absolute w-[140%] h-2 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_#ffffff] z-30"
                              style={{
                                filter: themePreset === 'cyber' 
                                  ? 'drop-shadow(0 0 8px #ff007f) hue-rotate(180deg)' 
                                  : themePreset === 'classic'
                                  ? 'drop-shadow(0 0 8px #f2cf43)'
                                  : 'drop-shadow(0 0 8px #ef4444)'
                              }}
                            />
                            
                            {/* 2. Floating Damage Indicator with pixel retro drift */}
                            <motion.div
                              initial={{ y: 0, opacity: 1, scale: 0.6 }}
                              animate={{ y: -45, opacity: [1, 1, 0], scale: 1.1 }}
                              transition={{ duration: 1.1, ease: "easeOut" }}
                              className="absolute z-50 pointer-events-none flex flex-col items-center justify-center font-pixel"
                            >
                              <span className="text-[9px] bg-zinc-950/95 border border-red-500/50 px-1 py-0.5 rounded text-red-500 font-bold tracking-tight whitespace-nowrap shadow-lg">
                                -{anim.damage} HP
                              </span>
                              <span className="text-[7px] text-red-400 font-bold uppercase tracking-wider scale-75 mt-0.5 shadow-sm">
                                CRITICAL!
                              </span>
                            </motion.div>

                            {/* 3. Pixel explosion particle chunks */}
                            {Array.from({ length: 14 }).map((_, i) => {
                              const angle = (i * 2 * Math.PI) / 14 + (Math.random() - 0.5) * 0.3;
                              const distance = 20 + Math.random() * 25; // radius in px
                              const targetX = Math.cos(angle) * distance;
                              const targetY = Math.sin(angle) * distance;
                              
                              // Particle core styling based on theme and captured piece
                              const isWhitePiece = anim.pieceColor === 'w';
                              const particleBg = isWhitePiece
                                ? themePreset === 'mint'
                                  ? 'bg-[#e0f8d0] border border-[#9bbc0f]'
                                  : themePreset === 'cyber'
                                  ? 'bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]'
                                  : 'bg-zinc-100 border border-zinc-300 shadow-[0_0_4px_#ffffff]'
                                : themePreset === 'mint'
                                  ? 'bg-[#0f380f]'
                                  : themePreset === 'cyber'
                                  ? 'bg-[#ff007f] shadow-[0_0_6px_#ff007f]'
                                  : 'bg-red-500 shadow-[0_0_4px_#ef4444]';

                              return (
                                <motion.div
                                  key={i}
                                  initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
                                  animate={{ 
                                    x: targetX, 
                                    y: targetY + 16, // include gravity fall
                                    scale: 0.2, 
                                    opacity: 0,
                                    rotate: Math.random() * 360
                                  }}
                                  transition={{ duration: 0.7, ease: "easeOut" }}
                                  className={`absolute w-1.5 h-1.5 rounded-none z-30 pointer-events-none ${particleBg}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Shield active overlay */}
                      {isShielded && (
                        <div className="absolute inset-0 bg-yellow-500/15 border-2 border-yellow-400 animate-pulse pointer-events-none z-20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-yellow-300 opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                        </div>
                      )}

                      {/* Stun active overlay */}
                      {isStunned && (
                        <div className="absolute inset-0 bg-sky-500/15 border-2 border-sky-400 pointer-events-none z-20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-sky-300 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                        </div>
                      )}

                      {/* Active spell targeting glow overlay */}
                      {isTargetableByActiveSpell && (
                        <div className="absolute inset-0 bg-red-600/20 border-2 border-red-500 animate-pulse pointer-events-none z-30" />
                      )}

                      {/* Small coordinate helper index on very bottom corner of first bottom labels */}
                      {coord.endsWith('1') && !isFlipped && (
                        <span className="absolute bottom-0 right-[2px] text-[8px] font-pixel text-zinc-400 font-bold opacity-30 select-none">{f}</span>
                      )}
                      {coord.endsWith('8') && isFlipped && (
                        <span className="absolute bottom-0 right-[2px] text-[8px] font-pixel text-zinc-400 font-bold opacity-30 select-none">{f}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Files labels horizontal bottom */}
              <div className={`ml-5 mt-2 flex justify-between text-xxs font-pixel font-bold select-none pointer-events-none ${
                themePreset === 'artistic' ? 'text-[#00ff41]/50' : 'text-zinc-500'
              }`}>
                {(isFlipped ? [...files].reverse() : files).map(f => (
                  <span key={f} className="w-10 text-center">{f.toUpperCase()}</span>
                ))}
              </div>
          </div>

          {/* Quick instructions indicator details */}
          <div className="mt-3 flex items-center gap-2 bg-[#181920]/80 px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 select-none font-mono">
            <Info className="w-3.5 h-3.5 text-[#f2cf43]" />
            <span>Click any legal piece to select and view green available move targets.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Dialogue Console Dialogs & Play History (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Main big Dialogue monitor */}
          <Card className={`crt-container min-h-56 p-4 flex flex-col justify-between text-white transition-all duration-200 rounded-none ${
            themePreset === 'artistic'
              ? 'border-4 border-[#1a1a2e] bg-[#11111d]'
              : 'pixel-border bg-[#111216] border-zinc-700'
          }`}>
            <div className="crt-screen scanline-flicker flex-1 flex flex-col justify-between">
              <div>
                <div className={`flex justify-between items-center font-pixel text-xxs pb-1.5 mb-2 select-none border-b ${
                  themePreset === 'artistic' 
                    ? 'text-[#ff00ff] border-[#1a1a2e]' 
                    : 'text-[#ea5f5f] border-rose-900'
                }`}>
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 animate-pulse" />
                    STATUS: {isThinking ? "CALCULATING..." : "WAITING"}
                  </span>
                  <span>CPU_01</span>
                </div>

                <div className="font-pixel text-[10px] text-zinc-400 leading-tight mb-2 uppercase tracking-wide select-none">
                  {persona === 'reckless' && "👿 Reckless Knight says:"}
                  {persona === 'master' && "🧠 Grandmaster Gemma says:"}
                  {persona === 'glitched' && "🌀 Glitched Gemma says:"}
                </div>

                <div className={`font-mono text-sm font-bold leading-relaxed break-words min-h-16 antialiased selection:bg-green-800 select-all ${
                  themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#4ade80]'
                }`}>
                  {displayedCommentary}
                  <span className={`inline-block w-2.5 h-4 ml-1 pixel-blink ${
                    themePreset === 'artistic' ? 'bg-[#00ff41]' : 'bg-[#4ade80]'
                  }`} />
                </div>
              </div>

              {isThinking && (
                <div className="flex items-center gap-2 font-pixel text-xxs text-yellow-400 mt-2">
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-sm animate-ping" />
                  <span>ALGEBRAIC SYNAPSE COMPUTING...</span>
                </div>
              )}
            </div>
          </Card>

          {/* Core arcade controllers triggers panel */}
          <Card className={`p-4 text-white transition-all duration-200 rounded-none ${
            themePreset === 'artistic'
              ? 'border-4 border-[#1a1a2e] bg-[#161625]'
              : 'pixel-border bg-[#181920] border-zinc-700'
          }`}>
            <h2 className={`text-xs font-pixel flex items-center gap-2 mb-3 border-b-2 border-zinc-800 pb-2 select-none ${
              themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#f2cf43]'
            }`}>
              <Gamepad2 className="w-4 h-4 text-green-400" /> CONSOLE PADS
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={resetGame}
                className={`font-pixel text-[#f2cf43] text-xxs h-11 text-white shadow-md active:translate-y-0.5 transition-all duration-150 ${
                  themePreset === 'artistic'
                    ? 'border-0 bg-[#00ff41] hover:bg-[#12fa4c] text-[#0f0f1b] shadow-[4px_4px_0px_#008f11] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    : 'border-2 border-black bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> START
              </Button>

              <Button
                onClick={undoMove}
                className={`font-pixel text-[#f2cf43] text-xxs h-11 text-white shadow-md active:translate-y-0.5 transition-all duration-150 ${
                  themePreset === 'artistic'
                    ? 'border-0 bg-[#ff00ff] hover:bg-[#fb2efb] text-white shadow-[4px_4px_0px_#800080] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    : 'border-2 border-black bg-[#9333ea] hover:bg-[#a855f7]'
                }`}
              >
                UNDO
              </Button>

              {/* Cheat Force CPU Move */}
              <Button
                onClick={forceCpuMove}
                disabled={isThinking || chessRef.current.isGameOver()}
                variant="outline"
                className={`col-span-2 text-xxs font-pixel h-10 select-none active:translate-y-0.5 transition-all duration-150 ${
                  themePreset === 'artistic'
                    ? 'border-2 border-dashed border-[#1a1a2e] bg-[#11111d] hover:bg-[#1b1b2f] text-[#00ff41]'
                    : 'col-span-2 border-4 border-zinc-900 border-l-cyan-600 border-r-cyan-600 bg-zinc-900 hover:bg-zinc-800 text-cyan-400'
                }`}
              >
                💥 FORCE COMPUTER TO PLAY
              </Button>
            </div>
          </Card>

          {/* Move Log Score panel */}
          <Card className={`p-4 text-white transition-all duration-200 rounded-none ${
            themePreset === 'artistic'
              ? 'border-4 border-[#1a1a2e] bg-[#161625]'
              : 'pixel-border bg-[#181920] border-zinc-700'
          }`}>
            <h3 className={`text-xs font-pixel flex items-center gap-2 mb-3 border-b-2 border-zinc-800 pb-2 select-none ${
              themePreset === 'artistic' ? 'text-[#00ff41]' : 'text-[#f2cf43]'
            }`}>
              <Award className="w-4 h-4 text-[#f2cf43]" /> MOVE RECORD
            </h3>

            <div className={`rounded p-2 font-mono text-xs max-h-36 overflow-y-auto select-all scrollbar-thin scrollbar-thumb-zinc-800 ${
              themePreset === 'artistic'
                ? 'bg-[#11111d] border border-[#1a1a2e]'
                : 'bg-zinc-950 border border-zinc-900'
            }`}>
              {moveHistory.length === 0 ? (
                <span className="text-zinc-650 italic text-[11px] block text-center py-2 select-none">Grid is vacant. Insert moves.</span>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, index) => {
                    const whiteIndex = index * 2;
                    const blackIndex = index * 2 + 1;
                    return (
                      <div key={index} className="flex gap-2 justify-between border-b border-zinc-950 py-0.5 text-zinc-300">
                        <span className="text-zinc-500 w-8">{index + 1}.</span>
                        <span className="text-slate-200 font-semibold text-left flex-1">{moveHistory[whiteIndex]}</span>
                        <span className="text-amber-400 text-right w-12">{moveHistory[blackIndex] || ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

        </div>
      </main>

      {/* Retro bottom footboard detail warnings */}
      <footer className="max-w-7xl w-full mx-auto px-6 text-center select-none mt-4">
        {themePreset === 'artistic' ? (
          <div className="border-t-4 border-[#1a1a2e] flex flex-wrap items-center px-6 py-3.5 justify-between bg-[#11111d] rounded-sm font-mono text-zinc-400 border border-[#1a1a2e]/60">
            <div className="flex gap-6 text-[11px] uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#00ff41]"></div> CPU: 12%</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ff00ff]"></div> VRAM: 3.4GB</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400"></div> LATENCY: 42ms</span>
            </div>
            <div className="text-[#00ff41] font-bold text-xs tracking-tighter">
              GEMMA v2 // LOCAL_HOST:3000
            </div>
          </div>
        ) : (
          <p className="text-[10px] font-pixel text-zinc-600">
            * RUNNABLE PORT 3000 CONSOLE. DESIGN COMPLIANT TO ARCADE CABINET GUIDELINE 497-C *
          </p>
        )}
      </footer>
    </div>
  );
}
