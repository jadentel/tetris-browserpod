export class UIController {
    constructor() {
        this.timelineList = document.getElementById('timeline-list');
        this.fileExplorer = document.getElementById('file-explorer');
        this.previewFrame = document.getElementById('preview-frame');
        this.previewOverlay = document.getElementById('preview-overlay');
        this.processList = document.getElementById('process-list');
        this.previewUrlBar = document.getElementById('preview-url');
        
        this.podStatus = document.getElementById('pod-status');
        this.serverStatus = document.getElementById('server-status');
        this.timingBoot = document.getElementById('timing-boot');
        this.timingServer = document.getElementById('timing-server');
        
        // Listeners for pod events
        window.addEventListener('pod-boot-start', () => {
            this.podStatus.textContent = 'Pod: Booting...';
            this.podStatus.classList.add('active');
            this.timingBoot.textContent = 'Boot: ...';
        });
        
        window.addEventListener('pod-boot-done', (e) => {
            this.podStatus.textContent = 'Pod: Online';
            this.timingBoot.textContent = `Boot: ${e.detail.time}ms`;
        });
        
        window.addEventListener('server-start-done', (e) => {
            this.serverStatus.textContent = 'Server: Running';
            this.serverStatus.classList.add('active');
            this.timingServer.textContent = `Server start: ${e.detail.time}ms`;
            
            // clear overlay
            this.previewOverlay.classList.add('hidden');
        });
    }

    addTimelineStep(text, className = '') {
        // remove "waiting" step if it exists
        const waiting = this.timelineList.querySelector('.waiting');
        if (waiting) waiting.remove();
        
        const li = document.createElement('li');
        li.className = `timeline-item ${className}`;
        li.textContent = text;
        this.timelineList.appendChild(li);
        this.timelineList.scrollTop = this.timelineList.scrollHeight;
        return li;
    }

    updateTimelineStep(text, newClass = '') {
        const items = this.timelineList.querySelectorAll('.timeline-item');
        if (items.length === 0) return this.addTimelineStep(text, newClass);
        const last = items[items.length - 1];
        last.textContent = text;
        if (newClass) {
            last.className = `timeline-item ${newClass}`;
        }
        return last;
    }

    async renderFileSystem(files) {
        this.fileExplorer.innerHTML = '';
        if (!files || files.length === 0) {
            this.fileExplorer.innerHTML = '<li class="tree-item empty">No files found.</li>';
            return;
        }

        // Render as a flat list but styling it like a tree for simplicity
        const dirs = new Set();
        files.forEach(f => {
            const parts = f.split('/').filter(Boolean);
            if (parts.length > 1) {
                dirs.add('/' + parts[0]);
                if (parts.length > 2) {
                    dirs.add('/' + parts[0] + '/' + parts[1]);
                }
            }
        });

        // Quick hack: just render the files directly with padding based on depth
        // We will mock foldering with indents
        for (const file of files.sort()) {
            const parts = file.split('/').filter(Boolean);
            const indent = (parts.length - 1) * 16;
            const li = document.createElement('li');
            li.className = 'tree-item file';
            li.style.marginLeft = `${indent}px`;
            li.innerHTML = `📄 ${parts[parts.length - 1]}`;
            li.dataset.path = file;
            this.fileExplorer.appendChild(li);
        }
    }

    markFileChanged(path) {
        const item = this.fileExplorer.querySelector(`[data-path="${path}"]`);
        if (item) {
            item.classList.add('changed');
        }
    }

    refreshIframe() {
        // To force refresh without breaking origin cache
        const src = this.previewFrame.src;
        if (src) {
            this.previewFrame.src = src;
        }
    }

    setPreviewUrl(url) {
        this.previewUrlBar.textContent = url;
        this.previewFrame.src = url;
    }

    addProcess(procStr) {
        if (this.processList.querySelector('.empty-proc')) {
            this.processList.innerHTML = '';
        }
        const li = document.createElement('li');
        li.textContent = '✓ ' + procStr;
        this.processList.appendChild(li);
    }

    clearProcesses() {
        this.processList.innerHTML = '<li class="empty-proc">None</li>';
    }
}
