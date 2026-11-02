/* ---------- Elo numbers you may want to tweak ---------- */
const POS_BASE = { 1: 10, 2: 20, 3: 10, 4: 20 };
const ZERO_MULT = { 1: 31, 2: 8, 3: 8, 4: 2 };
const PERFECT_BONUS = 2.0;
const IMPERFECT_PENALTY = 1.0;

const netOf = (p) => n0(p.gross_elo_earned) - n0(p.gross_elo_lost);
const sgn = (x) => (x > 0 ? "+" : "") + x;

/* Points -> multiplier: 310 points => x1.310, 90 points => x1.090 */
const pointsMultOf = (pts) => 1 + pts / 1000;

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
$("modeSolo").onclick = () => {
  $("modeSolo").classList.add("on");
  buildEloBoard();
};

/* ---------- Player slots ---------- */
function makeSlot(i) {
  const s = document.createElement("div");
  s.className = "slot";

  s.innerHTML = `
    <div class="field"><label>ID</label><input id="e${i}_id" placeholder="Type an ID" autocomplete="off"></div>
    <div class="sh" id="e${i}_head"></div>
    <div class="field"><label>Perfect Predictions</label><input id="e${i}_perf" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Imperfect Predictions</label><input id="e${i}_imp" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Points</label><input id="e${i}_pts" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Position</label>
      <select id="e${i}_pos">
        <option value="">Choose</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </div>
    <div class="calc">
      <small>Calculated Elo</small>
      <span id="e${i}_calc">—</span>
      <small id="e${i}_why"></small>
    </div>`;

  s.querySelectorAll("input,select").forEach(el => {
    el.addEventListener("input", recalcElo);
    el.addEventListener("change", recalcElo);
  });

  return s;
}

function buildEloBoard() {
  const box = $("eloBoard");
  box.innerHTML = "";

  const slots = document.createElement("div");
  slots.className = "slots";

  for (let i = 0; i < 4; i++) slots.append(makeSlot(i));

  box.append(slots);

  const m = document.createElement("div");
  m.className = "mult-row";
  m.innerHTML = `<label>Elo Multiplier</label><input id="e_mult" placeholder="e.g. 2 (optional)" autocomplete="off">`;

  m.querySelector("input").addEventListener("input", recalcElo);
  box.append(m);

  box.classList.remove("hidden");
  recalcElo();
}

/* ---------- Player information ---------- */
function renderSlotHead(i, id, p) {
  const h = $(`e${i}_head`);
  h.innerHTML = "";

  if (id === "") return;

  if (!p) {
    const t = document.createElement("div");
    t.className = "su bad";
    t.textContent = "No player with that ID";
    h.append(t);
    return;
  }

  const info = document.createElement("div");

  const nm = document.createElement("div");
  nm.className = "sn";
  nm.textContent = p.display_name;

  const us = document.createElement("div");
  us.className = "su";
  us.textContent = tagFor(p);

  const el = document.createElement("div");
  el.className = "su";
  el.textContent = "Current Elo: " + fmt(Math.max(netOf(p), 0));

  info.append(nm, us, el);
  h.append(makeAvatar(p), info);
}

/* ---------- Elo calculation ---------- */
let eloResult = null;

function recalcElo() {
  const rows = [];

  for (let i = 0; i < 4; i++) {
    const id = $(`e${i}_id`).value.trim();
    const p = id === "" ? null : players.find(x => x.id === id);

    renderSlotHead(i, id, p);

    rows.push({
      i,
      id,
      p,
      perfV: $(`e${i}_perf`).value.trim(),
      impV: $(`e${i}_imp`).value.trim(),
      ptsV: $(`e${i}_pts`).value.trim(),
      posV: $(`e${i}_pos`).value,
    });
  }

  const multV = $("e_mult").value.trim();
  const mult = multV === "" ? 1 : parseFloat(multV);
  const filled = rows.filter(r => r.id !== "");

  let problem = "";

  if (!(multV === "" || (/^\d+(\.\d+)?$/.test(multV) && mult > 0)))
    problem = "Elo Multiplier must be a number above 0.";
  else if (filled.length < 2)
    problem = "Fill in at least 2 players.";
  else if (filled.some(r => !r.p))
    problem = "One of the IDs doesn't match a player.";
  else if (new Set(filled.map(r => r.id)).size !== filled.length)
    problem = "Each player can only be used once.";
  else if (filled.some(r => !/^\d{0,9}$/.test(r.perfV) || !/^\d{0,9}$/.test(r.impV)))
    problem = "Perfect and Imperfect Predictions must be plain numbers.";
  else if (filled.some(r => !/^\d{0,9}$/.test(r.ptsV)))
    problem = "Points must be a plain number (like 90).";
  else if (filled.some(r => r.posV === ""))
    problem = "Choose a position for every player.";
  else if (new Set(filled.map(r => r.posV)).size !== filled.length)
    problem = "Each player can only be used once.";

  for (const r of rows) {
    $(`e${r.i}_calc`).textContent = "—";
    $(`e${r.i}_why`).textContent = "";
  }

  eloResult = null;
  $("eloError").textContent = "";

  if (problem) {
    $("eloMsg").textContent = problem;
    $("eloSave").disabled = true;
    return;
  }

  for (const r of filled) {
    r.elo = Math.max(netOf(r.p), 0);
    r.pos = Number(r.posV);
  }

  for (const r of filled) {
    const others = filled.filter(o => o !== r);
    const higher = others.filter(o => o.elo > r.elo);
    const lower = others.filter(o => !(o.elo > r.elo));

    const sum = (a) => a.reduce((t, o) => t + o.elo, 0);

    const adj = higher.length
      ? (Math.ceil((sum(higher) - sum(lower)) / (2 * higher.length)) || 0)
      : 0;

    const perf = r.perfV === "" ? 0 : parseInt(r.perfV, 10);
    const imp = r.impV === "" ? 0 : parseInt(r.impV, 10);
    const pts = r.ptsV === "" ? 0 : parseInt(r.ptsV, 10);

    const base = POS_BASE[r.pos];
    const perfBonus = perf * PERFECT_BONUS;
    const impPen = imp * IMPERFECT_PENALTY;

    let total = base + perfBonus - impPen + adj;

    // Placement multiplier applies ONLY when current Elo is exactly 0.
    const zeroUsed = r.elo === 0 ? ZERO_MULT[r.pos] : null;

    if (zeroUsed !== null) {
      total *= zeroUsed;
    }

    // Game streak multiplier.
    // 0 streak = x1, 1 streak = x2, 2 streak = x4, etc.
    const streak = Math.max(0, n0(r.p.game_streak));
    const streakMult = streak > 0 ? streak * 2 : 1;

    // Points multiplier: 310 points = x1.310, 90 points = x1.090
    const ptsMult = pointsMultOf(pts);

    total *= streakMult * ptsMult * mult;

    let change = Math.round(total) || 0;

    // Players cannot lose more Elo than they currently have.
    if (change < 0) {
      change = -Math.min(-change, r.elo);
    }

    r.change = change;

    $(`e${r.i}_calc`).textContent =
      change > 0 ? "+" + change : change === 0 ? "+0" : String(change);

    $(`e${r.i}_why`).textContent =
      `base ${sgn(base)} · predictions ${sgn(perfBonus - impPen)} · others ${sgn(adj)}` +
      (zeroUsed !== null ? ` · ×${zeroUsed} (0 Elo)` : "") +
      (streakMult !== 1 ? ` · ×${streakMult} (game streak)` : "") +
      (pts > 0 ? ` · ×${ptsMult.toFixed(3)} (points)` : "") +
      (mult !== 1 ? ` · ×${mult} (manual)` : "");
  }

  eloResult = filled.map(r => ({
    id: r.id,
    position: r.pos,
    perfect: r.perfV === "" ? 0 : parseInt(r.perfV, 10),
    imperfect: r.impV === "" ? 0 : parseInt(r.impV, 10),
    points: r.ptsV === "" ? 0 : parseInt(r.ptsV, 10),
    change: r.change,
  }));

  $("eloMsg").textContent =
    "Check the Calculated Elo of each player, then press Save.";

  $("eloSave").disabled = false;
}

/* ---------- Save ---------- */
$("eloSave").onclick = async () => {
  if (!eloResult) return;

  $("eloSave").disabled = true;

  const { error } = await db.rpc("apply_elo_game", {
    p_password: adminPassword,
    p_data: eloResult
  });

  if (error) {
    $("eloError").textContent = "Save failed: " + error.message;
    $("eloSave").disabled = false;
    return;
  }

  $("eloModal").classList.add("hidden");
  await loadPlayers();
};
