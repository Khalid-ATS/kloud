/* ---------- Load players, then start ---------- */
async function loadPlayers() {
  // Apply any Elo calculations whose 1 minute wait is over, then load the list
  await db.rpc("apply_due_elo");
  const { data, error } = await db.from("players").select("*").order("career_points", { ascending: false });
  if (error) { $("list").innerHTML = `<div class="empty">Could not load players.</div>`; console.error(error); return; }
  players = data;
  render();
}

loadPlayers();
