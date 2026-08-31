/* ==========================================================================
   MINI OSM - MANAGER JOKER CARDS SYSTEM (IN-GAME TACTICAL INTERVENTIONS)
   ========================================================================== */

const JOKER_CARDS = [
  {
    id: "press",
    name: "Aşırı Pres",
    icon: "⚡",
    desc: "Top kazanma hırsını artırır. Hücum Gücü +%35, Faul/Kart Riski +%25.",
    used: false,
    active: false,
    duration: 12, // match minutes
    apply: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower *= 1.35;
      targetMod.foulRisk *= 1.25;
      return "⚡ MENAJER JOKERİ: 'Aşırı Pres' aktif! Takım tam saha presle rakibe nefes aldırmıyor!";
    },
    revert: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower /= 1.35;
      targetMod.foulRisk /= 1.25;
    }
  },
  {
    id: "bus",
    name: "Otobüsü Çek",
    icon: "🛡️",
    desc: "Skoru korumak için tam savunma. Savunma Gücü +%45, Yenen Gol Riski -%40.",
    used: false,
    active: false,
    duration: 15,
    apply: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.defensePower *= 1.45;
      targetMod.attackPower *= 0.75;
      return "🛡️ MENAJER JOKERİ: 'Otobüsü Çek' aktif! Kendi yarı sahasına adeta etten duvar örüldü!";
    },
    revert: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.defensePower /= 1.45;
      targetMod.attackPower /= 0.75;
    }
  },
  {
    id: "last_gasp",
    name: "Son Dakika Golcüsü",
    icon: "⚽",
    desc: "Stoperler ceza sahasına çıkar. Hücum Gücü +%30, Gol Şansı +%40.",
    used: false,
    active: false,
    duration: 10,
    apply: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower *= 1.30;
      targetMod.cornerGoalChance = 1.5;
      return "⚽ MENAJER JOKERİ: 'Son Dakika Golcüsü'! Bütün hatlar rakip ceza sahasına yüklendi!";
    },
    revert: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower /= 1.30;
      targetMod.cornerGoalChance = 1.0;
    }
  },
  {
    id: "tactic_shift",
    name: "Taktiksel Risk",
    icon: "🔥",
    desc: "Tüm hatlarla hücuma kalk. Hücum Gücü +%45, Savunma Zafiyeti +%20.",
    used: false,
    active: false,
    duration: 12,
    apply: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower *= 1.45;
      targetMod.defensePower *= 0.80;
      return "🔥 MENAJER JOKERİ: 'Taktiksel Risk'! Tüm riskler alındı, galibiyet için baskı zirvede!";
    },
    revert: (engine, isUserHome) => {
      const targetMod = isUserHome ? engine.homeTacticModifiers : engine.awayTacticModifiers;
      targetMod.attackPower /= 1.45;
      targetMod.defensePower /= 0.80;
    }
  }
];

function resetJokerCards() {
  JOKER_CARDS.forEach(j => {
    j.used = false;
    j.active = false;
  });
}
