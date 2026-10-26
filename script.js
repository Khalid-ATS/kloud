const SUPABASE_URL = "https://dtwjulokzfzkxngarrax.supabase.co";
const SUPABASE_KEY = "sb_publishable_NnGoNuWIzw-LuN_Xebv8ag_TDBRNT8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// type: text = plain text, delta = +number or -number, num = plain number
// required: true means it cannot be left empty
const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: true },
  { key: "id", label: "ID", type: "text", required: true },
  { key: "rounds_won", label: "Rounds Won", type: "delta" },
  { key: "rounds_lost", label: "Rounds Lost", type: "delta" },
  { key: "perfect", label: "Perfect Predictions", type: "delta" },
  { key: "imperfect", label: "Imperfect Predictions", type: "delta" },
  { key: "elo_earned", label: "Gross Elo Earned", type: "delta" },
  { key: "elo_lost", label: "Gross Elo Lost", type: "delta" },
  { key: "career_points", label: "Overall Career Points", type: "delta" },
  { key: "highest", label: "Highest Single-Game Points", type: "delta" },
];

/* ---------- Badges ---------- */
const BADGES = [
  { key: "crown", name: "Founder" },
  { key: "heart", name: "Co Founder" },
  { key: "star", name: "Grandmaster" },
  { key: "fire", name: "Streak Master" },
];
const BADGE_NAME = Object.fromEntries(BADGES.map(b => [b.key, b.name]));

// Hidden sprite with the custom gradient icons (not unicode emojis)
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
</svg>`;
document.body.insertAdjacentHTML("afterbegin", SPRITE);

// Icon in its own colored square (used in the badge picker)
function iconSvg(key) {
  return `<span class="bsq bsq-${key}"><svg class="bicon" viewBox="0 0 24 24"><use href="#b-${key}"/></svg></span>`;
}
// Icon + name inside a colored chip (used on the cards and the profile popup)
function chipHtml(key) {
  return `<span class="bchip bchip-${key}"><svg class="bicon" viewBox="0 0 24 24"><use href="#b-${key}"/></svg>${BADGE_NAME[key]}</span>`;
}
function sortBadges(list) {
  const set = new Set(list || []);
  return BADGES.map(b => b.key).filter(k => set.has(k));
}

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

// Pfp on the left, then display name, username and badge chips
function makeHead(p) {
  const head = document.createElement("div"); head.className = "p-head";
  const info = document.createElement("div"); info.className = "p-info";

  const nm = document.createElement("div"); nm.className = "name"; nm.textContent = p.display_name;
  const us = document.createElement("div"); us.className = "user"; us.textContent = tagFor(p);
  info.append(nm, us);

  const owned = sortBadges(p.badges);
  if (owned.length) {
    const chips = document.createElement("div"); chips.className = "chips";
    chips.innerHTML = owned.map(chipHtml).join("");
    info.append(chips);
  }

  head.append(makeAvatar(p), info);
  return head;
}

function render() {
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

/* ---------- Profile popup (stats) ---------- */
function openProfile(p) {
  const rows = [
    ["Rounds Won", p.rounds_won], ["Rounds Lost", p.rounds_lost],
    ["Perfect Predictions", p.perfect_predictions], ["Imperfect Predictions", p.imperfect_predictions],
    ["Gross Elo Earned", p.gross_elo_earned], ["Gross Elo Lost", p.gross_elo_lost],
    ["Career Points", p.career_points],
    ["Highest Single-Game Points", p.highest_single_game_points ?? 0],
  ];
  const body = $("profileBody");
  body.innerHTML = "";
  const head = makeHead(p); head.classList.add("big");
  body.append(head);

  const stats = document.createElement("div"); stats.className = "stats";
  for (const [k, v] of rows) {
    const r = document.createElement("div"); r.className = "stat";
    const a = document.createElement("span"); a.textContent = k;
    const b = document.createElement("span"); b.textContent = v;
    r.append(a, b); stats.append(r);
  }
  body.append(stats);
  $("profileModal").classList.remove("hidden");
}
function closeProfile() { $("profileModal").classList.add("hidden"); }
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
    const inp = document.createElement("input");
    inp.id = "f_" + f.key; inp.autocomplete = "off";
    if (f.required) inp.placeholder = "Required";
    else if (f.type === "delta") inp.placeholder = "+5 or -5 (optional)";
    else if (f.type === "num") inp.placeholder = "e.g. 120 (optional)";
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

  // Auto-fill display name, username and badges when the ID matches an existing player.
  // This only happens when the ID changes, so anything you edit afterwards stays as you typed it.
  if (existing && syncedId !== id) {
    $("f_display_name").value = existing.display_name || "";
    $("f_username").value = existing.username || "";
    selectedBadges = sortBadges(existing.badges);
    syncedId = id;
    renderPicker();
  } else if (!existing && syncedId !== null) {
    // ID no longer matches anyone: clear what was auto-filled
    $("f_display_name").value = "";
    $("f_username").value = "";
    selectedBadges = [];
    syncedId = null;
    renderPicker();
  }

  // Validate (after filling, so the required fields count as filled)
  let ok = true;
  for (const f of FIELDS) {
    const el = $("f_" + f.key); const v = el.value.trim();
    let good = true;
    if (f.required && v === "") { good = false; ok = false; }
    else if (v !== "") {
      if (f.type === "delta") good = /^[+-]\d+$/.test(v);
      else if (f.type === "num") good = /^\d+$/.test(v);
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
    p_rounds_won: n("rounds_won"),
    p_rounds_lost: n("rounds_lost"),
    p_perfect: n("perfect"),
    p_imperfect: n("imperfect"),
    p_elo_earned: n("elo_earned"),
    p_elo_lost: n("elo_lost"),
    p_career_points: n("career_points"),
    p_highest: n("highest"),
    p_badges: sortBadges(selectedBadges),
  });
  if (error) { $("formError").textContent = "Save failed: " + error.message; $("saveBtn").disabled = false; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
};

loadPlayers();
