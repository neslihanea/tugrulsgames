/* ==========================================================================
   MINI OSM - APPLICATION CONTROLLER & UI RENDERER (FULL ROSTER & BENCH SUPPORT)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  let userTeam = null;
  let currentMatchday = 1;
  let currentSeasonNumber = 1;
  let leagueTable = [];
  let fixtures = [];
  let currentMatchEngine = null;
  let matchInterval = null;
  let selectedReferee = REFEREES[1]; // Default Halil Umut Meler
  let viewedRoundIndex = 0;

  /* ==========================================================================
     TRANSFER MARKET STATE & CONSTANTS
     ========================================================================== */
  let transferMode = "buy"; // 'buy' or 'sell'
  let transferPosFilter = "ALL";
  let transferNatFilter = "ALL";
  let transferSearchQuery = "";
  let transferSortBy = "rating_desc"; // 'rating_desc', 'rating_asc', 'age_asc', 'age_desc', 'val_desc', 'val_asc'

  const SORT_BADGES = {
    rating_desc: "(⭐ GEN ↓)",
    rating_asc: "(⭐ GEN ↑)",
    age_asc: "(👶 Yaş ↑)",
    age_desc: "(🧓 Yaş ↓)",
    val_desc: "(💰 Değer ↓)",
    val_asc: "(🏷️ Değer ↑)"
  };

  const FLAG_TO_COUNTRY_NAME = {
    '🇹🇷': 'Türkiye',
    '🇩🇪': 'Almanya',
    '🇦🇱': 'Arnavutluk',
    '🇦🇴': 'Angola',
    '🇦🇷': 'Arjantin',
    '🇦🇹': 'Avusturya',
    '🇧🇦': 'Bosna-Hersek',
    '🇧🇪': 'Belçika',
    '🇧🇬': 'Bulgaristan',
    '🇧🇯': 'Benin',
    '🇧🇷': 'Brezilya',
    '🇨🇦': 'Kanada',
    '🇨🇩': 'Demokratik Kongo',
    '🇨🇭': 'İsviçre',
    '🇨🇮': 'Fildişi Sahili',
    '🇨🇱': 'Şili',
    '🇨🇲': 'Kamerun',
    '🇨🇴': 'Kolombiya',
    '🇨🇻': 'Yeşil Burun Adaları',
    '🇨🇿': 'Çekya',
    '🇩🇰': 'Danimarka',
    '🇩🇿': 'Cezayir',
    '🇪🇨': 'Ekvador',
    '🇪🇬': 'Mısır',
    '🇪🇸': 'İspanya',
    '🇫🇮': 'Finlandiya',
    '🇫🇷': 'Fransa',
    '🇬🇦': 'Gabon',
    '🇬🇧': 'Büyük Britanya',
    '🇬🇭': 'Gana',
    '🇬🇳': 'Gine',
    '🇬🇷': 'Yunanistan',
    '🇬🇼': 'Gine-Bissau',
    '🇭🇷': 'Hırvatistan',
    '🇭🇺': 'Macaristan',
    '🇮🇪': 'İrlanda',
    '🇮🇱': 'İsrail',
    '🇮🇸': 'İzlanda',
    '🇮🇹': 'İtalya',
    '🇯🇲': 'Jamaika',
    '🇯🇵': 'Japonya',
    '🇰🇪': 'Kenya',
    '🇰🇷': 'Güney Kore',
    '🇱🇺': 'Lüksemburg',
    '🇱🇾': 'Libya',
    '🇲🇦': 'Fas',
    '🇲🇩': 'Moldova',
    '🇲🇪': 'Karadağ',
    '🇲🇰': 'Kuzey Makedonya',
    '🇲🇱': 'Mali',
    '🇲🇽': 'Meksika',
    '🇲🇿': 'Mozambik',
    '🇳🇬': 'Nijerya',
    '🇳🇱': 'Hollanda',
    '🇳🇴': 'Norveç',
    '🇳🇿': 'Yeni Zelanda',
    '🇵🇦': 'Panama',
    '🇵🇪': 'Peru',
    '🇵🇱': 'Polonya',
    '🇵🇹': 'Portekiz',
    '🇵🇾': 'Paraguay',
    '🇷🇴': 'Romanya',
    '🇷🇸': 'Sırbistan',
    '🇷🇺': 'Rusya',
    '🇸🇪': 'İsveç',
    '🇸🇮': 'Slovenya',
    '🇸🇰': 'Slovakya',
    '🇸🇳': 'Senegal',
    '🇸🇷': 'Surinam',
    '🇹🇬': 'Togo',
    '🇹🇹': 'Trinidad ve Tobago',
    '🇺🇦': 'Ukrayna',
    '🇺🇸': 'ABD',
    '🇺🇾': 'Uruguay',
    '🇺🇿': 'Özbekistan',
    '🇻🇪': 'Venezuela',
    '🇽🇰': 'Kosova',
    '🇿🇲': 'Zambiya',
    '🇿🇼': 'Zimbabve',
    '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'İngiltere',
    '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'İskoçya',
    '🏴󠁧󠁢󠁷󠁬󠁳󠁿': 'Galler',
    '🏳️': 'Diğer'
  };

  initApp();

  function initApp() {
    // Store initial baseline transfer budget for each team
    TEAMS_DATA.forEach(t => {
      if (t.initialBudget === undefined) {
        t.initialBudget = t.budget;
      }
    });

    setupTabNavigation();
    renderTeamSelection();
    setupTacticControls();
    setupMatchControls();
    setupStatsSubTabs();
    setupTransferControls();
    setupTrainingControls();
    setupSeasonControls();
    setupFixtureControls();
    generateLeagueSchedule();
    renderStandings();
    renderFixtures();
  }

  function setupTabNavigation() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetView = tab.dataset.view;

        if (!userTeam && targetView !== "view-teams") {
          alert("Lütfen önce ligden takımınızı seçin!");
          return;
        }

        document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".view-content").forEach(v => v.classList.remove("active"));

        tab.classList.add("active");
        const targetElem = document.getElementById(targetView);
        if (targetElem) targetElem.classList.add("active");

        if (targetView === "view-tactics") renderTacticsPitch();
        if (targetView === "view-transfer") renderTransferMarket();
        if (targetView === "view-training") renderTrainingCenter();
        if (targetView === "view-standings") {
          renderStandings();
          renderFixtures();
        }
      });
    });
  }

  function applyTeamTheme(team) {
    if (!team || !team.theme) return;
    const root = document.documentElement;
    root.style.setProperty("--team-primary", team.theme.primary);
    root.style.setProperty("--team-secondary", team.theme.secondary);
    root.style.setProperty("--team-primary-glow", team.theme.primaryGlow);
    root.style.setProperty("--team-secondary-glow", team.theme.secondaryGlow);
    root.style.setProperty("--team-gradient", team.theme.gradient);
    root.style.setProperty("--team-header-glow", team.theme.headerGlow);
    root.style.setProperty("--team-bg-mesh", team.theme.bgMesh);
  }

  function renderTeamSelection() {
    const grid = document.getElementById("team-selection-grid");
    if (!grid) return;

    grid.innerHTML = TEAMS_DATA.map(team => {
      const avgRating = Math.round(team.squad.reduce((a, b) => a + b.rating, 0) / team.squad.length);
      const primaryColor = team.theme ? team.theme.primary : team.color;
      const primaryGlow = team.theme ? team.theme.primaryGlow : 'rgba(255,255,255,0.2)';
      const gradient = team.theme ? team.theme.gradient : 'linear-gradient(135deg, #10b981, #059669)';

      return `
        <div class="glass-card team-select-card" style="--card-team-color: ${primaryColor}; --card-team-glow: ${primaryGlow};">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div class="team-card-logo-wrap" style="border: 1.5px solid rgba(255,255,255,0.1); box-shadow: 0 0 16px ${primaryGlow};">
                <img src="${team.logo}" alt="${team.name}" class="team-card-logo" onerror="this.outerHTML='<span style=\\'font-size:32px;\\'>${team.badge}</span>'"/>
              </div>
              <span class="badge-pill badge-target">🎯 Hedef: ${team.target}.lik</span>
            </div>
            <h3 style="font-size:21px; font-weight:800; margin-bottom:4px; letter-spacing:-0.3px;">${team.name}</h3>
            <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
              💰 Bütçe: <strong style="color:var(--text-main);">€${team.budget}M</strong> &nbsp;|&nbsp; 👥 Kadro: <strong style="color:var(--text-main);">${team.squad.length}</strong>
            </p>
            
            <div style="margin-bottom:18px;">
              <div class="team-card-badge-rating">
                <span>⚡ Takım Gücü</span>
                <span style="color:${primaryColor}; font-weight:800;">${avgRating} OVR</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${avgRating}%; background: ${gradient}; box-shadow: 0 0 10px ${primaryGlow};"></div>
              </div>
            </div>
          </div>

          <button class="btn btn-primary select-team-btn" data-id="${team.id}" style="width:100%; background:${gradient}; box-shadow: 0 4px 16px ${primaryGlow};">
            ${team.name} ile Başla ✨
          </button>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".select-team-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const teamId = e.currentTarget.dataset.id;
        userTeam = TEAMS_DATA.find(t => t.id === teamId);

        applyTeamTheme(userTeam);

        const teamBadgeElem = document.getElementById("user-team-badge");
        teamBadgeElem.className = "badge-pill user-team-active";
        teamBadgeElem.innerHTML = `<img src="${userTeam.logo}" alt="${userTeam.name}" class="team-header-logo" onerror="this.outerHTML='<span>${userTeam.badge}</span>'"/> <span>${userTeam.name}</span>`;

        document.getElementById("user-team-target").innerText = `Hedef: ${userTeam.target}.lik`;
        document.getElementById("user-team-info-box").style.display = "flex";

        if (!loadSquadFromLocalStorage(userTeam)) {
          autoBuildStarting11(userTeam, true);
        }
        document.querySelector('.nav-tab[data-view="view-tactics"]').click();
        showToast(`👑 ${userTeam.name} renkleri ve teması uygulandı!`);
      });
    });
  }

  function setupTacticControls() {
    const formationSelect = document.getElementById("tactic-formation");
    const styleSelect = document.getElementById("tactic-style");
    const pressureSlider = document.getElementById("tactic-pressure");
    const mentalitySlider = document.getElementById("tactic-mentality");
    const tempoSlider = document.getElementById("tactic-tempo");
    const tacklingSelect = document.getElementById("tactic-tackling");
    const refereeSelect = document.getElementById("referee-select");

    if (refereeSelect) {
      refereeSelect.innerHTML = REFEREES.map((ref, idx) => `
        <option value="${idx}">${ref.name} (${ref.strictness} Hakem)</option>
      `).join("");
      refereeSelect.addEventListener("change", (e) => {
        selectedReferee = REFEREES[e.target.value];
        document.getElementById("referee-info").innerText = selectedReferee.desc;
      });
    }

    const updateSliderVal = (slider, displayId) => {
      slider.addEventListener("input", (e) => {
        document.getElementById(displayId).innerText = `%${e.target.value}`;
        if (userTeam) {
          if (slider === pressureSlider) userTeam.tactic.pressure = +e.target.value;
          if (slider === mentalitySlider) userTeam.tactic.mentality = +e.target.value;
          if (slider === tempoSlider) userTeam.tactic.tempo = +e.target.value;
        }
      });
    };

    if (pressureSlider) updateSliderVal(pressureSlider, "pressure-val");
    if (mentalitySlider) updateSliderVal(mentalitySlider, "mentality-val");
    if (tempoSlider) updateSliderVal(tempoSlider, "tempo-val");

    if (formationSelect) {
      formationSelect.addEventListener("change", (e) => {
        if (userTeam) {
          userTeam.tactic.formation = e.target.value;
          // Force rebuild the starting 11 to fit the newly selected formation slots
          autoBuildStarting11(userTeam, true);
          selectedSwapPlayer = null;
          renderTacticsPitch();
          showToast(`📋 Diziliş ${e.target.value} olarak ayarlandı!`);
        }
      });
    }

    if (styleSelect) {
      styleSelect.addEventListener("change", (e) => {
        if (userTeam) userTeam.tactic.style = e.target.value;
      });
    }

    if (tacklingSelect) {
      tacklingSelect.addEventListener("change", (e) => {
        if (userTeam) userTeam.tactic.tackling = e.target.value;
      });
    }

    const autoPickBtn = document.getElementById("auto-pick-11-btn");
    if (autoPickBtn) {
      autoPickBtn.addEventListener("click", () => {
        if (!userTeam) return;
        autoBuildStarting11(userTeam, true);
        selectedSwapPlayer = null;
        renderTacticsPitch();
        showToast("⚡ En güçlü İlk 11 dizildi!");
      });
    }

    const saveSquadBtn = document.getElementById("save-squad-btn");
    if (saveSquadBtn) {
      saveSquadBtn.addEventListener("click", () => {
        if (!userTeam) return;
        saveSquadToLocalStorage();
      });
    }
  }

  function syncTacticControls() {
    if (!userTeam) return;
    const formationSelect = document.getElementById("tactic-formation");
    const styleSelect = document.getElementById("tactic-style");
    const pressureSlider = document.getElementById("tactic-pressure");
    const mentalitySlider = document.getElementById("tactic-mentality");
    const tempoSlider = document.getElementById("tactic-tempo");
    const tacklingSelect = document.getElementById("tactic-tackling");

    if (formationSelect && userTeam.tactic.formation) {
      formationSelect.value = userTeam.tactic.formation;
    }
    if (styleSelect && userTeam.tactic.style) {
      styleSelect.value = userTeam.tactic.style;
    }
    if (tacklingSelect && userTeam.tactic.tackling) {
      tacklingSelect.value = userTeam.tactic.tackling;
    }
    if (pressureSlider && userTeam.tactic.pressure) {
      pressureSlider.value = userTeam.tactic.pressure;
      const valElem = document.getElementById("pressure-val");
      if (valElem) valElem.innerText = `%${userTeam.tactic.pressure}`;
    }
    if (mentalitySlider && userTeam.tactic.mentality) {
      mentalitySlider.value = userTeam.tactic.mentality;
      const valElem = document.getElementById("mentality-val");
      if (valElem) valElem.innerText = `%${userTeam.tactic.mentality}`;
    }
    if (tempoSlider && userTeam.tactic.tempo) {
      tempoSlider.value = userTeam.tactic.tempo;
      const valElem = document.getElementById("tempo-val");
      if (valElem) valElem.innerText = `%${userTeam.tactic.tempo}`;
    }
  }

  function saveSquadToLocalStorage() {
    if (!userTeam) return;
    const dataToSave = {
      teamId: userTeam.id,
      starting11Names: userTeam.starting11.map(p => p.name),
      tactic: userTeam.tactic
    };
    localStorage.setItem("mini_osm_saved_squad_" + userTeam.id, JSON.stringify(dataToSave));
    showToast("💾 Kadro ve Taktikler Başarıyla Kaydedildi!");
  }

  function loadSquadFromLocalStorage(team) {
    if (!team) return false;
    try {
      const savedStr = localStorage.getItem("mini_osm_saved_squad_" + team.id);
      if (!savedStr) return false;
      const saved = JSON.parse(savedStr);
      if (saved && saved.starting11Names && saved.starting11Names.length === 11) {
        const restored = [];
        saved.starting11Names.forEach(name => {
          const found = team.squad.find(p => p.name === name);
          if (found) restored.push(found);
        });
        if (restored.length === 11) {
          team.starting11 = restored;
          if (saved.tactic) team.tactic = { ...team.tactic, ...saved.tactic };
          return true;
        }
      }
    } catch (e) {
      console.warn("Save load error:", e);
    }
    return false;
  }

  function showToast(message) {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(30px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  let selectedSwapPlayer = null; // { source: 'pitch'|'bench', player: Object, pitchIndex?: number }

  function parseFormation(formationStr) {
    if (!formationStr) return { defCount: 4, midCount: 3, fwdCount: 3 };
    const parts = formationStr.split("-").map(Number);
    if (parts.length === 3) {
      return { defCount: parts[0], midCount: parts[1], fwdCount: parts[2] };
    } else if (parts.length === 4) {
      // e.g. 4-2-3-1 -> def: 4, mid: 2+3=5, fwd: 1
      return { defCount: parts[0], midCount: parts[1] + parts[2], fwdCount: parts[3] };
    } else if (parts.length === 5) {
      return { defCount: parts[0], midCount: parts[1] + parts[2] + parts[3], fwdCount: parts[4] };
    }
    return { defCount: 4, midCount: 3, fwdCount: 3 };
  }

  function autoBuildStarting11(team, forceRebuild = false) {
    if (!team) return;
    if (!forceRebuild && loadSquadFromLocalStorage(team)) return;

    const formation = team.tactic.formation || "4-3-3";
    const { defCount, midCount, fwdCount } = parseFormation(formation);

    const sortedSquad = [...team.squad].sort((a, b) => b.rating - a.rating);

    const fws = sortedSquad.filter(p => p.pos === "FW").slice(0, fwdCount);
    const mfs = sortedSquad.filter(p => p.pos === "MF").slice(0, midCount);
    const dfs = sortedSquad.filter(p => p.pos === "DF").slice(0, defCount);
    const gks = sortedSquad.filter(p => p.pos === "GK").slice(0, 1);

    const pickedSet = new Set([...fws, ...mfs, ...dfs, ...gks].map(p => p.name));

    // Fill remaining if any position lacked enough players in squad
    let current11 = [...fws, ...mfs, ...dfs, ...gks];
    if (current11.length < 11) {
      const remaining = sortedSquad.filter(p => !pickedSet.has(p.name));
      current11.push(...remaining.slice(0, 11 - current11.length));
    }

    team.starting11 = current11;
  }

  function renderTacticsPitch() {
    if (!userTeam) return;

    syncTacticControls();

    if (!userTeam.starting11 || userTeam.starting11.length !== 11) {
      autoBuildStarting11(userTeam, true);
    }

    const pitchLayer = document.getElementById("pitch-players-layer");
    const benchContainer = document.getElementById("substitutes-bench-container");
    const bannerContainer = document.getElementById("swap-banner-container");
    if (!pitchLayer) return;

    const formation = userTeam.tactic.formation || "4-3-3";
    const { defCount, midCount, fwdCount } = parseFormation(formation);

    // Group starting 11 by tactical formation slots
    const starters = userTeam.starting11;

    const fws = starters.slice(0, fwdCount);
    const mfs = starters.slice(fwdCount, fwdCount + midCount);
    const dfs = starters.slice(fwdCount + midCount, fwdCount + midCount + defCount);
    const gks = starters.slice(fwdCount + midCount + defCount, 11);

    // Swap Banner
    if (bannerContainer) {
      if (selectedSwapPlayer) {
        bannerContainer.innerHTML = `
          <div class="swap-instruction-banner">
            <span>🔄 <strong>${selectedSwapPlayer.player.name}</strong> (${selectedSwapPlayer.player.pos} - ${selectedSwapPlayer.player.rating}) seçildi. Yerine koymak için sahadan veya yedek kulübesinden bir oyuncuya tıklayın.</span>
            <button class="btn btn-secondary" id="cancel-swap-btn" style="padding:2px 8px; font-size:11px;">❌ İptal</button>
          </div>
        `;
        document.getElementById("cancel-swap-btn")?.addEventListener("click", () => {
          selectedSwapPlayer = null;
          renderTacticsPitch();
        });
      } else {
        bannerContainer.innerHTML = "";
      }
    }

    // Render Pitch Starting 11
    let globalIndex = 0;
    pitchLayer.innerHTML = `
      <div class="pitch-row">
        ${fws.map(p => {
      const idx = globalIndex++;
      return createInteractivePlayerNode(p, "fw", idx, "FW");
    }).join("")}
      </div>
      <div class="pitch-row">
        ${mfs.map(p => {
      const idx = globalIndex++;
      return createInteractivePlayerNode(p, "mf", idx, "MF");
    }).join("")}
      </div>
      <div class="pitch-row">
        ${dfs.map(p => {
      const idx = globalIndex++;
      return createInteractivePlayerNode(p, "df", idx, "DF");
    }).join("")}
      </div>
      <div class="pitch-row">
        ${gks.map(p => {
      const idx = globalIndex++;
      return createInteractivePlayerNode(p, "gk", idx, "GK");
    }).join("")}
      </div>
    `;

    // Pitch Player Node Click & Hover Events
    pitchLayer.querySelectorAll(".player-card-node").forEach(node => {
      node.addEventListener("click", (e) => {
        const pitchIndex = +e.currentTarget.dataset.index;
        handlePitchPlayerClick(pitchIndex);
      });

      // Tooltip hover
      node.addEventListener("mouseenter", (e) => {
        const pitchIndex = +e.currentTarget.dataset.index;
        const player = userTeam.starting11[pitchIndex];
        if (player) showPlayerTooltip(e, player);
      });
      node.addEventListener("mouseleave", hidePlayerTooltip);
      node.addEventListener("mousemove", updatePlayerTooltipPosition);
    });

    // Render Bench (Yedekler)
    if (benchContainer) {
      const starterSet = new Set(userTeam.starting11.map(p => p.name));
      const benchPlayers = userTeam.squad.filter(p => !starterSet.has(p.name));

      benchContainer.innerHTML = benchPlayers.map(p => {
        const isSelected = selectedSwapPlayer && selectedSwapPlayer.source === "bench" && selectedSwapPlayer.player.name === p.name;
        const photoStyle = p.photo ? `background-image: url('${p.photo}');` : '';
        return `
          <div class="bench-player-card ${isSelected ? 'selected-for-swap' : ''}" data-name="${p.name}">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="player-badge-circle ${p.pos.toLowerCase()}" style="width:32px; height:32px; font-size:11px; ${photoStyle}">
                ${p.photo ? `<span class="rating-overlay" style="font-size:8px;">${p.rating}</span>` : p.rating}
              </span>
              <div>
                <div style="font-size:13px; font-weight:700;">${p.name}</div>
                <div style="font-size:10px; color:var(--text-muted);">${p.pos} | Yaş: ${p.age}</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-swap-bench" style="padding:4px 8px; font-size:11px;">
              ${isSelected ? 'Seçildi' : '🔄 Değiştir'}
            </button>
          </div>
        `;
      }).join("");

      benchContainer.querySelectorAll(".bench-player-card").forEach(node => {
        node.addEventListener("click", (e) => {
          const pName = e.currentTarget.dataset.name;
          const benchPlayer = benchPlayers.find(p => p.name === pName);
          if (benchPlayer) handleBenchPlayerClick(benchPlayer);
        });

        // Tooltip hover
        node.addEventListener("mouseenter", (e) => {
          const pName = e.currentTarget.dataset.name;
          const benchPlayer = benchPlayers.find(p => p.name === pName);
          if (benchPlayer) showPlayerTooltip(e, benchPlayer);
        });
        node.addEventListener("mouseleave", hidePlayerTooltip);
        node.addEventListener("mousemove", updatePlayerTooltipPosition);
      });
    }
  }

  function showPlayerTooltip(e, player) {
    const tooltip = document.getElementById("player-tooltip");
    if (!tooltip) return;

    document.getElementById("tt-name").innerText = player.name;
    document.getElementById("tt-nat").innerText = player.nat || "🏳️";
    document.getElementById("tt-age").innerText = player.age || "-";
    document.getElementById("tt-val").innerText = player.val || "-";

    tooltip.classList.add("active");
    updatePlayerTooltipPosition(e);
  }

  function hidePlayerTooltip() {
    const tooltip = document.getElementById("player-tooltip");
    if (tooltip) tooltip.classList.remove("active");
  }

  function updatePlayerTooltipPosition(e) {
    const tooltip = document.getElementById("player-tooltip");
    if (!tooltip) return;
    const x = e.clientX;
    const y = e.clientY - 15; // slightly above cursor
    tooltip.style.left = x + 'px';
    tooltip.style.top = y - tooltip.offsetHeight + 'px';
  }

  function handlePitchPlayerClick(pitchIndex) {
    const clickedPlayer = userTeam.starting11[pitchIndex];

    if (!selectedSwapPlayer) {
      // Select this pitch player for swap
      selectedSwapPlayer = { source: "pitch", pitchIndex, player: clickedPlayer };
    } else if (selectedSwapPlayer.source === "pitch") {
      if (selectedSwapPlayer.pitchIndex === pitchIndex) {
        // Unselect if clicked same
        selectedSwapPlayer = null;
      } else {
        // Swap 2 pitch players
        const temp = userTeam.starting11[selectedSwapPlayer.pitchIndex];
        userTeam.starting11[selectedSwapPlayer.pitchIndex] = userTeam.starting11[pitchIndex];
        userTeam.starting11[pitchIndex] = temp;
        selectedSwapPlayer = null;
      }
    } else if (selectedSwapPlayer.source === "bench") {
      // Swap bench player into this pitch slot
      const benchPlayer = selectedSwapPlayer.player;
      userTeam.starting11[pitchIndex] = benchPlayer;
      selectedSwapPlayer = null;
    }

    renderTacticsPitch();
  }

  function handleBenchPlayerClick(benchPlayer) {
    if (!selectedSwapPlayer) {
      selectedSwapPlayer = { source: "bench", player: benchPlayer };
    } else if (selectedSwapPlayer.source === "pitch") {
      // Swap selected pitch player with this bench player
      userTeam.starting11[selectedSwapPlayer.pitchIndex] = benchPlayer;
      selectedSwapPlayer = null;
    } else if (selectedSwapPlayer.source === "bench") {
      if (selectedSwapPlayer.player.name === benchPlayer.name) {
        selectedSwapPlayer = null;
      } else {
        selectedSwapPlayer = { source: "bench", player: benchPlayer };
      }
    }

    renderTacticsPitch();
  }

  function createInteractivePlayerNode(player, posClass, index, slotPos) {
    const isSelected = selectedSwapPlayer && selectedSwapPlayer.source === "pitch" && selectedSwapPlayer.pitchIndex === index;
    const isPosMismatch = player.pos !== slotPos && !(player.pos === "FW" && slotPos === "FW");
    const photoStyle = player.photo ? `background-image: url('${player.photo}');` : '';

    return `
      <div class="player-card-node ${isSelected ? 'selected-for-swap' : ''}" data-index="${index}" title="İlk 11'i değiştirmek için tıklayın">
        <div class="player-badge-circle ${posClass}" style="${photoStyle}">
          ${player.photo ? `<span class="rating-overlay">${player.rating}</span>` : player.rating}
        </div>
        <div class="player-node-name">
          ${player.name}
          ${isPosMismatch ? `<small style="color:var(--accent-gold);" title="Mevki dışı oynuyor">⚠️</small>` : ''}
        </div>
      </div>
    `;
  }

  function generateLeagueSchedule() {
    fixtures = [];
    leagueTable = TEAMS_DATA.map(t => ({
      team: t,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    }));

    // Dynamic Round Robin Schedule for all teams in TEAMS_DATA
    const teams = [...TEAMS_DATA];
    if (teams.length % 2 !== 0) teams.push(null); // Dummy bye if odd
    const n = teams.length;
    const roundsCount = n - 1;
    const half = n / 2;

    const firstHalf = [];
    const rotating = [...teams];

    for (let r = 0; r < roundsCount; r++) {
      const roundMatches = [];
      for (let i = 0; i < half; i++) {
        const t1 = rotating[i];
        const t2 = rotating[n - 1 - i];
        if (t1 && t2) {
          if (r % 2 === 1) {
            roundMatches.push({ home: t2, away: t1, played: false, score: null, hScore: 0, aScore: 0 });
          } else {
            roundMatches.push({ home: t1, away: t2, played: false, score: null, hScore: 0, aScore: 0 });
          }
        }
      }
      firstHalf.push(roundMatches);

      // Rotate keeping first element fixed
      const fixed = rotating[0];
      const rest = rotating.slice(1);
      rest.unshift(rest.pop());
      rotating.splice(0, rotating.length, fixed, ...rest);
    }

    // Second Half (Reverse fixtures)
    const secondHalf = firstHalf.map(round =>
      round.map(m => ({
        home: m.away,
        away: m.home,
        played: false,
        score: null,
        hScore: 0,
        aScore: 0
      }))
    );

    fixtures = [...firstHalf, ...secondHalf];
  }

  function setupFixtureControls() {
    const prevBtn = document.getElementById("prev-round-btn");
    const nextBtn = document.getElementById("next-round-btn");

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (viewedRoundIndex > 0) {
          viewedRoundIndex--;
          renderFixtures();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (viewedRoundIndex < fixtures.length - 1) {
          viewedRoundIndex++;
          renderFixtures();
        }
      };
    }
  }

  function renderFixtures() {
    const container = document.getElementById("fixtures-list-container");
    const title = document.getElementById("current-round-title");
    const prevBtn = document.getElementById("prev-round-btn");
    const nextBtn = document.getElementById("next-round-btn");

    if (!container || fixtures.length === 0) return;

    if (title) title.innerText = `${viewedRoundIndex + 1}. Hafta`;
    if (prevBtn) prevBtn.disabled = (viewedRoundIndex === 0);
    if (nextBtn) nextBtn.disabled = (viewedRoundIndex === fixtures.length - 1);

    const currentRoundMatches = fixtures[viewedRoundIndex] || [];

    container.innerHTML = currentRoundMatches.map(match => {
      const isUserMatch = userTeam && (match.home.id === userTeam.id || match.away.id === userTeam.id);
      const isPlayed = match.played;

      return `
        <div class="fixture-match-card ${isUserMatch ? 'user-match' : ''}">
          <div class="fixture-team">
            <img src="${match.home.logo}" alt="${match.home.name}" onerror="this.outerHTML='<span>${match.home.badge}</span>'"/>
            <span>${match.home.shortName}</span>
          </div>

          <div class="fixture-score-box">
            ${isPlayed
          ? `<span class="fixture-score-text">${match.score}</span><span class="fixture-status-label" style="color:var(--accent-green);">BİTTİ</span>`
          : `<span class="fixture-vs-text">VS</span><span class="fixture-status-label">${isUserMatch ? 'SİZİN MAÇ' : 'BEKLİYOR'}</span>`
        }
          </div>

          <div class="fixture-team away">
            <span>${match.away.shortName}</span>
            <img src="${match.away.logo}" alt="${match.away.name}" onerror="this.outerHTML='<span>${match.away.badge}</span>'"/>
          </div>
        </div>
      `;
    }).join("");
  }

  function simulateOtherRoundMatches(roundIndex) {
    if (!fixtures[roundIndex]) return;

    fixtures[roundIndex].forEach(match => {
      if (!match.played) {
        // AI vs AI full match simulation
        const engine = new MatchEngine(match.home, match.away, selectedReferee, null);
        while (engine.minute < 90) {
          engine.simulateMinute();
        }
        const motm = engine.calculateMatchRatings();

        match.played = true;
        match.hScore = engine.homeScore;
        match.aScore = engine.awayScore;
        match.score = `${engine.homeScore}-${engine.awayScore}`;
        match.motm = motm;

        updateLeagueTable(match.home, match.away, engine.homeScore, engine.awayScore);
      }
    });
  }

  let matchSpeed = 380; // default 2x speed in ms
  let isMatchPaused = false;
  let commentaryFilter = "all"; // 'all' or 'highlights'
  let nextFixtureToPlay = null;

  function setupMatchControls() {
    const pauseBtn = document.getElementById("match-pause-btn");
    const pauseIcon = document.getElementById("pause-btn-icon");
    const pauseText = document.getElementById("pause-btn-text");
    const speedBtns = document.querySelectorAll(".speed-btn[data-speed]");
    const instantBtn = document.getElementById("instant-finish-btn");
    const filterTabs = document.querySelectorAll(".commentary-filter-group .filter-tab");

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        if (!currentMatchEngine || currentMatchEngine.minute >= 90) return;
        isMatchPaused = !isMatchPaused;
        if (pauseIcon) pauseIcon.innerText = isMatchPaused ? "▶️" : "⏸️";
        if (pauseText) pauseText.innerText = isMatchPaused ? "Devam Et" : "Durdur";
        pauseBtn.classList.toggle("btn-primary", isMatchPaused);
        if (!isMatchPaused) scheduleNextMinute();
      });
    }

    speedBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        speedBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        matchSpeed = +e.currentTarget.dataset.speed;
      });
    });

    if (instantBtn) {
      instantBtn.addEventListener("click", () => {
        if (!currentMatchEngine || currentMatchEngine.minute >= 90) return;
        if (matchInterval) clearTimeout(matchInterval);
        while (currentMatchEngine.minute < 90) {
          currentMatchEngine.simulateMinute();
        }
        updateMatchUI();
        finishMatch(nextFixtureToPlay);
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        filterTabs.forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        commentaryFilter = e.currentTarget.dataset.filter;
        updateMatchUI();
      });
    });
  }

  const startMatchBtn = document.getElementById("start-match-btn");
  if (startMatchBtn) {
    startMatchBtn.addEventListener("click", () => {
      if (!userTeam) {
        alert("Lütfen önce takımınızı seçin!");
        return;
      }
      setupNextMatch();
    });
  }

  function setupNextMatch() {
    let nextFixture = null;
    for (let round of fixtures) {
      const match = round.find(m => !m.played && (m.home.id === userTeam.id || m.away.id === userTeam.id));
      if (match) {
        nextFixture = match;
        break;
      }
    }

    if (!nextFixture) {
      launchSeasonFinaleCeremony();
      return;
    }

    nextFixtureToPlay = nextFixture;
    const opponent = nextFixture.home.id === userTeam.id ? nextFixture.away : nextFixture.home;
    const isUserHome = nextFixture.home.id === userTeam.id;

    if (!userTeam.starting11 || userTeam.starting11.length !== 11) autoBuildStarting11(userTeam, true);
    if (!opponent.starting11 || opponent.starting11.length !== 11) autoBuildStarting11(opponent, true);

    AIManager.updateAITactics(opponent, userTeam, !isUserHome);

    resetJokerCards();
    currentMatchEngine = new MatchEngine(nextFixture.home, nextFixture.away, selectedReferee, userTeam.id);
    isMatchPaused = false;

    // Reset UI Elements
    const pauseIcon = document.getElementById("pause-btn-icon");
    const pauseText = document.getElementById("pause-btn-text");
    if (pauseIcon) pauseIcon.innerText = "⏸️";
    if (pauseText) pauseText.innerText = "Durdur";
    document.getElementById("match-pause-btn")?.classList.remove("btn-primary");

    const homeBadge = document.getElementById("match-home-badge");
    const awayBadge = document.getElementById("match-away-badge");

    document.getElementById("match-home-name").innerText = nextFixture.home.name;
    homeBadge.innerHTML = `<img src="${nextFixture.home.logo}" alt="${nextFixture.home.name}" onerror="this.outerHTML='${nextFixture.home.badge}'"/>`;
    homeBadge.style.borderColor = nextFixture.home.theme ? nextFixture.home.theme.primary : nextFixture.home.color;
    homeBadge.style.boxShadow = `0 0 18px ${nextFixture.home.theme ? nextFixture.home.theme.primaryGlow : 'rgba(255,255,255,0.2)'}`;

    document.getElementById("match-away-name").innerText = nextFixture.away.name;
    awayBadge.innerHTML = `<img src="${nextFixture.away.logo}" alt="${nextFixture.away.name}" onerror="this.outerHTML='${nextFixture.away.badge}'"/>`;
    awayBadge.style.borderColor = nextFixture.away.theme ? nextFixture.away.theme.primary : nextFixture.away.color;
    awayBadge.style.boxShadow = `0 0 18px ${nextFixture.away.theme ? nextFixture.away.theme.primaryGlow : 'rgba(255,255,255,0.2)'}`;

    document.getElementById("match-score-display").innerText = "0 - 0";

    const timerBadge = document.getElementById("match-timer-badge");
    timerBadge.innerText = "00'";
    timerBadge.classList.remove("finished");

    document.getElementById("match-result-status-container").innerHTML = "";
    document.getElementById("match-finish-banner-container").innerHTML = "";
    document.getElementById("live-indicator")?.classList.remove("finished");

    const liveControls = document.getElementById("match-live-controls");
    const finishedControls = document.getElementById("match-finished-controls");
    if (liveControls) liveControls.style.display = "flex";
    if (finishedControls) finishedControls.style.display = "none";

    document.getElementById("match-timeline-feed").innerHTML = `<span style="font-size:11px; color:var(--text-muted);">Zaman Çizelgesi</span>`;

    currentMatchEngine.addCommentary(0, `📢 Hakem ${selectedReferee.name} sahada son kontrollerini yaptı ve başlama düdüğünü çaldı! Maç başladı!`, "system", { badge: "📢 MAÇ BAŞLADI" });

    renderJokerCards();
    updateMatchUI();
    document.querySelector('.nav-tab[data-view="view-match"]').click();

    if (matchInterval) clearTimeout(matchInterval);
    scheduleNextMinute();
  }

  function scheduleNextMinute() {
    if (isMatchPaused || !currentMatchEngine) return;

    if (currentMatchEngine.minute >= 90) {
      finishMatch(nextFixtureToPlay);
      return;
    }

    const prevHomeScore = currentMatchEngine.homeScore;
    const prevAwayScore = currentMatchEngine.awayScore;
    const prevHomeReds = currentMatchEngine.homeReds;
    const prevAwayReds = currentMatchEngine.awayReds;

    currentMatchEngine.simulateMinute();
    updateMatchUI();

    // Check if a major event occurred (goal or red card)
    const isGoal = (currentMatchEngine.homeScore > prevHomeScore || currentMatchEngine.awayScore > prevAwayScore);
    const isRedCard = (currentMatchEngine.homeReds > prevHomeReds || currentMatchEngine.awayReds > prevAwayReds);

    // If major event occurred, give a brief 700ms extra pause so player can absorb and read the moment
    const delay = (isGoal || isRedCard) ? (matchSpeed + 700) : matchSpeed;

    matchInterval = setTimeout(() => {
      scheduleNextMinute();
    }, delay);
  }

  function updateMatchUI() {
    if (!currentMatchEngine) return;

    document.getElementById("match-timer-badge").innerText = `${currentMatchEngine.minute}'`;
    document.getElementById("match-score-display").innerText = `${currentMatchEngine.homeScore} - ${currentMatchEngine.awayScore}`;

    document.getElementById("home-xg-val").innerText = currentMatchEngine.homeXG;
    document.getElementById("away-xg-val").innerText = currentMatchEngine.awayXG;
    document.getElementById("home-shots-val").innerText = currentMatchEngine.homeShots;
    document.getElementById("away-shots-val").innerText = currentMatchEngine.awayShots;

    // Render Timeline feed
    const timeline = document.getElementById("match-timeline-feed");
    if (timeline) {
      const timelineItems = currentMatchEngine.commentary.filter(c => c.type === "goal" || c.type === "card" || c.type === "joker");
      if (timelineItems.length > 0) {
        timeline.innerHTML = timelineItems.map(item => `
          <span class="timeline-event-badge ${item.type}">
            ${item.badge.split(' ')[0]} ${item.minute}' ${item.player ? item.player.split(' ').pop() : ''}
          </span>
        `).join("");
      }
    }

    // Render Commentary stream with filtering
    const stream = document.getElementById("commentary-stream");
    if (stream && currentMatchEngine.commentary.length > 0) {
      let filteredList = currentMatchEngine.commentary;
      if (commentaryFilter === "highlights") {
        filteredList = currentMatchEngine.commentary.filter(c => c.isHighlight);
      }

      if (filteredList.length === 0) {
        stream.innerHTML = `<div class="commentary-card system"><div class="commentary-card-body">Henüz filtrelenmiş bir önemli an bulunmuyor.</div></div>`;
      } else {
        stream.innerHTML = filteredList.map(item => `
          <div class="commentary-card ${item.type}">
            <div class="commentary-card-header">
              <span class="commentary-card-badge">${item.badge}</span>
              <span class="commentary-time" style="font-size:12px;">${item.minute}'</span>
            </div>
            <div class="commentary-card-body">
              ${item.text}
            </div>
          </div>
        `).join("");
      }
    }

    renderJokerCards();
  }

  function renderJokerCards() {
    const grid = document.getElementById("joker-cards-grid");
    if (!grid) return;

    grid.innerHTML = JOKER_CARDS.map(joker => {
      let statusHtml = "";
      let activeClass = "";

      if (joker.active && currentMatchEngine) {
        const activeEntry = currentMatchEngine.activeJokers.find(aj => aj.joker.id === joker.id);
        const rem = activeEntry ? Math.max(0, activeEntry.expireMinute - currentMatchEngine.minute) : 0;
        activeClass = "active";
        statusHtml = `<div style="font-size:11px; font-weight:800; color:var(--accent-green); margin-top:6px; background:rgba(16,185,129,0.15); padding:2px 6px; border-radius:4px; border:1px solid rgba(16,185,129,0.3);">🟢 AKTİF (${rem}' dk)</div>`;
      } else if (joker.used) {
        activeClass = "disabled";
        statusHtml = `<div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-top:6px;">Kullanıldı</div>`;
      }

      return `
        <div class="joker-card ${activeClass}" data-id="${joker.id}">
          <div class="joker-icon">${joker.icon}</div>
          <div class="joker-title">${joker.name}</div>
          <div class="joker-desc">${joker.desc}</div>
          ${statusHtml}
        </div>
      `;
    }).join("");

    document.querySelectorAll(".joker-card").forEach(card => {
      card.addEventListener("click", (e) => {
        const jokerId = e.currentTarget.dataset.id;
        const joker = JOKER_CARDS.find(j => j.id === jokerId);
        if (!joker) return;

        if (joker.active) {
          showToast(`⚠️ '${joker.name}' jokeri zaten şu an devrede!`);
          return;
        }
        if (joker.used) {
          showToast(`⚠️ '${joker.name}' jokeri bu maçta daha önce kullanıldı!`);
          return;
        }

        if (currentMatchEngine && currentMatchEngine.activateJoker(jokerId)) {
          showToast(`⚡ '${joker.name}' jokeri devreye sokuldu!`);
          updateMatchUI();
        }
      });
    });
  }

  function finishMatch(fixture) {
    if (!fixture) return;
    fixture.played = true;
    fixture.score = `${currentMatchEngine.homeScore}-${currentMatchEngine.awayScore}`;

    // Calculate match ratings and Man of the Match (MOTM)
    const motm = currentMatchEngine.calculateMatchRatings();
    fixture.motm = motm;

    // Insert MOTM Card into Commentary Stream
    if (motm && motm.player) {
      const motmBg = motm.player.photo ? `background-image:url('${motm.player.photo}')` : '';
      currentMatchEngine.addCommentary(90, `🌟 MAÇIN ADAMI SEÇİLDİ: ${motm.player.name} (${motm.team.name}) - Maç Puanı: ⭐ ${motm.rating}`, "system", {
        badge: "🌟 MAÇIN ADAMI"
      });

      const commentaryBox = document.getElementById("match-commentary-box");
      if (commentaryBox) {
        const motmCardHtml = `
          <div class="motm-card" style="margin-bottom:14px; padding:14px 18px; background:linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.2)); border:1.5px solid var(--accent-gold); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:space-between; box-shadow:0 0 20px rgba(245, 158, 11, 0.3); animation:fadeIn 0.4s ease-out;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:48px; height:48px; border-radius:50%; ${motmBg}; background-size:cover; background-position:center; border:2px solid var(--accent-gold); position:relative; flex-shrink:0; background-color:var(--bg-secondary);">
                <span style="position:absolute; bottom:-4px; right:-4px; font-size:12px;">🌟</span>
              </div>
              <div>
                <div style="font-size:11px; font-weight:800; color:var(--accent-gold); text-transform:uppercase; letter-spacing:0.5px;">🌟 MAÇIN ADAMI (MAN OF THE MATCH)</div>
                <div style="font-size:16px; font-weight:800; color:var(--text-main);">${motm.player.name} <span style="font-weight:600; font-size:12px; color:var(--text-muted);">(${motm.team.name})</span></div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                  ${motm.goals > 0 ? `⚽ ${motm.goals} Gol ` : ''}${motm.assists > 0 ? `🅰️ ${motm.assists} Asist ` : ''}• Süper Maç Performansı
                </div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:24px; font-weight:900; color:var(--accent-gold);">⭐ ${motm.rating}</div>
              <div style="font-size:11px; color:var(--text-muted);">Maç Puanı</div>
            </div>
          </div>
        `;
        commentaryBox.insertAdjacentHTML("afterbegin", motmCardHtml);
      }
    }

    // Timer badge styling
    const timerBadge = document.getElementById("match-timer-badge");
    if (timerBadge) {
      timerBadge.innerText = "🏁 90' MS (BİTTİ)";
      timerBadge.classList.add("finished");
    }

    // Live indicator status
    document.getElementById("live-indicator")?.classList.add("finished");

    // Determine user match outcome
    const isUserHome = (fixture.home.id === userTeam.id);
    const userGoals = isUserHome ? currentMatchEngine.homeScore : currentMatchEngine.awayScore;
    const oppGoals = isUserHome ? currentMatchEngine.awayScore : currentMatchEngine.homeScore;
    const oppTeam = isUserHome ? fixture.away : fixture.home;

    let statusType = "draw";
    let statusText = "🤝 BERABERLİK (+1 PUAN)";
    let bannerIcon = "🤝";
    let bannerTitle = "MÜCADELE BERABERE SONUÇLANDI!";
    let bannerDesc = `${userTeam.name} ve ${oppTeam.name} sahadan 1'er puanla ayrıldı.`;

    if (userGoals > oppGoals) {
      statusType = "win";
      statusText = "🏆 GALİBİYET (+3 PUAN)";
      bannerIcon = "🎉";
      bannerTitle = `TEBRİKLER! ${userTeam.name} KAZANDI!`;
      bannerDesc = `Harika bir performans! 3 puanı hanenize yazdırdınız ve şampiyonluk yarışında avantaj yakaladınız.`;
    } else if (userGoals < oppGoals) {
      statusType = "loss";
      statusText = "❌ MAĞLUBİYET (0 PUAN)";
      bannerIcon = "💔";
      bannerTitle = "MAÇ MAĞLUBİYETLE SONUÇLANDI";
      bannerDesc = `${oppTeam.name} karşısında puan kaybı yaşandı. Taktiklerinizi gözden geçirerek sonraki maça hazırlanın.`;
    }

    // Render result pill below scoreboard digits
    const statusContainer = document.getElementById("match-result-status-container");
    if (statusContainer) {
      statusContainer.innerHTML = `<div class="match-result-status-pill ${statusType}">${statusText}</div>`;
    }

    // Render Match Finish Banner
    const bannerContainer = document.getElementById("match-finish-banner-container");
    if (bannerContainer) {
      bannerContainer.innerHTML = `
        <div class="match-finish-banner">
          <div class="finish-banner-content">
            <div class="finish-banner-icon">${bannerIcon}</div>
            <div>
              <div class="finish-banner-title">${bannerTitle}</div>
              <div class="finish-banner-desc">${bannerDesc}</div>
            </div>
          </div>
          <div class="finish-banner-actions">
            <button class="btn btn-secondary" id="banner-tactics-btn">📋 Kadro & Taktikler</button>
            <button class="btn btn-secondary" id="banner-standings-btn">🏆 Puan Durumu</button>
            <button class="btn btn-primary" id="banner-next-match-btn">⚡ Sıradaki Maç</button>
          </div>
        </div>
      `;

      document.getElementById("banner-tactics-btn")?.addEventListener("click", () => {
        document.querySelector('.nav-tab[data-view="view-tactics"]').click();
      });
      document.getElementById("banner-standings-btn")?.addEventListener("click", () => {
        document.querySelector('.nav-tab[data-view="view-standings"]').click();
      });
      document.getElementById("banner-next-match-btn")?.addEventListener("click", () => {
        setupNextMatch();
      });
    }

    // Switch Match Control Bar to Finished State
    const liveControls = document.getElementById("match-live-controls");
    const finishedControls = document.getElementById("match-finished-controls");
    if (liveControls) liveControls.style.display = "none";
    if (finishedControls) {
      finishedControls.style.display = "flex";
      finishedControls.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge-pill" style="color:var(--accent-gold); font-weight:800; border-color:var(--accent-gold);">🏁 MAÇ TAMAMLANDI</span>
          <button class="btn btn-secondary" id="quick-standings-btn" style="padding:6px 12px; font-size:12px;">🏆 Puan Durumu</button>
          <button class="btn btn-primary" id="quick-next-match-btn" style="padding:6px 14px; font-size:12px;">⚡ Sıradaki Maçı Oyna</button>
        </div>
      `;

      document.getElementById("quick-standings-btn")?.addEventListener("click", () => {
        document.querySelector('.nav-tab[data-view="view-standings"]').click();
      });
      document.getElementById("quick-next-match-btn")?.addEventListener("click", () => {
        setupNextMatch();
      });
    }

    currentMatchEngine.addCommentary(90, `🏁 Hakem ${selectedReferee.name} maçın son düdüğünü çaldı! Karşılaşma ${fixture.score} skoruyla tamamlandı.`, "system", { badge: "🏁 90' MAÇ SONA ERDİ" });
    updateMatchUI();

    updateLeagueTable(fixture.home, fixture.away, currentMatchEngine.homeScore, currentMatchEngine.awayScore);

    // Simulate other AI matches of this round and update league table
    const roundIdx = fixtures.findIndex(round => round.some(m => m === fixture));
    if (roundIdx !== -1) {
      simulateOtherRoundMatches(roundIdx);
      viewedRoundIndex = roundIdx;
    }

    // Automatically advance active training progress for user's team
    advanceAllTrainingProgress(35);

    renderStandings();
    renderFixtures();

    showToast(`🏁 Maç Sona Erdi! Sonuç: ${fixture.score} (${statusText.split(' ')[1]})`);

    // Check if season is completed
    const remainingUserMatches = fixtures.flat().filter(m => !m.played && (m.home.id === userTeam.id || m.away.id === userTeam.id));
    if (remainingUserMatches.length === 0) {
      setTimeout(() => {
        launchSeasonFinaleCeremony();
      }, 1200);
    }
  }

  function updateLeagueTable(home, away, hScore, aScore) {
    const hRow = leagueTable.find(r => r.team.id === home.id);
    const aRow = leagueTable.find(r => r.team.id === away.id);

    if (!hRow || !aRow) return;

    hRow.played++;
    aRow.played++;
    hRow.gf += hScore;
    hRow.ga += aScore;
    aRow.gf += aScore;
    aRow.ga += hScore;
    hRow.gd = hRow.gf - hRow.ga;
    aRow.gd = aRow.gf - aRow.ga;

    if (hScore > aScore) {
      hRow.won++;
      hRow.pts += 3;
      aRow.lost++;
    } else if (aScore > hScore) {
      aRow.won++;
      aRow.pts += 3;
      hRow.lost++;
    } else {
      hRow.drawn++;
      aRow.drawn++;
      hRow.pts += 1;
      aRow.pts += 1;
    }

    leagueTable.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  function renderStandings() {
    const tbody = document.getElementById("standings-table-body");
    if (!tbody) return;

    // Only show season finale actions when the season is actually finished
    const isSeasonFinished = fixtures.length > 0 && fixtures.flat().filter(m => !m.played && (userTeam ? (m.home.id === userTeam.id || m.away.id === userTeam.id) : true)).length === 0;
    const seasonBanner = document.getElementById("standings-season-ended-banner");
    if (seasonBanner) {
      seasonBanner.style.display = isSeasonFinished ? "flex" : "none";
    }

    tbody.innerHTML = leagueTable.map((row, index) => {
      const isUser = userTeam && row.team.id === userTeam.id;
      return `
        <tr class="${isUser ? 'user-row' : ''}">
          <td style="font-weight:800; color: ${index === 0 ? 'var(--accent-gold)' : 'var(--text-muted)'}">${index + 1}</td>
          <td style="font-weight:700; display:flex; align-items:center; gap:10px;">
            <img src="${row.team.logo}" alt="${row.team.name}" class="table-team-logo" onerror="this.outerHTML='<span>${row.team.badge}</span>'"/>
            <span>${row.team.name}</span>
            ${isUser ? '<span class="badge-pill" style="font-size:10px; padding:2px 8px; background:var(--team-gradient); color:#ffffff; font-weight:800; border:none; box-shadow:0 0 10px var(--team-primary-glow);">SİZ</span>' : ''}
          </td>
          <td>${row.played}</td>
          <td>${row.won}</td>
          <td>${row.drawn}</td>
          <td>${row.lost}</td>
          <td>${row.gf}:${row.ga}</td>
          <td style="font-weight:700;">${row.gd > 0 ? '+' + row.gd : row.gd}</td>
          <td style="font-weight:900; color:${isUser ? 'var(--team-primary)' : 'var(--text-main)'}; font-size:15px;">${row.pts}</td>
        </tr>
      `;
    }).join("");
  }

  function setupStatsSubTabs() {
    const tabs = document.querySelectorAll(".stats-sub-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        tabs.forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const tabType = e.currentTarget.dataset.tab;
        const tableWrapper = document.getElementById("stats-table-wrapper");
        const leaderboardWrapper = document.getElementById("stats-leaderboard-wrapper");

        if (tabType === "table") {
          if (tableWrapper) tableWrapper.style.display = "block";
          if (leaderboardWrapper) leaderboardWrapper.style.display = "none";
          renderStandings();
        } else {
          if (tableWrapper) tableWrapper.style.display = "none";
          if (leaderboardWrapper) leaderboardWrapper.style.display = "flex";
          renderLeagueStatistics(tabType);
        }
      });
    });
  }

  function renderLeagueStatistics(tabType) {
    const container = document.getElementById("stats-leaderboard-wrapper");
    if (!container) return;

    // Collect all players across all teams
    let playerList = [];
    TEAMS_DATA.forEach(team => {
      team.squad.forEach(player => {
        playerList.push({
          player: player,
          team: team,
          goals: player.goals || 0,
          assists: player.assists || 0,
          saves: player.saves || 0,
          motm: player.motmCount || 0,
          avgRating: player.matchesPlayed > 0 ? (player.totalRating / player.matchesPlayed).toFixed(1) : "0.0"
        });
      });
    });

    let titleText = "";
    let statLabel = "";

    if (tabType === "goals") {
      titleText = "⚽ GOL KRALLIĞI";
      statLabel = "Gol";
      playerList.sort((a, b) => b.goals - a.goals || b.player.rating - a.player.rating);
    } else if (tabType === "assists") {
      titleText = "🅰️ ASİST KRALLIĞI";
      statLabel = "Asist";
      playerList.sort((a, b) => b.assists - a.assists || b.player.rating - a.player.rating);
    } else if (tabType === "saves") {
      titleText = "🧤 EN ÇOK KURTARIŞ YAPAN KALECİLER";
      statLabel = "Kurtarış";
      playerList = playerList.filter(p => p.player.pos === "GK");
      playerList.sort((a, b) => b.saves - a.saves || b.player.rating - a.player.rating);
    } else if (tabType === "motm") {
      titleText = "🌟 MAÇIN ADAMI KRALLIĞI (MOTM)";
      statLabel = "Kez MOTM";
      playerList.sort((a, b) => b.motm - a.motm || b.avgRating - a.avgRating);
    }

    const top10 = playerList.slice(0, 10);

    let html = `
      <div style="font-size:14px; font-weight:800; color:var(--accent-gold); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <span>${titleText} (Top 10)</span>
        <span style="font-size:11px; color:var(--text-muted);">Süper Lig Sezon Verileri</span>
      </div>
    `;

    const isTopEmpty = top10.length === 0 ||
      (tabType === "goals" && top10[0].goals === 0) ||
      (tabType === "assists" && top10[0].assists === 0) ||
      (tabType === "saves" && top10[0].saves === 0) ||
      (tabType === "motm" && top10[0].motm === 0);

    if (isTopEmpty) {
      html += `
        <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13.5px; background:rgba(255,255,255,0.02); border-radius:var(--radius-md);">
          ⏳ Henüz ligde yeterli maç oynanmadı. Maçları oynadıkça krallık verileri güncellenecektir!
        </div>
      `;
    } else {
      html += top10.map((item, index) => {
        let rankBadge = `${index + 1}.`;
        if (index === 0) rankBadge = "🥇 1.";
        else if (index === 1) rankBadge = "🥈 2.";
        else if (index === 2) rankBadge = "🥉 3.";

        const valScore = tabType === "goals" ? item.goals : (tabType === "assists" ? item.assists : (tabType === "saves" ? item.saves : item.motm));
        const avatarBg = item.player.photo ? `background-image:url('${item.player.photo}')` : '';

        return `
          <div class="leaderboard-row">
            <div class="leaderboard-rank" style="color: ${index === 0 ? 'var(--accent-gold)' : (index < 3 ? '#ffffff' : 'var(--text-muted)')};">
              ${rankBadge}
            </div>
            <div class="leaderboard-player-info">
              <div class="leaderboard-avatar" style="${avatarBg}"></div>
              <div>
                <div style="font-weight:800; font-size:14px; color:var(--text-main);">
                  ${item.player.name} <span class="badge-pill" style="font-size:10px; padding:1px 6px;">${item.player.pos}</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); display:flex; align-items:center; gap:6px; margin-top:2px;">
                  <img src="${item.team.logo}" alt="${item.team.name}" class="team-header-logo" onerror="this.outerHTML='<span>${item.team.badge}</span>'"/>
                  <span>${item.team.name}</span>
                  • <span>⭐ ${item.avgRating} Ortalama Puan</span>
                </div>
              </div>
            </div>
            <div class="leaderboard-score">
              ${valScore} <span style="font-size:11px; font-weight:600; color:var(--text-muted);">${statLabel}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    container.innerHTML = html;
  }

  /* ==========================================================================
     TRANSFER MARKET CONTROLLER
     ========================================================================== */
  function parseValToFloat(vStr) {
    if (!vStr || vStr === "-") return 1.0;
    let str = String(vStr).replace("€", "").trim().toUpperCase();
    if (str.includes("M")) return parseFloat(str.replace("M", "")) || 1.0;
    if (str.includes("K")) return (parseFloat(str.replace("K", "")) || 1000) / 1000;
    return parseFloat(str) || 1.0;
  }

  function sortTransferPlayers(list, getPlayerFn) {
    list.sort((a, b) => {
      const pA = getPlayerFn ? getPlayerFn(a) : a;
      const pB = getPlayerFn ? getPlayerFn(b) : b;
      const valA = parseValToFloat(pA.val);
      const valB = parseValToFloat(pB.val);

      switch (transferSortBy) {
        case "rating_desc":
          return pB.rating - pA.rating || valB - valA;
        case "rating_asc":
          return pA.rating - pB.rating || valA - valB;
        case "age_asc":
          return pA.age - pB.age || pB.rating - pA.rating;
        case "age_desc":
          return pB.age - pA.age || pB.rating - pA.rating;
        case "val_desc":
          return valB - valA || pB.rating - pA.rating;
        case "val_asc":
          return valA - valB || pB.rating - pA.rating;
        default:
          return pB.rating - pA.rating;
      }
    });
  }

  function setupTransferControls() {
    // Mode switch (buy vs sell)
    const modeBtns = document.querySelectorAll(".transfer-mode-btn");
    modeBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        modeBtns.forEach(b => {
          b.classList.remove("active");
          b.classList.remove("btn-primary");
          b.classList.add("btn-secondary");
        });
        e.currentTarget.classList.add("active");
        e.currentTarget.classList.remove("btn-secondary");
        e.currentTarget.classList.add("btn-primary");
        transferMode = e.currentTarget.dataset.mode;
        renderTransferMarket();
      });
    });

    // Pos filter
    const posBtns = document.querySelectorAll(".transfer-pos-filter");
    posBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        posBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        transferPosFilter = e.currentTarget.dataset.pos;
        renderTransferMarket();
      });
    });

    // Search input
    const searchInput = document.getElementById("transfer-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        transferSearchQuery = e.target.value.toLowerCase().trim();
        renderTransferMarket();
      });
    }

    // Sort dropdown toggle
    const sortToggleBtn = document.getElementById("transfer-sort-toggle-btn");
    const sortMenu = document.getElementById("transfer-sort-menu");
    const natToggleBtn = document.getElementById("transfer-nat-toggle-btn");
    const natMenu = document.getElementById("transfer-nat-menu");

    if (sortToggleBtn && sortMenu) {
      sortToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (natMenu) natMenu.style.display = "none";
        const isOpen = sortMenu.style.display === "block";
        sortMenu.style.display = isOpen ? "none" : "block";
      });

      const sortOptions = sortMenu.querySelectorAll(".transfer-sort-option");
      sortOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          transferSortBy = e.currentTarget.dataset.sort;

          sortOptions.forEach(o => {
            o.classList.remove("active");
            const check = o.querySelector(".sort-check");
            if (check) check.style.display = "none";
          });

          e.currentTarget.classList.add("active");
          const activeCheck = e.currentTarget.querySelector(".sort-check");
          if (activeCheck) activeCheck.style.display = "inline";

          const badgeElem = document.getElementById("transfer-sort-active-badge");
          if (badgeElem && SORT_BADGES[transferSortBy]) {
            badgeElem.innerText = SORT_BADGES[transferSortBy];
          }

          sortMenu.style.display = "none";
          renderTransferMarket();
        });
      });
    }

    // Country dropdown initialization and event handlers
    const natContainer = document.getElementById("transfer-nat-options-container");
    if (natContainer) {
      // Gather all unique flags
      const flagsSet = new Set();
      if (typeof TEAMS_DATA !== "undefined") {
        TEAMS_DATA.forEach(t => t.squad && t.squad.forEach(p => p.nat && flagsSet.add(p.nat)));
      }
      Object.keys(FLAG_TO_COUNTRY_NAME).forEach(f => flagsSet.add(f));

      const countriesList = Array.from(flagsSet).map(flag => ({
        flag: flag,
        name: FLAG_TO_COUNTRY_NAME[flag] || flag
      }));

      // Alphabetically sort by Turkish country name (A to Z)
      countriesList.sort((a, b) => a.name.localeCompare(b.name, "tr", { sensitivity: "base" }));

      let optionsHtml = `
        <button class="transfer-nat-option ${transferNatFilter === 'ALL' ? 'active' : ''}" data-nat="ALL">
          <span>🌍 Tümü (Tüm Ülkeler)</span>
          <span class="nat-check" style="${transferNatFilter === 'ALL' ? '' : 'display:none;'}">✓</span>
        </button>
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;"></div>
      `;

      countriesList.forEach(c => {
        const isSelected = transferNatFilter === c.flag;
        optionsHtml += `
          <button class="transfer-nat-option ${isSelected ? 'active' : ''}" data-nat="${c.flag}">
            <span>${c.flag} ${c.name}</span>
            <span class="nat-check" style="${isSelected ? '' : 'display:none;'}">✓</span>
          </button>
        `;
      });

      natContainer.innerHTML = optionsHtml;

      const natOptions = natContainer.querySelectorAll(".transfer-nat-option");
      natOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          transferNatFilter = e.currentTarget.dataset.nat;

          natOptions.forEach(o => {
            o.classList.remove("active");
            const check = o.querySelector(".nat-check");
            if (check) check.style.display = "none";
          });

          e.currentTarget.classList.add("active");
          const activeCheck = e.currentTarget.querySelector(".nat-check");
          if (activeCheck) activeCheck.style.display = "inline";

          const badgeElem = document.getElementById("transfer-nat-active-badge");
          if (badgeElem) {
            if (transferNatFilter === "ALL") {
              badgeElem.innerText = "(Tümü)";
            } else {
              const countryName = FLAG_TO_COUNTRY_NAME[transferNatFilter] || transferNatFilter;
              badgeElem.innerText = `(${transferNatFilter} ${countryName})`;
            }
          }

          if (natMenu) natMenu.style.display = "none";
          renderTransferMarket();
        });
      });
    }

    if (natToggleBtn && natMenu) {
      natToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sortMenu) sortMenu.style.display = "none";
        const isOpen = natMenu.style.display === "block";
        natMenu.style.display = isOpen ? "none" : "block";
      });
    }

    // Close menus on outside click
    document.addEventListener("click", (e) => {
      if (sortMenu && !sortMenu.contains(e.target) && e.target !== sortToggleBtn && !sortToggleBtn?.contains(e.target)) {
        sortMenu.style.display = "none";
      }
      if (natMenu && !natMenu.contains(e.target) && e.target !== natToggleBtn && !natToggleBtn?.contains(e.target)) {
        natMenu.style.display = "none";
      }
    });
  }

  function renderTransferMarket() {
    if (!userTeam) return;

    // Update budget display
    const budgetDisplay = document.getElementById("transfer-user-budget-display");
    if (budgetDisplay) {
      budgetDisplay.innerText = `€${userTeam.budget.toFixed(1)}M`;
    }

    const grid = document.getElementById("transfer-players-grid");
    if (!grid) return;

    if (transferMode === "buy") {
      renderBuyMarket(grid);
    } else {
      renderSellMarket(grid);
    }
  }

  function renderBuyMarket(grid) {
    let availableList = [];

    // 1. Süper Lig Teams
    TEAMS_DATA.forEach(team => {
      if (userTeam && team.id === userTeam.id) return; // skip user's team
      team.squad.forEach(player => {
        availableList.push({
          player: player,
          sellerTeam: team
        });
      });
    });

    // 2. European Club Squads (Barcelona, Real Madrid, Atletico, AC Milan, Tottenham, Man City, Man United, Chelsea, Arsenal)
    const europeanTeams = [
      typeof BARCELONA_TEAM !== "undefined" ? BARCELONA_TEAM : null,
      typeof REAL_MADRID_TEAM !== "undefined" ? REAL_MADRID_TEAM : null,
      typeof ATLETICO_MADRID_TEAM !== "undefined" ? ATLETICO_MADRID_TEAM : null,
      typeof AC_MILAN_TEAM !== "undefined" ? AC_MILAN_TEAM : null,
      typeof TOTTENHAM_TEAM !== "undefined" ? TOTTENHAM_TEAM : null,
      typeof MAN_CITY_TEAM !== "undefined" ? MAN_CITY_TEAM : null,
      typeof MAN_UNITED_TEAM !== "undefined" ? MAN_UNITED_TEAM : null,
      typeof CHELSEA_TEAM !== "undefined" ? CHELSEA_TEAM : null,
      typeof ARSENAL_TEAM !== "undefined" ? ARSENAL_TEAM : null,
      typeof INTER_MILAN_TEAM !== "undefined" ? INTER_MILAN_TEAM : null,
      typeof AS_ROMA_TEAM !== "undefined" ? AS_ROMA_TEAM : null,
      typeof ATHLETIC_BILBAO_TEAM !== "undefined" ? ATHLETIC_BILBAO_TEAM : null,
      typeof SPORTING_TEAM !== "undefined" ? SPORTING_TEAM : null,
      typeof BENFICA_TEAM !== "undefined" ? BENFICA_TEAM : null,
      typeof PORTO_TEAM !== "undefined" ? PORTO_TEAM : null,
      typeof LIVERPOOL_TEAM !== "undefined" ? LIVERPOOL_TEAM : null,
      typeof ASTON_VILLA_TEAM !== "undefined" ? ASTON_VILLA_TEAM : null,
      typeof NEWCASTLE_TEAM !== "undefined" ? NEWCASTLE_TEAM : null,
      typeof BRIGHTON_TEAM !== "undefined" ? BRIGHTON_TEAM : null,
      typeof LEEDS_TEAM !== "undefined" ? LEEDS_TEAM : null,
      typeof REAL_SOCIEDAD_TEAM !== "undefined" ? REAL_SOCIEDAD_TEAM : null,
      typeof NAPOLI_TEAM !== "undefined" ? NAPOLI_TEAM : null,
      typeof JUVENTUS_TEAM !== "undefined" ? JUVENTUS_TEAM : null,
      typeof LAZIO_TEAM !== "undefined" ? LAZIO_TEAM : null,
      typeof ATALANTA_TEAM !== "undefined" ? ATALANTA_TEAM : null,
      typeof COMO_TEAM !== "undefined" ? COMO_TEAM : null,
      typeof BAYERN_TEAM !== "undefined" ? BAYERN_TEAM : null,
      typeof BVB_TEAM !== "undefined" ? BVB_TEAM : null,
      typeof LEVERKUSEN_TEAM !== "undefined" ? LEVERKUSEN_TEAM : null,
      typeof FIORENTINA_TEAM !== "undefined" ? FIORENTINA_TEAM : null,
      typeof UDINESE_TEAM !== "undefined" ? UDINESE_TEAM : null,
      typeof TORINO_TEAM !== "undefined" ? TORINO_TEAM : null,
      typeof CAGLIARI_TEAM !== "undefined" ? CAGLIARI_TEAM : null,
      typeof BOLOGNA_TEAM !== "undefined" ? BOLOGNA_TEAM : null,
      typeof CELTA_VIGO_TEAM !== "undefined" ? CELTA_VIGO_TEAM : null,
      typeof VILLARREAL_TEAM !== "undefined" ? VILLARREAL_TEAM : null,
      typeof GETAFE_TEAM !== "undefined" ? GETAFE_TEAM : null,
      typeof RAYO_TEAM !== "undefined" ? RAYO_TEAM : null,
      typeof OSASUNA_TEAM !== "undefined" ? OSASUNA_TEAM : null,
      typeof EVERTON_TEAM !== "undefined" ? EVERTON_TEAM : null,
      typeof BRENTFORD_TEAM !== "undefined" ? BRENTFORD_TEAM : null,
      typeof HULL_TEAM !== "undefined" ? HULL_TEAM : null,
      typeof FOREST_TEAM !== "undefined" ? FOREST_TEAM : null,
      typeof PALACE_TEAM !== "undefined" ? PALACE_TEAM : null,
      typeof FULHAM_TEAM !== "undefined" ? FULHAM_TEAM : null,
      typeof BOURNEMOUTH_TEAM !== "undefined" ? BOURNEMOUTH_TEAM : null,
      typeof PSG_TEAM !== "undefined" ? PSG_TEAM : null,
      typeof MARSEILLE_TEAM !== "undefined" ? MARSEILLE_TEAM : null,
      typeof LYON_TEAM !== "undefined" ? LYON_TEAM : null,
      typeof LILLE_TEAM !== "undefined" ? LILLE_TEAM : null,
      typeof MONACO_TEAM !== "undefined" ? MONACO_TEAM : null,
      typeof LENS_TEAM !== "undefined" ? LENS_TEAM : null,
      typeof RENNES_TEAM !== "undefined" ? RENNES_TEAM : null,
      typeof STRASBOURG_TEAM !== "undefined" ? STRASBOURG_TEAM : null,
      typeof BRAGA_TEAM !== "undefined" ? BRAGA_TEAM : null,
    ].filter(Boolean);

    europeanTeams.forEach(euroTeam => {
      if (!userTeam || userTeam.id !== euroTeam.id) {
        euroTeam.squad.forEach(player => {
          availableList.push({ player, sellerTeam: euroTeam });
        });
      }
    });

    // Filter by position
    if (transferPosFilter !== "ALL") {
      availableList = availableList.filter(item => item.player.pos === transferPosFilter);
    }

    // Filter by nationality
    if (transferNatFilter !== "ALL") {
      availableList = availableList.filter(item => item.player.nat === transferNatFilter);
    }

    // Filter by search query
    if (transferSearchQuery) {
      availableList = availableList.filter(item => {
        const natName = FLAG_TO_COUNTRY_NAME[item.player.nat] || "";
        return (
          item.player.name.toLowerCase().includes(transferSearchQuery) ||
          item.sellerTeam.name.toLowerCase().includes(transferSearchQuery) ||
          item.sellerTeam.shortName.toLowerCase().includes(transferSearchQuery) ||
          item.player.nat.toLowerCase().includes(transferSearchQuery) ||
          natName.toLowerCase().includes(transferSearchQuery)
        );
      });
    }

    // Sort using selected criteria (rating, age, value)
    sortTransferPlayers(availableList, item => item.player);

    if (availableList.length === 0) {
      grid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-muted);">
          🔍 Aradığınız kriterlere uygun satılık oyuncu bulunamadı.
        </div>
      `;
      return;
    }

    grid.innerHTML = availableList.slice(0, 60).map(item => {
      const p = item.player;
      const t = item.sellerTeam;
      const valFloat = parseValToFloat(p.val);
      const fee = +((valFloat + 0.5).toFixed(2));
      const canAfford = userTeam.budget >= fee;

      const posClass = p.pos.toLowerCase();
      const avatarBg = p.photo ? `background-image:url('${p.photo}')` : '';

      return `
        <div class="transfer-card">
          <div class="transfer-card-header">
            <div class="transfer-avatar" style="${avatarBg}"></div>
            <div style="flex-grow:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge-pill player-badge-circle ${posClass}" style="font-size:11px; padding:2px 8px;">${p.pos}</span>
                <span style="font-size:14px; font-weight:800; color:var(--accent-gold);">⭐ ${p.rating}</span>
              </div>
              <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-top:4px;">${p.name}</div>
              <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px; margin-top:2px;">
                <span>${p.nat} ${p.age} Yaş</span>
                •
                <img src="${t.logo}" alt="${t.name}" class="team-header-logo" onerror="this.outerHTML='<span>${t.badge}</span>'"/>
                <span style="${t.id === 'barca' ? 'color:#60a5fa; font-weight:700;' : ''}">${t.shortName}</span>
              </div>
            </div>
          </div>

          <div class="transfer-price-box">
            <div>
              <div style="font-size:11px; color:var(--text-muted);">Piyasa Değeri: <strong style="color:var(--text-main);">${p.val}</strong></div>
              <div style="font-size:14px; font-weight:800; color:var(--accent-green); margin-top:2px;">Bonservis: €${fee}M</div>
            </div>

            ${canAfford ? `
              <button class="btn btn-primary buy-btn" data-team="${t.id}" data-name="${p.name}" data-fee="${fee}" style="padding:6px 12px; font-size:12px;">
                🛒 Satın Al
              </button>
            ` : `
              <button class="btn btn-secondary" disabled style="padding:6px 10px; font-size:11px; opacity:0.4; cursor:not-allowed;">
                ❌ Yetersiz Bütçe
              </button>
            `}
          </div>
        </div>
      `;
    }).join("");

    // Attach buy button events
    grid.querySelectorAll(".buy-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const teamId = e.currentTarget.dataset.team;
        const name = e.currentTarget.dataset.name;
        const fee = parseFloat(e.currentTarget.dataset.fee);
        buyPlayer(teamId, name, fee);
      });
    });
  }

  function renderSellMarket(grid) {
    let squadList = [...userTeam.squad];

    // Filter by position
    if (transferPosFilter !== "ALL") {
      squadList = squadList.filter(p => p.pos === transferPosFilter);
    }

    // Filter by nationality
    if (transferNatFilter !== "ALL") {
      squadList = squadList.filter(p => p.nat === transferNatFilter);
    }

    // Filter by search query
    if (transferSearchQuery) {
      squadList = squadList.filter(p => {
        const natName = FLAG_TO_COUNTRY_NAME[p.nat] || "";
        return (
          p.name.toLowerCase().includes(transferSearchQuery) ||
          p.nat.toLowerCase().includes(transferSearchQuery) ||
          natName.toLowerCase().includes(transferSearchQuery)
        );
      });
    }

    // Sort using selected criteria
    sortTransferPlayers(squadList, p => p);

    grid.innerHTML = squadList.map(p => {
      const valFloat = parseValToFloat(p.val);
      const sellIncome = +(valFloat * 1.05).toFixed(1);

      const posClass = p.pos.toLowerCase();
      const avatarBg = p.photo ? `background-image:url('${p.photo}')` : '';

      return `
        <div class="transfer-card">
          <div class="transfer-card-header">
            <div class="transfer-avatar" style="${avatarBg}"></div>
            <div style="flex-grow:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge-pill player-badge-circle ${posClass}" style="font-size:11px; padding:2px 8px;">${p.pos}</span>
                <span style="font-size:14px; font-weight:800; color:var(--accent-gold);">⭐ ${p.rating}</span>
              </div>
              <div style="font-size:15px; font-weight:800; color:var(--text-main); margin-top:4px;">${p.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${p.nat} ${p.age} Yaş • Moral: ${p.morale}%
              </div>
            </div>
          </div>

          <div class="transfer-price-box">
            <div>
              <div style="font-size:11px; color:var(--text-muted);">Piyasa Değeri: <strong style="color:var(--text-main);">${p.val}</strong></div>
              <div style="font-size:14px; font-weight:800; color:var(--accent-gold); margin-top:2px;">Satış Geliri: +€${sellIncome}M</div>
            </div>

            <button class="btn btn-secondary sell-btn" data-name="${p.name}" data-income="${sellIncome}" style="padding:6px 12px; font-size:12px; border-color:var(--accent-red); color:var(--accent-red);">
              📤 Sat
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Attach sell button events
    grid.querySelectorAll(".sell-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const name = e.currentTarget.dataset.name;
        const income = parseFloat(e.currentTarget.dataset.income);
        sellPlayer(name, income);
      });
    });
  }

  function buyPlayer(sellerTeamId, playerName, fee) {
    if (!userTeam) return;

    if (userTeam.budget < fee) {
      showToast(`❌ Yetersiz Bütçe! Bu transfer için €${fee}M bütçe gerekiyor.`);
      return;
    }

    let sellerTeam = TEAMS_DATA.find(t => t.id === sellerTeamId);
    if (!sellerTeam) {
      const allEuroTeams = [
        typeof BARCELONA_TEAM !== "undefined" ? BARCELONA_TEAM : null,
        typeof REAL_MADRID_TEAM !== "undefined" ? REAL_MADRID_TEAM : null,
        typeof ATLETICO_MADRID_TEAM !== "undefined" ? ATLETICO_MADRID_TEAM : null,
        typeof AC_MILAN_TEAM !== "undefined" ? AC_MILAN_TEAM : null,
        typeof TOTTENHAM_TEAM !== "undefined" ? TOTTENHAM_TEAM : null,
        typeof MAN_CITY_TEAM !== "undefined" ? MAN_CITY_TEAM : null,
        typeof MAN_UNITED_TEAM !== "undefined" ? MAN_UNITED_TEAM : null,
        typeof CHELSEA_TEAM !== "undefined" ? CHELSEA_TEAM : null,
        typeof ARSENAL_TEAM !== "undefined" ? ARSENAL_TEAM : null,
        typeof INTER_MILAN_TEAM !== "undefined" ? INTER_MILAN_TEAM : null,
        typeof AS_ROMA_TEAM !== "undefined" ? AS_ROMA_TEAM : null,
        typeof ATHLETIC_BILBAO_TEAM !== "undefined" ? ATHLETIC_BILBAO_TEAM : null,
        typeof SPORTING_TEAM !== "undefined" ? SPORTING_TEAM : null,
        typeof BENFICA_TEAM !== "undefined" ? BENFICA_TEAM : null,
        typeof PORTO_TEAM !== "undefined" ? PORTO_TEAM : null,
        typeof LIVERPOOL_TEAM !== "undefined" ? LIVERPOOL_TEAM : null,
        typeof ASTON_VILLA_TEAM !== "undefined" ? ASTON_VILLA_TEAM : null,
        typeof NEWCASTLE_TEAM !== "undefined" ? NEWCASTLE_TEAM : null,
        typeof BRIGHTON_TEAM !== "undefined" ? BRIGHTON_TEAM : null,
        typeof LEEDS_TEAM !== "undefined" ? LEEDS_TEAM : null,
        typeof REAL_SOCIEDAD_TEAM !== "undefined" ? REAL_SOCIEDAD_TEAM : null,
        typeof NAPOLI_TEAM !== "undefined" ? NAPOLI_TEAM : null,
        typeof JUVENTUS_TEAM !== "undefined" ? JUVENTUS_TEAM : null,
        typeof LAZIO_TEAM !== "undefined" ? LAZIO_TEAM : null,
        typeof ATALANTA_TEAM !== "undefined" ? ATALANTA_TEAM : null,
        typeof COMO_TEAM !== "undefined" ? COMO_TEAM : null,
        typeof BAYERN_TEAM !== "undefined" ? BAYERN_TEAM : null,
        typeof BVB_TEAM !== "undefined" ? BVB_TEAM : null,
        typeof LEVERKUSEN_TEAM !== "undefined" ? LEVERKUSEN_TEAM : null,
        typeof FIORENTINA_TEAM !== "undefined" ? FIORENTINA_TEAM : null,
        typeof UDINESE_TEAM !== "undefined" ? UDINESE_TEAM : null,
        typeof TORINO_TEAM !== "undefined" ? TORINO_TEAM : null,
        typeof CAGLIARI_TEAM !== "undefined" ? CAGLIARI_TEAM : null,
        typeof BOLOGNA_TEAM !== "undefined" ? BOLOGNA_TEAM : null,
        typeof CELTA_VIGO_TEAM !== "undefined" ? CELTA_VIGO_TEAM : null,
        typeof VILLARREAL_TEAM !== "undefined" ? VILLARREAL_TEAM : null,
        typeof GETAFE_TEAM !== "undefined" ? GETAFE_TEAM : null,
        typeof RAYO_TEAM !== "undefined" ? RAYO_TEAM : null,
        typeof OSASUNA_TEAM !== "undefined" ? OSASUNA_TEAM : null,
        typeof EVERTON_TEAM !== "undefined" ? EVERTON_TEAM : null,
        typeof BRENTFORD_TEAM !== "undefined" ? BRENTFORD_TEAM : null,
        typeof HULL_TEAM !== "undefined" ? HULL_TEAM : null,
        typeof FOREST_TEAM !== "undefined" ? FOREST_TEAM : null,
        typeof PALACE_TEAM !== "undefined" ? PALACE_TEAM : null,
        typeof FULHAM_TEAM !== "undefined" ? FULHAM_TEAM : null,
        typeof BOURNEMOUTH_TEAM !== "undefined" ? BOURNEMOUTH_TEAM : null,
        typeof PSG_TEAM !== "undefined" ? PSG_TEAM : null,
        typeof MARSEILLE_TEAM !== "undefined" ? MARSEILLE_TEAM : null,
        typeof LYON_TEAM !== "undefined" ? LYON_TEAM : null,
        typeof LILLE_TEAM !== "undefined" ? LILLE_TEAM : null,
        typeof MONACO_TEAM !== "undefined" ? MONACO_TEAM : null,
        typeof LENS_TEAM !== "undefined" ? LENS_TEAM : null,
        typeof RENNES_TEAM !== "undefined" ? RENNES_TEAM : null,
        typeof STRASBOURG_TEAM !== "undefined" ? STRASBOURG_TEAM : null,
        typeof BRAGA_TEAM !== "undefined" ? BRAGA_TEAM : null,
      ].filter(Boolean);
      sellerTeam = allEuroTeams.find(t => t.id === sellerTeamId) || null;
    }
    if (!sellerTeam) return;

    const playerIndex = sellerTeam.squad.findIndex(p => p.name === playerName);
    if (playerIndex === -1) return;

    const [transferredPlayer] = sellerTeam.squad.splice(playerIndex, 1);

    // Deduct fee from user budget
    userTeam.budget = +((userTeam.budget - fee).toFixed(1));

    // Add player to user squad
    userTeam.squad.push(transferredPlayer);

    // Save squad and update UI
    saveSquadToLocalStorage();
    renderTransferMarket();
    renderTacticsPitch();

    showToast(`🎉 HARİKA TRANSFER! ${transferredPlayer.name} (€${fee}M) ${userTeam.name} kadrosuna katıldı!`);
  }

  function sellPlayer(playerName, income) {
    if (!userTeam) return;

    if (userTeam.squad.length <= 11) {
      alert("❌ Maç kadrosu kurabilmek için takımınızda en az 11 oyuncu kalmalıdır!");
      return;
    }

    const pIndex = userTeam.squad.findIndex(p => p.name === playerName);
    if (pIndex === -1) return;

    const [soldPlayer] = userTeam.squad.splice(pIndex, 1);

    // Remove from starting11 or substitutes if present
    if (userTeam.starting11) {
      userTeam.starting11 = userTeam.starting11.filter(p => p.name !== playerName);
    }

    // Add income to budget
    userTeam.budget = +((userTeam.budget + income).toFixed(1));

    // Save squad and update UI
    saveSquadToLocalStorage();
    renderTransferMarket();
    renderTacticsPitch();

    showToast(`💰 SATIŞ TAMAMLANDI! ${soldPlayer.name} €${income}M karşılığında satıldı.`);
  }

  /* ==========================================================================
     TRAINING & PLAYER DEVELOPMENT CONTROLLER
     ========================================================================== */
  function setupTrainingControls() {
    // Dynamic event handlers attached during render
  }

  function getPlayerBaseMaxGen(age) {
    if (age < 25) return 3; // 25 yaş altı toplamda 3 gen
    if (age < 30) return 2; // 25-29 yaş toplamda 2 gen
    return 1;               // 30 yaş üstü toplamda 1 gen
  }

  function getPlayerGainedGen(player) {
    return player.totalGainedGen || 0;
  }

  function getPlayerRemainingGen(player) {
    if (!player) return 0;
    const season = currentSeasonNumber || 1;
    const seasonGains = player.seasonGains || {};
    const baseMax = getPlayerBaseMaxGen(player.age);

    if (season === 1) {
      const gainedS1 = seasonGains[1] !== undefined ? seasonGains[1] : (player.totalGainedGen || 0);
      return Math.max(0, baseMax - gainedS1);
    } else if (season === 2) {
      if (player.maxedInSeason1) {
        // İlk sezonda haklarının tamamını kullandıysa 2. sezonda sadece 1 GEN gelişebilir
        const gainedS2 = seasonGains[2] || 0;
        return Math.max(0, 1 - gainedS2);
      } else {
        // İlk sezonda tamamını doldurmadıysa kalan normal hakkını kullanır
        const gainedS1 = seasonGains[1] || 0;
        const remainingBase = Math.max(0, baseMax - gainedS1);
        const gainedS2 = seasonGains[2] || 0;
        return Math.max(0, remainingBase - gainedS2);
      }
    } else {
      // 3. ve sonraki sezonlarda: İlk sezonda hakkını doldurmuş oyuncu kesinlikle gelişemez
      if (player.maxedInSeason1) {
        return 0;
      }
      const totalGained = player.totalGainedGen || 0;
      return Math.max(0, baseMax - totalGained);
    }
  }

  function getPlayerAgeBadge(player) {
    const season = currentSeasonNumber || 1;
    const remaining = getPlayerRemainingGen(player);
    const gained = getPlayerGainedGen(player);

    if (season >= 3 && player.maxedInSeason1) {
      return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:#ef4444; border-color:#ef4444; font-weight:800;">🔒 Kariyer Gelişimi Tamamlandı (3. Sezon+)</span>`;
    }

    if (remaining === 0) {
      return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:#ef4444; border-color:#ef4444; font-weight:800;">🔒 Bu Sezon Gelişim Doldu</span>`;
    }

    if (season === 2 && player.maxedInSeason1) {
      return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:var(--accent-gold); border-color:var(--accent-gold); font-weight:800;">🌟 2. Sezon Bonusu (+${remaining} GEN Hakkı)</span>`;
    }

    if (player.age < 25) {
      return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:var(--accent-gold); border-color:var(--accent-gold); font-weight:800;">🌟 &lt;25 Yaş (Kalan: +${remaining} GEN)</span>`;
    }
    if (player.age < 30) {
      return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:var(--accent-blue); border-color:var(--accent-blue); font-weight:800;">🔥 25-29 Yaş (Kalan: +${remaining} GEN)</span>`;
    }
    return `<span class="badge-pill" style="font-size:10px; padding:1px 6px; color:var(--text-muted); border-color:var(--glass-border);">👔 30+ Yaş (Kalan: +${remaining} GEN)</span>`;
  }

  function getSpeedupCost() {
    if (!userTeam) return 0.1;
    const cost = +(userTeam.budget * 0.01).toFixed(2);
    return Math.max(0.01, cost);
  }

  function isSeasonCompleted() {
    if (!fixtures || fixtures.length === 0) return false;
    const allMatches = fixtures.flat();
    return allMatches.length > 0 && allMatches.every(m => m.played);
  }

  function getTrainingData() {
    if (!userTeam) return {};
    if (!userTeam.training) {
      userTeam.training = { FW: null, MF: null, DF: null, GK: null };
    }
    return userTeam.training;
  }

  function renderTrainingCenter() {
    if (!userTeam) return;

    // Update budget displays
    const trainingBudgetElem = document.getElementById("training-user-budget-display");
    if (trainingBudgetElem) trainingBudgetElem.innerText = `€${userTeam.budget.toFixed(1)}M`;

    const transferBudgetElem = document.getElementById("transfer-user-budget-display");
    if (transferBudgetElem) transferBudgetElem.innerText = `€${userTeam.budget.toFixed(1)}M`;

    const container = document.getElementById("training-slots-container");
    if (!container) return;

    const isCompleted = isSeasonCompleted();
    const training = getTrainingData();
    const speedCost = getSpeedupCost();

    const slotsMeta = [
      { pos: "FW", title: "Hücum & Forvet İdmanı", icon: "⚽", color: "var(--accent-red)" },
      { pos: "MF", title: "Orta Saha & Oyun Kurucu İdmanı", icon: "🎯", color: "var(--accent-gold)" },
      { pos: "DF", title: "Savunma & Stoper İdmanı", icon: "🛡️", color: "var(--accent-blue)" },
      { pos: "GK", title: "Kaleci & Refleks İdmanı", icon: "🧤", color: "var(--accent-purple)" }
    ];

    let bannerHtml = "";
    if (isCompleted) {
      bannerHtml = `
        <div class="glass-card" style="grid-column: 1 / -1; margin-bottom: 8px; padding: 18px 24px; border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">🏁</span>
            <div>
              <div style="font-weight: 800; font-size: 16px; color: var(--accent-gold);">Sezon Tamamlandı!</div>
              <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Mevcut sezon sona erdiği için yeni antrenman başlatılamaz. Yeni idmanlar için lütfen yeni sezona başlayın.</div>
            </div>
          </div>
          <button class="btn btn-primary" id="training-new-season-banner-btn" style="padding: 10px 22px; font-size: 13.5px; font-weight: 800; background: linear-gradient(135deg, var(--accent-gold), #d97706); border-color: var(--accent-gold); color: #fff; box-shadow: 0 0 15px var(--accent-gold-glow);">
            🔄 Yeni Sezona Başla
          </button>
        </div>
      `;
    }

    const cardsHtml = slotsMeta.map(slot => {
      const activeSlot = training[slot.pos];
      let activePlayer = null;
      if (activeSlot && activeSlot.playerName) {
        activePlayer = userTeam.squad.find(p => p.name === activeSlot.playerName);
      }

      // Filter eligible squad players for this position slot who are not currently in training
      const eligiblePlayers = userTeam.squad.filter(p => {
        if (p.pos !== slot.pos) return false;
        const isBusy = Object.values(training).some(t => t && t.playerName === p.name);
        return !isBusy;
      }).sort((a, b) => {
        const remA = getPlayerRemainingGen(a);
        const remB = getPlayerRemainingGen(b);
        if (remA > 0 && remB === 0) return -1;
        if (remA === 0 && remB > 0) return 1;
        return b.rating - a.rating;
      });

      let contentHtml = "";

      if (activePlayer && activeSlot) {
        const remainingGen = getPlayerRemainingGen(activePlayer);
        const ageBadge = getPlayerAgeBadge(activePlayer);
        const progress = Math.min(100, activeSlot.progress || 0);
        const avatarBg = activePlayer.photo ? `background-image:url('${activePlayer.photo}')` : '';

        contentHtml = `
          <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">
            <div class="transfer-avatar" style="${avatarBg}"></div>
            <div style="flex-grow:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge-pill" style="font-size:11px; padding:2px 8px; background:rgba(255,255,255,0.08); border-color:var(--glass-border);">${activePlayer.pos}</span>
                <div style="display:flex; gap:6px; align-items:center;">
                  ${ageBadge}
                  <span style="font-size:15px; font-weight:800; color:var(--accent-gold);">⭐ ${activePlayer.rating}</span>
                </div>
              </div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-top:4px;">${activePlayer.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${activePlayer.nat} ${activePlayer.age} Yaş • Değer: ${activePlayer.val} • Kalan Gelişim: <strong style="color:var(--accent-gold);">+${remainingGen} GEN</strong>
              </div>
            </div>
          </div>

          <div style="margin-top:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
              <span style="color:var(--text-muted);">İdman İlerlemesi</span>
              <span style="color:${progress >= 100 ? 'var(--accent-green)' : 'var(--accent-gold)'};">%${progress} ${progress >= 100 ? '✓ (TAMAMLANDI)' : ''}</span>
            </div>
            <div class="training-progress-track">
              <div class="training-progress-bar" style="width: ${progress}%;"></div>
            </div>
          </div>

          <div style="display:flex; gap:8px; margin-top:14px;">
            ${progress >= 100 ? `
              <button class="btn btn-primary complete-train-btn" data-pos="${slot.pos}" style="flex-grow:1; font-size:12.5px;">
                🎉 Gelişimi Al (+1 GEN)
              </button>
            ` : (isCompleted ? `
              <button class="btn btn-secondary" disabled style="flex-grow:1; font-size:12px; opacity:0.4; cursor:not-allowed;" title="Sezon tamamlandı">
                🔒 Sezon Bitti
              </button>
            ` : `
              <button class="btn btn-secondary boost-train-btn" data-pos="${slot.pos}" style="flex-grow:1; font-size:12px;">
                ⚡ Hızlandır (+%35) • €${speedCost}M (%1 Bütçe)
              </button>
            `)}
            <button class="btn btn-secondary cancel-train-btn" data-pos="${slot.pos}" style="font-size:12px; border-color:var(--accent-red); color:var(--accent-red);" title="İdmanı İptal Et">
              ❌ İptal
            </button>
          </div>
        `;
      } else if (isCompleted) {
        contentHtml = `
          <div style="padding:20px 14px; text-align:center; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); border:1px dashed var(--glass-border); margin-bottom:14px;">
            <div style="font-size:26px; margin-bottom:6px;">🔒</div>
            <div style="font-size:13.5px; font-weight:700; color:var(--text-main); margin-bottom:4px;">
              İdman Sahası Kilitli
            </div>
            <div style="font-size:12px; color:var(--text-muted);">
              Sezon bittiği için yeni oyuncu idmana alınamaz.
            </div>
          </div>
        `;
      } else {
        contentHtml = `
          <div style="padding:14px; text-align:center; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); border:1px dashed var(--glass-border); margin-bottom:14px;">
            <div style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">
              Bu sahada antrenman yapan oyuncu yok.
            </div>

            ${eligiblePlayers.length > 0 ? `
              <select id="train-select-${slot.pos}" class="form-select" style="font-size:13px; margin-bottom:10px;">
                ${eligiblePlayers.map(p => {
          const remaining = getPlayerRemainingGen(p);
          const season = currentSeasonNumber || 1;
          let infoText = "";
          if (remaining === 0) {
            if (season >= 3 && p.maxedInSeason1) {
              infoText = "[Kariyer Gelişimi Tamamlandı (3. Sezon+) 🔒]";
            } else if (season === 2 && p.maxedInSeason1) {
              infoText = "[2. Sezon Hakkı Tamamlandı 🔒]";
            } else {
              infoText = "[Bu Sezonki Gelişim Doldu 🔒]";
            }
            return `<option value="${p.name}" disabled style="color:var(--text-muted);">${p.name} (⭐ ${p.rating} OVR, ${p.age} Yaş) • ${infoText}</option>`;
          }

          if (season === 2 && p.maxedInSeason1) {
            infoText = `[2. Sezon Bonusu: +${remaining} GEN] 🌟`;
          } else {
            infoText = `[Kalan: +${remaining} GEN]`;
          }
          const icon = p.age < 25 ? '🌟' : (p.age < 30 ? '🔥' : '👔');
          return `
                    <option value="${p.name}">
                      ${p.name} (⭐ ${p.rating} OVR, ${p.age} Yaş) • ${infoText} ${icon}
                    </option>
                  `;
        }).join("")}
              </select>
              <button class="btn btn-primary start-train-btn" data-pos="${slot.pos}" style="width:100%; font-size:13px;">
                ➕ Oyuncuyu İdmana Al
              </button>
            ` : `
              <div style="font-size:12px; color:var(--text-dim);">
                Kadronuzda bu mevki için boşta uygun oyuncu bulunmuyor.
              </div>
            `}
          </div>
        `;
      }

      return `
        <div class="training-slot-card" style="border-top: 3px solid ${slot.color};">
          <div class="training-slot-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">${slot.icon}</span>
              <span style="font-weight:800; font-size:16px; color:var(--text-main);">${slot.title}</span>
            </div>
            <span class="badge-pill" style="font-size:10px; padding:2px 6px;">${slot.pos}</span>
          </div>
          ${contentHtml}
        </div>
      `;
    }).join("");

    container.innerHTML = bannerHtml + cardsHtml;

    // Attach event listeners
    document.getElementById("training-new-season-banner-btn")?.addEventListener("click", () => {
      if (confirm("Mevcut sezon sıfırlanıp 2026/2027 yeni sezon fikstürü oluşturulacaktır. Onaylıyor musunuz?")) {
        restartNewSeason();
      }
    });

    container.querySelectorAll(".start-train-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const pos = e.currentTarget.dataset.pos;
        const selectElem = document.getElementById(`train-select-${pos}`);
        if (selectElem && selectElem.value) {
          startTraining(pos, selectElem.value);
        }
      });
    });

    container.querySelectorAll(".boost-train-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const pos = e.currentTarget.dataset.pos;
        speedupTraining(pos);
      });
    });

    container.querySelectorAll(".complete-train-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const pos = e.currentTarget.dataset.pos;
        completeTraining(pos);
      });
    });

    container.querySelectorAll(".cancel-train-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const pos = e.currentTarget.dataset.pos;
        cancelTraining(pos);
      });
    });
  }

  function startTraining(pos, playerName) {
    if (!userTeam) return;

    if (isSeasonCompleted()) {
      alert("⚠️ Sezon tamamlandı! Yeni antrenman başlatabilmek için lütfen 'Yeni Sezona Başla' butonuna tıklayarak yeni sezonu başlatın.");
      return;
    }

    const training = getTrainingData();
    const player = userTeam.squad.find(p => p.name === playerName);
    if (!player) return;

    const remaining = getPlayerRemainingGen(player);
    if (remaining <= 0) {
      const season = currentSeasonNumber || 1;
      if (season >= 3 && player.maxedInSeason1) {
        alert(`⚠️ ${player.name}, ilk 2 sezonda gelişimini tamamlamıştır ve 3. sezondan itibaren daha fazla geliştirilemez.`);
      } else if (season === 2 && player.maxedInSeason1) {
        alert(`⚠️ ${player.name}, 2. sezondaki +1 GEN gelişim hakkını tamamlamıştır.`);
      } else {
        alert(`⚠️ ${player.name} (${player.age} Yaş) bu sezonki gelişim hakkını doldurmuştur.`);
      }
      return;
    }

    training[pos] = {
      playerName: player.name,
      pos: pos,
      progress: 0,
      age: player.age
    };

    saveSquadToLocalStorage();
    renderTrainingCenter();
    showToast(`🏋️ ${player.name} (${pos}) özel antrenmana alındı!`);
  }

  function speedupTraining(pos) {
    if (!userTeam) return;

    if (isSeasonCompleted()) {
      showToast("⚠️ Sezon bitti! Sezon tamamlandığında antrenman hızlandırılamaz.");
      return;
    }

    const cost = getSpeedupCost();

    if (userTeam.budget < cost) {
      showToast(`❌ Yetersiz Bütçe! Hızlandırma için €${cost}M (%1 Bütçe) gereklidir.`);
      return;
    }

    // Deduct 1% of budget
    userTeam.budget = +((userTeam.budget - cost).toFixed(2));

    const training = getTrainingData();
    const slot = training[pos];
    if (!slot) return;

    slot.progress = Math.min(100, (slot.progress || 0) + 35);

    saveSquadToLocalStorage();
    renderTrainingCenter();
    showToast(`⚡ Hızlandırıldı! (-€${cost}M bütçe kesildi) İlerleme: %${slot.progress}`);
  }

  function advanceAllTrainingProgress(amount = 35) {
    if (!userTeam || !userTeam.training) return;
    Object.keys(userTeam.training).forEach(pos => {
      const slot = userTeam.training[pos];
      if (slot && slot.progress < 100) {
        slot.progress = Math.min(100, (slot.progress || 0) + amount);
      }
    });
    saveSquadToLocalStorage();
  }

  function completeTraining(pos) {
    if (!userTeam) return;
    const training = getTrainingData();
    const slot = training[pos];
    if (!slot) return;

    const player = userTeam.squad.find(p => p.name === slot.playerName);
    if (player) {
      const remaining = getPlayerRemainingGen(player);

      if (remaining > 0) {
        const ratingBoost = 1;
        const oldRating = player.rating;

        player.rating += ratingBoost;
        player.seasonGains = player.seasonGains || {};
        player.seasonGains[currentSeasonNumber] = (player.seasonGains[currentSeasonNumber] || 0) + ratingBoost;
        player.totalGainedGen = (player.totalGainedGen || 0) + ratingBoost;
        player.morale = 100;
        player.stamina = 100;

        // If in season 1, check if they now hit baseMax
        if (currentSeasonNumber === 1) {
          const baseMax = getPlayerBaseMaxGen(player.age);
          if (player.seasonGains[1] >= baseMax) {
            player.maxedInSeason1 = true;
          }
        }

        // Increase market value string proportionally
        const currentValFloat = parseValToFloat(player.val);
        const newValFloat = +(currentValFloat * (1 + (ratingBoost * 0.08))).toFixed(2);
        player.val = newValFloat >= 1.0 ? `€${newValFloat.toFixed(2)}M` : `€${Math.round(newValFloat * 1000)}K`;

        const newRemaining = getPlayerRemainingGen(player);
        showToast(`🎉 HARİKA GELİŞİM! ${player.name} antrenmanı bitirdi! Reyting: ⭐ ${oldRating} ➔ ${player.rating} (+${ratingBoost} GEN) • ${newRemaining === 0 ? 'Bu sezonki gelişim tamamlandı 🔒' : `Kalan: +${newRemaining} GEN`}`);
      } else {
        showToast(`ℹ️ ${player.name} bu sezonki maksimum gelişim kapasitesine ulaştı.`);
      }
    }

    training[pos] = null;
    saveSquadToLocalStorage();
    renderTrainingCenter();
    renderTacticsPitch();
  }

  function cancelTraining(pos) {
    if (!userTeam) return;
    const training = getTrainingData();
    if (training[pos]) {
      const name = training[pos].playerName;
      training[pos] = null;
      saveSquadToLocalStorage();
      renderTrainingCenter();
      showToast(`ℹ️ ${name} antrenmanı iptal edildi.`);
    }
  }

  /* ==========================================================================
     CONFETTI & SEASON FINALE CEREMONY CONTROLLER
     ========================================================================== */
  let confettiAnimationId = null;

  function startConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    const particleCount = 180;
    const particles = [];
    const colors = ["#f59e0b", "#fbbf24", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#ffffff"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 5,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      confettiAnimationId = requestAnimationFrame(animate);
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animate();
  }

  function stopConfetti() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
      canvas.style.display = "none";
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function launchSeasonFinaleCeremony() {
    if (!leagueTable || leagueTable.length === 0) return;

    // Start Confetti Celebration
    startConfetti();

    // 1. Champion Team (1st in standings)
    const championRow = leagueTable[0];
    const champion = championRow.team;
    const isUserChampion = userTeam && champion.id === userTeam.id;

    // 2. Aggregate all players for awards
    let allPlayers = [];
    TEAMS_DATA.forEach(team => {
      team.squad.forEach(p => {
        allPlayers.push({ player: p, team: team });
      });
    });

    // Gol Kralı (Top Scorer)
    const topScorers = [...allPlayers].sort((a, b) => (b.player.goals || 0) - (a.player.goals || 0));
    const topScorer = topScorers[0] || null;

    // Asist Kralı (Top Playmaker)
    const topAssisters = [...allPlayers].sort((a, b) => (b.player.assists || 0) - (a.player.assists || 0));
    const topAssister = topAssisters[0] || null;

    // Kurtarış Kralı (Golden Glove / Top Goalkeeper)
    const topGks = [...allPlayers].filter(item => item.player.pos === "GK").sort((a, b) => (b.player.saves || 0) - (a.player.saves || 0));
    const topGk = topGks[0] || null;

    // Sezonun Oyuncusu (MVP / Maçın Adamı Lideri)
    const topMotms = [...allPlayers].sort((a, b) => {
      const aScore = (a.player.motmCount || 0) * 10 + (a.player.totalRating && a.player.matchesPlayed ? (a.player.totalRating / a.player.matchesPlayed) : 0);
      const bScore = (b.player.motmCount || 0) * 10 + (b.player.totalRating && b.player.matchesPlayed ? (b.player.totalRating / b.player.matchesPlayed) : 0);
      return bScore - aScore;
    });
    const seasonMvp = topMotms[0] || null;

    // Render Modal Content
    const modalContent = document.getElementById("season-ceremony-card-content");
    if (!modalContent) return;

    const scorerAvatar = topScorer?.player?.photo ? `background-image:url('${topScorer.player.photo}')` : '';
    const assisterAvatar = topAssister?.player?.photo ? `background-image:url('${topAssister.player.photo}')` : '';
    const gkAvatar = topGk?.player?.photo ? `background-image:url('${topGk.player.photo}')` : '';
    const mvpAvatar = seasonMvp?.player?.photo ? `background-image:url('${seasonMvp.player.photo}')` : '';
    const mvpAvg = seasonMvp?.player?.matchesPlayed ? (seasonMvp.player.totalRating / seasonMvp.player.matchesPlayed).toFixed(2) : "8.5";

    modalContent.innerHTML = `
      <div style="text-align: center; position: relative;">
        <button id="close-ceremony-x-btn" style="position: absolute; top: -10px; right: -6px; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: #fff; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: var(--transition);" title="Kapat">✕</button>

        <span class="badge-pill" style="color: var(--accent-gold); border-color: var(--accent-gold); font-size: 13px; padding: 4px 14px; font-weight: 800; margin-bottom: 12px; display: inline-block;">
          ✨ 2025/2026 SÜPER LİG SEZON SONU TÖRENİ ✨
        </span>
        <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 6px; text-shadow: 0 0 20px var(--accent-gold-glow);">
          🏆 SEZONUN ŞAMPİYONU & ÖDÜLLER 🏆
        </h1>
        <p style="color: var(--text-muted); font-size: 14px;">
          Nefes kesen sezon tamamlandı! Kupayı kaldıran şampiyon ve sezonun en iyileri açıklandı.
        </p>

        <!-- Champion Box -->
        <div class="champion-hero-box">
          <div style="font-size: 42px; margin-bottom: 4px;">🏆</div>
          <img src="${champion.logo}" alt="${champion.name}" class="champion-logo-big" onerror="this.outerHTML='<span style=\\'font-size:56px;\\'>${champion.badge}</span>'"/>
          <h2 style="font-size: 32px; font-weight: 900; color: var(--accent-gold); margin: 12px 0 4px 0; text-shadow: 0 0 15px rgba(245,158,11,0.5);">
            ${champion.name}
          </h2>
          <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
            ${isUserChampion ? '👑 TEBRİKLER ŞAMPİYON MENAJER! Kupayı müzenize götürdünüz! 🎉' : `2025/2026 Süper Lig Şampiyonu!`}
          </div>
          <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); font-weight: 600;">
            <span>Toplam Puan: <strong style="color:#ffffff;">${championRow.pts} Puan</strong></span>
            •
            <span>Averaj: <strong style="color:var(--accent-green);">${championRow.gd > 0 ? '+' : ''}${championRow.gd}</strong></span>
            •
            <span>Galibiyet: <strong style="color:#ffffff;">${championRow.won}G ${championRow.drawn}B ${championRow.lost}M</strong></span>
          </div>
        </div>

        <!-- Season Standing Cash Prizes -->
        <h3 style="font-size: 18px; font-weight: 800; text-align: left; margin: 24px 0 12px 0; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
          <span>💰 Sezon Sonu Sıralama Bütçe Bonusları</span>
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 8px;">
          ${[
        { rank: 1, bonus: "5.00M", badge: "🥇 1. (Şampiyon)", color: "var(--accent-gold)" },
        { rank: 2, bonus: "3.50M", badge: "🥈 2. Sıra", color: "#94a3b8" },
        { rank: 3, bonus: "2.92M", badge: "🥉 3. Sıra", color: "#f97316" },
        { rank: 4, bonus: "2.10M", badge: "🏅 4. Sıra", color: "var(--accent-blue)" },
        { rank: 5, bonus: "1.25M", badge: "🎖️ 5. Sıra", color: "var(--accent-green)" }
      ].map(item => {
        const teamRow = leagueTable[item.rank - 1];
        const t = teamRow ? teamRow.team : null;
        const isUserRow = userTeam && t && t.id === userTeam.id;
        return `
              <div class="glass-card" style="padding: 12px 8px; text-align: center; border: 1px solid ${isUserRow ? item.color : 'var(--glass-border)'}; ${isUserRow ? `box-shadow: 0 0 15px rgba(245,158,11,0.25); background: rgba(255,255,255,0.06);` : ''}">
                <div style="font-size: 11px; font-weight: 800; color: ${item.color}; margin-bottom: 4px;">${item.badge}</div>
                <div style="font-size: 16px; font-weight: 900; color: var(--accent-green); margin: 4px 0;">+€${item.bonus}</div>
                <div style="font-size: 11.5px; color: var(--text-main); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${t ? `${t.name} ${isUserRow ? '⭐ (Siz)' : ''}` : '—'}
                </div>
              </div>
            `;
      }).join("")}
        </div>
        <div style="font-size: 12px; color: var(--text-muted); text-align: left; margin-bottom: 20px;">
          ℹ️ <em>Ayrıca yeni sezona geçildiğinde tüm takımların bütçelerine, lig başlangıç bütçelerinin onda biri (1/10) eklenir.</em>
        </div>

        <!-- Season Individual Awards Grid -->
        <h3 style="font-size: 18px; font-weight: 800; text-align: left; margin: 24px 0 12px 0; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
          <span>🌟 Sezonun Kralları ve Bireysel Ödülleri</span>
        </h3>

        <div class="awards-grid">
          <!-- 1. Gol Kralı -->
          <div class="award-item-card" style="border-top: 3px solid var(--accent-red);">
            <div>
              <div class="award-badge-title" style="color: var(--accent-red);">
                <span>⚽ GOL KRALI (Altın Ayakkabı)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                <div class="transfer-avatar" style="width: 44px; height: 44px; ${scorerAvatar}"></div>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${topScorer ? topScorer.player.name : '—'}</div>
                  <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    ${topScorer ? `<img src="${topScorer.team.logo}" alt="" class="team-header-logo" onerror="this.outerHTML='<span>${topScorer.team.badge}</span>'"/> <span>${topScorer.team.shortName}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 18px; font-weight: 900; color: var(--accent-red); margin-top: 8px;">
              ⚽ ${topScorer ? (topScorer.player.goals || 0) : 0} <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Gol</span>
            </div>
          </div>

          <!-- 2. Asist Kralı -->
          <div class="award-item-card" style="border-top: 3px solid var(--accent-gold);">
            <div>
              <div class="award-badge-title" style="color: var(--accent-gold);">
                <span>🅰️ ASİST KRALI (Altın Pas)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                <div class="transfer-avatar" style="width: 44px; height: 44px; ${assisterAvatar}"></div>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${topAssister ? topAssister.player.name : '—'}</div>
                  <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    ${topAssister ? `<img src="${topAssister.team.logo}" alt="" class="team-header-logo" onerror="this.outerHTML='<span>${topAssister.team.badge}</span>'"/> <span>${topAssister.team.shortName}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 18px; font-weight: 900; color: var(--accent-gold); margin-top: 8px;">
              🅰️ ${topAssister ? (topAssister.player.assists || 0) : 0} <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Asist</span>
            </div>
          </div>

          <!-- 3. Kurtarış Kralı -->
          <div class="award-item-card" style="border-top: 3px solid var(--accent-purple);">
            <div>
              <div class="award-badge-title" style="color: var(--accent-purple);">
                <span>🧤 ALTIN ELDİVEN (Kurtarış)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                <div class="transfer-avatar" style="width: 44px; height: 44px; ${gkAvatar}"></div>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${topGk ? topGk.player.name : '—'}</div>
                  <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    ${topGk ? `<img src="${topGk.team.logo}" alt="" class="team-header-logo" onerror="this.outerHTML='<span>${topGk.team.badge}</span>'"/> <span>${topGk.team.shortName}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 18px; font-weight: 900; color: var(--accent-purple); margin-top: 8px;">
              🧤 ${topGk ? (topGk.player.saves || 0) : 0} <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Kurtarış</span>
            </div>
          </div>

          <!-- 4. Sezonun MVP'si -->
          <div class="award-item-card" style="border-top: 3px solid var(--accent-green);">
            <div>
              <div class="award-badge-title" style="color: var(--accent-green);">
                <span>🌟 SEZONUN OYUNCUSU (MVP)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                <div class="transfer-avatar" style="width: 44px; height: 44px; ${mvpAvatar}"></div>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${seasonMvp ? seasonMvp.player.name : '—'}</div>
                  <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    ${seasonMvp ? `<img src="${seasonMvp.team.logo}" alt="" class="team-header-logo" onerror="this.outerHTML='<span>${seasonMvp.team.badge}</span>'"/> <span>${seasonMvp.team.shortName}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 15px; font-weight: 900; color: var(--accent-green); margin-top: 8px;">
              🌟 ${seasonMvp ? (seasonMvp.player.motmCount || 0) : 0} MOTM • ⭐ ${mvpAvg} Puan
            </div>
          </div>
        </div>

        <!-- Action Buttons: Çık & Yeni Sezona Başla -->
        <div style="display: flex; gap: 14px; justify-content: center; margin-top: 26px; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="close-ceremony-standings-btn" style="padding: 12px 28px; font-size: 14.5px; font-weight: 700; border-color: rgba(255,255,255,0.25); display: flex; align-items: center; gap: 8px;">
            🚪 Çıkış (Kapat)
          </button>
          <button class="btn btn-primary" id="restart-new-season-btn" style="padding: 12px 32px; font-size: 14.5px; font-weight: 800; background: linear-gradient(135deg, var(--accent-gold), #d97706); border-color: var(--accent-gold); color: #ffffff; box-shadow: 0 0 20px var(--accent-gold-glow); display: flex; align-items: center; gap: 8px;">
            🔄 Yeni Sezona Başla
          </button>
        </div>
      </div>
    `;

    const modal = document.getElementById("season-finale-modal");
    if (modal) modal.style.display = "flex";

    const closeModalHandler = () => {
      modal.style.display = "none";
      stopConfetti();
      document.querySelector('.nav-tab[data-view="view-standings"]').click();
    };

    document.getElementById("close-ceremony-x-btn")?.addEventListener("click", closeModalHandler);
    document.getElementById("close-ceremony-standings-btn")?.addEventListener("click", closeModalHandler);

    document.getElementById("restart-new-season-btn")?.addEventListener("click", () => {
      modal.style.display = "none";
      stopConfetti();
      restartNewSeason();
    });
  }

  function setupSeasonControls() {
    const handleNewSeason = () => {
      if (!userTeam) {
        alert("Lütfen önce takımınızı seçin!");
        return;
      }
      if (confirm("Mevcut sezon sıfırlanıp 2026/2027 yeni sezon fikstürü oluşturulacaktır. Onaylıyor musunuz?")) {
        restartNewSeason();
      }
    };

    document.getElementById("standings-new-season-btn")?.addEventListener("click", handleNewSeason);
    document.getElementById("header-new-season-btn")?.addEventListener("click", handleNewSeason);

    document.getElementById("standings-show-ceremony-btn")?.addEventListener("click", () => {
      if (!userTeam) {
        alert("Lütfen önce takımınızı seçin!");
        return;
      }
      launchSeasonFinaleCeremony();
    });
  }

  function restartNewSeason() {
    const currentSeason = currentSeasonNumber || 1;
    // Mark season 1 maxed players and reset match stats (preserve training progress)
    TEAMS_DATA.forEach(team => {
      team.squad.forEach(p => {
        p.goals = 0;
        p.assists = 0;
        p.saves = 0;
        p.motmCount = 0;
        p.totalRating = 0;
        p.matchesPlayed = 0;

        if (currentSeason === 1) {
          const baseMax = getPlayerBaseMaxGen(p.age);
          const s1Gained = (p.seasonGains && p.seasonGains[1]) || (p.totalGainedGen || 0);
          if (s1Gained >= baseMax) {
            p.maxedInSeason1 = true;
          }
        }
      });
    });

    currentSeasonNumber = currentSeason + 1;

    // Reset active training slots for the new season
    if (userTeam) {
      userTeam.training = { FW: null, MF: null, DF: null, GK: null };
    }

    // Standings placement bonus (1st: 5M, 2nd: 3.5M, 3rd: 2.92M, 4th: 2.1M, 5th: 1.25M)
    const rankBonuses = [
      { rank: 1, bonus: 5.0, title: "Şampiyonluk Bonusu" },
      { rank: 2, bonus: 3.5, title: "2.lik Bonusu" },
      { rank: 3, bonus: 2.92, title: "3.lük Bonusu" },
      { rank: 4, bonus: 2.1, title: "4.lük Bonusu" },
      { rank: 5, bonus: 1.25, title: "5.lik Bonusu" }
    ];

    let userRankBonus = 0;
    let userRankIndex = -1;

    if (leagueTable && leagueTable.length > 0) {
      rankBonuses.forEach(({ rank, bonus }) => {
        const row = leagueTable[rank - 1];
        if (row && row.team) {
          row.team.budget = +((row.team.budget + bonus).toFixed(2));
          if (userTeam && row.team.id === userTeam.id) {
            userRankBonus = bonus;
            userRankIndex = rank;
          }
        }
      });
    }

    // Add 1/10 (10%) of initial baseline transfer budget to all teams for the new season
    TEAMS_DATA.forEach(team => {
      const baseBudget = team.initialBudget !== undefined ? team.initialBudget : (team.budget || 30.0);
      const bonus = +(baseBudget * 0.10).toFixed(2);
      team.budget = +((team.budget + bonus).toFixed(2));
    });

    if (userTeam) {
      const userBase = userTeam.initialBudget !== undefined ? userTeam.initialBudget : (userTeam.budget || 30.0);
      const userBaseBonus = +(userBase * 0.10).toFixed(2);
      saveSquadToLocalStorage();
      if (userRankBonus > 0) {
        showToast(`🎉 ${currentSeasonNumber}. SEZON BAŞLADI! Lig ${userRankIndex}.si olduğunuz için +€${userRankBonus.toFixed(2)}M başarı bonusu ve başlangıç bütçesi bonusu (+€${userBaseBonus.toFixed(2)}M) kasanıza eklendi! Güncel Bütçe: €${userTeam.budget.toFixed(2)}M`);
      } else {
        showToast(`🎉 ${currentSeasonNumber}. SEZON BAŞLADI! Başlangıç bütçesi bonusu (+€${userBaseBonus.toFixed(2)}M) kasanıza eklendi. Güncel Kasa: €${userTeam.budget.toFixed(2)}M`);
      }
    } else {
      showToast(`🎉 ${currentSeasonNumber}. SEZON BAŞLADI! Yeni fikstür oluşturuldu.`);
    }

    currentMatchday = 1;
    viewedRoundIndex = 0;
    generateLeagueSchedule();
    renderStandings();
    renderFixtures();
    renderTacticsPitch();
    if (userTeam) {
      renderTransferMarket();
      renderTrainingCenter();
    }

    document.querySelector('.nav-tab[data-view="view-tactics"]').click();
  }
});
