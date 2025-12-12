class Draw {
    constructor(panel) {
        this.EPS = 1e-10;
        this.ONE_MINUS_EPS = 1 - this.EPS;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        panel.appendChild(this.canvas);

        this.shapes = [];

        this.observer = new ResizeObserver(() => this.#resize());
        this.observer.observe(panel);

        this.#resize();
    }

    #resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.#redraw();
    }

    #redraw() {
        this.#clear();
        // console.log(this.shapes);
        for (const s of this.shapes) {
            const pts = s.point;
            if (!pts || pts.length < 2) continue;

            this.ctx.strokeStyle = s.color || 'black';
            this.ctx.lineWidth = s.width || 1;

            switch (s.toolstyle || '1') {
                case '0':
                    this.#redraw0();
                    break;
                case '1':
                    this.#redraw1(pts);
                    break;
                case '2':
                    this.#redraw2(pts);
                    break;
                default: { }
            }
        }

        const lastIdx = this.shapes.length - 1;
        this.shapes = this.shapes.filter((item, index) => {
            if (index === lastIdx) return true;
            if (item.toolstyle == '0') return false;
            return true;
        });
    }
    #redraw0() {
        const lastIdx = this.shapes.length - 1;
        const last = this.shapes[lastIdx];
        if (!last || last.point.length < 2) return;

        const p2 = last.point[last.point.length - 1];
        const p1 = last.point[last.point.length - 2];

        this.shapes = this.shapes.filter((item, index) => {
            if (index === lastIdx) return true;
            let hasCollision = false;
            for (let i = 0; i < item.point.length - 1; i++) {
                const sp = item.point[i];
                const ep = item.point[i + 1];

                if (this.#cross(p1, p2, sp, ep)) {
                    hasCollision = true;
                    break;
                }
            }
            return !hasCollision;
        });
    }


    #redraw1(pts) {

        this.ctx.beginPath();
        this.ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
            this.ctx.lineTo(pts[i][0], pts[i][1]);
        }
        this.ctx.stroke();
    }
    #redraw2(pts) {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 2; i++) {
            const xc = (pts[i][0] + pts[i + 1][0]) / 2;
            const yc = (pts[i][1] + pts[i + 1][1]) / 2;
            this.ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
        }
        const len = pts.length;
        this.ctx.quadraticCurveTo(
            pts[len - 2][0],
            pts[len - 2][1],
            pts[len - 1][0],
            pts[len - 1][1]
        );

        this.ctx.stroke();
    }

    #clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    #cross(a, p, b, c) {
        if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === c[0] && a[1] === c[1])) return true;

        const abx = b[0] - a[0], aby = b[1] - a[1];
        const acx = c[0] - a[0], acy = c[1] - a[1];
        const apx = p[0] - a[0], apy = p[1] - a[1];

        const det = abx * acy - aby * acx;

        if (Math.abs(det) < this.EPS) {
            return ((abx > 0) !== (acx > 0)) || ((aby > 0) !== (acy > 0));
        }

        const x = (apx * acy - apy * acx) / det;
        if (x < -this.EPS) return false;

        const y = (abx * apy - aby * apx) / det;
        if (y < -this.EPS) return false;

        return (x + y >= this.ONE_MINUS_EPS);
    }

    addpoint(x, y) {
        const last = this.shapes.pop();
        last.point.push([x, y])
        this.line(last);
        this.#redraw();
    }

    line(shape = {
        point: [[50, 50], [200, 200], [300, 100]],
        color: 'red',
        width: 5,
        toolstyle: 1
    }) {
        this.shapes.push(shape);
    }


    getRelativePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}
