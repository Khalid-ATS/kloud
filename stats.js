/* ---------- Stat calculations ---------- */
const round2 = (x) => String(Math.round(x * 100) / 100);
const round1 = (x) => String(Math.round(x * 10) / 10);

// "2.5 Games Won for every 1 Game Lost"
function ratioText(won, lost, wonWord, lostWord, noneText) {
  if (won === 0 && lost === 0) return "N/A";
  if (lost === 0) return noneText;
  return `${round2(won / lost)} ${wonWord} for every 1 ${lostWord}`;
}
// "10% / 90%" (first = won, second = lost)
function pctPair(won, lost) {
  const total = won + lost;
  if (total === 0) return "0% / 0%";
  return `${round1(won / total * 100)}% / ${round1(lost / total * 100)}%`;
}
// Adds a + sign to positive numbers
function signed(x) {
  const s = round2(x);
  return x > 0 ? "+" + s : s;
}

function statSections(p) {
  const gw = n0(p.games_won), gl = n0(p.games_lost), gp = gw + gl;
  const pp = n0(p.perfect_predictions), ip = n0(p.imperfect_predictions);
  const gee = n0(p.gross_elo_earned), gel = n0(p.gross_elo_lost);
  const net = gee - gel;
  const ocp = n0(p.career_points);

  return {
    Games: [
      ["Games Played", gp],
      ["Games Won", gw],
      ["Games Lost", gl],
      ["Current Game Win Streak", n0(p.game_streak)],
      ["Highest Game Win Streak", n0(p.game_best_streak)],
      ["Game Win to Loss Ratio", ratioText(gw, gl, "Games Won", "Game Lost", "No games lost yet")],
      ["Game Win to Loss Percentage", pctPair(gw, gl)],
    ],
    Predictions: [
      ["Perfect Predictions", pp],
      ["Imperfect Predictions", ip],
      ["Predictions Made", pp + ip],
      ["Current Perfect Prediction Streak", n0(p.perfect_streak)],
      ["Highest Perfect Prediction Streak", n0(p.perfect_best_streak)],
      ["Prediction Accuracy", (pp + ip === 0 ? "0" : round1(pp / (pp + ip) * 100)) + "%"],
      ["Perfect to Imperfect Predictions Rate", ratioText(pp, ip, "Perfect", "Imperfect", "No imperfect predictions yet")],
    ],
    Elo: [
      ["Current Elo", net],
      ["Gross Elo Earned", gee],
      ["Gross Elo Lost", gel],
      ["Net Elo", net],
      ["Peak Elo", n0(p.peak_elo)],
      ["Average Elo Change Per Game", gp === 0 ? "0" : signed(net / gp)],
    ],
    Points: [
      ["Overall Career Points", ocp],
      ["Average Points Per Game", gp === 0 ? 0 : round2(ocp / gp)],
      ["Highest Single-Game Points", n0(p.highest_single_game_points)],
    ],
  };
}
