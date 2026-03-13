(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(n){if(n.ep)return;n.ep=!0;const o=t(n);fetch(n.href,o)}})();const w=`const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');

// Scale the canvas so blocks are 20x20
context.scale(20, 20);

// Matrix utility functions
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Shapes & colors
const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#0d0d0d'; // Background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
        updateScore();
    }
}

function playerDrop() {
    if (isPaused) return;
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if (isPaused) return;
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    if (isPaused) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!isPaused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }
    
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

document.addEventListener('keydown', event => {
    switch(event.keyCode) {
        case 37: playerMove(-1); break; // Left
        case 39: playerMove(1); break;  // Right
        case 40: playerDrop(); break;   // Down
        case 38: playerRotate(1); break;// Up (Rotate)
        case 81: playerRotate(-1); break; // Q (Rotate Left)
        case 87: playerRotate(1); break;  // W (Rotate Right)
    }
});

playerReset();
updateScore();
update();

// Add global configuration window object for future modification
window.AppConfig = {
    setDropInterval: (ms) => dropInterval = ms,
    setPaused: (p) => isPaused = p
};
`,g=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetris</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="game-container">
        <canvas id="tetris-canvas" width="240" height="400"></canvas>
        <div id="ui-overlay">
            <h1 id="title">TETRIS</h1>
            <div id="score-board">Score: <span id="score">0</span></div>
            <div id="leaderboard" style="display: none;">
                <h3>Leaderboard</h3>
                <ul id="leaderboard-list"></ul>
            </div>
        </div>
    </div>
    <script src="game.js"><\/script>
</body>
</html>
`,v=`body {
    background-color: #111;
    color: #fff;
    font-family: 'Courier New', Courier, monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    overflow: hidden;
}

#game-container {
    position: relative;
    border: 4px solid #333;
    padding: 10px;
    background: #000;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0,0,0,0.8);
}

canvas {
    background-color: #0d0d0d;
    display: block;
}

#ui-overlay {
    position: absolute;
    top: 20px;
    right: -160px;
    width: 140px;
}

#title {
    margin: 0 0 20px 0;
    font-size: 24px;
    letter-spacing: 2px;
    color: #4CAF50;
    text-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

#score-board {
    font-size: 18px;
    margin-bottom: 20px;
}

#leaderboard {
    font-size: 14px;
    background: rgba(255, 255, 255, 0.1);
    padding: 10px;
    border-radius: 4px;
}

#leaderboard h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
}

#leaderboard-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

#leaderboard-list li {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}
`,x=`{
  "scores": [
    { "name": "CPU", "score": 9999 },
    { "name": "AI", "score": 5000 },
    { "name": "P1", "score": 100 }
  ]
}
`,b=`const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');
const DATA_DIR = path.join(__dirname, 'data');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  console.log(\`\${req.method} \${req.url}\`);

  // Simple API routing
  if (req.url === '/api/scores' && req.method === 'GET') {
    const scoresPath = path.join(DATA_DIR, 'scores.json');
    if (fs.existsSync(scoresPath)) {
      const data = fs.readFileSync(scoresPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ scores: [] }));
    }
    return;
  }

  // Static file serving
  let filePath = path.join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: '+error.code+' ..\\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
  console.log(\`Serving static files from \${BUILD_DIR}\`);
});
`,S="1.0.0",T=new Function("x","return import(x)");async function k(){try{return await T(`https://rt.browserpod.io/${S}/browserpod.js`)}catch{return{BrowserPod:null}}}const E=await k(),P=E.BrowserPod,I=Object.assign({"../assets/workspace/build/game.js":w,"../assets/workspace/build/index.html":g,"../assets/workspace/build/style.css":v,"../assets/workspace/data/scores.json":x,"../assets/workspace/server.js":b});let a=null,p=null;async function C(i){if(a)return a;const e="bp_test_1234",t=performance.now();window.dispatchEvent(new CustomEvent("pod-boot-start")),a=new P({apiKey:e}),await a.boot();const r=performance.now();return window.dispatchEvent(new CustomEvent("pod-boot-done",{detail:{time:Math.round(r-t)}})),i&&await a.createDefaultTerminal({fontFamily:'"Fira Code", monospace',fontSize:14,cursorBlink:!0,theme:{background:"#000000",foreground:"#e2e8f0",cursor:"#4CAF50"}},i),a}async function j(){if(!a)throw new Error("Pod not booted");await a.run("mkdir -p /workspace/build /workspace/data");for(const[i,e]of Object.entries(I)){const t=i.replace("../assets/workspace","/workspace");await a.fs.writeFile(t,e)}}async function m(){if(!a)return[];const i=await a.run("find /workspace -type f");return i.exitCode===0?i.stdout.trim().split(`
`).filter(Boolean):[]}async function f(){if(!a)throw new Error("Pod not booted");p&&await p.kill();const i=performance.now();p=await a.spawn("node",["/workspace/server.js"]),await new Promise(t=>setTimeout(t,500));const e=performance.now();return window.dispatchEvent(new CustomEvent("server-start-done",{detail:{time:Math.round(e-i)}})),a.previewUrl||a.getPreviewUrl?.(3e3)||"http://localhost:3000/"}async function F(){await f()}async function d(i,e){a&&await a.fs.writeFile(i,e)}async function c(i){return a?await a.fs.readFile(i):null}async function L(i,e){return a?await a.spawn(i,e):null}class A{constructor(e){this.ui=e,this.aiProcess=null}async processPrompt(e){const t=e.toLowerCase();if(await this.ui.addTimelineStep("Agent received prompt: Analyzing intent...","step-active"),await this.delay(800),t.includes("neon"))await this.applyNeonTheme();else if(t.includes("leaderboard"))await this.applyLeaderboard();else if(t.includes("ai")||t.includes("bot")||t.includes("autoplay"))await this.applyAutoplayAI();else if(t.includes("pause")||t.includes("resume"))await this.applyPauseResume();else if(t.includes("faster")||t.includes("speed"))await this.applyFasterSpeed();else{await this.ui.updateTimelineStep("Unknown prompt. Try one from the list.","step-done");return}await this.ui.updateTimelineStep("Task completed. Verifying preview...","step-done"),await this.ui.addTimelineStep("Agent is idle.","waiting"),await this.ui.refreshFileSystem()}async applyNeonTheme(){await this.ui.updateTimelineStep("Intent: Neon Theme. Inspecting CSS files...","step-done"),await this.ui.addTimelineStep("Patching /workspace/build/style.css...","step-active");let e=await c("/workspace/build/style.css");e||(e=""),e=e.replace(/border: 4px solid #333;/,"border: 4px solid #0ff; box-shadow: 0 0 20px #0ff, inset 0 0 10px #0ff;"),e=e.replace(/color: #4CAF50;/,"color: #ff00ff; text-shadow: 0 0 10px #ff00ff;"),await this.delay(1e3),await d("/workspace/build/style.css",e),this.ui.markFileChanged("/workspace/build/style.css"),await this.ui.updateTimelineStep("CSS updated.","step-done"),await this.restartAndVerify()}async applyLeaderboard(){await this.ui.updateTimelineStep("Intent: Leaderboard. Inspecting index.html and style.css...","step-done"),await this.ui.addTimelineStep("Modifying frontend to show leaderboard...","step-active");let e=await c("/workspace/build/index.html");e&&(e=e.replace('style="display: none;"','style="display: block;"'),await d("/workspace/build/index.html",e),this.ui.markFileChanged("/workspace/build/index.html"));let t=await c("/workspace/build/game.js");t&&!t.includes('fetch("/api/scores")')&&(t+=`
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
`,await d("/workspace/build/game.js",t),this.ui.markFileChanged("/workspace/build/game.js")),await this.delay(1e3),await this.ui.updateTimelineStep("Frontend updated.","step-done"),await this.restartAndVerify()}async applyAutoplayAI(){await this.ui.updateTimelineStep("Intent: Autoplay AI. Creating ai-player.js...","step-done"),await this.ui.addTimelineStep("Writing /workspace/ai-player.js...","step-active"),await d("/workspace/ai-player.js",`
console.log("AI Player Booting...");
setInterval(() => {
    console.log("AI deciding next move... [simulated computation]");
}, 2000);
`),this.ui.markFileChanged("/workspace/ai-player.js"),await this.delay(1e3),await this.ui.updateTimelineStep("AI script created.","step-done"),await this.ui.addTimelineStep("Starting secondary AI process...","step-active"),this.aiProcess=await L("node",["/workspace/ai-player.js"]),this.ui.addProcess("node /workspace/ai-player.js");let t=await c("/workspace/build/game.js");t&&(t+=`
// Fake AI input
setInterval(() => { if(!isPaused) playerRotate((Math.random() > 0.5 ? 1 : -1)); }, 1000);
`,await d("/workspace/build/game.js",t),this.ui.markFileChanged("/workspace/build/game.js")),await this.ui.updateTimelineStep("AI process running.","step-done"),await this.restartAndVerify()}async applyPauseResume(){await this.ui.updateTimelineStep("Intent: Pause/Resume. Analyzing game.js...","step-done"),await this.ui.addTimelineStep("Adding P key listener to game.js...","step-active");let e=await c("/workspace/build/game.js");e&&!e.includes("case 80:")&&(e=e.replace("case 87: playerRotate(1); break;  // W (Rotate Right)",`case 87: playerRotate(1); break;
        case 80: window.AppConfig.setPaused(!isPaused); break; // P (Pause)`),await d("/workspace/build/game.js",e),this.ui.markFileChanged("/workspace/build/game.js")),await this.delay(800),await this.ui.updateTimelineStep("Patch applied.","step-done"),await this.restartAndVerify()}async applyFasterSpeed(){await this.ui.updateTimelineStep("Intent: Faster speed. Analyzing game config...","step-done"),await this.ui.addTimelineStep("Reducing drop interval in game.js...","step-active");let e=await c("/workspace/build/game.js");e&&(e=e.replace("let dropInterval = 1000;","let dropInterval = 200;"),await d("/workspace/build/game.js",e),this.ui.markFileChanged("/workspace/build/game.js")),await this.delay(800),await this.ui.updateTimelineStep("Game speed doubled.","step-done"),await this.restartAndVerify()}async restartAndVerify(){await this.ui.addTimelineStep("Restarting Node.js server...","step-active"),await F(),await this.delay(800),await this.ui.updateTimelineStep("Server restarted. Refreshing iframe preview...","step-active"),this.ui.refreshIframe(),await this.delay(500)}delay(e){return new Promise(t=>setTimeout(t,e))}}class B{constructor(){this.timelineList=document.getElementById("timeline-list"),this.fileExplorer=document.getElementById("file-explorer"),this.previewFrame=document.getElementById("preview-frame"),this.previewOverlay=document.getElementById("preview-overlay"),this.processList=document.getElementById("process-list"),this.previewUrlBar=document.getElementById("preview-url"),this.podStatus=document.getElementById("pod-status"),this.serverStatus=document.getElementById("server-status"),this.timingBoot=document.getElementById("timing-boot"),this.timingServer=document.getElementById("timing-server"),window.addEventListener("pod-boot-start",()=>{this.podStatus.textContent="Pod: Booting...",this.podStatus.classList.add("active"),this.timingBoot.textContent="Boot: ..."}),window.addEventListener("pod-boot-done",e=>{this.podStatus.textContent="Pod: Online",this.timingBoot.textContent=`Boot: ${e.detail.time}ms`}),window.addEventListener("server-start-done",e=>{this.serverStatus.textContent="Server: Running",this.serverStatus.classList.add("active"),this.timingServer.textContent=`Server start: ${e.detail.time}ms`,this.previewOverlay.classList.add("hidden")})}addTimelineStep(e,t=""){const r=this.timelineList.querySelector(".waiting");r&&r.remove();const n=document.createElement("li");return n.className=`timeline-item ${t}`,n.textContent=e,this.timelineList.appendChild(n),this.timelineList.scrollTop=this.timelineList.scrollHeight,n}updateTimelineStep(e,t=""){const r=this.timelineList.querySelectorAll(".timeline-item");if(r.length===0)return this.addTimelineStep(e,t);const n=r[r.length-1];return n.textContent=e,t&&(n.className=`timeline-item ${t}`),n}async renderFileSystem(e){if(this.fileExplorer.innerHTML="",!e||e.length===0){this.fileExplorer.innerHTML='<li class="tree-item empty">No files found.</li>';return}const t=new Set;e.forEach(r=>{const n=r.split("/").filter(Boolean);n.length>1&&(t.add("/"+n[0]),n.length>2&&t.add("/"+n[0]+"/"+n[1]))});for(const r of e.sort()){const n=r.split("/").filter(Boolean),o=(n.length-1)*16,l=document.createElement("li");l.className="tree-item file",l.style.marginLeft=`${o}px`,l.innerHTML=`📄 ${n[n.length-1]}`,l.dataset.path=r,this.fileExplorer.appendChild(l)}}markFileChanged(e){const t=this.fileExplorer.querySelector(`[data-path="${e}"]`);t&&t.classList.add("changed")}refreshIframe(){const e=this.previewFrame.src;e&&(this.previewFrame.src=e)}setPreviewUrl(e){this.previewUrlBar.textContent=e,this.previewFrame.src=e}addProcess(e){this.processList.querySelector(".empty-proc")&&(this.processList.innerHTML="");const t=document.createElement("li");t.textContent="✓ "+e,this.processList.appendChild(t)}clearProcesses(){this.processList.innerHTML='<li class="empty-proc">None</li>'}}let s=null,y=null,u=!1;document.addEventListener("DOMContentLoaded",()=>{s=new B,y=new A(s),document.getElementById("btn-boot").addEventListener("click",h),document.getElementById("btn-run-agent").addEventListener("click",_),document.getElementById("btn-reset").addEventListener("click",()=>window.location.reload()),document.querySelectorAll(".btn-prompt").forEach(i=>{i.addEventListener("click",e=>{const t=e.target.textContent;document.getElementById("prompt-input").value=t})})});async function h(){if(!u)try{const i=document.getElementById("terminal-container");s.addTimelineStep("Booting BrowserPod WASM Environment...","step-active"),await C(i),s.updateTimelineStep("BrowserPod booted.","step-done"),s.addTimelineStep("Mounting workspace virtual filesystem...","step-active"),await j();const e=await m();await s.renderFileSystem(e),s.updateTimelineStep("Filesystem prepared.","step-done"),s.addTimelineStep("Starting Node.js server inside Pod...","step-active");const t=await f();s.addProcess("node /workspace/server.js"),s.updateTimelineStep("Server started listening on port 3000.","step-done"),s.addTimelineStep("Awaiting agent prompt...","waiting"),s.setPreviewUrl(t),u=!0,document.getElementById("btn-boot").disabled=!0}catch(i){console.error(i),s.addTimelineStep("Error during boot: "+i.message,"")}}async function _(){const i=document.getElementById("prompt-input").value.trim();if(i){u||await h(),document.getElementById("btn-run-agent").disabled=!0;try{await y.processPrompt(i);const e=await m()}catch(e){console.error(e),s.updateTimelineStep("Agent Error: "+e.message,"")}document.getElementById("btn-run-agent").disabled=!1}}
