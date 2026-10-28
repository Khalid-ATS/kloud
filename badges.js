/* ---------- Badges you assign by hand ---------- */
// To change what the info box says, edit the "desc" text here.
const BADGES = [
  { key: "crown", name: "Founder", desc: "Cloud Creator" },
  { key: "heart", name: "Co Founder", desc: "Cloud Co Creator" },
  { key: "star", name: "Grandmaster", desc: "Awarded to any Cloud Prodigy" },
  { key: "fire", name: "Streak Master", desc: "Very High Streak" },
  { key: "veteran", name: "Veteran", desc: "Old Cloud Player" },
  { key: "preseason", name: "Pre-Season Cloud Player", desc: "Cloud Player before Season 1" },
  { key: "champion", name: "Cloud Champion", desc: "Awarded to a Cloud Champion" },
];
const BADGE_BY_KEY = Object.fromEntries(BADGES.map(b => [b.key, b]));

// Hidden sprite with the custom icons (not unicode emojis)
const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="gCrown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd84a"/><stop offset="1" stop-color="#e3a400"/>
    </linearGradient>
    <linearGradient id="gHeart" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff7a7a"/><stop offset=".55" stop-color="#e5162f"/><stop offset="1" stop-color="#a80019"/>
    </linearGradient>
    <linearGradient id="gStar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe26b"/><stop offset=".55" stop-color="#f5b400"/><stop offset="1" stop-color="#c88400"/>
    </linearGradient>
    <linearGradient id="gFire" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff8a3d"/><stop offset=".5" stop-color="#ff3b30"/><stop offset="1" stop-color="#b80f1f"/>
    </linearGradient>
    <linearGradient id="gVet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2b8ff"/><stop offset=".55" stop-color="#9b4dff"/><stop offset="1" stop-color="#5b1fb5"/>
    </linearGradient>
    <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd6e4"/>
    </linearGradient>

    <linearGradient id="gR0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9985f"/><stop offset=".55" stop-color="#8a4b1f"/><stop offset="1" stop-color="#5a2d0f"/>
    </linearGradient>
    <linearGradient id="gR1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eceef2"/><stop offset=".55" stop-color="#a0a4ab"/><stop offset="1" stop-color="#6f737a"/>
    </linearGradient>
    <linearGradient id="gR2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8c14a"/><stop offset=".55" stop-color="#c29a1c"/><stop offset="1" stop-color="#8f6c06"/>
    </linearGradient>
    <linearGradient id="gR3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c8f2f0"/><stop offset=".55" stop-color="#7fd1cf"/><stop offset="1" stop-color="#3e9a9a"/>
    </linearGradient>
    <linearGradient id="gR4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8fd0ff"/><stop offset=".55" stop-color="#3b8fe8"/><stop offset="1" stop-color="#1f4fb0"/>
    </linearGradient>
    <linearGradient id="gR5" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a4a55"/><stop offset=".55" stop-color="#1a1a20"/><stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>

  <symbol id="b-crown" viewBox="0 0 24 24">
    <path d="M2.5 8.2l4.6 4.1L12 4.8l4.9 7.5 4.6-4.1-1.9 11.2H4.4L2.5 8.2z" fill="url(#gCrown)" stroke="#b57d00" stroke-width="1" stroke-linejoin="round"/>
    <circle cx="2.8" cy="7.4" r="1.6" fill="url(#gCrown)" stroke="#b57d00" stroke-width=".8"/>
    <circle cx="12" cy="3.9" r="1.7" fill="url(#gCrown)" stroke="#b57d00" stroke-width=".8"/>
    <circle cx="21.2" cy="7.4" r="1.6" fill="url(#gCrown)" stroke="#b57d00" stroke-width=".8"/>
    <rect x="5" y="16.4" width="14" height="1.6" rx=".8" fill="#fff" opacity=".35"/>
  </symbol>

  <symbol id="b-heart" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#gHeart)" stroke="#8c0015" stroke-width=".8" stroke-linejoin="round"/>
    <ellipse cx="7.3" cy="7.6" rx="2.3" ry="1.3" transform="rotate(-35 7.3 7.6)" fill="#fff" opacity=".4"/>
  </symbol>

  <symbol id="b-star" viewBox="0 0 24 24">
    <path d="M12 3.2l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.4l-5.1 2.8 1-5.8-4.2-4.1 5.8-.8L12 3.2z"
          fill="url(#gStar)" stroke="url(#gStar)" stroke-width="2.4" stroke-linejoin="round"/>
  </symbol>

  <symbol id="b-fire" viewBox="0 0 24 24">
    <path d="M13 2.6C13.4 6 16.8 8.6 17.8 12.4C18.8 16.4 16 21 12 21C8 21 5.4 18 6 14.4C6.4 12.1 7.9 10.6 9.1 9C9.3 10.3 9.9 11.1 10.8 11.4C10.6 8.2 11.1 4.7 13 2.6Z"
          fill="url(#gFire)" stroke="url(#gFire)" stroke-width="1.6" stroke-linejoin="round"/>
  </symbol>

  <symbol id="b-veteran" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#gVet)" stroke="#4a1796" stroke-width=".8" stroke-linejoin="round"/>
    <ellipse cx="7.3" cy="7.6" rx="2.3" ry="1.3" transform="rotate(-35 7.3 7.6)" fill="#fff" opacity=".4"/>
  </symbol>

  <symbol id="b-preseason" viewBox="0 0 24 24">
    <path d="M6.5 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.4 8.9a5 5 0 0 1 .1 10.1H6.5z" fill="url(#gCloud)" stroke="#aab4c8" stroke-width=".8" stroke-linejoin="round"/>
  </symbol>

  <symbol id="b-champion" viewBox="0 0 24 24">
    <g fill="none" stroke-width="1.8" stroke-linecap="round">
      <path d="M2 17A10 10 0 0 1 22 17" stroke="#ff3b3b"/>
      <path d="M4 17A8 8 0 0 1 20 17" stroke="#ff9f1a"/>
      <path d="M6 17A6 6 0 0 1 18 17" stroke="#f2c500"/>
      <path d="M8 17A4 4 0 0 1 16 17" stroke="#2fbf4a"/>
      <path d="M10 17A2 2 0 0 1 14 17" stroke="#2f8dff"/>
    </g>
  </symbol>
</svg>`;
document.body.insertAdjacentHTML("afterbegin", SPRITE);

// Icon in its own colored square (used in the badge picker)
function iconSvg(key) {
  return `<span class="bsq bsq-${key}"><svg class="bicon" viewBox="0 0 24 24"><use href="#b-${key}"/></svg></span>`;
}
// Icon + name inside a colored chip (cards and profile popup). Click it to see what it means.
function chipHtml(key) {
  const b = BADGE_BY_KEY[key];
  const icon = `<svg class="bicon" viewBox="0 0 24 24"><use href="#b-${key}"/></svg>`;
  const shown = key === "champion" ? `<span class="csq">${icon}</span>` : icon;
  return `<span class="bchip bchip-${key}" data-title="${b.name}" data-info="${b.desc}">${shown}${b.name}</span>`;
}
function sortBadges(list) {
  const set = new Set(list || []);
  return BADGES.map(b => b.key).filter(k => set.has(k));
}

/* ---------- Info box (click a title to open, click again or elsewhere to close) ---------- */
const tip = document.createElement("div");
tip.className = "tip";
document.body.append(tip);
let tipEl = null;

function showTip(el) {
  tip.innerHTML = `<b>${el.dataset.title}</b><span>${el.dataset.info}</span>`;
  tip.classList.add("show");
  tipEl = el;
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  let top = r.top - th - 8;
  if (top < 8) top = r.bottom + 8;
  tip.style.left = left + "px";
  tip.style.top = top + "px";
}
function hideTip() { tip.classList.remove("show"); tipEl = null; }

document.addEventListener("click", (e) => {
  const chip = e.target.closest(".bchip");
  if (!chip) { hideTip(); return; }
  if (tipEl === chip) hideTip(); else showTip(chip);
});
window.addEventListener("scroll", hideTip, true);
