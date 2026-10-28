// type: text = plain text, about = long text (optional),
//       delta = +number or -number, count = plain number (optional + allowed)
// required: true means it cannot be left empty
const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: true },
  { key: "id", label: "ID", type: "text", required: true },
  { key: "about", label: "About Me", type: "about" },
  { key: "rounds", label: "Rounds", type: "delta", hint: "+2 = won, -2 = lost (optional)" },
  { key: "perfect", label: "Perfect Predictions", type: "count", hint: "e.g. 3 (optional)" },
  { key: "imperfect", label: "Imperfect Predictions", type: "count", hint: "e.g. 2 (optional)" },
  { key: "elo", label: "Elo", type: "delta", hint: "Manual change: +25 earned, -25 lost (optional)" },
  { key: "points", label: "Points", type: "delta", hint: "+310 = win (gain Elo), -310 = loss (lose Elo)" },
];

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

/* ---------- Profile picture field (top of Update Info) ---------- */
let avatarValue = "";   // "" = default picture, otherwise a small image as a data URL

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

/* ---------- Badge picker (in Update Info, under Profile) ---------- */
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
  avatarValue = "";

  const avField = document.createElement("div");
  avField.className = "field"; avField.id = "avatarField";
  box.append(avField);
  renderAvatarField();

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

  // Auto-fill display name, username, about me, picture and badges when the ID matches an existing player.
  // This only happens when the ID changes, so anything you edit afterwards stays as you typed it.
  if (existing && syncedId !== id) {
    $("f_display_name").value = existing.display_name || "";
    $("f_username").value = existing.username || "";
    $("f_about").value = existing.about || "";
    avatarValue = existing.avatar_url || "";
    selectedBadges = sortBadges(existing.badges);
    syncedId = id;
    renderPicker();
  } else if (!existing && syncedId !== null) {
    // ID no longer matches anyone: clear what was auto-filled
    $("f_display_name").value = "";
    $("f_username").value = "";
    $("f_about").value = "";
    avatarValue = "";
    selectedBadges = [];
    syncedId = null;
    renderPicker();
  }
  renderAvatarField();

  // Validate (after filling, so the required fields count as filled)
  let ok = true;
  for (const f of FIELDS) {
    if (f.type === "about") continue;
    const el = $("f_" + f.key); const v = el.value.trim();
    let good = true;
    if (f.required && v === "") { good = false; ok = false; }
    else if (v !== "") {
      if (f.type === "delta") good = /^[+-]\d+$/.test(v);
      else if (f.type === "count") good = /^\+?\d+$/.test(v);
      if (!good) ok = false;
    }
    el.classList.toggle("invalid", v !== "" && !good);
  }

  let note = id
    ? (existing ? "This player exists: filled fields will update them, empty stats stay the same."
                : "New player: a new profile will be created (empty stats start at 0).")
    : "";
  if (id && $("f_points").value.trim() !== "") {
    note += " Points count as one finished game, and the Elo change is applied 1 minute after saving.";
  }
  $("formNote").textContent = note;
  $("saveBtn").disabled = !ok;
}

$("saveBtn").onclick = async () => {
  const v = (k) => $("f_" + k).value.trim();
  const n = (k) => (v(k) === "" ? null : parseInt(v(k), 10));
  const t = (k) => (v(k) === "" ? null : v(k));
  const hadPoints = v("points") !== "";
  $("saveBtn").disabled = true;
  const { error } = await db.rpc("upsert_player", {
    p_password: adminPassword,
    p_id: v("id"),
    p_display_name: t("display_name"),
    p_username: t("username"),
    p_about: v("about"),               // empty text clears the description
    p_rounds: n("rounds"),
    p_perfect: n("perfect"),
    p_imperfect: n("imperfect"),
    p_elo: n("elo"),
    p_points: n("points"),
    p_badges: sortBadges(selectedBadges),
    p_avatar: avatarValue,             // empty text = default picture
  });
  if (error) { $("formError").textContent = "Save failed: " + error.message; $("saveBtn").disabled = false; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
  // The Elo change lands 1 minute after saving, so refresh once it should be done
  if (hadPoints) setTimeout(loadPlayers, 65000);
};
