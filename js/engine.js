/* ==========================================================================
   MINI OSM - MATHEMATICAL MATCH SIMULATOR & COMMENTARY ENGINE
   ========================================================================== */

class MatchEngine {
  constructor(homeTeam, awayTeam, referee, userTeamId = null) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.referee = referee;
    this.userTeamId = userTeamId;
    this.isUserHome = userTeamId ? (homeTeam.id === userTeamId) : true;

    this.minute = 0;
    this.homeScore = 0;
    this.awayScore = 0;
    this.homeXG = 0.0;
    this.awayXG = 0.0;
    this.homeShots = 0;
    this.awayShots = 0;
    this.homeFouls = 0;
    this.awayFouls = 0;
    this.homeYellows = 0;
    this.awayYellows = 0;
    this.homeReds = 0;
    this.awayReds = 0;

    this.commentary = [];
    this.activeJokers = [];

    // Calculate base strengths
    this.homePower = this.calculateSquadPower(homeTeam) * 1.05; // Home advantage (+5%)
    this.awayPower = this.calculateSquadPower(awayTeam);

    // Apply tactic synergy / counter synergy
    this.tacticMultiplier = this.calculateTacticSynergy(homeTeam.tactic, awayTeam.tactic);

    // Dynamic modifiers
    this.homeTacticModifiers = {
      attackPower: (homeTeam.tactic.mentality / 50) * this.tacticMultiplier,
      defensePower: (100 - homeTeam.tactic.mentality + 30) / 50,
      foulRisk: this.getFoulMultiplier(homeTeam.tactic.tackling),
      cornerGoalChance: 1.0
    };

    this.awayTacticModifiers = {
      attackPower: (awayTeam.tactic.mentality / 50),
      defensePower: (100 - awayTeam.tactic.mentality + 30) / 50,
      foulRisk: this.getFoulMultiplier(awayTeam.tactic.tackling),
      cornerGoalChance: 1.0
    };
  }

  calculateSquadPower(team) {
    const starters = (team.starting11 && team.starting11.length === 11)
      ? team.starting11
      : team.squad.slice(0, 11);
    const totalRating = starters.reduce((acc, p) => acc + (p.rating * (p.morale / 100) * (p.stamina / 100)), 0);
    return totalRating / starters.length;
  }

  calculateTacticSynergy(homeTactic, awayTactic) {
    let bonus = 1.0;
    // Counter Tactic Matrix
    if (homeTactic.style === "Kaleyi Görünce Vur" && awayTactic.style === "Kanatları Kullan") {
      bonus += 0.12; // 4-5-1 Shoot on sight counters 4-3-3 Wing play
    } else if (homeTactic.style === "Kontra Atak" && homeTactic.mentality > 70) {
      bonus += 0.10;
    } else if (homeTactic.style === "Paslaşarak" && homeTactic.formation === "4-4-2") {
      bonus += 0.08;
    }
    return bonus;
  }

  getFoulMultiplier(tackling) {
    switch (tackling) {
      case "Nazik": return 0.5;
      case "Normal": return 1.0;
      case "Agresif": return 1.6;
      case "Çok Agresif": return 2.3;
      default: return 1.0;
    }
  }

  activateJoker(jokerId) {
    const joker = JOKER_CARDS.find(j => j.id === jokerId);
    if (joker && !joker.used && !joker.active) {
      joker.used = true;
      joker.active = true;
      const text = joker.apply(this, this.isUserHome);
      this.activeJokers.push({ joker, expireMinute: this.minute + joker.duration });
      this.addCommentary(this.minute, text, "joker", { badge: `⚡ ${joker.name}` });
      return true;
    }
    return false;
  }

  addCommentary(min, text, type = "normal", metadata = {}) {
    let badgeText = metadata.badge;
    if (!badgeText) {
      if (type === "goal") badgeText = "⚽ GOOOOL!";
      else if (type === "card") badgeText = "🟨 KART";
      else if (type === "joker") badgeText = "⚡ JOKER";
      else if (type === "danger") badgeText = "🔥 TEHLİKELİ ATAK";
      else if (type === "system") badgeText = "📢 BİLGİ";
      else badgeText = "📌 MAÇ ANLATIMI";
    }

    const isHighlight = (type === "goal" || type === "card" || type === "danger" || type === "joker" || type === "system");

    this.commentary.unshift({
      minute: min,
      text: text,
      type: type,
      badge: badgeText,
      isHighlight: isHighlight,
      player: metadata.player || "",
      team: metadata.team || "",
      score: `${this.homeScore} - ${this.awayScore}`
    });
  }

  // Simulate 1 minute of the match
  simulateMinute() {
    this.minute++;

    // Half-Time Announcement
    if (this.minute === 45) {
      this.addCommentary(45, `⏱️ İLK YARI SONA ERDİ! Skor: ${this.homeTeam.name} ${this.homeScore} - ${this.awayScore} ${this.awayTeam.name}`, "system", { badge: "⏱️ İLK YARI BİTTİ" });
    }

    // Check expiring jokers
    this.activeJokers = this.activeJokers.filter(aj => {
      if (this.minute >= aj.expireMinute) {
        aj.joker.active = false;
        aj.joker.revert(this, this.isUserHome);
        this.addCommentary(this.minute, `⏳ Joker Etkisi Sona Erdi: '${aj.joker.name}'`, "normal", { badge: "⏳ JOKER BİTTİ" });
        return false;
      }
      return true;
    });

    // Random roll for attack event
    const attackRoll = Math.random();

    // Home Attack Opportunity (Factoring in opponent defense power)
    const homeAttackChance = 0.068 * (this.homePower / this.awayPower) * (this.homeTacticModifiers.attackPower / this.awayTacticModifiers.defensePower);
    if (attackRoll < homeAttackChance) {
      this.simulateAttack(this.homeTeam, this.awayTeam, true);
      return;
    }

    // Away Attack Opportunity (Factoring in home defense power)
    const awayAttackChance = 0.059 * (this.awayPower / this.homePower) * (this.awayTacticModifiers.attackPower / this.homeTacticModifiers.defensePower);
    if (attackRoll > (1 - awayAttackChance)) {
      this.simulateAttack(this.awayTeam, this.homeTeam, false);
      return;
    }

    // Foul / Card roll
    const foulRoll = Math.random();
    if (foulRoll < 0.04 * this.referee.strictnessMultiplier * this.homeTacticModifiers.foulRisk) {
      this.simulateFoul(this.homeTeam, true);
    }
  }

  simulateAttack(attackingTeam, defendingTeam, isHome) {
    const starters = (attackingTeam.starting11 && attackingTeam.starting11.length === 11)
      ? attackingTeam.starting11
      : attackingTeam.squad.slice(0, 11);

    const fieldPlayers = starters.filter(p => p.pos !== "GK");
    const fws = fieldPlayers.filter(p => p.pos === "FW");
    const mfs = fieldPlayers.filter(p => p.pos === "MF");
    const dfs = fieldPlayers.filter(p => p.pos === "DF");

    // Position-weighted scorer selection (Strictly Outfield Players: FW > MF > DF)
    let attacker = null;
    const posRoll = Math.random();
    if (posRoll < 0.65 && fws.length > 0) {
      attacker = fws[Math.floor(Math.random() * fws.length)];
    } else if (posRoll < 0.93 && mfs.length > 0) {
      attacker = mfs[Math.floor(Math.random() * mfs.length)];
    } else if (dfs.length > 0) {
      attacker = dfs[Math.floor(Math.random() * dfs.length)];
    } else if (fieldPlayers.length > 0) {
      attacker = fieldPlayers[Math.floor(Math.random() * fieldPlayers.length)];
    } else {
      attacker = starters[Math.floor(Math.random() * starters.length)];
    }

    const defStarters = (defendingTeam.starting11 && defendingTeam.starting11.length === 11)
      ? defendingTeam.starting11
      : defendingTeam.squad.slice(0, 11);
    const goalkeeper = defStarters.find(p => p.pos === "GK") || defStarters[defStarters.length - 1];

    const shotQuality = Math.random();
    const eventXG = +(shotQuality * 0.35).toFixed(2);

    if (isHome) {
      this.homeShots++;
      this.homeXG = +(this.homeXG + eventXG).toFixed(2);
    } else {
      this.awayShots++;
      this.awayXG = +(this.awayXG + eventXG).toFixed(2);
    }

    // Realistic Goal Conversion Calculation (Tuned for ~2.70 average goals/match)
    const baseThreshold = isHome ? 0.175 + (eventXG * 0.46) : 0.165 + (eventXG * 0.44);
    const gkMod = goalkeeper ? (goalkeeper.rating - 70) * 0.003 : 0;
    const finalGoalThreshold = Math.max(0.08, baseThreshold - gkMod);

    if (Math.random() < finalGoalThreshold) {
      if (isHome) this.homeScore++;
      else this.awayScore++;

      // Pick assist provider (~75% chance, strictly Outfield Players)
      let assister = null;
      if (Math.random() < 0.75) {
        const potentialAssisters = fieldPlayers.filter(p => p.name !== attacker.name);
        if (potentialAssisters.length > 0) {
          const aMfs = potentialAssisters.filter(p => p.pos === "MF");
          const aFws = potentialAssisters.filter(p => p.pos === "FW");
          const aDfs = potentialAssisters.filter(p => p.pos === "DF");

          const aRoll = Math.random();
          if (aRoll < 0.65 && aMfs.length > 0) assister = aMfs[Math.floor(Math.random() * aMfs.length)];
          else if (aRoll < 0.90 && aFws.length > 0) assister = aFws[Math.floor(Math.random() * aFws.length)];
          else if (aDfs.length > 0) assister = aDfs[Math.floor(Math.random() * aDfs.length)];
          else assister = potentialAssisters[Math.floor(Math.random() * potentialAssisters.length)];
        }
      }

      // Record player stats on actual player objects
      attacker.goals = (attacker.goals || 0) + 1;
      attacker.matchGoals = (attacker.matchGoals || 0) + 1;
      if (assister) {
        assister.assists = (assister.assists || 0) + 1;
        assister.matchAssists = (assister.matchAssists || 0) + 1;
      }

      const assistText = assister ? ` (Asist: ${assister.name})` : " (Bireysel Çaba)";
      const goalMessages = [
        `⚽ GOOOOL! ${attacker.name}${assistText} ceza sahası içinden mükemmel bir vuruşla topu ağlarla buluşturdu! (${attackingTeam.name})`,
        `⚽ GOOOOL! Mükemmel organizasyon! ${attacker.name}${assistText} skoru değiştiren golü attı! (${attackingTeam.name})`,
        `⚽ GOOOOL! ${attacker.name}${assistText} ceza sahası dışından füze gibi şutla kaleciyi çaresiz bıraktı! (${attackingTeam.name})`
      ];
      const msg = goalMessages[Math.floor(Math.random() * goalMessages.length)];
      this.addCommentary(this.minute, `${msg}`, "goal", {
        badge: `⚽ GOOOOL! (${this.homeScore}-${this.awayScore})`,
        player: attacker.name,
        team: attackingTeam.name
      });
    } else if (shotQuality > 0.2) {
      // Goalkeeper Save & Dangerous Miss
      if (goalkeeper) {
        goalkeeper.saves = (goalkeeper.saves || 0) + 1;
        goalkeeper.matchSaves = (goalkeeper.matchSaves || 0) + 1;
      }
      const missMessages = [
        `🔥 BÜYÜK FIRSAT! ${attacker.name} ceza sahasında topla buluştu, sert vuruşu az farkla avuta çıktı! (xG: ${eventXG})`,
        `🧤 MÜTHİŞ KURTARIŞ! ${attacker.name}'ın köşeye giden şutunda kaleci ${goalkeeper.name} parmaklarının ucuyla kornere çeldi!`,
        `💥 DİREKTEN DÖNDÜ! ${attackingTeam.shortName} atağında ${attacker.name}'ın füzesi üst direkte patladı!`
      ];
      const msg = missMessages[Math.floor(Math.random() * missMessages.length)];
      this.addCommentary(this.minute, msg, "danger", {
        badge: "🔥 TEHLİKELİ POZİSYON",
        player: attacker.name,
        team: attackingTeam.name
      });
    } else {
      if (goalkeeper && Math.random() < 0.4) {
        goalkeeper.saves = (goalkeeper.saves || 0) + 1;
        goalkeeper.matchSaves = (goalkeeper.matchSaves || 0) + 1;
      }
      this.addCommentary(this.minute, `👟 ${attackingTeam.name} atağında ${attacker.name} şansını denedi, ancak savunma araya girdi.`, "normal", {
        badge: "👟 ATAK GİRİŞİMİ"
      });
    }
  }

  simulateFoul(team, isHome) {
    if (isHome) this.homeFouls++;
    else this.awayFouls++;

    const starters = (team.starting11 && team.starting11.length === 11)
      ? team.starting11
      : team.squad.slice(0, 11);

    const cardRoll = Math.random() * this.referee.strictnessMultiplier;
    const fieldStarters = starters.filter(p => p.pos !== "GK");
    const player = fieldStarters.length > 0 ? fieldStarters[Math.floor(Math.random() * fieldStarters.length)] : starters[0];

    if (cardRoll > 1.7) {
      if (isHome) this.homeReds++;
      else this.awayReds++;
      player.matchRed = true;
      this.addCommentary(this.minute, `🟥 KIRMIZI KART! Hakem ${this.referee.name}, ${player.name}'a yaptığı kontrolsüz ve sert müdahale nedeniyle DİREKT KIRMIZI KART gösterdi! (${team.name})`, "card", {
        badge: "🟥 KIRMIZI KART!",
        player: player.name,
        team: team.name
      });
    } else if (cardRoll > 1.15) {
      if (isHome) this.homeYellows++;
      else this.awayYellows++;
      player.matchYellow = true;
      this.addCommentary(this.minute, `🟨 SARI KART! ${player.name} yaptığı faulün ardından hakem ${this.referee.name} tarafından sarı kartla cezalandırıldı. (${team.name})`, "card", {
        badge: "🟨 SARI KART",
        player: player.name,
        team: team.name
      });
    }
  }

  calculateMatchRatings() {
    const homeStarters = (this.homeTeam.starting11 && this.homeTeam.starting11.length === 11) ? this.homeTeam.starting11 : this.homeTeam.squad.slice(0, 11);
    const awayStarters = (this.awayTeam.starting11 && this.awayTeam.starting11.length === 11) ? this.awayTeam.starting11 : this.awayTeam.squad.slice(0, 11);

    let allPlayers = [];

    const processTeam = (starters, team, goalsFor, goalsAgainst, isHome) => {
      starters.forEach(p => {
        p.matchesPlayed = (p.matchesPlayed || 0) + 1;
        let r = 6.2; // Base rating

        // Goal & Assist Bonuses
        const mGoals = p.matchGoals || 0;
        const mAssists = p.matchAssists || 0;
        const mSaves = p.matchSaves || 0;
        r += mGoals * 1.4;
        r += mAssists * 0.9;
        if (p.pos === "GK") r += mSaves * 0.35;

        // Clean sheet bonus for GK & DF
        if (goalsAgainst === 0 && (p.pos === "GK" || p.pos === "DF")) {
          r += 0.8;
        } else if (goalsAgainst > 0 && (p.pos === "GK" || p.pos === "DF")) {
          r -= (goalsAgainst * 0.2);
        }

        // Match result influence
        if (goalsFor > goalsAgainst) {
          r += 0.5 + (goalsFor - goalsAgainst) * 0.1;
        } else if (goalsFor < goalsAgainst) {
          r -= 0.3;
        } else {
          r += 0.1;
        }

        // Cards penalty
        if (p.matchYellow) r -= 0.4;
        if (p.matchRed) r -= 1.4;

        // Base player skill bonus
        r += (p.rating - 75) * 0.04;

        // Random match variability
        r += (Math.random() * 0.4 - 0.2);

        r = Math.max(5.0, Math.min(10.0, +r.toFixed(1)));
        p.lastMatchRating = r;
        p.totalRating = +((p.totalRating || 0) + r).toFixed(1);

        // Reset match-specific transient counters for next match
        delete p.matchGoals;
        delete p.matchAssists;
        delete p.matchSaves;
        delete p.matchYellow;
        delete p.matchRed;

        allPlayers.push({ player: p, team: team, rating: r, goals: mGoals, assists: mAssists, saves: mSaves });
      });
    };

    processTeam(homeStarters, this.homeTeam, this.homeScore, this.awayScore, true);
    processTeam(awayStarters, this.awayTeam, this.awayScore, this.homeScore, false);

    // Sort by rating descending to determine Man of the Match (MOTM)
    allPlayers.sort((a, b) => b.rating - a.rating);

    const best = allPlayers[0];
    if (best && best.player) {
      best.player.motmCount = (best.player.motmCount || 0) + 1;
      this.motm = best;
    }

    return this.motm;
  }
}
