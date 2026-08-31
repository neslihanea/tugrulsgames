/* ==========================================================================
   MINI OSM - AI MANAGER ENGINE & TACTIC ADAPTER
   ========================================================================== */

class AIManager {
  static updateAITactics(team, opponentTeam, isHome) {
    if (!team || !opponentTeam) return;

    // Compare strength
    const teamPower = team.squad.reduce((a, b) => a + b.rating, 0) / team.squad.length;
    const oppPower = opponentTeam.squad.reduce((a, b) => a + b.rating, 0) / opponentTeam.squad.length;

    const powerRatio = teamPower / oppPower;

    if (powerRatio > 1.08) {
      // AI is stronger: Pick offensive tactic
      team.tactic.formation = "4-3-3";
      team.tactic.style = "Kanatları Kullan";
      team.tactic.mentality = Math.min(85, Math.floor(75 + (powerRatio * 5)));
      team.tactic.pressure = 75;
      team.tactic.tempo = 75;
    } else if (powerRatio < 0.92) {
      // AI is underdog: Pick defensive counter tactic
      team.tactic.formation = isHome ? "4-5-1" : "5-3-2";
      team.tactic.style = "Kaleyi Görünce Vur";
      team.tactic.mentality = Math.max(35, Math.floor(40 * powerRatio));
      team.tactic.pressure = 50;
      team.tactic.tempo = 65;
    } else {
      // Balanced rivalry
      team.tactic.formation = "4-4-2";
      team.tactic.style = "Paslaşarak";
      team.tactic.mentality = 60;
      team.tactic.pressure = 60;
      team.tactic.tempo = 60;
    }
  }
}
