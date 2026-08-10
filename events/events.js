// ═══════════════════════════════════════════════════════
// PHOENIX EVENT PAGE — SHARED EFFECTS
//   1. Fire Embers Background
//   2. Kinetic Grid Cursor Effect
// ═══════════════════════════════════════════════════════

// ── 1. FIRE EMBERS ─────────────────────────────────────
(function initEmbers() {
    const c = document.getElementById('ec');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W = 0, H = 0;

    function resize() {
        W = c.width = innerWidth;
        H = c.height = innerHeight;
        // Re-scatter particles within visible area on resize
        pts.forEach(p => {
            if (p.x > W) p.x = Math.random() * W;
            if (p.y > H) p.y = Math.random() * H;
        });
    }

    // Spawn particles WITHIN viewport bounds immediately
    const pts = Array.from({ length: 80 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.9 + 0.3),
        r:  Math.random() * 1.8 + 0.4,
        a:  Math.random() * 0.55 + 0.25,
        gold: Math.random() > 0.4,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: (Math.random() - 0.5) * 0.04
    }));

    resize();
    window.addEventListener('resize', resize);

    // Detect page colour theme from root var
    const isIgnite = document.documentElement.style.getPropertyValue('--ignite-theme') === 'purple';

    (function loop() {
        if (!W) { requestAnimationFrame(loop); return; }
        ctx.clearRect(0, 0, W, H);

        // Subtle dark radial gradient background
        const g = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, Math.max(W, H) * 0.9);
        g.addColorStop(0, 'rgba(20,8,3,0.6)');
        g.addColorStop(1, 'rgba(5,3,3,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        pts.forEach(p => {
            p.wobble += p.wobbleSpeed;
            p.x += p.vx + Math.sin(p.wobble) * 0.3;
            p.y += p.vy;
            if (p.y < -10) {
                p.y = H + 5;
                p.x = Math.random() * W;
                p.a = Math.random() * 0.55 + 0.25;
                p.r = Math.random() * 1.8 + 0.4;
                p.gold = Math.random() > 0.4;
            }
            if (p.x < -10) p.x = W + 5;
            if (p.x > W + 10) p.x = -5;

            ctx.save();
            ctx.globalAlpha = p.a;
            // Colour: orange/gold for orange pages, purple/orange for ignite pages
            let col;
            if (document.body.dataset.theme === 'purple') {
                col = p.gold ? '#c800ff' : '#ff5100';
            } else {
                col = p.gold ? '#ffaa00' : '#ff5100';
            }
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = p.r * 5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        requestAnimationFrame(loop);
    })();
})();

// ── 2. KINETIC GRID CURSOR EFFECT ──────────────────────
(function initKineticGrid() {
    // Create canvas
    const kg = document.createElement('canvas');
    kg.id = 'kinetic-grid-canvas';
    kg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;opacity:0.5;pointer-events:none;';
    document.body.appendChild(kg);
    const kCtx = kg.getContext('2d');

    const GAP  = 45;   // grid spacing px
    const R    = 280;  // attraction radius px
    const PULL = 1.5;  // strength
    const DPR  = window.devicePixelRatio || 1;

    let kW = 0, kH = 0;
    let kCols = [], kDots = [];
    let kTrail = [];
    const kMouse = { x: -9999, y: -9999, active: false };

    function buildGrid() {
        kW = window.innerWidth;
        kH = window.innerHeight;
        kg.width  = Math.floor(kW * DPR);
        kg.height = Math.floor(kH * DPR);
        kg.style.width  = kW + 'px';
        kg.style.height = kH + 'px';
        kCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

        kCols = []; kDots = [];
        const nC = Math.floor(kW / GAP) + 2;
        const nR = Math.floor(kH / GAP) + 2;
        for (let c = 0; c < nC; c++) {
            const col = [];
            for (let r = 0; r < nR; r++) {
                const hx = c * GAP, hy = r * GAP;
                const dot = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
                col.push(dot);
                kDots.push(dot);
            }
            kCols.push(col);
        }
    }

    function setMouse(x, y) {
        kMouse.x = x; kMouse.y = y; kMouse.active = true;
        kTrail.push({ x, y, t: performance.now() });
        if (kTrail.length > 80) kTrail.shift();
    }

    window.addEventListener('mousemove',  e => setMouse(e.clientX, e.clientY));
    window.addEventListener('touchmove',  e => { const t = e.touches[0]; if (t) setMouse(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('mouseleave', () => { kMouse.active = false; kMouse.x = -9999; kMouse.y = -9999; });
    window.addEventListener('touchend',   () => { kMouse.active = false; kMouse.x = -9999; kMouse.y = -9999; });
    window.addEventListener('resize', buildGrid);

    // Detect theme colour from page
    function getThemeColours() {
        if (document.body.dataset.theme === 'purple') {
            return { dot: '#c800ff', line: '#c800ff', trail: '#ff5100' };
        }
        return { dot: '#ff5100', line: '#ff5100', trail: '#ffaa00' };
    }

    buildGrid();

    (function loopKG(ts) {
        kCtx.clearRect(0, 0, kW, kH);
        const now = ts || performance.now();
        const col = getThemeColours();

        // Physics
        for (let i = 0; i < kDots.length; i++) {
            const d = kDots[i];
            let ax = (d.hx - d.x) * 0.09;
            let ay = (d.hy - d.y) * 0.09;
            if (kMouse.active) {
                const dx = kMouse.x - d.x, dy = kMouse.y - d.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < R && dist > 0.001) {
                    const f = (1 - dist / R) * PULL;
                    ax += (dx / dist) * f;
                    ay += (dy / dist) * f;
                }
            }
            d.vx = (d.vx + ax) * 0.80;
            d.vy = (d.vy + ay) * 0.80;
            d.x += d.vx;
            d.y += d.vy;
        }

        // Draw lines
        for (let c = 0; c < kCols.length; c++) {
            for (let r = 0; r < kCols[c].length; r++) {
                const d = kCols[c][r];
                const prox = kMouse.active
                    ? Math.max(0, 1 - Math.sqrt((kMouse.x - d.x) ** 2 + (kMouse.y - d.y) ** 2) / R)
                    : 0;
                const right = kCols[c + 1]?.[r];
                const down  = kCols[c]?.[r + 1];
                const alpha = 0.05 + prox * 0.5;

                if (right) {
                    kCtx.globalAlpha = alpha;
                    kCtx.strokeStyle = col.line;
                    kCtx.lineWidth = 0.5 + prox * 1.2;
                    kCtx.beginPath();
                    kCtx.moveTo(d.x, d.y);
                    kCtx.lineTo(right.x, right.y);
                    kCtx.stroke();
                }
                if (down) {
                    kCtx.globalAlpha = alpha;
                    kCtx.strokeStyle = col.line;
                    kCtx.lineWidth = 0.5 + prox * 1.2;
                    kCtx.beginPath();
                    kCtx.moveTo(d.x, d.y);
                    kCtx.lineTo(down.x, down.y);
                    kCtx.stroke();
                }
            }
        }

        // Draw dots
        for (let i = 0; i < kDots.length; i++) {
            const d = kDots[i];
            const prox = kMouse.active
                ? Math.max(0, 1 - Math.sqrt((kMouse.x - d.x) ** 2 + (kMouse.y - d.y) ** 2) / R)
                : 0;
            kCtx.globalAlpha = 0.18 + prox * 0.82;
            kCtx.fillStyle = col.dot;
            if (prox > 0.01) { kCtx.shadowColor = col.dot; kCtx.shadowBlur = prox * 8; }
            else kCtx.shadowBlur = 0;
            kCtx.beginPath();
            kCtx.arc(d.x, d.y, 0.9 + prox * 2.5, 0, Math.PI * 2);
            kCtx.fill();
        }
        kCtx.shadowBlur = 0;

        // Draw trail
        kCtx.lineCap = 'round'; kCtx.lineJoin = 'round';
        for (let i = 1; i < kTrail.length; i++) {
            const a = kTrail[i - 1], b = kTrail[i];
            const age = now - b.t;
            if (age > 300) continue;
            kCtx.globalAlpha = Math.max(0, 1 - age / 300) * 0.9;
            kCtx.strokeStyle = col.trail;
            kCtx.lineWidth = 2.5;
            kCtx.beginPath();
            kCtx.moveTo(a.x, a.y);
            kCtx.lineTo(b.x, b.y);
            kCtx.stroke();
        }

        kCtx.globalAlpha = 1;
        requestAnimationFrame(loopKG);
    })();
})();
