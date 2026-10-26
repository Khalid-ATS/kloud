const SUPABASE_URL = "https://dtwjulokzfzkxngarrax.supabase.co";
const SUPABASE_KEY = "sb_publishable_NnGoNuWIzw-LuN_Xebv8ag_TDBRNT8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// type: text = plain text, delta = must be +number or -number, optnum = optional plain number
const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text" },
  { key: "username", label: "Username", type: "text" },
  { key: "id", label: "ID", type: "text" },
  { key: "rounds_won", label: "Rounds Won", type: "delta" },
  { key: "rounds_lost", label: "Rounds Lost", type: "delta" },
  { key: "perfect", label: "Perfect Predictions", type: "delta" },
  { key: "imperfect", label: "Imperfect Predictions", type: "delta" },
  { key: "elo_earned", label: "Gross Elo Earned", type: "delta" },
  { key: "elo_lost", label: "Gross Elo Lost", type: "delta" },
  { key: "career_points", label: "Overall Career Points", type: "delta" },
  { key: "highest", label: "Highest Single-Game Points (optional)", type: "optnum" },
];

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

function render() {
  const q = $("search").value.trim().toLowerCase();
  const shown = players.filter(p =>
    p.display_name.toLowerCase().includes(q) ||
    p.username.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q));
  const list = $("list");
  list.innerHTML = "";
  if (!shown.length) { list.innerHTML = `<div class="empty">No players found.</div>`; return; }

  for (const p of shown) {
    const card = document.createElement("div");
    card.className = "card";
    const rows = [
      ["Rounds Won", p.rounds_won], ["Rounds Lost", p.rounds_lost],
      ["Perfect Predictions", p.perfect_predictions], ["Imperfect Predictions", p.imperfect_predictions],
      ["Gross Elo Earned", p.gross_elo_earned], ["Gross Elo Lost", p.gross_elo_lost],
      ["Career Points", p.career_points],
      ["Highest Single-Game", p.highest_single_game_points ?? "—"],
    ];
    const av = document.createElement("div"); av.className = "avatar"; av.textContent = (p.display_name[0] || "?").toUpperCase();
    const pid = document.createElement("div"); pid.className = "pid"; pid.textContent = "ID: " + p.id;
    const nm = document.createElement("div"); nm.className = "name"; nm.textContent = p.display_name;
    const us = document.createElement("div"); us.className = "user"; us.textContent = "@" + p.username;
    card.append(av, pid, nm, us);
    for (const [k, v] of rows) {
      const r = document.createElement("div"); r.className = "stat";
      const a = document.createElement("span"); a.textContent = k;
      const b = document.createElement("span"); b.textContent = v;
      r.append(a, b); card.append(r);
    }
    list.append(card);
  }
}

$("search").addEventListener("input", render);

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

/* ---------- Info popup ---------- */
function openForm() {
  const box = $("formFields");
  box.innerHTML = "";
  for (const f of FIELDS) {
    const wrap = document.createElement("div"); wrap.className = "field";
    const lab = document.createElement("label"); lab.textContent = f.label + ":";
    const inp = document.createElement("input");
    inp.id = "f_" + f.key; inp.autocomplete = "off";
    if (f.type === "delta") inp.placeholder = "+5 or -5";
    if (f.type === "optnum") inp.placeholder = "e.g. 120 (can leave empty)";
    inp.addEventListener("input", validate);
    wrap.append(lab, inp); box.append(wrap);
  }
  $("formError").textContent = ""; $("formNote").textContent = "";
  $("saveBtn").disabled = true;
  $("infoModal").classList.remove("hidden");
}
$("infoCancel").onclick = () => $("infoModal").classList.add("hidden");

function validate() {
  let ok = true;
  for (const f of FIELDS) {
    const el = $("f_" + f.key); const v = el.value.trim();
    let good = true;
    if (f.type === "text") good = v.length > 0;
    else if (f.type === "delta") good = /^[+-]\d+$/.test(v);
    else if (f.type === "optnum") good = v === "" || /^\d+$/.test(v);
    el.classList.toggle("invalid", v !== "" && !good);
    if (!good) ok = false;
  }
  const id = $("f_id").value.trim();
  const exists = players.some(p => p.id === id);
  $("formNote").textContent = id
    ? (exists ? "ID exists: stats will be added/subtracted for this player."
              : "New ID: a new player will be created.")
    : "";
  $("saveBtn").disabled = !ok;
}

$("saveBtn").onclick = async () => {
  const v = (k) => $("f_" + k).value.trim();
  const hi = v("highest");
  $("saveBtn").disabled = true;
  const { error } = await db.rpc("upsert_player", {
    p_password: adminPassword,
    p_id: v("id"),
    p_display_name: v("display_name"),
    p_username: v("username"),
    p_rounds_won: parseInt(v("rounds_won"), 10),
    p_rounds_lost: parseInt(v("rounds_lost"), 10),
    p_perfect: parseInt(v("perfect"), 10),
    p_imperfect: parseInt(v("imperfect"), 10),
    p_elo_earned: parseInt(v("elo_earned"), 10),
    p_elo_lost: parseInt(v("elo_lost"), 10),
    p_career_points: parseInt(v("career_points"), 10),
    p_highest: hi === "" ? null : parseInt(hi, 10),
  });
  if (error) { $("formError").textContent = "Save failed: " + error.message; $("saveBtn").disabled = false; return; }
  $("infoModal").classList.add("hidden");
  await loadPlayers();
};

loadPlayers();
