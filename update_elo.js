/* ---------- Elo numbers you may want to tweak ---------- */
const POS_BASE = { 1: 20, 2: 10, 3: 0, 4: -20 };   // base Elo for each finishing position
const ZERO_MULT = { 1: 4, 2: 3, 3: 2, 4: 1 };      // extra multiplier for players who have 0 Elo
const PERFECT_BONUS = 1.5;                         // Elo per perfect prediction

const netOf = (p) => n0(p.gross_elo_earned) - n0(p.gross_elo_lost);
const sgn = (x) => (x > 0 ? "+" : "") + x;

/* ---------- Opening ---------- */
function openElo() {
  $("eloBoard").classList.add("hidden");
  $("eloBoard").innerHTML = "";
  $("modeSolo").classList.remove("on");
  $("eloMsg").textContent = "Choose a gamemode.";
  $("eloError").textContent = "";
  $("eloSave").disabled = true;
  $("eloModal").classList.remove("hidden");
}
$("eloCancel").onclick = () => $("eloModal").classList.add("hidden");
$("modeSolo").onclick = () => { $("modeSolo").classList.add("on"); buildEloBoard(); };

/* ---------- The 4 player boxes + multiplier ---------- */
function makeSlot(i) {
  const s = document.createElement("div");
  s.className = "slot";
  s.innerHTML = `
    <div class="field"><label>ID</label><input id="e${i}_id" placeholder="Type an ID" autocomplete="off"></div>
    <div class="sh" id="e${i}_head"></div>
    <div class="field"><label>Perfect Predictions</label><input id="e${i}_perf" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Points</label><input id="e${i}_pts" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Position</label>
      <select id="e${i}_pos"><option value="">Choose</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
    </div>
    <div class="calc"><small>Calculated Elo</small><span id="e${i}_calc">—</span><small id="e${i}_why"></small></div>`;
  s.querySelectorAll("input,select").forEach(el => {
    el.addEventListener("input", recalcElo);
    el.addEventListener("change", recalcElo);
  });
  return s;
}

function buildEloBoard() {
  const box = $("eloBoard");
  box.innerHTML = "";
  const slots = document.createElement("div"); slots.className = "slots";
  for (let i = 0; i < 4; i++) slots.append(makeSlot(i));
  box.append(slots);

  const m = document.createElement("div"); m.className = "mult-row";
  m.innerHTML = `<label>Elo Multiplier</label><input id="e_mult" placeholder="e.g. 2 (optional)" autocomplete="off">`;
  m.querySelector("input").addEventListener("input", recalcElo);
  box.append(m);

  box.classList.remove("hidden");
  recalcElo();
}

// Shows pfp, display name and username for the typed ID
function renderSlotHead(i, id, p) {
  const h = $(`e${i}_head`);
  h.innerHTML = "";
  if (id === "") return;
  if (!p) {
    const t = document.createElement("div"); t.className = "su bad"; t.textContent = "No player with that ID";
    h.append(t); return;
  }
  const info = document.createElement("div");
  const nm = document.createElement("div"); nm.className = "sn"; nm.textContent = p.display_name;
  const us = document.createElement("div"); us.className = "su"; us.textContent = tagFor(p);
  const el = document.createElement("div"); el.className = "su"; el.textContent = "Current Elo: " + fmt(Math.max(netOf(p), 0));
  info.append(nm, us, el);
  h.append(makeAvatar(p), info);
}

/* ---------- The calculation (live, before saving) ---------- */
let eloResult = null;   // what Save will send

function recalcElo() {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const id = $(`e${i}_id`).value.trim();
    const p = id === "" ? null : players.find(x => x.id === id);
    renderSlotHead(i, id, p);
    rows.push({
      i, id, p,
      perfV: $(`e${i}_perf`).value.trim(),
      ptsV: $(`e${i}_pts`).value.trim(),
      posV: $(`e${i}_pos`).value,
    });
  }

  const multV = $("e_mult").value.trim();
  const mult = multV === "" ? 1 : parseFloat(multV);
  const filled = rows.filter(r => r.id !== "");

  let problem = "";
  if (!(multV === "" || (/^\d+(\.\d+)?$/.test(multV) && mult > 0))) problem = "Elo Multiplier must be a number above 0.";
  else if (filled.length < 2) problem = "Fill in at least 2 players.";
  else if (filled.some(r => !r.p)) problem = "One of the IDs doesn't match a player.";
  else if (new Set(filled.map(r => r.id)).size !== filled.length) problem = "Each player can only be used once.";
  else if (filled.some(r => !/^\d{0,9}$/.test(r.perfV) || !/^\d{0,9}$/.test(r.ptsV))) problem = "Perfect Predictions and Points must be plain numbers.";
  else if (filled.some(r => r.posV === "")) problem = "Choose a position for every player.";
  else if (new Set(filled.map(r => r.posV)).size !== filled.length) problem = "Each position can only be used once.";

  // Reset the displays
  for (const r of rows) { $(`e${r.i}_calc`).textContent = "—"; $(`e${r.i}_why`).textContent = ""; }
  eloResult = null;
  $("eloError").textContent = "";

  if (problem) {
    $("eloMsg").textContent = problem;
    $("eloSave").disabled = true;
    return;
  }

  for (const r of filled) { r.elo = Math.max(netOf(r.p), 0); r.pos = Number(r.posV); }

  for (const r of filled) {
    const others = filled.filter(o => o !== r);
    const higher = others.filter(o => o.elo > r.elo);
    const lower = others.filter(o => !(o.elo > r.elo));
    const sum = (a) => a.reduce((t, o) => t + o.elo, 0);
    // (higher Elos - lower Elos) / (2 x number of higher players), rounded up
    const adj = higher.length ? (Math.ceil((sum(higher) - sum(lower)) / (2 * higher.length)) || 0) : 0;

    const base = POS_BASE[r.pos];
    const perfBonus = (r.perfV === "" ? 0 : parseInt(r.perfV, 10)) * PERFECT_BONUS;
    let total = base + perfBonus + adj;
    const zero = r.elo === 0;
    if (zero) total *= ZERO_MULT[r.pos];
    total *= mult;

    let change = Math.round(total) || 0;
    if (change < 0) change = -Math.min(-change, r.elo);   // can't drop below 0 Elo
    r.change = change;

    $(`e${r.i}_calc`).textContent = change > 0 ? "+" + change : change === 0 ? "+0" : String(change);
    $(`e${r.i}_why`).textContent =
      `base ${sgn(base)} · predictions ${sgn(perfBonus)} · others ${sgn(adj)}` +
      (zero ? ` · ×${ZERO_MULT[r.pos]} (0 Elo)` : "") + (mult !== 1 ? ` · ×${mult}` : "");
  }

  eloResult = filled.map(r => ({
    id: r.id,
    position: r.pos,
    perfect: r.perfV === "" ? 0 : parseInt(r.perfV, 10),
    points: r.ptsV === "" ? 0 : parseInt(r.ptsV, 10),
    change: r.change,
  }));
  $("eloMsg").textContent = "Check the Calculated Elo of each player, then press Save.";
  $("eloSave").disabled = false;
}

/* ---------- Save ---------- */
$("eloSave").onclick = async () => {
  if (!eloResult) return;
  $("eloSave").disabled = true;
  const { error } = await db.rpc("apply_elo_game", { p_password: adminPassword, p_data: eloResult });
  if (error) { $("eloError").textContent = "Save failed: " + error.message; $("eloSave").disabled = false; return; }
  $("eloModal").classList.add("hidden");
  await loadPlayers();
};
