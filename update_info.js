/* ---------- Editable numbers, grouped like the profile tabs ---------- */
// Everything else (Games Played, Current/Net Elo, ratios, percentages) is calculated automatically.
const NUM_SECTIONS = {
  Games: [
    ["games_won", "Games Won"],
    ["games_lost", "Games Lost"],
    ["game_streak", "Current Game Win Streak"],
    ["game_best_streak", "Highest Game Win Streak"],
  ],
  Predictions: [
    ["perfect_predictions", "Perfect Predictions"],
    ["imperfect_predictions", "Imperfect Predictions"],
    ["perfect_streak", "Current Perfect Prediction Streak"],
    ["perfect_best_streak", "Highest Perfect Prediction Streak"],
  ],
  Elo: [
    ["gross_elo_earned", "Gross Elo Earned"],
    ["gross_elo_lost", "Gross Elo Lost"],
    ["peak_elo", "Peak Elo"],
  ],
  Points: [
    ["career_points", "Overall Career Points"],
    ["highest_single_game_points", "Highest Single-Game Points"],
  ],
};
const NUM_KEYS = Object.values(NUM_SECTIONS).flat().map(x => x[0]);

let avatarValue = "";      // "" = default picture, otherwise a small image as a data URL
let selectedBadges = [];
let pickerOpen = false;    // is the badge tray open?
let chosen = false;        // has a player (or "None") been picked yet?
let selectedId = null;     // null = new profile, otherwise the ID of the player being edited
let ddOpen = false;        // is the player list open?
let activeTab = null;      // which category is open

/* ---------- Picture ---------- */
// Shrinks the chosen image to a 256x256 square so it stays small
function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a picture."));
      img.onload = () => {
        const S = 256;
        const c = document.createElement("canvas");
        c.width = S; c.height = S;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#232328"; ctx.fillRect(0, 0, S, S);
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAvatarBox() {
  const box = $("avatarBox");
  if (!box) return;
  box.innerHTML = "";
  if (avatarValue) {
    const img = document.createElement("img"); img.src = avatarValue; img.alt = "";
    box.append(img);
  } else {
    const name = ($("f_display_name") && $("f_display_name").value.trim()) || "";
    box.textContent = (name[0] || "?").toUpperCase();
  }
  const rm = $("removePfp");
  if (rm) rm.disabled = !avatarValue;
}

/* ---------- Badges (same spot as on the profile) ---------- */
// Elo rank + chosen badges as chips, each badge with a small x, then a "+ Badge" button
function renderChips() {
  const box = $("chipsBox");
  if (!box) return;
  box.innerHTML = "";

  const live = {
    gross_elo_earned: n0($("f_gross_elo_earned").value),
    gross_elo_lost: n0($("f_gross_elo_lost").value),
  };
  const rank = document.createElement("span");
  rank.innerHTML = rankChipHtml(live);
  box.append(rank.firstChild);

  for (const k of selectedBadges) {
    const w = document.createElement("span"); w.className = "edchip";
    w.innerHTML = chipHtml(k);
    const x = document.createElement("button");
    x.type = "button"; x.className = "xbtn"; x.textContent = "×";
    x.setAttribute("aria-label", "Remove " + BADGE_BY_KEY[k].name);
    x.onclick = (e) => {
      e.stopPropagation();
      selectedBadges = selectedBadges.filter(b => b !== k);
      renderChips(); renderTray();
    };
    w.append(x);
    box.append(w);
  }

  const add = document.createElement("button");
  add.type = "button"; add.className = "add-badge";
  add.textContent = pickerOpen ? "Close" : "+ Badge";
  add.onclick = () => { pickerOpen = !pickerOpen; renderChips(); renderTray(); };
  box.append(add);
}

function renderTray() {
  const wrap = $("badgeTray");
  if (!wrap) return;
  wrap.innerHTML = "";
  wrap.classList.toggle("hidden", !pickerOpen);
  if (!pickerOpen) return;

  const tray = document.createElement("div"); tray.className = "badge-tray";
  for (const b of BADGES) {
    const on = selectedBadges.includes(b.key);
    const pick = document.createElement("div");
    pick.className = "pick" + (on ? " on" : "");
    pick.innerHTML = iconSvg(b.key);
    const nm = document.createElement("span"); nm.textContent = b.name;
    pick.append(nm);
    pick.style.cursor = "pointer";
    pick.onclick = () => {
      selectedBadges = on
        ? selectedBadges.filter(k => k !== b.key)
        : sortBadges([...selectedBadges, b.key]);
      renderChips(); renderTray();
    };
    tray.append(pick);
  }
  wrap.append(tray);
  const note = document.createElement("div"); note.className = "note";
  note.textContent = "Click a badge to add or remove it. Elo rank badges (Bronze to Obsidian) are automatic.";
  wrap.append(note);
}

/* ---------- Player chooser (small oval, display names only) ---------- */
function renderPlayerPicker() {
  const wrap = $("playerPick");
  if (!wrap) return;
  wrap.innerHTML = "";

  const cur = selectedId === null ? null : players.find(x => x.id === selectedId);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "pill-btn";
  btn.textContent = !chosen ? "Choose a player" : cur ? cur.display_name : "None (new profile)";
  btn.onclick = (e) => { e.stopPropagation(); ddOpen = !ddOpen; renderPlayerPicker(); };
  wrap.append(btn);

  if (!ddOpen) return;

  const list = document.createElement("div"); list.className = "pill-list";
  const none = document.createElement("button");
  none.type = "button"; none.className = "pill new"; none.textContent = "None";
  none.onclick = () => selectPlayer(null);
  list.append(none);
  for (const p of players) {
    const it = document.createElement("button");
    it.type = "button"; it.className = "pill" + (p.id === selectedId ? " on" : "");
    it.textContent = p.display_name;
    it.onclick = () => selectPlayer(p.id);
    list.append(it);
  }
  wrap.append(list);
}

// Close the list when you click anywhere else
document.addEventListener("click", (e) => {
  if (ddOpen && !e.target.closest("#playerPick")) { ddOpen = false; renderPlayerPicker(); }
});

/* ---------- Building the editor (laid out like a profile) ---------- */
function buildEditor() {
  const ed = document.createElement("div");
  ed.id = "editor"; ed.className = "hidden";

  // Reset / Delete
  const acts = document.createElement("div"); acts.className = "ed-actions";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button"; resetBtn.className = "btn secondary"; resetBtn.id = "resetBtn";
  resetBtn.onclick = resetPlayer;
  const delBtn = document.createElement("button");
  delBtn.type = "button"; delBtn.className = "btn danger"; delBtn.id = "deleteBtn";
  delBtn.textContent = "Delete";
  delBtn.onclick = deletePlayer;
  acts.append(resetBtn, delBtn);
  ed.append(acts);

  // Head: picture on the left (with Upload / Remove), info on the right
  const head = document.createElement("div"); head.className = "p-head big ed-head";

  const left = document.createElement("div"); left.className = "ed-av";
  const avBox = document.createElement("div"); avBox.className = "avatar"; avBox.id = "avatarBox";
  const file = document.createElement("input");
  file.type = "file"; file.accept = "image/*"; file.hidden = true;
  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    try { avatarValue = await processImage(f); $("formError").textContent = ""; }
    catch (err) { $("formError").textContent = err.message; }
    renderAvatarBox();
  };
  const up = document.createElement("button");
  up.type = "button"; up.className = "btn secondary"; up.textContent = "Upload PFP";
  up.onclick = () => file.click();
  const rm = document.createElement("button");
  rm.type = "button"; rm.className = "btn secondary"; rm.id = "removePfp"; rm.textContent = "Remove PFP";
  rm.onclick = () => { avatarValue = ""; renderAvatarBox(); };
  const btns = document.createElement("div"); btns.className = "ed-avbtns";
  btns.append(up, rm);
  left.append(avBox, btns, file);

  const info = document.createElement("div"); info.className = "p-info";
  const dn = document.createElement("input");
  dn.id = "f_display_name"; dn.className = "ed-name"; dn.placeholder = "Display name";
  dn.autocomplete = "off";
  dn.addEventListener("input", () => { if (!avatarValue) renderAvatarBox(); validate(); });

  const row = document.createElement("div"); row.className = "ed-row";
  const at = document.createElement("span"); at.textContent = "@";
  const un = document.createElement("input");
  un.id = "f_username"; un.placeholder = "username"; un.autocomplete = "off";
  un.addEventListener("input", validate);
  const hash = document.createElement("span"); hash.textContent = "#";
  const idi = document.createElement("input");
  idi.id = "f_id"; idi.placeholder = "ID"; idi.autocomplete = "off"; idi.className = "ed-id";
  idi.addEventListener("input", validate);
  row.append(at, un, hash, idi);

  const chips = document.createElement("div"); chips.className = "chips"; chips.id = "chipsBox";
  info.append(dn, row, chips);
  head.append(left, info);
  ed.append(head);

  const tray = document.createElement("div"); tray.id = "badgeTray"; tray.className = "hidden";
  ed.append(tray);

  // About Me
  const about = document.createElement("div"); about.className = "about";
  const at2 = document.createElement("div"); at2.className = "about-title"; at2.textContent = "About Me";
  const ta = document.createElement("textarea");
  ta.id = "f_about"; ta.rows = 3; ta.maxLength = 300;
  ta.placeholder = "Write something about this player (optional)";
  ta.addEventListener("input", validate);
  about.append(at2, ta);
  ed.append(about);

  // Category tags + editable numbers
  const tabs = document.createElement("div"); tabs.className = "tabs"; tabs.id = "edTabs";
  const grids = document.createElement("div"); grids.id = "edGrids";
  for (const [name, items] of Object.entries(NUM_SECTIONS)) {
    const t = document.createElement("button");
    t.type = "button"; t.className = "tab"; t.dataset.tab = name; t.textContent = name;
    t.onclick = () => { activeTab = activeTab === name ? null : name; showTab(); };
    tabs.append(t);

    const grid = document.createElement("div");
    grid.className = "stat-grid hidden"; grid.dataset.tab = name;
    for (const [key, label] of items) {
      const box = document.createElement("div"); box.className = "stat-box";
      const l = document.createElement("div"); l.className = "stat-label"; l.textContent = label;
      const inp = document.createElement("input");
      inp.id = "f_" + key; inp.autocomplete = "off"; inp.inputMode = "numeric"; inp.placeholder = "0";
      inp.addEventListener("input", validate);
      box.append(l, inp); grid.append(box);
    }
    grids.append(grid);
  }
  ed.append(tabs, grids);

  const calc = document.createElement("div"); calc.className = "note";
  calc.textContent = "Games Played, Current Elo, Net Elo, ratios and percentages are worked out automatically from these numbers.";
  ed.append(calc);

  return ed;
}

function showTab() {
  document.querySelectorAll("#edTabs .tab").forEach(t => t.classList.toggle("on", t.dataset.tab === activeTab));
  document.querySelectorAll("#edGrids .stat-grid").forEach(g => g.classList.toggle("hidden", g.dataset.tab !== activeTab));
}

/* ---------- Opening the popup ---------- */
function openForm() {
  chosen = false; selectedId = null; ddOpen = false; pickerOpen = false;
  avatarValue = ""; selectedBadges = []; activeTab = null;

  const box = $("formFields");
  box.innerHTML = "";
  const pp = document.createElement("div"); pp.className = "field"; pp.id = "playerPick";
  box.append(pp);
  box.append(buildEditor());
  renderPlayerPicker();

  $("formError").textContent = "";
  $("formNote").textContent = "Pick a player to edit, or None to create a new profile.";
  $("saveBtn").disabled = true;
  $("infoModal").classList.remove("hidden");
}
$("infoCancel").onclick = () => { ddOpen = false; $("infoModal").classList.add("hidden"); };

// Fills every box with a player's saved info (null = empty form for a new profile)
function loadInto(p) {
  $("f_display_name").value = p ? p.display_name || "" : "";
  $("f_username").value = p ? p.username || "" : "";
  $("f_id").value = p ? p.id : "";
  $("f_about").value = p ? p.about || "" : "";
  for (const k of NUM_KEYS) $("f_" + k).value = String(p ? n0(p[k]) : 0);
  avatarValue = p ? p.avatar_url || "" : "";
  selectedBadges = p ? sortBadges(p.badges) : [];
  pickerOpen = false; activeTab = null;
  renderAvatarBox(); renderChips(); renderTray(); showTab();
}

function selectPlayer(id) {
  chosen = true; selectedId = id; ddOpen = false;
  const p = id === null ? null : players.find(x => x.id === id);
  loadInto(p);
  renderPlayerPicker();
  $("editor").classList.remove("hidden");
  $("resetBtn").textContent = id === null ? "Clear form" : "Reset stats";
  $("deleteBtn").classList.toggle("hidden", id === null);
  $("formError").textContent = "";
  validate();
}

/* ---------- Reset and Delete ---------- */
async function resetPlayer() {
  if (selectedId === null) { loadInto(null); validate(); return; }
  const p = players.find(x => x.id === selectedId);
  if (!p) return;
  if (!confirm(`Reset all stats for ${p.display_name} (${tagFor(p)}) to 0? Anything you typed but did not save is lost.`)) return;

  const { error } = await db.rpc("reset_player", { p_password: adminPassword, p_id: selectedId });
  if (error) { $("formError").textContent = "Reset failed: " + error.message; return; }
  await loadPlayers();
  selectPlayer(selectedId);
  $("formNote").textContent = "Stats reset to 0.";
}

async function deletePlayer() {
  const p = players.find(x => x.id === selectedId);
  if (!p) return;
  if (!confirm(`Delete ${p.display_name} (${tagFor(p)}) for good? This can't be undone.`)) return;

  $("deleteBtn").disabled = true;
  const { error } = await db.rpc("delete_player", { p_password: adminPassword, p_id: selectedId });
  $("deleteBtn").disabled = false;
  if (error) { $("formError").textContent = "Delete failed: " + error.message; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
}

/* ---------- Checking the form ---------- */
function validate() {
  if (!chosen) { $("saveBtn").disabled = true; return; }
  let ok = true;

  for (const k of ["display_name", "username", "id"]) {
    if ($("f_" + k).value.trim() === "") ok = false;
  }

  for (const k of NUM_KEYS) {
    const el = $("f_" + k); const v = el.value.trim();
    const good = v === "" || /^\d{1,9}$/.test(v);
    el.classList.toggle("invalid", !good);
    if (!good) ok = false;
  }

  // The ID can't belong to somebody else
  const id = $("f_id").value.trim();
  const clash = id !== "" && id !== selectedId && players.some(p => p.id === id);
  $("f_id").classList.toggle("invalid", clash);
  $("formError").textContent = clash ? "That ID is already used by another player." : "";
  if (clash) ok = false;

  renderChips();   // keeps the Elo rank chip in step with the Elo numbers

  $("formNote").textContent = selectedId === null
    ? "New profile: it will be created when you press Save."
    : "Editing an existing player: what you type replaces the saved value. Blank numbers count as 0.";
  $("saveBtn").disabled = !ok;
}

/* ---------- Save ---------- */
$("saveBtn").onclick = async () => {
  const v = (k) => $("f_" + k).value.trim();
  const num = (k) => (v(k) === "" ? 0 : parseInt(v(k), 10));

  const data = {
    id: v("id"),
    display_name: v("display_name"),
    username: v("username"),
    about: $("f_about").value.trim(),
    avatar_url: avatarValue,
    badges: sortBadges(selectedBadges),
  };
  for (const k of NUM_KEYS) data[k] = num(k);

  $("saveBtn").disabled = true;
  const { error } = await db.rpc("admin_save_player", {
    p_password: adminPassword,
    p_old_id: selectedId,
    p_data: data,
  });
  if (error) { $("formError").textContent = "Save failed: " + error.message; $("saveBtn").disabled = false; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
};
