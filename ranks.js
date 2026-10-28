/* ---------- Elo ranks (automatic) ---------- */
const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Obsidian"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const fmt = (x) => x.toLocaleString("en-US");

// Rank comes from Net Elo (Gross Elo Earned - Gross Elo Lost). Below 0 counts as 0.
function rankFor(p) {
  const elo = Math.max(n0(p.gross_elo_earned) - n0(p.gross_elo_lost), 0);
  const t = Math.min(Math.floor(elo / 1000), 5);
  const d = Math.min(Math.floor((elo - t * 1000) / 200), 4);
  const low = t * 1000 + d * 200;
  const isTop = t === 5 && d === 4;
  const range = isTop ? fmt(low) + "+" : fmt(low) + "–" + fmt(low + 199);
  let extra = "";
  if (d === 0 && t === 0) extra = " · Lowest Bronze";
  else if (d === 0) extra = " · Lowest " + TIERS[t];
  if (isTop) extra = " · Highest rank";
  else if (d === 4) extra = " · Highest " + TIERS[t];
  return { t, d, title: TIERS[t] + " " + ROMAN[d], info: "Rank by Elo: " + range + extra };
}

function rankIcon(t, d) {
  const textColor = (t === 1 || t === 2 || t === 3) ? "#23232a" : "#ffffff";
  const size = d === 2 ? 9 : (d === 1 || d === 3) ? 10 : 12;
  return `<svg class="bicon rank" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="url(#gR${t})"/><text x="12" y="16.2" text-anchor="middle" font-size="${size}" font-weight="800" font-family="system-ui,sans-serif" fill="${textColor}">${ROMAN[d]}</text></svg>`;
}
function rankChipHtml(p) {
  const r = rankFor(p);
  return `<span class="bchip bchip-r${r.t}" data-title="${r.title}" data-info="${r.info}">${rankIcon(r.t, r.d)}${r.title}</span>`;
}
