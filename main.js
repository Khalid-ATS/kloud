/* ---------- Load players, then start ---------- */

// Sort by ID: #0000, #0001, #0002... Numeric IDs first in number order, other IDs after in A-Z order
function byId(a, b) {
  const an = /^\d+$/.test(a.id), bn = /^\d+$/.test(b.id);
  if (an && bn) return Number(a.id) - Number(b.id);
  if (an) return -1;
  if (bn) return 1;
  return a.id.localeCompare(b.id);
}

async function loadPlayers() {
  const { data, error } = await db.from("players").select("*");
  if (error) { $("list").innerHTML = `<div class="empty">Could not load players.</div>`; console.error(error); return; }
  players = data.sort(byId);
  render();
}

loadPlayers();
