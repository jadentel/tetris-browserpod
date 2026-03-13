import { BrowserPod } from '@leaningtech/browserpod';

// Load all workspace files purely client-side via Vite's import.meta.glob
const workspaceFiles = import.meta.glob('../assets/workspace/**/*', { query: '?raw', import: 'default', eager: true });

let podInstance = null;
let serverProc = null;
let aiProc = null;

export async function ensurePod(terminalContainer) {
    if (podInstance) return podInstance;
    
    const apiKey = import.meta.env.VITE_BP_APIKEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("Missing VITE_BP_APIKEY in .env");
    }

    // Start boot timing
    const t0 = performance.now();
    window.dispatchEvent(new CustomEvent('pod-boot-start'));
    
    podInstance = await BrowserPod.boot({
        apiKey: apiKey
    });
    
    // Mount terminal if provided
    let terminal = null;
    if (terminalContainer) {
        terminal = await podInstance.createDefaultTerminal(terminalContainer);
        
        // Quick visual tweak to keep it looking nice even without the config API
        terminalContainer.style.background = '#000000';
    }
    
    // Attach terminal to pod instance for easy access
    podInstance.terminal = terminal;
    
    const t1 = performance.now();
    window.dispatchEvent(new CustomEvent('pod-boot-done', { detail: { time: Math.round(t1 - t0) } }));

    return podInstance;
}

export function getPod() {
    return podInstance;
}

export async function copyWorkspaceToPod() {
    if (!podInstance) throw new Error("Pod not booted");
    
    // Create base directories
    await podInstance.createDirectory('/workspace', { recursive: true });
    await podInstance.createDirectory('/workspace/build', { recursive: true });
    await podInstance.createDirectory('/workspace/data', { recursive: true });
    
    for (const [path, content] of Object.entries(workspaceFiles)) {
        // path is like '../assets/workspace/server.js'
        // we want '/workspace/server.js'
        const podPath = path.replace('../assets/workspace', '/workspace');
        
        // Write file
        const file = await podInstance.createFile(podPath, 'utf-8');
        await file.write(content);
        await file.close();
    }
    
    console.log("Copied files to workspace.");
}

export async function getFilesystemTree() {
    // Basic mock since we don't have a `run` output easily capturable without a stream
    // and `fs` API doesn't have readdir in this definition. Best effort flat list based on what we copied:
    if (!podInstance) return [];
    
    const podFiles = Object.keys(workspaceFiles).map(p => p.replace('../assets/workspace', '/workspace'));
    
    // Include AI file if it exists
    try {
        const testAI = await podInstance.openFile('/workspace/ai-player.js', 'utf-8');
        if (testAI) {
            podFiles.push('/workspace/ai-player.js');
            await testAI.close();
        }
    } catch(e) {}

    return podFiles;
}

export async function startServer() {
    if (!podInstance) throw new Error("Pod not booted");
    
    // Cleanup previous process if possible
    if (serverProc && serverProc.kill) {
        try { await serverProc.kill(); } catch(e) {}
    }
    
    const t0 = performance.now();
    
    return new Promise((resolve) => {
        let resolved = false;
        
        // 1. Setup listener FIRST to avoid races
        podInstance.onPortal(({ url, port }) => {
            console.log(`Portal detected: ${url} (port ${port})`);
            if (port === 3000 && !resolved) {
                resolved = true;
                const t1 = performance.now();
                window.appPreviewUrl = url;
                window.dispatchEvent(new CustomEvent('server-start-done', { detail: { time: Math.round(t1 - t0) } }));
                resolve(url);
            }
        });
        
        // 2. Start node in the background
        serverProc = podInstance.run('node', ['/workspace/server.js'], { 
            terminal: podInstance.terminal
        });

        // 3. Fallback timeout
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                const url = window.appPreviewUrl || 'http://localhost:3000/';
                console.warn("onPortal timeout, falling back to", url);
                window.dispatchEvent(new CustomEvent('server-start-done', { detail: { time: 5000 } }));
                resolve(url);
            }
        }, 10000); // 10s timeout for WASM cold start
    });
}

export async function restartServer() {
    await startServer();
}

export async function applyPatch(podPath, newContent) {
    if (!podInstance) return;
    try {
        const file = await podInstance.createFile(podPath, 'utf-8');
        await file.write(newContent);
        await file.close();
        console.log(`Patched ${podPath}`);
    } catch (e) {
        console.error("Failed to patch", e);
    }
}

export async function readFile(podPath) {
    if (!podInstance) return null;
    try {
        const file = await podInstance.openFile(podPath, 'utf-8');
        const size = await file.getSize();
        const content = await file.read(size);
        await file.close();
        return content;
    } catch(e) {
        return null;
    }
}

export async function runProcess(cmd, args) {
    if (!podInstance) return null;
    return await podInstance.run(cmd, args, { terminal: podInstance.terminal });
}

export async function stopProcess(proc) {
    if (proc && proc.kill) await proc.kill();
}
