'use strict';

// ============================================================
//  DYNAMIC BROWSER TITLE — Typewriter style
// ============================================================
(function animateTitle() {
    const titles = ["MXYOR", "BEST", "DEVELOPMENT"];
    let i = 0, j = 0, isDeleting = false;
    function loop() {
        const fullTxt = titles[i % titles.length];
        document.title = isDeleting ? fullTxt.substring(0, j--) : (fullTxt.substring(0, j++) || "?");
        let speed = isDeleting ? 100 : 150;
        if (!isDeleting && j > fullTxt.length) {
            isDeleting = true; speed = 1000;
        } else if (isDeleting && j < 0) {
            isDeleting = false; i++; speed = 300; j = 0;
        }
        setTimeout(loop, speed);
    }
    loop();
})();

// ============================================================
//  CURSOR — dot + lagging ring + trail
// ============================================================
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let ringX = mouseX, ringY = mouseY;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
});

// Lagging ring
(function moveRing() {
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(moveRing);
})();

// Cursor trail
const TRAIL_COUNT = 16;
const trail = [];
const trailPositions = Array.from({ length: TRAIL_COUNT }, () => ({ x: 0, y: 0 }));

for (let i = 0; i < TRAIL_COUNT; i++) {
    const d = document.createElement('div');
    d.className = 'trail-dot';
    const t = 1 - i / TRAIL_COUNT;
    d.style.opacity = (t * 0.5).toString();
    d.style.transform = `translate(-50%,-50%) scale(${t * 0.9})`;
    d.style.background = `hsl(${355 - i * 6}, 80%, ${55 + i * 1.5}%)`;
    document.body.appendChild(d);
    trail.push(d);
}

(function animateTrail() {
    trailPositions[0].x += (mouseX - trailPositions[0].x) * 0.35;
    trailPositions[0].y += (mouseY - trailPositions[0].y) * 0.35;
    for (let i = 1; i < TRAIL_COUNT; i++) {
        trailPositions[i].x += (trailPositions[i - 1].x - trailPositions[i].x) * 0.45;
        trailPositions[i].y += (trailPositions[i - 1].y - trailPositions[i].y) * 0.45;
    }
    trail.forEach((el, i) => {
        el.style.left = trailPositions[i].x + 'px';
        el.style.top = trailPositions[i].y + 'px';
    });
    requestAnimationFrame(animateTrail);
})();

// Hover ring growth
document.querySelectorAll('a, button, .badge, input, .plink').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
});

// Click burst — BIG and AGGRESSIVE
document.addEventListener('click', e => {
    spawnBurst(e.clientX, e.clientY);
});
function spawnBurst(x, y) {
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        const isRed = Math.random() > 0.4;
        const size = 2 + Math.random() * 5;
        p.style.cssText = `
            position:fixed; width:${size}px; height:${size}px;
            background: ${isRed ? '#f8312f' : '#fff'};
            border-radius:50%; pointer-events:none; z-index:9996;
            left:${x}px; top:${y}px; transform:translate(-50%,-50%);
            box-shadow: 0 0 ${isRed ? '15px #f8312f' : '10px #fff'};
        `;
        document.body.appendChild(p);
        const angle = (Math.PI * 2 * i) / 20;
        const dist = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        p.animate([
            { transform: `translate(-50%,-50%) translate(0,0) scale(1)`, opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
        ], { duration: 400 + Math.random() * 400, easing: 'cubic-bezier(0,0,.2,1)' })
            .onfinish = () => p.remove();
    }
}

// ============================================================
//  AUDIO PLAYER (Local Audio)
// ============================================================
const bgAudio = document.getElementById('bg-audio');
const volBtn = document.getElementById('vol-btn');
const volSlider = document.getElementById('vol-slider');

const SVG_ON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>`;
const SVG_OFF = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

if (volBtn) volBtn.innerHTML = SVG_ON;

let muted = false;
let lastVol = 0.25;
let isPlaying = false;

function safePlay(audio) {
    if (!audio) return;
    console.log("safePlay invoked. currentSrc:", audio.currentSrc);
    const promise = audio.play();
    if (promise !== undefined) {
        promise.then(() => {
            isPlaying = true;
            console.log("SUCCESS: Audio started playing.");
        }).catch(e => {
            console.error("Playback Error: ", e);
            isPlaying = false;
        });
    }
}

function safePause(audio) {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
}

if (bgAudio) {
    bgAudio.volume = lastVol;
    if (volSlider) volSlider.value = lastVol;

    // Check if file loads
    bgAudio.addEventListener('error', (e) => {
        console.error("Audio Load Error! Browser looked for file at: ", bgAudio.currentSrc || "Unknown Source");
        console.group("Diagnostic Data");
        console.log("Source from DOM: ", bgAudio.src);
        console.log("ReadyState: ", bgAudio.readyState);
        console.log("NetworkState: ", bgAudio.networkState);
        console.groupEnd();
    });

    if (volBtn) {
        volBtn.addEventListener('click', () => {
            muted = !muted;
            bgAudio.muted = muted;
            bgAudio.volume = muted ? 0 : lastVol;
            volBtn.innerHTML = muted ? SVG_OFF : SVG_ON;

            if (!muted) {
                console.log("Manual play trigger. Source: ", bgAudio.currentSrc);
                safePlay(bgAudio);
            } else {
                safePause(bgAudio);
            }
        });
    }
    if (volSlider) {
        volSlider.addEventListener('input', () => {
            const v = parseFloat(volSlider.value);
            muted = (v === 0);
            bgAudio.muted = muted;
            lastVol = v || lastVol;
            bgAudio.volume = v;
            volBtn.innerHTML = muted ? SVG_OFF : SVG_ON;
        });
    }
}


// ============================================================
//  PARTICLE CANVAS — HIGH-END PLEXUS WEB
// ============================================================
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

    class Node {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.r = Math.random() * 2 + 1;
            this.glow = Math.random() * 20 + 10;
            this.baseColor = Math.random() > 0.8 ? [248, 49, 47] : [150, 10, 20]; // Reds and deep crimsons
        }
        update() {
            // Mouse interact
            const dx = mouseX - this.x; const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x -= dx * 0.02; this.y -= dy * 0.02;
            }

            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W) this.vx *= -1;
            if (this.y < 0 || this.y > H) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${this.baseColor[0]},${this.baseColor[1]},${this.baseColor[2]})`;
            ctx.shadowBlur = this.glow;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const numNodes = Math.min((W * H) / 12000, 150); // density
    const nodes = Array.from({ length: numNodes }, () => new Node());

    function drawBg() {
        ctx.clearRect(0, 0, W, H);

        // Gradient dark void background
        const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H));
        bgGrad.addColorStop(0, '#0a0305');
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        ctx.lineWidth = 1;

        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            a.update();
            a.draw();

            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x; const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 180) {
                    const alpha = (1 - dist / 180) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(248, 49, 47, ${alpha})`;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(drawBg);
    }
    drawBg();
}

// ============================================================
//  VISITOR COUNTER — Static Mock for GitHub Pages
// ============================================================
(function () {
    const elFooter = document.getElementById('visitor-count');
    const target = 21234; // Static base from config.php
    const from = target - 50;
    const dur = 2000;
    const t0 = performance.now();

    if (elFooter) {
        (function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            const val = Math.round(from + (target - from) * ease);
            elFooter.textContent = val.toLocaleString('ru-RU') + ' просмотров';
            if (p < 1) requestAnimationFrame(tick);
        })(t0);
    }
})();

// ============================================================
//  MODAL — project info popup
// ============================================================
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const projectBtn = document.getElementById('project-btn');

function openModal() {
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

if (projectBtn) projectBtn.addEventListener('click', openModal);
if (projectBtn) projectBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(); });
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ============================================================
//  START SCREEN
// ============================================================
const startScreen = document.getElementById('start-screen');
const main = document.getElementById('main');
let started = false;

function launch() {
    if (started) return; started = true;
    // ELEGANT LAUNCH transition
    startScreen.classList.add('red-glow-flash');

    setTimeout(() => {
        startScreen.classList.remove('red-glow-flash');
    }, 800);

    for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnBurst(
            window.innerWidth * (0.2 + Math.random() * 0.6),
            window.innerHeight * (0.2 + Math.random() * 0.6)
        ), i * 80);
    }
    startScreen.classList.add('out');
    setTimeout(() => startScreen.style.display = 'none', 900);
    main.classList.add('visible');

    if (bgAudio) {
        bgAudio.muted = false;
        bgAudio.volume = lastVol || 0.5;
        console.log("Auto-launching music. Source: ", bgAudio.currentSrc);
        safePlay(bgAudio);
    }

    startWriters();
}

startScreen.addEventListener('click', launch);
startScreen.addEventListener('touchstart', e => { e.preventDefault(); launch(); });

// ============================================================
//  TYPEWRITERS
// ============================================================
const PROFILE_NAME = 'mxyor';
const bioMessages = [
    'do you like python? ? ?'
];
const nameEl = document.getElementById('profile-name');
const bioEl = document.getElementById('profile-bio');

let bioIdx = 0, bioChar = 0, bioDel = false;

function typeBio() {
    if (!bioEl) return;
    const msg = bioMessages[bioIdx];
    if (!bioDel) { bioChar++; if (bioChar > msg.length) { bioDel = true; setTimeout(typeBio, 2000); return; } }
    else { bioChar--; if (bioChar === 0) { bioDel = false; bioIdx = (bioIdx + 1) % bioMessages.length; setTimeout(typeBio, 350); return; } }
    bioEl.textContent = msg.slice(0, bioChar) + '▌';
    setTimeout(typeBio, bioDel ? 45 : 90);
}

let nameChar = 0;
function typeName() {
    if (!nameEl) return;
    nameChar++;
    nameEl.textContent = PROFILE_NAME.slice(0, nameChar);
    nameEl.setAttribute('data-text', nameEl.textContent);
    if (nameChar < PROFILE_NAME.length) setTimeout(typeName, 130);
}

// Start screen hint typewriter
const hintEl = document.getElementById('start-hint');
const hint = 'click anywhere to enter';
let hi = 0;
function typeHint() {
    if (!hintEl || hi > hint.length) return;
    hintEl.textContent = hint.slice(0, hi) + (hi < hint.length ? '▌' : '');
    hi++;
    setTimeout(typeHint, 75);
}
setTimeout(typeHint, 800);

function startWriters() {
    if (nameEl) { nameEl.textContent = ''; nameChar = 0; }
    typeName();
    setTimeout(typeBio, 900);
}

// ============================================================
//  3D CARD TILT — magnetic
// ============================================================
const card = document.getElementById('card');
if (card && window.matchMedia('(pointer: fine)').matches) {
    let tiltRAF;
    let tX = 0, tY = 0, tTX = 0, tTY = 0;

    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        tTX = ((e.clientY - cy) / r.height) * 8; // Softer tilt
        tTY = -((e.clientX - cx) / r.width) * 8;
    });

    card.addEventListener('mouseleave', () => { tTX = 0; tTY = 0; });

    (function animateTilt() {
        tX += (tTX - tX) * 0.06;
        tY += (tTY - tY) * 0.06;
        if (card) card.style.transform =
            `perspective(1200px) rotateX(${tX}deg) rotateY(${tY}deg)`;
        requestAnimationFrame(animateTilt);
    })();
}
