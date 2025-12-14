class Draw {
    constructor(panel) {
        this.panel = panel;
        this.EPS = 1e-10;
        this.ONE_MINUS_EPS = 1 - this.EPS;

        this.buffCanvas = document.createElement('Canvas');
        this.drawCanvas = document.createElement('Canvas');
        this.buffCtx = this.buffCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');
        panel.appendChild(this.buffCanvas);
        panel.appendChild(this.drawCanvas);

        this.#setCss();

        this.toolstyle = 1;
        this.ifdown = false;
        this.shapes = [];

        this.observer = new ResizeObserver(() => {
            this.#resize(this.buffCanvas);
            this.#resize(this.drawCanvas);
            this.#fullRedrawBuff();
        });
        this.observer.observe(panel);
        this.#lockScreen();
        this.#action();
        this.#resize(this.buffCanvas);
        this.#resize(this.drawCanvas);
    }

    setToolstyle(i) {
        this.toolstyle = i;
    }

    addpoint(x, y) {
        if (this.shapes.length === 0) return;
        const last = this.shapes[this.shapes.length - 1];
        last.point.push([x, y]);
    }

    line(shape = {
        point: [[50, 50], [200, 200], [300, 100]],
        color: 'red',
        width: 5,
        toolstyle: 1
    }) {
        this.shapes.push(shape);
    }

    //====================================================================================

    #resize(canvas) {
        const parent = canvas.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }

    #redraw() {
        this.#clear();

        if (this.shapes.length < 1) return;

        const lastIdx = this.shapes.length - 1;
        const last = this.shapes[lastIdx];
        this.#pen(this.drawCtx, last);

        if (this.toolstyle == '0' && this.ifdown) {
            if (!last) return;
            const p2 = last.point[last.point.length - 1];
            this.#drawcycle(p2[0], p2[1]);
        }
    }

    #pen(ctx, s) {
        const pts = s.point;
        const pentype = String(s.toolstyle);
        if (!pts || pts.length == 0 || pentype == '0') return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = s.color || 'black';
        ctx.lineWidth = s.width || 2;

        if (pts.length == 1) {
            this.#drawcycle(pts[0][0], pts[0][1], ctx.lineWidth, 1, ctx.strokeStyle);
        } else {
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);

            if (pentype == '2') {
                for (let i = 1; i < pts.length - 2; i++) {
                    const xc = (pts[i][0] + pts[i + 1][0]) / 2;
                    const yc = (pts[i][1] + pts[i + 1][1]) / 2;
                    ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
                }
                const len = pts.length;
                ctx.quadraticCurveTo(
                    pts[len - 2][0],
                    pts[len - 2][1],
                    pts[len - 1][0],
                    pts[len - 1][1]
                );
            } else if (pentype == '1') {
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i][0], pts[i][1]);
                }
            }
            ctx.stroke();
        }
    }

    #erase() {
        const lastIdx = this.shapes.length - 1;
        const last = this.shapes[lastIdx];

        if (!last || last.point.length < 2) return;

        const lastPot = last.point.length;
        const p2 = last.point[lastPot - 1];
        const p1 = last.point[lastPot - 2];

        let isErase = false;

        this.shapes = this.shapes.filter((item, index) => {
            if (index === lastIdx) return true;
            let hasCollision = false;
            for (let i = 0; i < item.point.length; i++) {
                const sp = item.point[i];
                const ep = item.point[(i == item.point.length - 1) ? i : (i + 1)];

                if (this.#cross(p1, p2, sp, ep)) {
                    hasCollision = true;
                    isErase = true;
                    break;
                }
            }
            return !hasCollision;
        });
        if (isErase) {
            this.#fullRedrawBuff();
        }
    }

    #drawcycle(x, y, r = 16, Alpha = 0.4, color = 'darkgray') {
        this.drawCtx.save();

        this.drawCtx.beginPath();
        this.drawCtx.globalAlpha = Alpha;
        this.drawCtx.fillStyle = color;
        this.drawCtx.arc(x, y, r, 0, 4 * Math.PI);
        this.drawCtx.fill();
        this.drawCtx.closePath();

        this.drawCtx.restore();
    }


    #clear() {
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }

    #cross(a, p, b, c) {
        if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === c[0] && a[1] === c[1])) return true;

        const bpx = p[0] - b[0], bpy = p[1] - b[1];
        if (bpx * bpx + bpy * bpy < 256) return true;



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

    #fullRedrawBuff() {
        this.buffCtx.clearRect(0, 0, this.buffCanvas.width, this.buffCanvas.height);
        for (const s of this.shapes) {
            this.#pen(this.buffCtx, s);
        }
    }

    #commitToBackground() {
        this.buffCtx.save();
        this.buffCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.buffCtx.drawImage(this.drawCanvas, 0, 0);
        this.buffCtx.restore();

        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }

    #getRelativePos(e) {
        const parent = this.drawCanvas.parentElement;
        const scaleX = this.drawCanvas.width / parent.clientWidth;
        const scaleY = this.drawCanvas.height / parent.clientHeight;
        return { x: e.offsetX * scaleX, y: e.offsetY * scaleY };
    }

    //====================================================================================

    #setCss() {
        this.drawCanvas.parentElement.style.position = 'relative';
        this.drawCanvas.style.touchAction = 'none';
        this.drawCanvas.style.userSelect = 'none';
        this.drawCanvas.style.webkitUserSelect = 'none';
        this.drawCanvas.style.webkitTapHighlightColor = 'transparent';
        this.drawCanvas.style.webkitTouchCallout = 'none';

        this.drawCanvas.style.position = 'absolute';
        this.drawCanvas.style.left = '0';
        this.drawCanvas.style.top = '0';
        this.drawCanvas.style.zIndex = '2';
        this.drawCanvas.style.backgroundColor = 'transparent';

        this.buffCanvas.style.position = 'absolute';
        this.buffCanvas.style.left = '0';
        this.buffCanvas.style.top = '0';
        this.buffCanvas.style.zIndex = '1';
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
            const pos = this.#getRelativePos(e);
            this.ifdown = true;
            this.line({ point: [[pos.x, pos.y]], width: 3, toolstyle: this.toolstyle });

            this.#redraw();
        }, { passive: false });

        this.panel.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'mouse' && e.buttons === 0) return;

            const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
            for (let event of events) {
                const pos = this.#getRelativePos(event);
                this.addpoint(pos.x, pos.y);
            }
            if (String(this.toolstyle) == '0') {
                this.#erase();
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
            this.#commitToBackground();
        }, { passive: false });

    }

}
