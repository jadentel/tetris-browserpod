# BrowserPod Tetris Agent Playground

This is a polished demo showcasing the power of **BrowserPod** running entirely in the browser. It simulates an AI developer ("agent") operating within a local filesystem and Node.js environment directly in your browser.

## Features Showcased

- **Sandboxed AI Code Execution**: The app creates a BrowserPod environment for a fully client-side agent to read, patch, and run node scripts.
- **Virtual Filesystem**: Contains a mocked Node.js application (`server.js`) and a fully functional Tetris game. The filesystem is dynamically modified dynamically.
- **Multi-process Execution**: Shows standard HTTP servers alongside dynamically spawned AI scripts.
- **Fast Cold Starts**: BrowserPod boots Vite applications almost instantly, with measured startup timings visible.
- **Live Interactive Preview**: Changes made to the game code are reflected immediately in the application iframe preview via seamless Node.js restarts.

## Local Setup

1. Make sure you have Node installed.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Setup the environment variable:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Edit `.env` to include your \`VITE_BP_APIKEY\`.

4. Start the dev server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Visit the printed unauthenticated loopback URL in your browser. Wait for the server to load and try the suggested prompts!

> Note: For the preview iframe to load correctly, make sure it has the proper COOP/COEP isolation rules. This repo provides \`vite.config.js\` and \`vercel.json\` to enforce this automatically.
# tetris-browserpod
