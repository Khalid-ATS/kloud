const SUPABASE_URL = "https://dtwjulokzfzkxngarrax.supabase.co";
const SUPABASE_KEY = "sb_publishable_NnGoNuWIzw-LuN_Xebv8ag_TDBRNT8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Small helpers and shared data used by every other file
const $ = (id) => document.getElementById(id);
const n0 = (x) => Number(x) || 0;

let players = [];        // the loaded player list
let adminPassword = "";  // set after the password popup succeeds

/* ---------- Gamemodes ---------- */
// Solos and Duos work. Trios is "coming soon" (shown, but not clickable).
const MODES = [
  { key: "solo", label: "Solos" },
  { key: "duo",  label: "Duos" },
  { key: "trio", label: "Trios", disabled: true },
];
const modeLabel = (m) => (MODES.find(x => x.key === m) || MODES[0]).label;

// Every number that is tracked separately for each gamemode
const STAT_KEYS = [
  "games_won", "games_lost", "game_streak", "game_best_streak",
  "perfect_predictions", "imperfect_predictions",
  "gross_elo_earned", "gross_elo_lost", "peak_elo",
  "career_points", "highest_single_game_points",
];

// Solo numbers use the normal column names. Duo numbers have "duo_" in front (duo_games_won ...).
const statKey = (mode, key) => (mode === "duo" ? "duo_" + key : key);

// Returns the player with the chosen gamemode's numbers in the normal stat names,
// so rankFor(), statSections(), eloOf() ... work for any gamemode without changes.
function forMode(p, mode) {
  if (mode !== "duo") return p;
  const v = { ...p };
  for (const k of STAT_KEYS) v[k] = p["duo_" + k];
  return v;
}

// Draws the  Solos | Duos | Trios  tabs inside `box`. onPick(modeKey) runs when a tab is clicked.
function buildModeSeg(box, current, onPick) {
  box.innerHTML = "";
  for (const m of MODES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.label;
    if (m.key === current) b.className = "on";
    if (m.disabled) { b.disabled = true; b.title = "Coming soon"; }
    else b.onclick = () => onPick(m.key);
    box.append(b);
  }
}

let gameMode = "solo";   // the gamemode shown on Player Profiles and Player Rankings
