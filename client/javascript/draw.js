class Draw {
    constructor(panel) {
        this.panel = panel;
        this.EPS = 1e-10;
        this.ONE_MINUS_EPS = 1 - this.EPS;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        panel.appendChild(this.canvas);

        this.toolstyle = 1;
        this.ifdown = false;
        this.shapes = [];

        this.observer = new ResizeObserver(() => this.#resize());
        this.observer.observe(panel);
        this.#lockScreen();
        this.#action();
        this.#resize();
    }

    #resize() {
        const parent = this.canvas.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.#redraw();
        }
    }

    #redraw() {
        this.#clear();
        for (const s of this.shapes) {
            const pts = s.point;
            if (!pts || pts.length == 0) continue;

            this.ctx.strokeStyle = s.color || 'black';
            this.ctx.lineWidth = s.width || 2;
            if (pts.length == 1 && String(s.toolstyle) != '0') {
                this.#drawcycle(pts[0][0], pts[0][1], this.ctx.lineWidth, 1, this.ctx.strokeStyle);
            } else switch (String(s.toolstyle)) {
                case '1':
                    this.#redraw1(pts);
                    break;
                case '2':
                    this.#redraw2(pts);
                    break;
                default: { }
            }
        }
        if (this.toolstyle == '0' && this.ifdown) {

            const lastIdx = this.shapes.length - 1;
            const last = this.shapes[lastIdx];

            if (!last || last.point.length < 2) return;

            const p2 = last.point[last.point.length - 1];
            const p1 = last.point[last.point.length - 2];

            this.#drawcycle(p2[0], p2[1]);
        }
    }

    #checkCollision() {
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
    #drawcycle(x, y, r = 8, Alpha = 0.4, color = 'darkgray') {
        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.globalAlpha = Alpha;
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, r, 0, 4 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.restore();
    }


    #clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    #cross(a, p, b, c) {
        if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === c[0] && a[1] === c[1])) return true;


        
        const bpx = p[0] - b[0], bpy = p[1] - b[1];
        if ( bpx*bpx + bpy*bpy < 64) return true;

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

    setToolstyle(i) {
        this.toolstyle = i;
    }

    addpoint(x, y) {
        if (this.shapes.length === 0) return;
        const last = this.shapes[this.shapes.length - 1];
        last.point.push([x, y]);

        // if (String(this.toolstyle) == '0') {
        //     this.#checkCollision();
        // } else this.#redraw();
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
        const parent = this.canvas.parentElement;
        const scaleX = this.canvas.width / parent.clientWidth;
        const scaleY = this.canvas.height / parent.clientHeight;
        return { x: e.offsetX * scaleX, y: e.offsetY * scaleY };
    }


    //====================================================================================

    #lockScreen() {
        const prevent = (e) => e.preventDefault();
        document.addEventListener('gesturestart', prevent);
        document.addEventListener('gesturechange', prevent);
        document.addEventListener('gestureend', prevent);

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    //====================================================================================

    #action() {
        let ticking = false;
        this.panel.addEventListener('pointerdown', (e) => {
            const pos = this.getRelativePos(e);
            this.ifdown = true;
            this.line({ point: [[pos.x, pos.y]], width: 3, toolstyle: this.toolstyle });

            this.#redraw();
        }, { passive: false });

        this.panel.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'mouse' && e.buttons === 0) return;
            // const pos = this.getRelativePos(e);
            // this.addpoint(pos.x, pos.y);

            const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
            for (let event of events) {
                // // 使用 event.offsetX, event.offsetY 繪製更精細的線條
                // this.currentPath.points.push({ x: event.offsetX, y: event.offsetY });


                const pos = this.getRelativePos(event);
                this.addpoint(pos.x, pos.y);
            }


            if (String(this.toolstyle) == '0') {
                this.#checkCollision();
            }

            if (!ticking) {
                requestAnimationFrame(() => {
                    this.#redraw();

                    ticking = false;
                });
                ticking = true;
            }
            
        }, { passive: false });

        this.panel.addEventListener('pointerup', (e) => {
            this.ifdown = false;
            const last = this.shapes[this.shapes.length - 1];
            if (last && String(last.toolstyle) === '0') {
                this.shapes.pop();
                this.#redraw();
            }
        }, { passive: false });

    }

}
