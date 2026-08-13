// Module-level flag: true while the intro overlay is visible.
// Declared here (outside DOMContentLoaded) so the standalone
// kinetic-grid IIFE below can also gate itself on this flag.
let introIsPlaying = false;

document.addEventListener('DOMContentLoaded', () => {

// Detect touch/no-mouse devices once, reused by every mouse-only effect below
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// Shared "is the tab actually visible" flag — every background RAF loop
// below checks this so nothing keeps animating (and burning battery/CPU)
// while the tab is in the background.
let pageIsVisible = !document.hidden;
document.addEventListener('visibilitychange', () => { pageIsVisible = !document.hidden; });

// introIsPlaying is declared at module scope above DOMContentLoaded
// so every RAF loop in this file can read it.

// ═══════════════════════════════════════════════════════
// 0. INTRO VIDEO — play on load, then reveal the site
// ═══════════════════════════════════════════════════════
const introOverlay = document.getElementById('intro-overlay');
const introVideo   = document.getElementById('intro-video');
if (introOverlay && introVideo) {
    const hasPlayed = sessionStorage.getItem('introPlayed');
    if (hasPlayed) {
        introOverlay.remove();
    } else {
        introIsPlaying = true;
        document.body.classList.add('intro-locked');
        let introDone = false;
        const hideIntro = () => {
            if (introDone) return;
            introDone = true;
            sessionStorage.setItem('introPlayed', 'true');
            document.body.classList.remove('intro-locked');
            introOverlay.classList.add('is-hidden');
            setTimeout(() => { if (introOverlay.parentNode) introOverlay.remove(); }, 900);
            introIsPlaying = false;
            startBgAnimation();
        };
        introVideo.addEventListener('ended', hideIntro);
        introVideo.addEventListener('error', hideIntro);
        const skipBtn = document.getElementById('intro-skip');
        if (skipBtn) skipBtn.addEventListener('click', hideIntro);
    }
}

// ═══════════════════════════════════════════════════════
// 1. CUSTOM CURSOR
// ═══════════════════════════════════════════════════════
const cursorInner = document.querySelector('.cursor-inner');
const cursorOuter = document.querySelector('.cursor-outer');
let mx = 0, my = 0, ox = 0, oy = 0;

// Skip the whole custom-cursor system on touch devices — there's no
// mouse to track, so this was previously running forever for nothing.
if (!isTouchDevice) {
    window.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cursorInner.style.left = mx + 'px';
        cursorInner.style.top  = my + 'px';
    });
    (function cursorLoop() {
        ox += (mx - ox) * 0.14;
        oy += (my - oy) * 0.14;
        cursorOuter.style.left = ox + 'px';
        cursorOuter.style.top  = oy + 'px';
        requestAnimationFrame(cursorLoop);
    })();
    document.querySelectorAll('[data-hover-trigger]').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering-interactive'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering-interactive'));
    });
} else {
    if (cursorInner) cursorInner.style.display = 'none';
    if (cursorOuter) cursorOuter.style.display = 'none';
}


// ═══════════════════════════════════════════════════════
// 1b. MOBILE HAMBURGER NAV
// ═══════════════════════════════════════════════════════
const hamburgerBtn  = document.getElementById('nav-hamburger');
const mobileOverlay = document.getElementById('mobile-nav-overlay');
const mobileClose   = document.getElementById('mobile-nav-close');

function openMobileNav() {
    if (!mobileOverlay || !hamburgerBtn) return;
    mobileOverlay.classList.add('is-open');
    hamburgerBtn.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
    if (!mobileOverlay || !hamburgerBtn) return;
    mobileOverlay.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileNav);
if (mobileClose)  mobileClose.addEventListener('click', closeMobileNav);
// Close drawer on any mobile nav link click
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
});


// ═══════════════════════════════════════════════════════
// 2. BACKGROUND CANVAS — SPOOKY CABLES + EMBERS
//    Fixed: covers the FULL viewport at all times
// ═══════════════════════════════════════════════════════
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');
let bgW, bgH;

function resizeBg() {
    bgW = bgCanvas.width  = window.innerWidth;
    bgH = bgCanvas.height = window.innerHeight;
    buildCables(); // Rebuild cable layout on resize
}
window.addEventListener('resize', resizeBg);

// ── Cable Definitions ──────────────────────────────────
// Each cable: array of control points for bezier curves,
// like heavy power lines sagging between posts.
let cables = [];

function buildCables() {
    cables = [
        // Big thick main cable: top-left to right, catenary sag
        {
            pts: [
                [-0.05, 0.08],
                [ 0.20, 0.18],
                [ 0.50, 0.26],
                [ 0.80, 0.16],
                [ 1.05, 0.10]
            ],
            width: 12, alpha: 0.18, color: '#1a0d00'
        },
        // Second thick cable below the first
        {
            pts: [
                [-0.05, 0.12],
                [ 0.20, 0.22],
                [ 0.50, 0.30],
                [ 0.80, 0.20],
                [ 1.05, 0.14]
            ],
            width: 8, alpha: 0.14, color: '#120800'
        },
        // Diagonal cable top-right to bottom-left
        {
            pts: [
                [1.05, 0.05],
                [0.75, 0.25],
                [0.50, 0.45],
                [0.25, 0.65],
                [-0.05, 0.82]
            ],
            width: 10, alpha: 0.15, color: '#1a0d00'
        },
        // Bottom cable sweeping across
        {
            pts: [
                [-0.05, 0.88],
                [ 0.20, 0.78],
                [ 0.50, 0.72],
                [ 0.80, 0.80],
                [ 1.05, 0.90]
            ],
            width: 14, alpha: 0.20, color: '#150900'
        },
        // Thin wire mid-screen
        {
            pts: [
                [-0.05, 0.40],
                [ 0.30, 0.50],
                [ 0.60, 0.38],
                [ 1.05, 0.48]
            ],
            width: 4, alpha: 0.10, color: '#2a1200'
        },
        // Short cable upper right with slight glow
        {
            pts: [
                [0.55, -0.02],
                [0.60,  0.12],
                [0.70,  0.22],
                [0.85,  0.30]
            ],
            width: 6, alpha: 0.13, color: '#1f0d00'
        },
        // Bottom-right drooping cable
        {
            pts: [
                [0.60, 1.02],
                [0.72, 0.85],
                [0.85, 0.78],
                [1.05, 0.72]
            ],
            width: 9, alpha: 0.16, color: '#160800'
        }
    ];
}

function drawCables() {
    cables.forEach(cable => {
        const pts = cable.pts.map(([px, py]) => [px * bgW, py * bgH]);

        bgCtx.save();
        bgCtx.globalAlpha = cable.alpha;
        bgCtx.strokeStyle = cable.color;
        bgCtx.lineWidth   = cable.width;
        bgCtx.lineCap     = 'round';
        bgCtx.lineJoin    = 'round';

        // Draw a slight glow around thick cables
        if (cable.width >= 8) {
            bgCtx.shadowColor = 'rgba(255,81,0,0.04)';
            bgCtx.shadowBlur  = 18;
        }

        bgCtx.beginPath();
        bgCtx.moveTo(pts[0][0], pts[0][1]);

        // Draw smooth catenary-like path using bezier segments
        for (let i = 1; i < pts.length - 1; i++) {
            const cpX = (pts[i][0] + pts[i+1][0]) / 2;
            const cpY = (pts[i][1] + pts[i+1][1]) / 2;
            bgCtx.quadraticCurveTo(pts[i][0], pts[i][1], cpX, cpY);
        }
        bgCtx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
        bgCtx.stroke();

        // Draw tiny junction dots at each control point
        bgCtx.shadowBlur = 0;
        bgCtx.globalAlpha = cable.alpha * 1.6;
        bgCtx.fillStyle = '#331800';
        pts.forEach(([px, py]) => {
            bgCtx.beginPath();
            bgCtx.arc(px, py, cable.width * 0.7, 0, Math.PI*2);
            bgCtx.fill();
        });

        bgCtx.restore();
    });
}

// ── Shared glow-dot sprite cache ────────────────────────
const glowSpriteCache = {};
function getGlowSprite(color) {
    if (glowSpriteCache[color]) return glowSpriteCache[color];
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    color);
    grad.addColorStop(0.35, color);
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    glowSpriteCache[color] = c;
    return c;
}
function drawGlowDot(ctx, x, y, r, color, alpha) {
    const sprite = getGlowSprite(color);
    const size = r * 6; // matches the visual spread of the old shadowBlur radius
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - size/2, y - size/2, size, size);
    ctx.restore();
}

// ── Ember Particles ────────────────────────────────────
class Ember {
    constructor(randY = false) { this.reset(randY); }

    reset(randY = false) {
        this.x    = Math.random() * bgW;
        this.y    = randY ? Math.random() * bgH : bgH + Math.random() * 30;
        this.vy   = -(Math.random() * 1.0 + 0.4);
        this.vx   = Math.random() * 0.4 - 0.2;
        this.r    = Math.random() * 1.6 + 0.5;
        this.a    = Math.random() * 0.55 + 0.2;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        this.gold = Math.random() > 0.45;
    }
    update() {
        this.y  += this.vy;
        this.x  += this.vx;
        this.life++;
        // Mouse repulsion
        const dx = this.x - mx, dy = this.y - my;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 130) {
            this.x += (dx/d) * 1.8;
            this.y += (dy/d) * 1.8;
        }
        if (this.life >= this.maxLife || this.y < -8) this.reset(false);
    }
    draw() {
        const fade = 1 - this.life / this.maxLife;
        const col = this.gold ? '#ffaa00' : '#ff5100';
        drawGlowDot(bgCtx, this.x, this.y, this.r, col, this.a * fade);
    }
}

const EMBER_COUNT = 90;
let embers = [];

function buildEmbers() {
    embers = Array.from({length: EMBER_COUNT}, () => new Ember(true));
}

// ── Cursor Fire Embers ─────────────────────────────────
class CursorEmber {
    constructor(x, y, intense) {
        this.x = x + (Math.random() * 14 - 7);
        this.y = y + (Math.random() * 10 - 5);
        this.vx = Math.random() * 1.8 - 0.9;
        this.vy = -(Math.random() * (intense ? 3.0 : 1.8) + 0.6);
        this.r  = Math.random() * (intense ? 2.6 : 1.8) + 0.6;
        this.a  = Math.random() * 0.65 + 0.3;
        this.life    = 0;
        this.maxLife = Math.floor(Math.random() * (intense ? 35 : 22) + 14);
        this.col = Math.random() > 0.48 ? '#ffaa00' : (Math.random() > 0.5 ? '#ff5100' : '#ff003c');
    }
    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy -= 0.04;
        this.vx *= 0.97;
        this.life++;
    }
    draw() {
        const fade = 1 - this.life / this.maxLife;
        drawGlowDot(bgCtx, this.x, this.y, this.r, this.col, this.a * fade);
    }
}

let cursorEmbers = [];
let frameCtr = 0;

// ── Main background render loop ────────────────────────
let bgRafId = null;
function animBg() {
    if (!bgW || !pageIsVisible) { bgRafId = requestAnimationFrame(animBg); return; }

    bgCtx.clearRect(0, 0, bgW, bgH);

    const grad = bgCtx.createRadialGradient(bgW/2, bgH/2, 0, bgW/2, bgH/2, Math.max(bgW,bgH)*0.7);
    grad.addColorStop(0,   '#150a05');
    grad.addColorStop(0.6, '#0c0503');
    grad.addColorStop(1,   '#050303');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgW, bgH);

    drawCables();

    bgCtx.save();
    bgCtx.strokeStyle = 'rgba(255,81,0,0.015)';
    bgCtx.lineWidth   = 1;
    const gs = 50;
    for (let x = 0; x < bgW; x += gs) {
        bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgH); bgCtx.stroke();
    }
    for (let y = 0; y < bgH; y += gs) {
        bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgW, y); bgCtx.stroke();
    }
    bgCtx.restore();

    embers.forEach(e => { e.update(); e.draw(); });

    frameCtr++;
    const isHovering = document.body.classList.contains('hovering-interactive');

    if (isHovering) {
        for (let i = 0; i < 4; i++) cursorEmbers.push(new CursorEmber(mx, my, true));
    } else if (frameCtr % 3 === 0) {
        cursorEmbers.push(new CursorEmber(mx, my, false));
    }

    cursorEmbers = cursorEmbers.filter(e => {
        e.update();
        e.draw();
        return e.life < e.maxLife;
    });

    bgRafId = requestAnimationFrame(animBg);
}

function startBgAnimation() {
    if (bgRafId !== null) cancelAnimationFrame(bgRafId);
    bgRafId = requestAnimationFrame(animBg);
}

resizeBg();
buildEmbers();

if (!introIsPlaying) startBgAnimation();


// ═══════════════════════════════════════════════════════
// 3. LOGO WING FIRE PARTICLES
// ═══════════════════════════════════════════════════════
const logoCanvas  = document.getElementById('logo-fire-canvas');
const logoCtx     = logoCanvas.getContext('2d');
const logoWrapper = document.getElementById('logo-trigger');
let lw = 0, lh = 0;
let logoHover = false;

function resizeLogo() {
    lw = logoCanvas.width  = logoWrapper.clientWidth  * 1.4;
    lh = logoCanvas.height = logoWrapper.clientHeight * 1.4;
}
logoWrapper.addEventListener('mouseenter', () => logoHover = true);
logoWrapper.addEventListener('mouseleave', () => logoHover = false);
window.addEventListener('resize', resizeLogo);

class LogoSpark {
    constructor(side) { this.side = side; this.init(); }
    init() {
        const cx = lw/2, cy = lh/2 - 20;
        const sign = this.side === 'L' ? -1 : 1;
        const ang  = -Math.PI/2 + sign * Math.random() * (Math.PI/2.2);
        const rad  = Math.random() * lw*0.18 + lw*0.05;
        this.x = cx + Math.cos(ang)*rad;
        this.y = cy + Math.sin(ang)*rad + Math.random()*20 - 10;
        this.vx = sign * (Math.random()*1.4 + 0.2);
        this.vy = -(Math.random()*2.5 + 0.5);
        this.r  = Math.random()*2.5 + 0.8;
        this.a  = Math.random()*0.7 + 0.3;
        this.col = ['#ff5100','#ffaa00','#ff003c'][Math.floor(Math.random()*3)];
        this.life = 0;
        this.maxLife = Math.random()*40 + 18;
    }
    update() {
        this.vy -= logoHover ? 0.09 : 0.05;
        this.x += this.vx; this.y += this.vy;
        this.life++;
        if (this.life >= this.maxLife) this.init();
    }
    draw() {
        drawGlowDot(logoCtx, this.x, this.y, this.r, this.col, this.a * (1 - this.life/this.maxLife));
    }
}

const logoSparks = Array.from({length: 120}, (_, i) => new LogoSpark(i%2===0?'L':'R'));

let heroInView = true;
const heroSectionEl = document.getElementById('hero');
if (heroSectionEl && 'IntersectionObserver' in window) {
    const heroIO = new IntersectionObserver(
        entries => { heroInView = entries[0].isIntersecting; },
        { rootMargin: '200px 0px' }
    );
    heroIO.observe(heroSectionEl);
}

setTimeout(() => {
    resizeLogo();
    (function animLogo() {
        if (pageIsVisible && heroInView && !introIsPlaying) {
            logoCtx.clearRect(0, 0, lw, lh);
            logoSparks.forEach(p => { p.update(); p.draw(); });
        }
        requestAnimationFrame(animLogo);
    })();
}, 600);


// ═══════════════════════════════════════════════════════
// 4. GALLERY — BULLETPROOF HORIZONTAL PINNED SCROLL
// ═══════════════════════════════════════════════════════
const galSection = document.getElementById('gallery');
const galSticky  = document.getElementById('gallery-sticky');
const galHelix   = document.getElementById('gallery-helix');
const galBar     = document.getElementById('gallery-progress-bar');
const galCurrent = document.getElementById('gallery-current');
const galDots    = document.querySelectorAll('.gdot');
const hcards     = document.querySelectorAll('.hcard');

let galInView = false;
if (galSection && 'IntersectionObserver' in window) {
    const galIO = new IntersectionObserver(
        entries => { galInView = entries[0].isIntersecting; },
        { rootMargin: '800px 0px' }
    );
    galIO.observe(galSection);
} else {
    galInView = true;
}

const LERP   = 0.08;
let targetX  = 0;
let currentX = 0;
let lastX    = 0;

let galTop    = 0;
let galBudget = 0;
let helixRadius  = 420;
let helixSpacing = 240;

function cacheGalleryBounds() {
    let el = galSection;
    let top = 0;
    while (el) { top += el.offsetTop; el = el.offsetParent; }
    galTop    = top;
    galBudget = galSection.offsetHeight - window.innerHeight;

    const w = window.innerWidth;
    if (w < 360) {
        helixRadius  = 180;
        helixSpacing = 130;
    } else if (w < 480) {
        helixRadius  = 230;
        helixSpacing = 160;
    } else if (w < 768) {
        helixRadius  = 280;
        helixSpacing = 190;
    } else if (w < 1024) {
        helixRadius  = 340;
        helixSpacing = 220;
    } else {
        helixRadius  = 430;
        helixSpacing = 260;
    }

    hcards.forEach((card, i) => {
        const theta = i * 90;
        const y = (i - 1.5) * helixSpacing;
        card.style.transform = `rotateY(${theta}deg) translateZ(${helixRadius}px) translateY(${y}px)`;
    });
}

function onScroll() {
    const scrollY  = window.scrollY;
    const scrolled = scrollY - galTop;

    if (scrolled <= 0) {
        galSticky.style.position = 'absolute';
        galSticky.style.top      = '0px';
        galSticky.style.bottom   = 'auto';
        targetX = 0;

    } else if (scrolled >= galBudget) {
        galSticky.style.position = 'absolute';
        galSticky.style.top      = galBudget + 'px';
        galSticky.style.bottom   = 'auto';
        targetX = 1000;

    } else {
        galSticky.style.position = 'fixed';
        galSticky.style.top      = '0px';
        galSticky.style.bottom   = 'auto';

        const progress = scrolled / galBudget;
        targetX = progress * 1000;
    }
}

hcards.forEach(card => {
    // Mouse parallax only makes sense with a real pointer — skip on touch
    if (isTouchDevice) return;
    const wrap = card.querySelector('.hcard-img-wrap');
    card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const px = (e.clientX - r.left)  / r.width  - 0.5;
        const py = (e.clientY - r.top)   / r.height - 0.5;
        if (wrap) wrap.style.transform = `translate(${px * -25}px, ${py * -16}px) scale(1.05)`;
    });
    card.addEventListener('mouseleave', () => {
        if (wrap) wrap.style.transform = 'translate(0,0) scale(1)';
    });
});

document.querySelectorAll('.hcard-slideshow').forEach(slide => {
    const imgs = slide.querySelectorAll('.hcard-img');
    if (imgs.length < 2) return;
    let sIdx = 0;
    setInterval(() => {
        imgs[sIdx].classList.remove('is-active');
        sIdx = (sIdx + 1) % imgs.length;
        imgs[sIdx].classList.add('is-active');
    }, 2600);
});

galDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const idx      = parseInt(dot.dataset.dot);
        const progress = idx / (hcards.length - 1);
        window.scrollTo({ top: galTop + progress * galBudget, behavior: 'smooth' });
    });
});

window.addEventListener('scroll', onScroll, { passive: true });

window.addEventListener('resize', () => {
    cacheGalleryBounds();
    onScroll();
});

window.addEventListener('load', () => {
    cacheGalleryBounds();
    onScroll();
});
requestAnimationFrame(() => {
    cacheGalleryBounds();
    onScroll();
});

if (typeof ResizeObserver !== 'undefined') {
    let bodyResizeTimer = null;
    const ro = new ResizeObserver(() => {
        clearTimeout(bodyResizeTimer);
        bodyResizeTimer = setTimeout(() => {
            cacheGalleryBounds();
            onScroll();
        }, 120);
    });
    ro.observe(document.body);
}

(function galLoop() {
    if (galInView && pageIsVisible && !introIsPlaying) {
        currentX += (targetX - currentX) * LERP;

        const velocity = currentX - lastX;
        lastX = currentX;

        const progress = currentX / 1000;

        const rotation = progress * -270;
        const helixY = (1.5 - progress * 3) * helixSpacing;
        const tiltX = Math.max(-10, Math.min(10, velocity * 0.25));

        galHelix.style.transform = `rotateX(${tiltX}deg) rotateY(${rotation}deg) translateY(${helixY}px)`;

        if (galBar) {
            galBar.style.width = (progress * 100) + '%';
        }

        const activeI = Math.max(0, Math.min(hcards.length - 1, Math.round(progress * (hcards.length - 1))));
        if (galCurrent) {
            galCurrent.textContent = String(activeI + 1).padStart(2, '0');
        }

        galDots.forEach((d, i) => {
            d.classList.toggle('active', i === activeI);
        });
    }

    requestAnimationFrame(galLoop);
})();


// ═══════════════════════════════════════════════════════
// 5. NAV SCROLLSPY
// ═══════════════════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    document.body.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 160) current = s.id;
    });
    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
}, { passive: true });

// ═══════════════════════════════════════════════════════
// 6. MEMBERS SECTION — HOVER IMAGE REVEAL & EMBERS BACKGROUND
// ═══════════════════════════════════════════════════════
const mCanvas = document.getElementById('members-embers-canvas');
const mCtx = mCanvas.getContext('2d');
let mW = 0, mH = 0;
const mDpr = Math.min(window.devicePixelRatio || 1, 2);
let mFlakes = [];

function resizeMembersCanvas() {
    const parent = mCanvas.parentElement;
    if (!parent) return;
    mW = parent.clientWidth;
    mH = parent.clientHeight;
    
    mCanvas.width = mW * mDpr;
    mCanvas.height = mH * mDpr;
    mCanvas.style.width = mW + 'px';
    mCanvas.style.height = mH + 'px';
    
    mCtx.setTransform(mDpr, 0, 0, mDpr, 0, 0);
    buildMembersEmbers();
}

function buildMembersEmbers() {
    const n = 120;
    mFlakes = [];
    const colors = ['#ff5100', '#ffaa00', '#ff3300', '#e65c00', '#ff9900'];
    for (let i = 0; i < n; i++) {
        mFlakes.push({
            x: Math.random() * mW,
            y: Math.random() * mH,
            r: 1 + Math.random() * 2.5,
            vy: -(0.5 + Math.random() * 1.5),
            vx: (Math.random() * 0.8 - 0.4),
            phase: Math.random() * Math.PI * 2,
            sway: 0.15 + Math.random() * 0.5,
            alpha: 0.15 + Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function drawMembersEmbers() {
    mCtx.clearRect(0, 0, mW, mH);
    for (let i = 0; i < mFlakes.length; i++) {
        const f = mFlakes[i];
        drawGlowDot(mCtx, f.x, f.y, f.r, f.color, f.alpha);
    }
}

let membersInView = false;
const membersSectionEl = document.getElementById('members');
if (membersSectionEl && 'IntersectionObserver' in window) {
    const membersIO = new IntersectionObserver(
        entries => { membersInView = entries[0].isIntersecting; },
        { rootMargin: '600px 0px' }
    );
    membersIO.observe(membersSectionEl);
} else {
    membersInView = true;
}

function loopMembersEmbers(t) {
    if (mW === 0 || mH === 0) {
        requestAnimationFrame(loopMembersEmbers);
        return;
    }
    if (pageIsVisible && membersInView && !introIsPlaying) {
        for (let i = 0; i < mFlakes.length; i++) {
            const f = mFlakes[i];
            f.y += f.vy;
            f.x += f.vx + Math.sin(t * 0.0012 + f.phase) * f.sway;

            if (f.y + f.r < 0) {
                f.y = mH + f.r;
                f.x = Math.random() * mW;
            }
            if (f.x < -f.r) f.x = mW + f.r;
            else if (f.x > mW + f.r) f.x = -f.r;
        }
        drawMembersEmbers();
    }
    requestAnimationFrame(loopMembersEmbers);
}

// ── Eye Ticker Logic (vanilla-JS port of the eye-ticker React component) ──
const EYE_TICKER_IMAGES = {
    line1: [
        { src: 'assets/exec/nitin.webp', focusY: 15 },
        { src: 'assets/exec/aashira.webp', focusY: 15 },
        { src: 'assets/exec/Varsha.webp', focusY: 15 },
        { src: 'assets/exec/rishika.webp', focusY: 15 },
        { src: 'assets/exec/aishwarya.webp', focusY: 15 },
    ],
    line2: [
        { src: 'assets/leads/harish.webp', focusY: 15 },
        { src: 'assets/leads/jagadish.webp', focusY: 15 },
        { src: 'assets/leads/mythrayee.webp', focusY: 15 },
        { src: 'assets/leads/keerthana.webp', focusY: 15 },
        { src: 'assets/leads/sachitha.webp', focusY: 15 },
        { src: 'assets/leads/srinithi.webp', focusY: 15 },
        { src: 'assets/leads/rakesh.webp', focusY: 15 },
        { src: 'assets/leads/giridharan.webp', focusY: 15 },
        { src: 'assets/leads/thamizh.webp', focusY: 15 },
        { src: 'assets/leads/venkat.webp', focusY: 15 },
        { src: 'assets/leads/abhishek.webp', focusY: 15 },
        { src: 'assets/leads/pavithra.webp', focusY: 15 },
        { src: 'assets/leads/sherly.webp', focusY: 15 },
    ],
    line3: [
        { src: 'assets/jnrs/abhirami.webp', focusY: 15 },
        { src: 'assets/jnrs/neranjan.webp', focusY: 15 },
        { src: 'assets/jnrs/nithin aaron.webp', focusY: 15 },
        { src: 'assets/jnrs/rishidhar.webp', focusY: 15 },
        { src: 'assets/jnrs/anuradha.webp', focusY: 15 },
        { src: 'assets/jnrs/dhanushri.webp', focusY: 15 },
        { src: 'assets/jnrs/kamalesh.webp', focusY: 15 },
        { src: 'assets/jnrs/nirppesh.webp', focusY: 15 },
        { src: 'assets/jnrs/dhivagar.webp', focusY: 15 },
        { src: 'assets/jnrs/faaiza.webp', focusY: 15 },
        { src: 'assets/jnrs/kaushik.webp', focusY: 15 },
        { src: 'assets/jnrs/niranjan.webp', focusY: 15 },
        { src: 'assets/jnrs/yuvashree.webp', focusY: 15 },
        { src: 'assets/jnrs/devika.webp', focusY: 15 },
        { src: 'assets/jnrs/shreya.webp', focusY: 15 },
        { src: 'assets/jnrs/vamshika.webp', focusY: 15 },
        { src: 'assets/jnrs/visagan.webp', focusY: 15 },
    ],
    line4: [
        { src: 'assets/mentor/adharsh.webp', focusY: 15 },
        { src: 'assets/mentor/devesh.webp', focusY: 15 },
        { src: 'assets/mentor/tarun.webp', focusY: 15 },
    ],
};

const EYE_TICKER_ROW_CONFIG = {
    line1: { bow: -1,   arc: 63, gap: 32, dir: 'right', bandIndex: 0, static: true },
    line2: { bow: -0.3, arc: 63, gap: 32, dir: 'left',  bandIndex: 1 },
    line3: { bow: 0.3,  arc: 63, gap: 32, dir: 'right', bandIndex: 2 },
    line4: { bow: 1,    arc: 63, gap: 32, dir: 'left',  bandIndex: 3, static: true },
};
const EYE_TICKER_ROW_COUNT = 4;

const EYE_TICKER_SPEED = 20;      // base speed unit, matches JSX default
const EYE_TICKER_PX_PER_SPEED = 14;
const EYE_TICKER_SPEED_MULTIPLIER = 0.32; // slowed to a calm, comfortable ticker pace
const EYE_TICKER_HOVER_SLOWDOWN = 0.18; // fraction of (already-reduced) pace while hovered

class EyeTickerRow {
    constructor(el, side, images) {
        this.el = el;
        this.side = side;
        this.config = EYE_TICKER_ROW_CONFIG[side];
        this.static = !!this.config.static;
        this.images = images;
        this.cardEls = [];
        this.hoveredIndex = -1;
        this.travel = 0;
        this.lastTime = null;
        this.frame = null;
        this.build();
    }

    measure() {
        const rect = this.el.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.radius = 14;

        // Give each row its own vertical band so rows can never overlap,
        // then size the card to actually fit inside that band (leaving a
        // little slack for the arc to bob up/down within it).
        this.bandHeight = this.height / EYE_TICKER_ROW_COUNT;
        this.bandCenter = this.bandHeight * (this.config.bandIndex + 0.5);

        const aspect = 190 / 240; // width / height of the reference card
        const maxCardHeight = this.bandHeight * 0.92;
        const isMobile = this.width < 640;
        const preferredCardHeight = isMobile ? 220 : 340;
        this.cardHeight = Math.max(60, Math.min(preferredCardHeight, maxCardHeight));
        this.cardWidth = this.cardHeight * aspect;

        this.outside = Math.max(this.cardWidth * 0.75, this.width * 0.06);
        this.pathWidth = Math.max(1, this.width - this.cardWidth + this.outside * 2);
        this.step = Math.max(this.cardWidth * 0.25, this.cardWidth + this.config.gap);

        if (this.static) {
            this.cards = this.images;
            this.loopLength = Math.max(1, this.cards.length * this.step);
        } else {
            const setWidth = Math.max(1, this.images.length * this.step);
            const copies = Math.max(2, Math.ceil((this.pathWidth + setWidth) / setWidth) + 1);
            this.cards = Array.from({ length: copies }).flatMap(() => this.images);
            this.loopLength = Math.max(1, this.cards.length * this.step);
        }

        this.headroom = Math.max(0, this.bandHeight / 2 - this.cardHeight / 2);
        this.amplitude = this.headroom * (this.config.arc / 100);
        this.baseline = this.bandCenter;
        this.dirSign = this.config.dir === 'left' ? -1 : 1;
    }

    build() {
        this.measure();
        this.el.innerHTML = '';
        this.cardEls = this.cards.map((img, i) => {
            const card = document.createElement('div');
            card.className = 'eye-card';
            card.style.width = this.cardWidth + 'px';
            card.style.height = this.cardHeight + 'px';
            card.style.borderRadius = this.radius + 'px';

            if (img.src) {
                const imgEl = document.createElement('img');
                imgEl.className = 'eye-card-img';
                imgEl.src = img.src;
                imgEl.alt = '';
                imgEl.draggable = false;
                imgEl.style.objectPosition = `center ${img.focusY}%`;
                card.appendChild(imgEl);
            } else {
                card.classList.add('is-empty');
            }

            card.addEventListener('mouseenter', () => { this.hoveredIndex = i; card.classList.add('is-hovered'); });
            card.addEventListener('mouseleave', () => { if (this.hoveredIndex === i) this.hoveredIndex = -1; card.classList.remove('is-hovered'); });

            this.el.appendChild(card);
            return card;
        });

        if (this.static) {
            this.el.classList.add('is-static');
            this.el.style.height = this.cardHeight + 'px';
            this.el.style.top = (this.bandCenter - this.cardHeight / 2) + 'px';
            this.cardEls.forEach(card => {
                card.style.position = 'relative';
                card.style.flex = '0 0 auto';
                card.style.zIndex = '1';
            });
        }
    }

    placeAt(index, travel) {
        const raw = index * this.step + travel;
        const wrapped = ((raw % this.loopLength) + this.loopLength) % this.loopLength;
        const progress = Math.max(0, Math.min(1, wrapped / this.pathWidth));
        const x = wrapped - this.outside;
        const y = this.baseline + this.config.bow * this.amplitude * Math.sin(Math.PI * progress) - this.cardHeight / 2;
        const visible = x > -this.cardWidth * 1.25 && x < this.width + this.cardWidth * 0.25;
        const z = Math.round(this.dirSign * x) + 100000;
        return { x, y, visible, z };
    }

    tick(now) {
        if (this.lastTime === null) this.lastTime = now;
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Skip the (otherwise-forever) per-frame work while the section
        // isn't visible, the tab is backgrounded, or the intro is playing.
        if (pageIsVisible && membersInView && !introIsPlaying) {
            const slowed = this.hoveredIndex !== -1;
            const paceFactor = slowed ? EYE_TICKER_HOVER_SLOWDOWN : 1;
            const pace = Math.max(1, EYE_TICKER_SPEED) * EYE_TICKER_PX_PER_SPEED * EYE_TICKER_SPEED_MULTIPLIER * paceFactor;

            this.travel += dt * pace * this.dirSign;

            for (let i = 0; i < this.cardEls.length; i++) {
                const el = this.cardEls[i];
                const { x, y, visible, z } = this.placeAt(i, this.travel);
                el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                el.style.opacity = visible ? '1' : '0';
                if (i !== this.hoveredIndex) el.style.zIndex = String(z);
            }
        } else {
            this.lastTime = now; // avoid a large dt jump when it resumes
        }

        this.frame = requestAnimationFrame((t) => this.tick(t));
    }

    start() {
        if (this.static) return;
        if (this.frame) cancelAnimationFrame(this.frame);
        this.lastTime = null;
        this.frame = requestAnimationFrame((t) => this.tick(t));
    }

    resize() {
        this.measure();
        this.el.innerHTML = '';
        this.build();
    }
}

const eyeTickerEl = document.getElementById('eye-ticker');
if (eyeTickerEl) {
    const rows = [
        new EyeTickerRow(document.getElementById('eye-row-line1'), 'line1', EYE_TICKER_IMAGES.line1),
        new EyeTickerRow(document.getElementById('eye-row-line2'), 'line2', EYE_TICKER_IMAGES.line2),
        new EyeTickerRow(document.getElementById('eye-row-line3'), 'line3', EYE_TICKER_IMAGES.line3),
        new EyeTickerRow(document.getElementById('eye-row-line4'), 'line4', EYE_TICKER_IMAGES.line4),
    ];
    rows.forEach((row) => row.start());

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => rows.forEach((row) => row.resize()), 200);
    });
}

// ── Cheer Button — burst into flames then commit ──────
function burstFlames(b) {
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const colors = ['#ff5100', '#ffaa00', '#ff3300', '#ffe066', '#ff003c'];
    for (let i = 0; i < 38; i++) {
        const p = document.createElement('span');
        p.className = 'cheer-flame';
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = color;
        p.style.boxShadow = '0 0 12px ' + color;
        document.body.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = 45 + Math.random() * 100;
        const anim = p.animate([
            { transform: 'translate(-50%,-50%) translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(-50%,-50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 45}px) scale(0.15)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 500, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = () => p.remove();
    }
}

const cheerBtn = document.getElementById('cheer-btn');
if (cheerBtn) {
    cheerBtn.addEventListener('click', () => {
        if (cheerBtn.classList.contains('is-burning')) return;
        cheerBtn.classList.add('is-burning');
        burstFlames(cheerBtn);
        setTimeout(() => {
            cheerBtn.classList.remove('is-burning');
        }, 900);
    });
}

// Initialize members canvas
window.addEventListener('resize', resizeMembersCanvas);
resizeMembersCanvas();
requestAnimationFrame(loopMembersEmbers);

}); // end DOMContentLoaded

// ═══════════════════════════════════════════════════════
// 7. KINETIC GRID INTERACTIVE BACKGROUND
//    Runs as a standalone IIFE — fully independent of
//    DOMContentLoaded so it starts immediately.
// ═══════════════════════════════════════════════════════
(function initKineticGrid() {
    const kCanvas = document.getElementById('kinetic-grid-canvas');
    if (!kCanvas) return;

    // This entire effect only reacts to a mouse cursor, which doesn't
    // exist on touch devices — building the grid + running its physics
    // and draw loop there was previously pure wasted work.
    if (window.matchMedia('(pointer: coarse)').matches) {
        kCanvas.style.display = 'none';
        return;
    }

    const kCtx = kCanvas.getContext('2d');

    // Local glow-sprite cache (this IIFE runs standalone, before
    // DOMContentLoaded, so it doesn't share the one defined below)
    const kGlowCache = {};
    function kGlowDot(x, y, r, color, alpha) {
        if (!kGlowCache[color]) {
            const size = 32;
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const gctx = c.getContext('2d');
            const grad = gctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            grad.addColorStop(0, color);
            grad.addColorStop(0.35, color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            gctx.fillStyle = grad;
            gctx.fillRect(0, 0, size, size);
            kGlowCache[color] = c;
        }
        const size = r * 6;
        kCtx.save();
        kCtx.globalAlpha = alpha;
        kCtx.drawImage(kGlowCache[color], x - size/2, y - size/2, size, size);
        kCtx.restore();
    }

    const KG = 45;    // grid spacing in px
    const KR = 280;   // cursor attraction radius in px
    const KP = 1.5;   // strength
    const DPR = window.devicePixelRatio || 1;

    let kW = 0, kH = 0;
    let kCols = [], kDots = [];
    let kTrail = [];
    const kMouse = { x: -9999, y: -9999, active: false };

    function buildGrid() {
        kW = window.innerWidth;
        kH = window.innerHeight;
        kCanvas.width  = Math.floor(kW * DPR);
        kCanvas.height = Math.floor(kH * DPR);
        kCanvas.style.width  = kW + 'px';
        kCanvas.style.height = kH + 'px';
        kCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

        kCols = []; kDots = [];
        const nC = Math.floor(kW / KG) + 2;
        const nR = Math.floor(kH / KG) + 2;
        for (let c = 0; c < nC; c++) {
            const col = [];
            for (let r = 0; r < nR; r++) {
                const hx = c * KG, hy = r * KG;
                const d = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
                col.push(d); kDots.push(d);
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
    window.addEventListener('mouseleave', () => { kMouse.active = false; });
    window.addEventListener('touchend',   () => { kMouse.active = false; });
    window.addEventListener('resize', buildGrid);

    buildGrid();

    (function loopKG(ts) {
        // Skip all GPU work while the intro video is playing.
        if (!introIsPlaying) {
        kCtx.clearRect(0, 0, kW, kH);
        const now = ts || performance.now();

        // Physics update
        for (let i = 0; i < kDots.length; i++) {
            const d = kDots[i];
            let ax = (d.hx - d.x) * 0.09;
            let ay = (d.hy - d.y) * 0.09;
            if (kMouse.active) {
                const dx = kMouse.x - d.x, dy = kMouse.y - d.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < KR && dist > 0.001) {
                    const f = (1 - dist / KR) * KP;
                    ax += (dx / dist) * f;
                    ay += (dy / dist) * f;
                }
            }
            d.vx = (d.vx + ax) * 0.80;
            d.vy = (d.vy + ay) * 0.80;
            d.x += d.vx;
            d.y += d.vy;
        }

        // Draw grid lines
        for (let c = 0; c < kCols.length; c++) {
            for (let r = 0; r < kCols[c].length; r++) {
                const d = kCols[c][r];
                const prox = kMouse.active
                    ? Math.max(0, 1 - Math.sqrt((kMouse.x - d.x) ** 2 + (kMouse.y - d.y) ** 2) / KR)
                    : 0;
                const alpha = prox * 0.6;    // invisible at rest, lit only near cursor
                const lw    = 0.5 + prox * 1.2;

                const right = kCols[c + 1]?.[r];
                const down  = kCols[c]?.[r + 1];

                if (right) {
                    kCtx.globalAlpha = alpha;
                    kCtx.strokeStyle = '#ff5100';
                    kCtx.lineWidth   = lw;
                    kCtx.beginPath();
                    kCtx.moveTo(d.x, d.y);
                    kCtx.lineTo(right.x, right.y);
                    kCtx.stroke();
                }
                if (down) {
                    kCtx.globalAlpha = alpha;
                    kCtx.strokeStyle = '#ff5100';
                    kCtx.lineWidth   = lw;
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
                ? Math.max(0, 1 - Math.sqrt((kMouse.x - d.x) ** 2 + (kMouse.y - d.y) ** 2) / KR)
                : 0;
            if (prox <= 0) continue; // invisible at rest — skip entirely instead of drawing at alpha 0
            const r = 0.6 + prox * 3.2;
            if (prox > 0.05) {
                kGlowDot(d.x, d.y, r, '#ff5100', prox);
            } else {
                kCtx.save();
                kCtx.globalAlpha = prox;
                kCtx.fillStyle = '#ff5100';
                kCtx.beginPath();
                kCtx.arc(d.x, d.y, r, 0, Math.PI * 2);
                kCtx.fill();
                kCtx.restore();
            }
        }

        // Draw cursor trail
        kCtx.lineCap = 'round'; kCtx.lineJoin = 'round';
        for (let i = 1; i < kTrail.length; i++) {
            const a = kTrail[i - 1], b = kTrail[i];
            const age = now - b.t;
            if (age > 300) continue;
            kCtx.globalAlpha = Math.max(0, 1 - age / 300) * 0.9;
            kCtx.strokeStyle = '#ffaa00';
            kCtx.lineWidth   = 2.8;
            kCtx.beginPath();
            kCtx.moveTo(a.x, a.y);
            kCtx.lineTo(b.x, b.y);
            kCtx.stroke();
        }

        kCtx.globalAlpha = 1;
        } // end !introIsPlaying
        requestAnimationFrame(loopKG);
    })();

// ═══════════════════════════════════════════════════════
// 7. CONNECT SECTION — reveal cards when scrolled into view
// ═══════════════════════════════════════════════════════
const revealCards = document.querySelectorAll('[data-reveal]');
if (revealCards.length) {
    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                revealIO.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    revealCards.forEach(card => revealIO.observe(card));
}
})();

