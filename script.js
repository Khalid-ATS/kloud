const SUPABASE_URL = "https://dtwjulokzfzkxngarrax.supabase.co";
const SUPABASE_KEY = "sb_publishable_NnGoNuWIzw-LuN_Xebv8ag_TDBRNT8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// type: text = plain text, about = long text (optional), delta = +number or -number
// required: true means it cannot be left empty
const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: true },
  { key: "id", label: "ID", type: "text", required: true },
  { key: "about", label: "About Me", type: "about" },
  { key: "rounds", label: "Rounds", type: "delta", hint: "+2 = won, -2 = lost (optional)" },
  { key: "games", label: "Games", type: "delta", hint: "+2 = won, -2 = lost (optional)" },
  { key: "predictions", label: "Predictions", type: "delta", hint: "+2 = perfect, -2 = imperfect (optional)" },
  { key: "elo", label: "Elo", type: "delta", hint: "+25 = earned, -25 = lost (optional)" },
  { key: "points", label: "Points", type: "delta" },
];

const n0 = (x) => Number(x) || 0;

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

/* ---------- Elo ranks (automatic) ---------- */
const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Obsidian"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const fmt = (x) => x.toLocaleString("en-US");

// Rank comes from Net Elo (Gross Elo Earned - Gross Elo Lost). Below 0 counts as 0.
function rankFor(p) {
  const elo = Math.max(n0(p.gross_elo_earned) - n0(p.gross_elo_lost), 0);
  const t = Math.min(Math.floor(elo / 1000), 5);
  const d = Math.min(Math.floor((elo - t * 1000) / 200), 4);
  const low = t * 1000 + d * 200;
  const isTop = t === 5 && d === 4;
  const range = isTop ? fmt(low) + "+" : fmt(low) + "–" + fmt(low + 199);
  let extra = "";
  if (d === 0 && t === 0) extra = " · Lowest Bronze";
  else if (d === 0) extra = " · Lowest " + TIERS[t];
  if (isTop) extra = " · Highest rank";
  else if (d === 4) extra = " · Highest " + TIERS[t];
  return { t, d, title: TIERS[t] + " " + ROMAN[d], info: "Rank by Elo: " + range + extra };
}

function rankIcon(t, d) {
  const textColor = (t === 1 || t === 2 || t === 3) ? "#23232a" : "#ffffff";
  const size = d === 2 ? 9 : (d === 1 || d === 3) ? 10 : 12;
  return `<svg class="bicon rank" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="url(#gR${t})"/><text x="12" y="16.2" text-anchor="middle" font-size="${size}" font-weight="800" font-family="system-ui,sans-serif" fill="${textColor}">${ROMAN[d]}</text></svg>`;
}
function rankChipHtml(p) {
  const r = rankFor(p);
  return `<span class="bchip bchip-r${r.t}" data-title="${r.title}" data-info="${r.info}">${rankIcon(r.t, r.d)}${r.title}</span>`;
}

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

const $ = (id) => document.getElementById(id);
let players = [];
let adminPassword = "";

/* ---------- Load + render ---------- */
async function loadPlayers() {
  const { data, error } = await db.from("players").select("*").order("career_points", { ascending: false });
  if (error) { $("list").innerHTML = `<div class="empty">Could not load players.</div>`; console.error(error); return; }
  players = data;
  render();
}

function tagFor(p) {
  const num = /^\d+$/.test(p.id) ? p.id.padStart(4, "0") : p.id;
  return "@" + p.username + "#" + num;
}

// Circle profile picture. Uses p.avatar_url if you ever add that column, otherwise the first letter.
function makeAvatar(p) {
  const av = document.createElement("div");
  av.className = "avatar";
  if (p.avatar_url) {
    const img = document.createElement("img");
    img.src = p.avatar_url; img.alt = "";
    av.append(img);
  } else {
    av.textContent = (p.display_name[0] || "?").toUpperCase();
  }
  return av;
}

// Pfp on the left, then display name, username and badge chips (Elo rank first)
function makeHead(p) {
  const head = document.createElement("div"); head.className = "p-head";
  const info = document.createElement("div"); info.className = "p-info";

  const nm = document.createElement("div"); nm.className = "name"; nm.textContent = p.display_name;
  const us = document.createElement("div"); us.className = "user"; us.textContent = tagFor(p);
  info.append(nm, us);

  const chips = document.createElement("div"); chips.className = "chips";
  chips.innerHTML = rankChipHtml(p) + sortBadges(p.badges).map(chipHtml).join("");
  info.append(chips);

  head.append(makeAvatar(p), info);
  return head;
}

function render() {
  hideTip();
  const q = $("search").value.trim().toLowerCase();
  const shown = players.filter(p =>
    p.display_name.toLowerCase().includes(q) ||
    p.username.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    tagFor(p).toLowerCase().includes(q));
  const list = $("list");
  list.innerHTML = "";
  if (!shown.length) { list.innerHTML = `<div class="empty">No players found.</div>`; return; }

  for (const p of shown) {
    const card = document.createElement("div");
    card.className = "card";
    const btn = document.createElement("button");
    btn.className = "btn view"; btn.textContent = "View Profile";
    btn.onclick = () => openProfile(p);
    card.append(makeHead(p), btn);
    list.append(card);
  }
}

$("search").addEventListener("input", render);

/* ---------- Stat calculations ---------- */
const round2 = (x) => String(Math.round(x * 100) / 100);
const round1 = (x) => String(Math.round(x * 10) / 10);

// "2.5 Rounds Won for every 1 Round Lost"
function ratioText(won, lost, wonWord, lostWord, noneText) {
  if (won === 0 && lost === 0) return "N/A";
  if (lost === 0) return noneText;
  return `${round2(won / lost)} ${wonWord} for every 1 ${lostWord}`;
}
// "10% / 90%" (first = won, second = lost)
function pctPair(won, lost) {
  const total = won + lost;
  if (total === 0) return "0% / 0%";
  return `${round1(won / total * 100)}% / ${round1(lost / total * 100)}%`;
}
// Adds a + sign to positive numbers
function signed(x) {
  const s = round2(x);
  return x > 0 ? "+" + s : s;
}

function statSections(p) {
  const rw = n0(p.rounds_won), rl = n0(p.rounds_lost), rp = rw + rl;
  const gw = n0(p.games_won), gl = n0(p.games_lost), gp = gw + gl;
  const pp = n0(p.perfect_predictions), ip = n0(p.imperfect_predictions);
  const gee = n0(p.gross_elo_earned), gel = n0(p.gross_elo_lost);
  const net = gee - gel;
  const ocp = n0(p.career_points);

  return {
    Rounds: [
      ["Rounds Played", rp],
      ["Rounds Won", rw],
      ["Rounds Lost", rl],
      ["Current Round Win Streak", n0(p.round_streak)],
      ["Highest Round Win Streak", n0(p.round_best_streak)],
      ["Round Win to Loss Ratio", ratioText(rw, rl, "Rounds Won", "Round Lost", "No rounds lost yet")],
      ["Round Win to Loss Percentage", pctPair(rw, rl)],
    ],
    Games: [
      ["Games Played", gp],
      ["Games Won", gw],
      ["Games Lost", gl],
      ["Current Game Win Streak", n0(p.game_streak)],
      ["Highest Game Win Streak", n0(p.game_best_streak)],
      ["Game Win to Loss Ratio", ratioText(gw, gl, "Games Won", "Game Lost", "No games lost yet")],
      ["Game Win to Loss Percentage", pctPair(gw, gl)],
    ],
    Predictions: [
      ["Perfect Predictions", pp],
      ["Imperfect Predictions", ip],
      ["Predictions Made", pp + ip],
      ["Current Perfect Prediction Streak", n0(p.perfect_streak)],
      ["Highest Perfect Prediction Streak", n0(p.perfect_best_streak)],
      ["Prediction Accuracy", (rp === 0 ? "0" : round1(pp / rp * 100)) + "%"],
      ["Perfect to Imperfect Predictions Rate", ratioText(pp, ip, "Perfect", "Imperfect", "No imperfect predictions yet")],
    ],
    Elo: [
      ["Gross Elo Earned", gee],
      ["Gross Elo Lost", gel],
      ["Net Elo", net],
      ["Peak Elo", n0(p.peak_elo)],
      ["Average Elo Change Per Game", gp === 0 ? "0" : signed(net / gp)],
    ],
    Points: [
      ["Overall Career Points", ocp],
      ["Average Points Per Round", rp === 0 ? 0 : round2(ocp / rp)],
      ["Average Points Per Game", gp === 0 ? 0 : round2(ocp / gp)],
      ["Highest Single-Game Points", n0(p.highest_single_game_points)],
    ],
  };
}

/* ---------- Profile popup ---------- */
function openProfile(p) {
  let activeTab = null;
  const body = $("profileBody");
  const sections = statSections(p);

  function draw() {
    hideTip();
    body.innerHTML = "";

    const head = makeHead(p); head.classList.add("big");
    body.append(head);

    // About Me
    const about = document.createElement("div"); about.className = "about";
    const title = document.createElement("div"); title.className = "about-title"; title.textContent = "About Me";
    const text = document.createElement("div");
    text.className = "about-text" + (p.about ? "" : " none");
    text.textContent = p.about || "No description yet.";
    about.append(title, text);
    body.append(about);

    // Category tags (ovals)
    const tabs = document.createElement("div"); tabs.className = "tabs";
    for (const name of Object.keys(sections)) {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "tab" + (activeTab === name ? " on" : "");
      t.textContent = name;
      t.onclick = () => { activeTab = activeTab === name ? null : name; draw(); };
      tabs.append(t);
    }
    body.append(tabs);

    // Stats for the chosen tag (rounded rectangles)
    if (activeTab) {
      const grid = document.createElement("div"); grid.className = "stat-grid";
      for (const [label, value] of sections[activeTab]) {
        const box = document.createElement("div"); box.className = "stat-box";
        const l = document.createElement("div"); l.className = "stat-label"; l.textContent = label;
        const v = document.createElement("div"); v.className = "stat-value"; v.textContent = value;
        box.append(l, v); grid.append(box);
      }
      body.append(grid);
    }
  }

  draw();
  $("profileModal").classList.remove("hidden");
}
function closeProfile() { hideTip(); $("profileModal").classList.add("hidden"); }
$("profileClose").onclick = closeProfile;
$("profileModal").addEventListener("click", (e) => { if (e.target === $("profileModal")) closeProfile(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProfile(); });

/* ---------- Password popup ---------- */
$("updateBtn").onclick = () => {
  $("pwInput").value = ""; $("pwError").textContent = "";
  $("pwModal").classList.remove("hidden"); $("pwInput").focus();
};
$("pwCancel").onclick = () => $("pwModal").classList.add("hidden");
$("pwInput").addEventListener("keydown", e => { if (e.key === "Enter") $("pwOk").click(); });

$("pwOk").onclick = async () => {
  const pw = $("pwInput").value;
  const { data, error } = await db.rpc("check_admin_password", { p: pw });
  if (error || data !== true) { $("pwError").textContent = "Wrong password."; return; }
  adminPassword = pw;
  $("pwModal").classList.add("hidden");
  openForm();
};

/* ---------- Badge picker (top of Update Info) ---------- */
let selectedBadges = [];
let pickerOpen = false;
let badgesTouched = false;
let syncedId = null;         // the existing ID whose info was auto-filled

function renderPicker() {
  const wrap = $("badgePicker");
  if (!wrap) return;
  wrap.innerHTML = "";

  const lab = document.createElement("label"); lab.textContent = "Badges:";
  wrap.append(lab);

  if (!pickerOpen) {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "badge-open";
    const txt = document.createElement("span");
    txt.textContent = selectedBadges.length ? "Edit badges" : "Add badges";
    btn.append(txt);
    if (selectedBadges.length) {
      const prev = document.createElement("span"); prev.className = "badges";
      prev.innerHTML = selectedBadges.map(k => `<span class="badge">${iconSvg(k)}</span>`).join("");
      btn.append(prev);
    }
    btn.onclick = () => { pickerOpen = true; renderPicker(); };
    wrap.append(btn);
    return;
  }

  const tray = document.createElement("div"); tray.className = "badge-tray";
  for (const b of BADGES) {
    const on = selectedBadges.includes(b.key);
    const pick = document.createElement("div");
    pick.className = "pick" + (on ? " on" : "");
    pick.innerHTML = iconSvg(b.key);
    const nm = document.createElement("span"); nm.textContent = b.name;
    pick.append(nm);
    if (on) {
      const x = document.createElement("button");
      x.type = "button"; x.className = "x"; x.textContent = "×";
      x.setAttribute("aria-label", "Remove " + b.name);
      x.onclick = (e) => {
        e.stopPropagation();
        badgesTouched = true;
        selectedBadges = selectedBadges.filter(k => k !== b.key);
        renderPicker();
      };
      pick.append(x);
    } else {
      pick.onclick = () => {
        badgesTouched = true;
        selectedBadges = sortBadges([...selectedBadges, b.key]);
        renderPicker();
      };
    }
    tray.append(pick);
  }
  const done = document.createElement("button");
  done.type = "button"; done.className = "btn secondary done";
  done.textContent = "Done";
  done.onclick = () => { pickerOpen = false; renderPicker(); };
  tray.append(done);
  wrap.append(tray);

  const note = document.createElement("div"); note.className = "note";
  note.textContent = "Elo rank badges (Bronze to Obsidian) are given automatically from Net Elo.";
  wrap.append(note);
}

/* ---------- Info popup ---------- */
function openForm() {
  const box = $("formFields");
  box.innerHTML = "";

  selectedBadges = []; pickerOpen = false; badgesTouched = false; syncedId = null;
  const picker = document.createElement("div");
  picker.className = "field badge-picker"; picker.id = "badgePicker";
  box.append(picker);
  renderPicker();

  for (const f of FIELDS) {
    const wrap = document.createElement("div"); wrap.className = "field";
    const lab = document.createElement("label"); lab.textContent = f.label + ":";
    let inp;
    if (f.type === "about") {
      inp = document.createElement("textarea");
      inp.rows = 3; inp.maxLength = 300;
      inp.placeholder = "Write something about this player (optional)";
    } else {
      inp = document.createElement("input");
      if (f.required) inp.placeholder = "Required";
      else if (f.hint) inp.placeholder = f.hint;
      else if (f.type === "delta") inp.placeholder = "+5 or -5 (optional)";
    }
    inp.id = "f_" + f.key; inp.autocomplete = "off";
    inp.addEventListener("input", validate);
    wrap.append(lab, inp); box.append(wrap);
  }
  $("formError").textContent = ""; $("formNote").textContent = "";
  $("saveBtn").disabled = true;
  $("infoModal").classList.remove("hidden");
}
$("infoCancel").onclick = () => $("infoModal").classList.add("hidden");

function validate() {
  const id = $("f_id").value.trim();
  const existing = players.find(p => p.id === id);

  // Auto-fill display name, username, about me and badges when the ID matches an existing player.
  // This only happens when the ID changes, so anything you edit afterwards stays as you typed it.
  if (existing && syncedId !== id) {
    $("f_display_name").value = existing.display_name || "";
    $("f_username").value = existing.username || "";
    $("f_about").value = existing.about || "";
    selectedBadges = sortBadges(existing.badges);
    syncedId = id;
    renderPicker();
  } else if (!existing && syncedId !== null) {
    // ID no longer matches anyone: clear what was auto-filled
    $("f_display_name").value = "";
    $("f_username").value = "";
    $("f_about").value = "";
    selectedBadges = [];
    syncedId = null;
    renderPicker();
  }

  // Validate (after filling, so the required fields count as filled)
  let ok = true;
  for (const f of FIELDS) {
    if (f.type === "about") continue;
    const el = $("f_" + f.key); const v = el.value.trim();
    let good = true;
    if (f.required && v === "") { good = false; ok = false; }
    else if (v !== "") {
      if (f.type === "delta") good = /^[+-]\d+$/.test(v);
      if (!good) ok = false;
    }
    el.classList.toggle("invalid", v !== "" && !good);
  }

  $("formNote").textContent = id
    ? (existing ? "This player exists: filled fields will update them, empty stats stay the same."
                : "New player: a new profile will be created (empty stats start at 0).")
    : "";
  $("saveBtn").disabled = !ok;
}

$("saveBtn").onclick = async () => {
  const v = (k) => $("f_" + k).value.trim();
  const n = (k) => (v(k) === "" ? null : parseInt(v(k), 10));
  const t = (k) => (v(k) === "" ? null : v(k));
  $("saveBtn").disabled = true;
  const { error } = await db.rpc("upsert_player", {
    p_password: adminPassword,
    p_id: v("id"),
    p_display_name: t("display_name"),
    p_username: t("username"),
    p_about: v("about"),               // empty text clears the description
    p_rounds: n("rounds"),
    p_games: n("games"),
    p_predictions: n("predictions"),
    p_elo: n("elo"),
    p_points: n("points"),
    p_badges: sortBadges(selectedBadges),
  });
  if (error) { $("formError").textContent = "Save failed: " + error.message; $("saveBtn").disabled = false; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
};

loadPlayers();
