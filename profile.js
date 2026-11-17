/* ---------- Player cards ---------- */
function tagFor(p) {
  const num = /^\d+$/.test(p.id) ? p.id.padStart(4, "0") : p.id;
  return "@" + p.username + "#" + num;
}

// Circle profile picture. Uses the uploaded picture if there is one, otherwise the first letter.
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
// mode given (profile popup): one rank chip for that gamemode. No mode (cards): Solos and Duos chips.
function makeHead(p, mode) {
  const head = document.createElement("div"); head.className = "p-head";
  const info = document.createElement("div"); info.className = "p-info";

  const nm = document.createElement("div"); nm.className = "name"; nm.textContent = p.display_name;
  const us = document.createElement("div"); us.className = "user"; us.textContent = tagFor(p);
  info.append(nm, us);

  const chips = document.createElement("div"); chips.className = "chips";
  const rankChips = mode
    ? rankChipHtml(forMode(p, mode), mode)
    : rankChipHtml(forMode(p, "solo"), "solo") + rankChipHtml(forMode(p, "duo"), "duo");
  chips.innerHTML = rankChips + sortBadges(p.badges).map(chipHtml).join("");
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

$("search").addEventListener("input", () => renderAll());

/* ---------- Profile popup ---------- */
let profilePlayer = null;   // the player whose popup is open
let profileTab = null;      // which category tag is open
let profileMode = "solo";  // which gamemode the open popup shows (its own tabs)

// Draws the popup for the current gamemode (Solos / Duos)
function drawProfile() {
  const p = profilePlayer;
  if (!p) return;
  const body = $("profileBody");
  const sections = statSections(forMode(p, profileMode));

  hideTip();
  body.innerHTML = "";

  const head = makeHead(p, profileMode); head.classList.add("big");
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
    t.className = "tab" + (profileTab === name ? " on" : "");
    t.textContent = name;
    t.onclick = () => { profileTab = profileTab === name ? null : name; drawProfile(); };
    tabs.append(t);
  }
  body.append(tabs);

  // Stats for the chosen tag (rounded rectangles)
  if (profileTab) {
    const grid = document.createElement("div"); grid.className = "stat-grid";
    for (const [label, value] of sections[profileTab]) {
      const box = document.createElement("div"); box.className = "stat-box";
      const l = document.createElement("div"); l.className = "stat-label"; l.textContent = label;
      const v = document.createElement("div"); v.className = "stat-value"; v.textContent = value;
      box.append(l, v); grid.append(box);
    }
    body.append(grid);
  }
}

// Switching Solos / Duos inside the popup only changes the popup
function setProfileMode(m) {
  profileMode = m;
  buildModeSeg($("profileSeg"), profileMode, setProfileMode);
  drawProfile();
}

function openProfile(p, mode = "solo") {
  profilePlayer = p;
  profileTab = null;
  profileMode = mode;
  buildModeSeg($("profileSeg"), profileMode, setProfileMode);
  drawProfile();
  $("profileModal").classList.remove("hidden");
}
function closeProfile() { hideTip(); $("profileModal").classList.add("hidden"); }
$("profileClose").onclick = closeProfile;
$("profileModal").addEventListener("click", (e) => { if (e.target === $("profileModal")) closeProfile(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProfile(); });
