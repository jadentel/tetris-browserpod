import { ensurePod, copyWorkspaceToPod, getFilesystemTree, startServer } from './sandbox.js';
import { TetrisAgent } from './agent.js';
import { UIController } from './ui.js';

let ui = null;
let agent = null;
let isBooted = false;

function init() {
    ui = new UIController();
    agent = new TetrisAgent(ui);
    
    // Bind buttons
    document.getElementById('btn-boot').addEventListener('click', handleBoot);
    document.getElementById('btn-run-agent').addEventListener('click', handleRunAgent);
    document.getElementById('btn-reset').addEventListener('click', () => window.location.reload());
    
    // Quick prompts
    document.querySelectorAll('.btn-prompt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.target.textContent;
            document.getElementById('prompt-input').value = text;
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function handleBoot() {
    if (isBooted) return;
    try {
        const terminalContainer = document.getElementById('terminal-container');
        
        ui.addTimelineStep("Booting BrowserPod WASM Environment...", "step-active");
        await ensurePod(terminalContainer);
        ui.updateTimelineStep("BrowserPod booted.", "step-done");

        ui.addTimelineStep("Mounting workspace virtual filesystem...", "step-active");
        await copyWorkspaceToPod();
        const files = await getFilesystemTree();
        await ui.renderFileSystem(files);
        ui.updateTimelineStep("Filesystem prepared.", "step-done");

        ui.addTimelineStep("Starting Node.js server inside Pod...", "step-active");
        const previewUrl = await startServer();
        ui.addProcess('node /workspace/server.js');
        ui.updateTimelineStep("Server started listening on port 3000.", "step-done");
        
        ui.addTimelineStep("Awaiting agent prompt...", "waiting");
        
        ui.setPreviewUrl(previewUrl);
        isBooted = true;
        document.getElementById('btn-boot').disabled = true;
    } catch (err) {
        console.error(err);
        ui.addTimelineStep("Error during boot: " + err.message, "");
    }
}

// Intercept prompt run
async function handleRunAgent() {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (!prompt) return;
    
    // Auto-boot if not already
    if (!isBooted) {
        await handleBoot();
    }
    
    document.getElementById('btn-run-agent').disabled = true;
    
    try {
        await agent.processPrompt(prompt);
        // Sync FS
        const files = await getFilesystemTree();
        // Since we mark them manually as changed in agent, we just want to ensure we have the files, 
        // but ui.renderFileSystem would erase the changed styling. So we only refresh if new files.
        // For our demo, the agent marks files.
    } catch (e) {
        console.error(e);
        ui.updateTimelineStep("Agent Error: " + e.message, "");
    }
    
    document.getElementById('btn-run-agent').disabled = false;
}
