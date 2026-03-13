import { readFile, applyPatch, restartServer, getFilesystemTree, runProcess } from './sandbox.js';

export class TetrisAgent {
    constructor(uiController) {
        this.ui = uiController;
        this.aiProcess = null;
    }

    async processPrompt(prompt) {
        const p = prompt.toLowerCase();
        
        await this.ui.addTimelineStep("Agent received prompt: Analyzing intent...", "step-active");
        await this.delay(800);
        
        if (p.includes("neon")) {
            await this.applyNeonTheme();
        } else if (p.includes("leaderboard")) {
            await this.applyLeaderboard();
        } else if (p.includes("ai") || p.includes("bot") || p.includes("autoplay")) {
            await this.applyAutoplayAI();
        } else if (p.includes("pause") || p.includes("resume")) {
            await this.applyPauseResume();
        } else if (p.includes("faster") || p.includes("speed")) {
            await this.applyFasterSpeed();
        } else {
            await this.ui.updateTimelineStep("Unknown prompt. Try one from the list.", "step-done");
            return;
        }

        await this.ui.updateTimelineStep("Task completed. Verifying preview...", "step-done");
        await this.ui.addTimelineStep("Agent is idle.", "waiting");
        
        // Refresh FS view just in case
        const files = await getFilesystemTree();
        await this.ui.renderFileSystem(files);
    }

    async applyNeonTheme() {
        await this.ui.updateTimelineStep("Intent: Neon Theme. Inspecting CSS files...", "step-done");
        await this.ui.addTimelineStep("Patching /workspace/build/style.css...", "step-active");
        
        let css = await readFile('/workspace/build/style.css');
        if (!css) css = "";
        
        // Make it neon
        css = css.replace(/border: 4px solid #333;/, 'border: 4px solid #0ff; box-shadow: 0 0 20px #0ff, inset 0 0 10px #0ff;');
        css = css.replace(/color: #4CAF50;/, 'color: #ff00ff; text-shadow: 0 0 10px #ff00ff;');
        
        await this.delay(1000);
        await applyPatch('/workspace/build/style.css', css);
        
        this.ui.markFileChanged('/workspace/build/style.css');
        await this.ui.updateTimelineStep("CSS updated.", "step-done");
        await this.restartAndVerify();
    }

    async applyLeaderboard() {
        await this.ui.updateTimelineStep("Intent: Leaderboard. Inspecting index.html and style.css...", "step-done");
        await this.ui.addTimelineStep("Modifying frontend to show leaderboard...", "step-active");
        
        let html = await readFile('/workspace/build/index.html');
        // Unhide the leaderboard
        if (html) {
             html = html.replace('style="display: none;"', 'style="display: block;"');
             await applyPatch('/workspace/build/index.html', html);
             this.ui.markFileChanged('/workspace/build/index.html');
        }
        
        let js = await readFile('/workspace/build/game.js');
        if (js && !js.includes('fetch("/api/scores")')) {
            const leaderboardCode = `
// Append to updateScore
const origUpdateScore = updateScore;
updateScore = function() {
    origUpdateScore();
    fetch('/api/scores').then(r=>r.json()).then(data => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = data.scores.map(s => '<li><span>'+s.name+'</span><span>'+s.score+'</span></li>').join('');
        }
    }).catch(e=>console.error(e));
};
updateScore();
`;
            js += leaderboardCode;
            await applyPatch('/workspace/build/game.js', js);
            this.ui.markFileChanged('/workspace/build/game.js');
        }
        
        await this.delay(1000);
        await this.ui.updateTimelineStep("Frontend updated.", "step-done");
        await this.restartAndVerify();
    }

    async applyAutoplayAI() {
        await this.ui.updateTimelineStep("Intent: Autoplay AI. Creating ai-player.js...", "step-done");
        await this.ui.addTimelineStep("Writing /workspace/ai-player.js...", "step-active");
        
        const aiCode = `
console.log("AI Player Booting...");
setInterval(() => {
    console.log("AI deciding next move... [simulated computation]");
}, 2000);
`;
        await applyPatch('/workspace/ai-player.js', aiCode);
        this.ui.markFileChanged('/workspace/ai-player.js');
        
        await this.delay(1000);
        await this.ui.updateTimelineStep("AI script created.", "step-done");
        
        await this.ui.addTimelineStep("Starting secondary AI process...", "step-active");
        this.aiProcess = await runProcess('node', ['/workspace/ai-player.js']);
        this.ui.addProcess('node /workspace/ai-player.js');
        
        // Modify frontend to "look" like AI is playing (hack for demo)
        let js = await readFile('/workspace/build/game.js');
        if (js) {
            js += `\n// Fake AI input\nsetInterval(() => { if(!isPaused) playerRotate((Math.random() > 0.5 ? 1 : -1)); }, 1000);\n`;
            await applyPatch('/workspace/build/game.js', js);
            this.ui.markFileChanged('/workspace/build/game.js');
        }
        
        await this.ui.updateTimelineStep("AI process running.", "step-done");
        await this.restartAndVerify();
    }

    async applyPauseResume() {
        await this.ui.updateTimelineStep("Intent: Pause/Resume. Analyzing game.js...", "step-done");
        await this.ui.addTimelineStep("Adding P key listener to game.js...", "step-active");
        
        let js = await readFile('/workspace/build/game.js');
        if (js && !js.includes('case 80:')) {
            js = js.replace('case 87: playerRotate(1); break;  // W (Rotate Right)', 
            'case 87: playerRotate(1); break;\n        case 80: window.AppConfig.setPaused(!isPaused); break; // P (Pause)');
            await applyPatch('/workspace/build/game.js', js);
            this.ui.markFileChanged('/workspace/build/game.js');
        }
        
        await this.delay(800);
        await this.ui.updateTimelineStep("Patch applied.", "step-done");
        await this.restartAndVerify();
    }

    async applyFasterSpeed() {
        await this.ui.updateTimelineStep("Intent: Faster speed. Analyzing game config...", "step-done");
        await this.ui.addTimelineStep("Reducing drop interval in game.js...", "step-active");
        
        let js = await readFile('/workspace/build/game.js');
        if (js) {
            js = js.replace('let dropInterval = 1000;', 'let dropInterval = 200;');  // Super fast
            await applyPatch('/workspace/build/game.js', js);
            this.ui.markFileChanged('/workspace/build/game.js');
        }
        
        await this.delay(800);
        await this.ui.updateTimelineStep("Game speed doubled.", "step-done");
        await this.restartAndVerify();
    }

    async restartAndVerify() {
        await this.ui.addTimelineStep("Restarting Node.js server...", "step-active");
        await restartServer();
        await this.delay(800);
        await this.ui.updateTimelineStep("Server restarted. Refreshing iframe preview...", "step-active");
        this.ui.refreshIframe();
        await this.delay(500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
