/* ---------- Elo ranks (automatic) ---------- */
const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Obsidian"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const fmt = (x) => x.toLocaleString("en-US");

// Every division is 100 Elo wide, 5 divisions per tier:
// Bronze I 0-99, Bronze II 100-199 ... Bronze V 400-499, Silver I 500-599 ... Obsidian V 2,900+
// Rank comes from Net Elo (Gross Elo Earned - Gross Elo Lost). Below 0 counts as 0.
function rankFor(p) {
  const elo = Math.max(n0(p.gross_elo_earned) - n0(p.gross_elo_lost), 0);
  const step = Math.min(Math.floor(elo / 100), 29);   // 0 to 29 (30 divisions in total)
  const t = Math.floor(step / 5);
  const d = step % 5;
  const low = step * 100;
  const isTop = step === 29;
  const range = isTop ? fmt(low) + "+" : fmt(low) + "-" + fmt(low + 99);
  return { t, d, title: TIERS[t] + " " + ROMAN[d], info: "Rank by Elo: " + range };
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
