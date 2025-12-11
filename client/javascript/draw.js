class Draw {
    constructor(panel) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        panel.appendChild(this.canvas);

        this.shapes = [];   // 儲存畫過的線段

        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(panel);

        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.redraw();
    }

    redraw() {
        this.clear();
        for (const s of this.shapes) {
            const pts = s.point;

            if (!pts || pts.length < 2) continue;

            this.ctx.strokeStyle = s.color || 'black';
            this.ctx.lineWidth = s.width || 1;
            this.ctx.beginPath();
            this.ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
                this.ctx.lineTo(pts[i][0], pts[i][1]);
            }
            this.ctx.stroke();
        }
    }

    conline(x, y) {
        const last = this.shapes.pop();
        last.point.push([x, y])
        this.line(last);
    }

    line(shape = {
        point: [[50, 50], [200, 200], [300, 100]],
        color: 'red',
        width: 5
    }) {
        this.shapes.push(shape);
        this.redraw();
        console.log(this.shapes);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }



    getRelativePos(e) {
        const rect = this.canvas.getBoundingClientRect();

        // 避免 retina、CSS scale 造成偏差
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}
