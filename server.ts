import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client (server-side only, user-agent for telemetry)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// REST route for Cloud Backup opponent (Gemini 3.5 Flash)
app.post("/api/gemini-chess", async (req, res) => {
  try {
    const { fen, legalMoves, history, telemetry, persona, lastMove } = req.body;

    if (!aiClient) {
      return res.status(503).json({ 
        error: "Gemini API key is not configured in Secrets. Switch to Local LM Studio or Heuristic Engine!" 
      });
    }

    if (!legalMoves || !Array.isArray(legalMoves) || legalMoves.length === 0) {
      return res.status(400).json({ error: "No legal moves provided." });
    }

    const systemInstruction = `You are an 8-bit retro arcade chess AI playing a game. 
You must select exactly ONE move from the provided list of legal moves. 
You must output your response strictly as JSON with this schema:
{
  "move": "the chosen move string EXACTLY as it appears in the list",
  "commentary": "a very short, witty retro video game commentary (max 100 characters) about the move or board state"
}

Persona guidelines:
- "reckless": Aggressive, overconfident, arcade trash-talker, uses punctuation like "!!!", "MUHAHAHA!" or "BEHOLD!".
- "master": Calm, analytical, deep, formal, talks about positioning or strategies in retro wise style.
- "glitched": Shorthand, capitalizations, visual glitch indicators (e.g., "G_E_M_M_A.ERR", "SYS_OVR_RIDE").

DO NOT output any markdown formatting other than raw JSON.
The selected move MUST be one of: [${legalMoves.join(', ')}]`;

    const userPrompt = `
Board FEN: ${fen}
Game History: ${history || "None"}
Last Move: ${lastMove || "None"}
Your active persona: ${persona || "reckless"}
Telemetry of board: 
- Material score discrepancy (positive = white leading, negative = black leading): ${telemetry?.materialDifference || 0}
- Total pieces remaining: ${telemetry?.boardPieceCount || 32}
- Is AI in Check?: ${telemetry?.isAiCheck ? "YES" : "NO"}
- Is Player in Check?: ${telemetry?.isUserCheck ? "YES" : "NO"}

CHOOSE EXACTLY ONE LEGAL MOVE FROM THIS ARRAY (Case Sensitive, EXACT string match):
[${legalMoves.map(m => `"${m}"`).join(', ')}]

Return JSON with "move" and "commentary". Make sure the "move" exists in the list!`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: {
              type: Type.STRING,
              description: "The exact move string selected from the legal moves array.",
            },
            commentary: {
              type: Type.STRING,
              description: "Retro retro arcade dialogue or tactical thought (max 100 characters).",
            },
          },
          required: ["move", "commentary"],
        },
        temperature: 0.7,
      },
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput);
    
    // Verify Gemma / Gemini selected a valid move
    if (!legalMoves.includes(data.move)) {
      // Find exact or closest case-insensitive match
      const matched = legalMoves.find(m => m.toLowerCase() === data.move?.toLowerCase());
      if (matched) {
        data.move = matched;
      } else {
        // Fallback to first move if totally invalid
        data.move = legalMoves[0];
        data.isFallback = true;
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error("Gemini route error:", error);
    res.status(500).json({ error: error.message || "Unknown error during AI generation." });
  }
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
