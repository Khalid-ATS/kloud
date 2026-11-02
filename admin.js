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
let pickerOpen = false;
let chosen = false;        // has a player (or "None") been picked yet?
let selectedId = null;     // null = new profile, otherwise the ID of the player being edited
let ddOpen = false;        // is the player list open?

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

/* ---------- Profile picture field ---------- */
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

function renderAvatarField() {
  const wrap = $("avatarField");
  if (!wrap) return;
  wrap.innerHTML = "";

  const lab = document.createElement("label"); lab.textContent = "Profile:";
  wrap.append(lab);

  const row = document.createElement("div"); row.className = "avatar-row";

  const prev = document.createElement("div"); prev.className = "avatar small";
  if (avatarValue) {
    const img = document.createElement("img"); img.src = avatarValue; img.alt = "";
    prev.append(img);
  } else {
    const name = ($("f_display_name") && $("f_display_name").value.trim()) || "";
    prev.textContent = (name[0] || "?").toUpperCase();
  }

  const file = document.createElement("input");
  file.type = "file"; file.accept = "image/*"; file.hidden = true;
  file.onchange = async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    try {
      avatarValue = await processImage(f);
      $("formError").textContent = "";
    } catch (err) {
      $("formError").textContent = err.message;
    }
    renderAvatarField();
  };

  const up = document.createElement("button");
  up.type = "button"; up.className = "btn secondary";
  up.textContent = "Upload PFP";
  up.onclick = () => file.click();

  row.append(prev, up);

  if (avatarValue) {
    const rm = document.createElement("button");
    rm.type = "button"; rm.className = "btn secondary";
    rm.textContent = "Remove";
    rm.onclick = () => { avatarValue = ""; renderAvatarField(); };
    row.append(rm);
  }

  const hint = document.createElement("div"); hint.className = "note";
  hint.textContent = avatarValue ? "Custom picture selected." : "Optional. Without one, the default letter picture is used.";
  wrap.append(row, hint, file);
}

/* ---------- Badge picker ---------- */
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
        selectedBadges = selectedBadges.filter(k => k !== b.key);
        renderPicker();
      };
      pick.append(x);
    } else {
      pick.onclick = () => {
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

/* ---------- Player dropdown ---------- */
function renderPlayerPicker() {
  const wrap = $("playerPick");
  if (!wrap) return;
  wrap.innerHTML = "";

  const lab = document.createElement("label"); lab.textContent = "Player:";
  wrap.append(lab);

  const cur = selectedId === null ? null : players.find(x => x.id === selectedId);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "dd-btn";
  btn.textContent = !chosen ? "Choose a player..."
    : cur ? `${cur.display_name}  ${tagFor(cur)}` : "None (create a new profile)";
  btn.onclick = (e) => { e.stopPropagation(); ddOpen = !ddOpen; renderPlayerPicker(); };
  wrap.append(btn);

  if (!ddOpen) return;

  const list = document.createElement("div"); list.className = "dd-list";

  const none = document.createElement("div");
  none.className = "dd-item new";
  none.textContent = "None (create a new profile)";
  none.onclick = () => selectPlayer(null);
  list.append(none);

  for (const p of players) {
    const it = document.createElement("div"); it.className = "dd-item";
    const av = makeAvatar(p); av.classList.add("tiny");
    const nm = document.createElement("span"); nm.textContent = p.display_name;
    const sub = document.createElement("span"); sub.className = "dd-sub"; sub.textContent = tagFor(p);
    it.append(av, nm, sub);
    it.onclick = () => selectPlayer(p.id);
    list.append(it);
  }
  wrap.append(list);
}

// Close the player list when you click anywhere else
document.addEventListener("click", (e) => {
  if (ddOpen && !e.target.closest("#playerPick")) { ddOpen = false; renderPlayerPicker(); }
});

/* ---------- Building the editor ---------- */
function mkField(label, id, tag) {
  const wrap = document.createElement("div"); wrap.className = "field";
  const lab = document.createElement("label"); lab.textContent = label + ":";
  const inp = document.createElement(tag || "input");
  inp.id = id; inp.autocomplete = "off";
  inp.addEventListener("input", () => {
    if (id === "f_display_name" && !avatarValue) renderAvatarField();
    validate();
  });
  wrap.append(lab, inp);
  return { wrap, inp };
}

function buildEditor() {
  const ed = document.createElement("div");
  ed.id = "editor"; ed.className = "hidden";

  // Reset and Delete
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

  // Picture
  const av = document.createElement("div"); av.className = "field"; av.id = "avatarField";
  ed.append(av);

  // Text fields
  const dn = mkField("Display Name", "f_display_name"); dn.inp.placeholder = "Required";
  const un = mkField("Username", "f_username"); un.inp.placeholder = "Required";
  const id = mkField("ID", "f_id"); id.inp.placeholder = "Required (you can change it)";
  const ab = mkField("About Me", "f_about", "textarea");
  ab.inp.rows = 3; ab.inp.maxLength = 300; ab.inp.placeholder = "Write something about this player (optional)";
  ed.append(dn.wrap, un.wrap, id.wrap, ab.wrap);

  // Badges
  const bp = document.createElement("div"); bp.className = "field"; bp.id = "badgePicker";
  ed.append(bp);

  // Category tags with editable numbers
  const tabs = document.createElement("div"); tabs.className = "tabs";
  const grids = {}, tabBtns = {};
  const showTab = (name) => {
    for (const k of Object.keys(NUM_SECTIONS)) {
      tabBtns[k].classList.toggle("on", k === name);
      grids[k].classList.toggle("hidden", k !== name);
    }
  };
  for (const [name, items] of Object.entries(NUM_SECTIONS)) {
    const t = document.createElement("button");
    t.type = "button"; t.className = "tab"; t.textContent = name;
    t.onclick = () => showTab(name);
    tabs.append(t); tabBtns[name] = t;

    const grid = document.createElement("div"); grid.className = "stat-grid";
    for (const [key, label] of items) {
      const box = document.createElement("div"); box.className = "stat-box";
      const l = document.createElement("div"); l.className = "stat-label"; l.textContent = label;
      const inp = document.createElement("input");
      inp.id = "f_" + key; inp.autocomplete = "off"; inp.inputMode = "numeric"; inp.placeholder = "0";
      inp.addEventListener("input", validate);
      box.append(l, inp); grid.append(box);
    }
    grids[name] = grid;
    ed.append; // (grids are added after the tabs below)
  }
  ed.append(tabs);
  for (const g of Object.values(grids)) ed.append(g);
  const calc = document.createElement("div"); calc.className = "note";
  calc.textContent = "Games Played, Current Elo, Net Elo, ratios and percentages are worked out automatically from these numbers.";
  ed.append(calc);
  showTab("Games");

  return ed;
}

/* ---------- Opening the popup ---------- */
function openForm() {
  chosen = false; selectedId = null; ddOpen = false; pickerOpen = false;
  avatarValue = ""; selectedBadges = [];

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
  pickerOpen = false;
  renderAvatarField();
  renderPicker();
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
    const el = $("f_" + k);
    if (el.value.trim() === "") ok = false;
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
