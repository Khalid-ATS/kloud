const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: true },
  { key: "id", label: "ID", type: "text", required: true },
  { key: "rounds_won", label: "Rounds Won", type: "delta" },
  { key: "rounds_lost", label: "Rounds Lost", type: "delta" },
  { key: "perfect", label: "Perfect Predictions", type: "delta" },
  { key: "imperfect", label: "Imperfect Predictions", type: "delta" },
  { key: "elo_earned", label: "Gross Elo Earned", type: "delta" },
  { key: "elo_lost", label: "Gross Elo Lost", type: "delta" },
  { key: "career_points", label: "Overall Career Points", type: "delta" },
  { key: "highest", label: "Highest Single-Game Points", type: "num" },
];
