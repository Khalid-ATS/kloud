/* ---------- Tabs, filters and the Player Rankings board ---------- */
let tierFilter = "all";

// Switch between Player Profiles and Player Rankings
function setView(v) {
  $("list").classList.toggle("hidden", v !== "profiles");
  $("rankings").classList.toggle("hidden", v !== "rankings");
  document.querySelectorAll(".nav-tab").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  hideTip();
}
document.querySelectorAll(".nav-tab").forEach(b => { b.onclick = () => setView(b.dataset.view); });

// Tier filter: All, then Bronze to Obsidian (any division)
$("tierSel").innerHTML = `<option value="all">All</option>` +
  TIERS.map((t, i) => `<option value="${i}">${t}</option>`).join("");
$("tierSel").onchange = () => { tierFilter = $("tierSel").value; renderRankings(); };

const eloOf = (p) => n0(p.gross_elo_earned) - n0(p.gross_elo_lost);
const idTag = (p) => "#" + (/^\d+$/.test(p.id) ? p.id.padStart(4, "0") : p.id);

// A value with a bar next to it
function barCell(text, pct, color) {
  const c = document.createElement("div"); c.className = "bcell";
  const v = document.createElement("span"); v.className = "bval"; v.textContent = text;
  const bar = document.createElement("div"); bar.className = "bar";
  const fill = document.createElement("i");
  fill.style.width = Math.max(0, Math.min(100, pct)) + "%";
  fill.style.background = color;
  bar.append(fill); c.append(v, bar);
  return c;
}

function renderRankings() {
  hideTip();
  const box = $("boardRows");
  box.innerHTML = "";
  const q = $("search").value.trim().toLowerCase();

  // Everyone in the chosen tier, best Elo first
  let pool = players.map(p => ({ p, elo: eloOf(p), r: rankFor(p) }));
  if (tierFilter !== "all") pool = pool.filter(x => x.r.t === Number(tierFilter));
  pool.sort((a, b) => b.elo - a.elo || byId(a.p, b.p));
  pool.forEach((x, i) => { x.pos = i + 1; });

  const maxElo = Math.max(1, ...pool.map(x => x.elo));
  const maxGames = Math.max(1, ...pool.map(x => n0(x.p.games_won) + n0(x.p.games_lost)));
  const maxStreak = Math.max(1, ...pool.map(x => n0(x.p.game_streak)));

  // Search only hides rows, it doesn't change anyone's position
  const shown = q ? pool.filter(x =>
    x.p.display_name.toLowerCase().includes(q) ||
    x.p.username.toLowerCase().includes(q) ||
    x.p.id.toLowerCase().includes(q) ||
    tagFor(x.p).toLowerCase().includes(q)) : pool;

  if (!shown.length) {
    box.innerHTML = `<div class="empty" style="padding:40px">No players found.</div>`;
    return;
  }

  for (const x of shown) {
    const p = x.p;
    const gp = n0(p.games_won) + n0(p.games_lost);
    const winRate = gp === 0 ? 0 : n0(p.games_won) / gp * 100;
    const preds = n0(p.perfect_predictions) + n0(p.imperfect_predictions);
    const acc = preds === 0 ? 0 : n0(p.perfect_predictions) / preds * 100;
    const streak = n0(p.game_streak);

    const row = document.createElement("div");
    row.className = "brow row";
    row.onclick = () => openProfile(p);

    // # (top 1, 2, 3 are colored)
    const pos = document.createElement("div");
    pos.className = "pos" + (x.pos <= 3 ? " p" + x.pos : "");
    pos.textContent = x.pos;

    // IDs
    const idc = document.createElement("div");
    idc.className = "idc"; idc.textContent = idTag(p);

    // Players: pfp, display name, tier icon
    const pl = document.createElement("div"); pl.className = "pl";
    const nm = document.createElement("span"); nm.className = "pname"; nm.textContent = p.display_name;
    const icon = document.createElement("span");
    icon.style.display = "inline-flex";
    icon.innerHTML = rankIcon(x.r.t, x.r.d);
    pl.append(makeAvatar(p), nm, icon);

    row.append(
      pos, idc, pl,
      barCell(fmt(x.elo), x.elo / maxElo * 100, "#e0a43a"),
      barCell(gp, gp / maxGames * 100, "#4aa3ff"),
      barCell(round1(winRate) + "%", winRate, "#4cd06a"),
      barCell(round1(acc) + "%", acc, "#ec6a8a"),
      barCell(streak, streak / maxStreak * 100, "#8f7bff")
    );
    box.append(row);
  }
}

// Redraws both pages (used after loading and while searching)
function renderAll() {
  render();
  renderRankings();
}
