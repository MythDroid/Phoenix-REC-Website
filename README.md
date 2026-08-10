# PHOENIX · Code. Build. Conquer.

Official website of the **PHOENIX Club** — Rajalakshmi Engineering College.

A dark, cinematic single-page experience built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step — open it and it runs.

---

## ✨ Features

- **Intro video** — `assets/initial.mp4` plays on load; playable once per session (`sessionStorage`), skippable.
- **Custom cursor** — trailing glow cursor that reacts over interactive elements.
- **Background canvases** — cables + rising embers (`#bg-canvas`) and a kinetic grid trail (`#kinetic-grid-canvas`).
- **Hero** — animated PHOENIX logo (`assets/phoenix_logo.png`) with a flame particle canvas; the logo shrinks and flies to the top-left nav once you scroll past the hero.
- **LIVE_SPARK** — upcoming event cards (Investiture Ceremony, Phoenix Hacks 1.0) with posters, details, and a flame-burst "Cheer" button.
- **CHRONICLES** — a pinned 3D helix gallery (`Active Theory`-style horizontal scroll) with 4 event cards that scroll into view as you scroll the page.
- **CORE X BOARD** — three arced auto-scrolling eye-ticker rows of member photos (static top/bottom rows, moving middle row).
- **CONNECT WITH US** — Instagram, LinkedIn, and Email contact cards with hover glows and scroll-reveal animations.
- Fully responsive across desktop, tablet, and mobile.

---

## 📁 Project Structure

```
Phoenix/
├── index.html              # Main single-page site
├── style.css               # All styles (design system + sections)
├── app.js                  # All interactivity (vanilla JS)
├── README.md
├── assets/
│   ├── phoenix_logo.png    # PHOENIX logo (nav + hero)
│   ├── initial.mp4         # Intro video
│   ├── Phoenix_hacks_1.0.jpeg
│   ├── investiture ceremony.png
│   ├── ignix1.jpg          # IGNIX Module 1 poster
│   ├── ignix2.jpg          # IGNIX Module 2 poster
│   ├── *.jpg               # Member photos for the eye ticker
│   ├── IGNIX1/             # Module 1 gallery photos
│   └── IGNIX2/             # Module 2 gallery photos
└── events/
    ├── ignix1.html         # IGNIX Module 1 event page
    ├── ignix2.html         # IGNIX Module 2 event page
    ├── investiture.html    # Investiture Ceremony page
    ├── phoenixHacks1.html  # Phoenix Hacks 1.0 page
    └── events.js           # Shared canvas background for event pages
```

---

## 🚀 Running

Open `index.html` in a browser (double-click, or serve it locally for best results):

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

---

## 🎨 Design System

Defined in `:root` inside `style.css`:

| Token              | Value     |
|--------------------|-----------|
| `--accent-orange`  | `#ff5100` |
| `--accent-gold`    | `#ffaa00` |
| `--accent-red`     | `#ff003c` |
| `--accent-purple`  | `#c800ff` |
| `--bg-primary`     | `#050303` |
| `--font-orbitron`  | Orbitron  |
| `--font-space`     | Space Grotesk |
| `--font-pixel`     | Courier Prime |

Reusable helpers: `.glass-panel`, `.pixel-text`, `.font-orbitron`, `.font-space`, `.glow-text`, `.text-orange`, etc.

---

## 🧩 Key Notes

- **File names are exact** — many assets contain spaces/uppercase (e.g. `assets/Varsha.jpeg`, `assets/nithin aaron.jpg`, `assets/investiture ceremony.png`). Keep raw spaces in `src`.
- **Event page galleries** reference photos with URL-encoded paths (spaces → `%20`, parentheses → `%28`/`%29`).
- **Intro video**: to always replay on refresh, remove the `sessionStorage` check in `app.js` §0.
- The gallery is a 500vh scroll budget — the sticky horizontal helix is driven by `app.js` §4.

---

© 2026 PHOENIX · Rajalakshmi Engineering College
