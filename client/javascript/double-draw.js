class FastDraw {
    constructor(container) {
        this.container = container;
        this.container.style.position = 'relative';

        // 1. 初始化畫布
        this.bgCanvas = this.#createCanvas(); // 存放歷史紀錄
        this.fgCanvas = this.#createCanvas(); // 存放當前筆觸
        
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.fgCtx = this.fgCanvas.getContext('2d');

        this.history = [];      // 儲存已完成的所有路徑
        this.currentPath = null; // 正在畫的路徑

        this.#initEvents();
        this.#resize();
    }

    #createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this.container.appendChild(canvas);
        return canvas;
    }

    #resize() {
        const rect = this.container.getBoundingClientRect();
        [this.bgCanvas, this.fgCanvas].forEach(cvs => {
            cvs.width = rect.width;
            cvs.height = rect.height;
        });
        this.#redrawBackground();
    }

    // 只有在畫完一筆、縮放或刪除時才呼叫這個
    #redrawBackground() {
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.history.forEach(path => this.#drawPath(this.bgCtx, path));
    }

    // 通用的繪圖工具函數
    #drawPath(ctx, path) {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
    }

    #initEvents() {
        this.container.addEventListener('pointerdown', (e) => {
            this.currentPath = {
                color: 'black',
                lineWidth: 3,
                points: [{ x: e.offsetX, y: e.offsetY }]
            };
        });

        this.container.addEventListener('pointermove', (e) => {
            if (!this.currentPath) return;

            const lastPoint = this.currentPath.points[this.currentPath.points.length - 1];
            
            // 效能優化：如果移動距離太小（小於2px），不記錄點，減少計算量
            if (Math.hypot(e.offsetX - lastPoint.x, e.offsetY - lastPoint.y) < 2) return;

            this.currentPath.points.push({ x: e.offsetX, y: e.offsetY });

            // 【關鍵】只清空並重繪頂層畫布，這非常快！
            this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
            this.#drawPath(this.fgCtx, this.currentPath);
        });

        this.container.addEventListener('pointerup', () => {
            if (!this.currentPath) return;

            // 1. 將畫完的線條加入歷史
            this.history.push(this.currentPath);
            
            // 2. 將這條線直接畫到底層畫布（避免重繪整個歷史，增加效率）
            this.#drawPath(this.bgCtx, this.currentPath);
            
            // 3. 清空頂層畫布，準備下一筆
            this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
            this.currentPath = null;
        });
    }
}