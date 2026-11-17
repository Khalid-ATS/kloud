/* ---------- Elo numbers you may want to tweak ---------- */
const POS_BASE = { 1: 10, 2: 20, 3: 10, 4: 20 };
const ZERO_MULT = { 1: 31, 2: 8, 3: 8, 4: 2 };

/* Duos: base Elo for the winning team (+) and the losing team (-) */
const DUO_BASE_WIN = 20;
const DUO_BASE_LOSS = 20;

/* Predictions: n predictions => x(1 + n/10).  1 -> 1.1, 2 -> 1.2, 10 -> 2.0, 11 -> 2.1 ...
   Perfect:   gaining Elo => multiplied,  losing Elo => divided
   Imperfect: gaining Elo => divided,     losing Elo => multiplied */
const predMultOf = (n) => (10 + n) / 10;

/* Placement vs Elo ("upsets") */
const UPSET_WIN_RATE = 0.10;  // beating a higher-Elo player: +10% of the Elo gap, per player
const UPSET_LOSS_RATE = 0.15; // losing to a lower-Elo player: -15% of the Elo gap, per player
const UPSET_CAP = 150;        // max Elo swing from any single opponent

/* Rank decay: higher rank = smaller gains (index 0 = Bronze I ... 29 = top rank) */
const RANK_DECAY = 0.025;     // each rank removes 2.5% of gains
const RANK_MIN_MULT = 0.25;   // gains never drop below x0.25

/* Same logic as rankFor() in ranks.js: 100 Elo per division, 0 = Bronze I ... 29 = Obsidian V (2,900+) */
const rankIndexOf = (elo) => Math.min(Math.floor(Math.max(elo, 0) / 100), 29);

let eloMode = null;   // "solo" or "duo": which gamemode this game is for

// The player's numbers for the chosen gamemode (Solos or Duos)
const viewOf = (p) => forMode(p, eloMode);
const netOf = (p) => n0(viewOf(p).gross_elo_earned) - n0(viewOf(p).gross_elo_lost);
const sgn = (x) => (x > 0 ? "+" : "") + x;

/* Points -> multiplier: 310 points => x1.310, 90 points => x1.090 */
const pointsMultOf = (pts) => 1 + pts / 1000;

/* ---------- Opening ---------- */
function openElo() {
  $("eloBoard").classList.add("hidden");
  $("eloBoard").innerHTML = "";
  eloMode = null;
  $("modeSolo").classList.remove("on");
  $("modeDuo").classList.remove("on");
  $("eloMsg").textContent = "Choose a gamemode.";
  $("eloError").textContent = "";
  $("eloSave").disabled = true;
  $("eloModal").classList.remove("hidden");
}

$("eloCancel").onclick = () => $("eloModal").classList.add("hidden");

// Picking a gamemode. Solos and Duos have different layouts, so changing the gamemode rebuilds the board.
function pickEloMode(m) {
  const changed = eloMode !== m;
  eloMode = m;
  $("modeSolo").classList.toggle("on", m === "solo");
  $("modeDuo").classList.toggle("on", m === "duo");
  if (changed || $("eloBoard").classList.contains("hidden")) buildEloBoard();
  else recalcElo();
}
$("modeSolo").onclick = () => pickEloMode("solo");
$("modeDuo").onclick = () => pickEloMode("duo");

/* ---------- Player slots ---------- */
// duo = true: no Points / Position boxes here, those belong to the team
function makeSlot(i, duo) {
  const s = document.createElement("div");
  s.className = "slot";

  s.innerHTML = `
    <div class="field"><label>ID</label><input id="e${i}_id" placeholder="Type an ID" autocomplete="off"></div>
    <div class="sh" id="e${i}_head"></div>
    <div class="field"><label>Perfect Predictions</label><input id="e${i}_perf" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Imperfect Predictions</label><input id="e${i}_imp" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    ${duo ? "" : `
    <div class="field"><label>Points</label><input id="e${i}_pts" placeholder="0" inputmode="numeric" autocomplete="off"></div>
    <div class="field"><label>Position</label>
      <select id="e${i}_pos">
        <option value="">Choose</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </div>`}
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

// Duos: one team = 2 players + one shared Points box. Team 0 = Position 1 (won), team 1 = Position 2 (lost).
function makeTeam(t) {
  const wrap = document.createElement("div");
  wrap.className = "team " + (t === 0 ? "won" : "lost");

  const title = document.createElement("div");
  title.className = "team-title";
  title.textContent = t === 0 ? "Position 1 · Won" : "Position 2 · Lost";
  wrap.append(title);

  const slots = document.createElement("div");
  slots.className = "slots";
  slots.append(makeSlot(t * 2, true), makeSlot(t * 2 + 1, true));
  wrap.append(slots);

  const pts = document.createElement("div");
  pts.className = "field team-pts";
  pts.innerHTML = `<label>Points (both players get this)</label><input id="t${t}_pts" placeholder="0" inputmode="numeric" autocomplete="off">`;
  pts.querySelector("input").addEventListener("input", recalcElo);
  wrap.append(pts);

  return wrap;
}

function buildEloBoard() {
  const box = $("eloBoard");
  box.innerHTML = "";

  if (eloMode === "duo") {
    const teams = document.createElement("div");
    teams.className = "teams";
    teams.append(makeTeam(0), makeTeam(1));
    box.append(teams);
  } else {
    const slots = document.createElement("div");
    slots.className = "slots";
    for (let i = 0; i < 4; i++) slots.append(makeSlot(i, false));
    box.append(slots);
  }

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
  if (eloMode === "duo") return recalcDuo();

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

    // Placement vs Elo. Position 1 is best (lower number = better).
    let upset = 0;
    for (const o of others) {
      const gap = Math.abs(o.elo - r.elo);
      const beat = r.pos < o.pos;
      if (beat && o.elo > r.elo) {
        upset += Math.min(gap * UPSET_WIN_RATE, UPSET_CAP);   // beat a higher-Elo player
      } else if (!beat && o.elo < r.elo) {
        upset -= Math.min(gap * UPSET_LOSS_RATE, UPSET_CAP);  // lost to a lower-Elo player
      }
    }
    upset = Math.round(upset);

    let total = base + adj + upset;

    // Placement multiplier applies ONLY when current Elo is exactly 0.
    const zeroUsed = r.elo === 0 ? ZERO_MULT[r.pos] : null;

    if (zeroUsed !== null) {
      total *= zeroUsed;
    }

    // Predictions: 2 perfect = x1.2, 2 imperfect = x1.2 (see predMultOf).
    // Gaining Elo: perfect multiplies, imperfect divides.
    // Losing Elo:  perfect divides,     imperfect multiplies.
    const perfM = predMultOf(perf);
    const impM = predMultOf(imp);
    const gaining = total > 0;
    const losing = total < 0;

    if (gaining) total = total * perfM / impM;
    else if (losing) total = total / perfM * impM;

    // Game streak multiplier.
    // 0 streak = x1, 1 streak = x2, 2 streak = x4, etc.
    const streak = Math.max(0, n0(viewOf(r.p).game_streak));
    const streakMult = streak > 0 ? streak * 2 : 1;

    // Points multiplier: 310 points = x1.310, 90 points = x1.090
    const ptsMult = pointsMultOf(pts);

    // Rank decay: higher rank = smaller gains (losses are unaffected).
    const rankIdx = rankIndexOf(r.elo);
    const rankMult = total > 0
      ? Math.max(RANK_MIN_MULT, 1 - rankIdx * RANK_DECAY)
      : 1;

    total *= streakMult * ptsMult * rankMult * mult;

    let change = Math.round(total) || 0;

    // Players cannot lose more Elo than they currently have.
    if (change < 0) {
      change = -Math.min(-change, r.elo);
    }

    r.change = change;

    $(`e${r.i}_calc`).textContent =
      change > 0 ? "+" + change : change === 0 ? "+0" : String(change);

    $(`e${r.i}_why`).textContent =
      `base ${sgn(base)} · others ${sgn(adj)} · upset ${sgn(upset)}` +
      (perf > 0 && (gaining || losing) ? ` · ${gaining ? "×" : "÷"}${perfM.toFixed(1)} (perfect)` : "") +
      (imp > 0 && (gaining || losing) ? ` · ${gaining ? "÷" : "×"}${impM.toFixed(1)} (imperfect)` : "") +
      (rankMult !== 1 ? ` · ×${rankMult.toFixed(2)} (rank)` : "") +
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

/* ---------- Duos calculation (2 teams of 2) ---------- */
// Team 0 (slots 0,1) = Position 1 = won.  Team 1 (slots 2,3) = Position 2 = lost.
// Your result depends on YOUR team's average Elo vs the OTHER team's average Elo.
function recalcDuo() {
  const rows = [];

  for (let i = 0; i < 4; i++) {
    const id = $(`e${i}_id`).value.trim();
    const p = id === "" ? null : players.find(x => x.id === id);

    renderSlotHead(i, id, p);

    const team = i < 2 ? 0 : 1;
    rows.push({
      i,
      team,
      pos: team === 0 ? 1 : 2,
      id,
      p,
      perfV: $(`e${i}_perf`).value.trim(),
      impV: $(`e${i}_imp`).value.trim(),
      ptsV: $(`t${team}_pts`).value.trim(),   // shared by both players of the team
    });
  }

  const multV = $("e_mult").value.trim();
  const mult = multV === "" ? 1 : parseFloat(multV);

  let problem = "";

  if (!(multV === "" || (/^\d+(\.\d+)?$/.test(multV) && mult > 0)))
    problem = "Elo Multiplier must be a number above 0.";
  else if (rows.some(r => r.id === ""))
    problem = "Fill in both players of each team.";
  else if (rows.some(r => !r.p))
    problem = "One of the IDs doesn't match a player.";
  else if (new Set(rows.map(r => r.id)).size !== rows.length)
    problem = "Each player can only be used once.";
  else if (rows.some(r => !/^\d{0,9}$/.test(r.perfV) || !/^\d{0,9}$/.test(r.impV)))
    problem = "Perfect and Imperfect Predictions must be plain numbers.";
  else if (rows.some(r => !/^\d{0,9}$/.test(r.ptsV)))
    problem = "Points must be a plain number (like 90).";

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

  for (const r of rows) r.elo = Math.max(netOf(r.p), 0);

  const avg = (t) => {
    const m = rows.filter(r => r.team === t);
    return m.reduce((s, r) => s + r.elo, 0) / m.length;
  };
  const teamAvg = [avg(0), avg(1)];

  for (const r of rows) {
    const won = r.team === 0;
    const A = teamAvg[r.team];        // my team
    const B = teamAvg[1 - r.team];    // their team
    const gap = Math.abs(B - A);

    const perf = r.perfV === "" ? 0 : parseInt(r.perfV, 10);
    const imp = r.impV === "" ? 0 : parseInt(r.impV, 10);
    const pts = r.ptsV === "" ? 0 : parseInt(r.ptsV, 10);

    const base = won ? DUO_BASE_WIN : -DUO_BASE_LOSS;

    // Opponents stronger than us: winning pays more / losing hurts less. Weaker: the other way round.
    const adj = Math.ceil((B - A) / 2) || 0;

    // Upsets (same rates as Solos, using the team averages)
    let upset = 0;
    if (won && B > A) upset += Math.min(gap * UPSET_WIN_RATE, UPSET_CAP);
    if (!won && B < A) upset -= Math.min(gap * UPSET_LOSS_RATE, UPSET_CAP);
    upset = Math.round(upset);

    let total = base + adj + upset;

    // The winners never lose Elo and the losers never gain Elo
    total = won ? Math.max(total, 0) : Math.min(total, 0);

    // Placement multiplier applies ONLY when this player's own Elo is exactly 0.
    const zeroUsed = r.elo === 0 ? ZERO_MULT[r.pos] : null;
    if (zeroUsed !== null) total *= zeroUsed;

    const perfM = predMultOf(perf);
    const impM = predMultOf(imp);
    const gaining = total > 0;
    const losing = total < 0;

    if (gaining) total = total * perfM / impM;
    else if (losing) total = total / perfM * impM;

    const streak = Math.max(0, n0(viewOf(r.p).game_streak));
    const streakMult = streak > 0 ? streak * 2 : 1;

    const ptsMult = pointsMultOf(pts);

    const rankIdx = rankIndexOf(r.elo);
    const rankMult = total > 0
      ? Math.max(RANK_MIN_MULT, 1 - rankIdx * RANK_DECAY)
      : 1;

    total *= streakMult * ptsMult * rankMult * mult;

    let change = Math.round(total) || 0;
    if (change < 0) change = -Math.min(-change, r.elo);

    r.change = change;

    $(`e${r.i}_calc`).textContent =
      change > 0 ? "+" + change : change === 0 ? "+0" : String(change);

    $(`e${r.i}_why`).textContent =
      `team ${Math.round(A)} vs ${Math.round(B)} · base ${sgn(base)} · others ${sgn(adj)} · upset ${sgn(upset)}` +
      (perf > 0 && (gaining || losing) ? ` · ${gaining ? "×" : "÷"}${perfM.toFixed(1)} (perfect)` : "") +
      (imp > 0 && (gaining || losing) ? ` · ${gaining ? "÷" : "×"}${impM.toFixed(1)} (imperfect)` : "") +
      (rankMult !== 1 ? ` · ×${rankMult.toFixed(2)} (rank)` : "") +
      (zeroUsed !== null ? ` · ×${zeroUsed} (0 Elo)` : "") +
      (streakMult !== 1 ? ` · ×${streakMult} (game streak)` : "") +
      (pts > 0 ? ` · ×${ptsMult.toFixed(3)} (points)` : "") +
      (mult !== 1 ? ` · ×${mult} (manual)` : "");
  }

  eloResult = rows.map(r => ({
    id: r.id,
    position: r.pos,                                   // 1 = won, 2 = lost
    perfect: r.perfV === "" ? 0 : parseInt(r.perfV, 10),
    imperfect: r.impV === "" ? 0 : parseInt(r.impV, 10),
    points: r.ptsV === "" ? 0 : parseInt(r.ptsV, 10),  // same amount for both teammates
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

  // Solos use the original function, Duos use the new one (see the SQL file)
  const { error } = await db.rpc(eloMode === "duo" ? "apply_elo_game_duo" : "apply_elo_game", {
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
