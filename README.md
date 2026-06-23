# Retro Arcade Chess RPG: Local Deployment & Setup guide

Welcome to the **Retro Arcade Chess RPG**! This guide provides detailed, step-by-step instructions for running and deploying this full-stack interactive game locally on your Windows, macOS, or Linux PC.

The application features a **TypeScript/React (Vite) frontend** integrated with an **Express.js backend** that proxies AI moves securely using the Google Gemini SDK or connects to local models (like LM Studio).

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **Node.js**: Version `18.0.0` or higher (we recommend `v20.x` or `v22.x` LTS).
   - Check version: `node -v`
2. **npm** (Node Package Manager): Usually bundled with Node.js.
   - Check version: `npm -v`
3. ***(Optional)* A Google Gemini API Key**: If you wish to use the advanced cloud-hosted AI opponent (powered by `gemini-3.5-flash`).
   - You can get a free key from the [Google AI Studio Console](https://aistudio.google.com/).
4. ***(Optional)* LM Studio / Local Inference Server**: If you wish to play against a fully local open-weights model (e.g. Gemma 2b or Llama 3) without internet connection.

---

## 🚀 Quick Start (Local Development)

Follow these steps to run the application in development mode with hot-reloading:

### Step 1: Prepare your Project Directory
If you downloaded the code as a ZIP archive, extract it to a folder of your choice on your local machine.

Open your system terminal (or Command Prompt / PowerShell on Windows) and navigate to the project root directory:
```bash
cd /path/to/retro-arcade-chess-rpg
```

### Step 2: Install Dependencies
Run the package manager to download and install all node modules required by the frontend and backend:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy or rename the example environment file to create a local `.env` configuration:

* On **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```
* On **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
* On **Windows (Command Prompt)**:
  ```cmd
  copy .env.example .env
  ```

Open the newly created `.env` file in your favorite text editor and set your credentials:
```env
# Set your Gemini API key from Google AI Studio
GEMINI_API_KEY="AIzaSyYourActualKeyHere..."

# Set the self-referential URL of your local server
APP_URL="http://localhost:3000"
```

### Step 4: Launch Dev Server
Start the unified full-stack server. In development, this runs the backend Express server on port `3000` and configures Vite as a middleware proxy to serve and hot-reload React assets:
```bash
npm run dev
```

You should see a message in your console:
`Server running on http://localhost:3000`

Open your web browser and navigate to **[http://localhost:3000](http://localhost:3000)** to start playing!

---

## 📦 Production Build & Deployment

To build a high-performance, optimized version of the app suitable for hosting or running on a local production environment:

### Step 1: Compile and Bundle
Run the build script. This will compile all static React assets into the `dist/` directory and compile the TypeScript Express backend into a single self-contained CommonJS file (`dist/server.cjs`) using `esbuild`:
```bash
npm run build
```

### Step 2: Start Production Server
Launch the precompiled production server. Unlike the dev mode, this avoids TypeScript on-the-fly compiling and serves static mini-files with maximum speed:
```bash
npm run start
```
The app will be accessible at **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠️ Playing Against an AI Opponent

The Chess RPG supports three engine capabilities, selectable from the **AI Opponent settings** inside the game dashboard:

1. **Heuristic Engine (Local)**:
   - Does not require any API keys or network connection.
   - Evaluates moves using rapid boards algorithms, positioning matrices, and search scores.
2. **Gemini 3.5 Flash (Cloud)**:
   - Requires a valid `GEMINI_API_KEY` defined in your `.env` file.
   - Generates retro dialog logs depending on the selected AI Persona (*Reckless Apprentice*, *Grandmaster*, or *Glitched Mainframe*).
3. **Local LLM / LM Studio (Local)**:
   - Fully offline AI.
   - Run a local server such as **LM Studio**, **Ollama**, or **Llama.cpp** hosting an OpenAI-compatible endpoint.
   - Set the Local Inference URL inside the game UI settings (e.g., `http://127.0.0.1:1234/v1` for LM Studio).
   - Enter your model ID (e.g. `gemma-2b-it`) and play.

---

## 🗃️ Under the Hood: Full-Stack Architecture

* **Framework & Frontend**: Built with React 19, styled with modern Tailwind CSS utility classes, and powered by `lucide-react` for graphics.
* **Game Rules Engine**: Driven by the battle-tested `chess.js` library.
* **Backend Bridge**: Built using `Express.js`, which securely manages API endpoints (`/api/gemini-chess`) so that your secret `GEMINI_API_KEY` is never exposed to the user's browser.
* **Sound Design**: Integrated with a custom synthesized sound effects framework running directly inside your browser's standard Web Audio API.

Have fun conquering the Retro Arena! ♟️⚔️
