// Floré — Pelvic Floor & Kegel Wellness App
// Core Application Controller

class KegelApp {
  constructor() {
    this.currentView = 'view-home';
    this.exerciseSession = null; // Active exercise session state
    this.timerAnimFrame = null;
    this.isPaused = false;
    this.anatomyCycleTimer = null;
    this.anatomyState = 'relax'; // 'relax' | 'contract'
    
    // Demonstration Engine States
    this.playerViewMode = 'posture'; // 'orb' | 'posture' | 'elevator'
    this.playerPostureMode = 'supine'; // 'supine' | 'seated' | 'standing'
    this.studioActiveTab = 'supine'; // 'supine' | 'seated' | 'standing' | 'elevator' | 'breath'
    this.studioIsPlaying = true;
    this.studioPhaseVal = 0; // 0 to 100
    this.studioAnimTimer = null;
    
    this.init();
  }

  init() {
    // 1. Check Onboarding
    const profile = window.storageManager.getProfile();
    if (!profile || !profile.isOnboarded) {
      this.showOnboarding();
    }

    // 2. Initialize Theme & Sound Preferences
    this.applyStoredSettings();

    // 3. Bind Navigation & UI Events
    this.bindNavigation();
    this.bindExerciseControls();
    this.bindProgramsAndCustom();
    this.bindLearnAndQuiz();
    this.bindSettings();
    this.bindDiscreetMode();
    this.bindDeviceFrameToggle();
    this.bindDemonstrationStudio();

    // 4. Render Active View Content
    this.renderHome();
    this.renderPrograms();
    this.renderProgress();
    this.renderEducation();

    // 5. Initialize Interactive Visualizers
    this.initAnatomyVisualizer();
  }

  // =========================================================
  // THEME & SETTINGS INITIALIZATION
  // =========================================================
  applyStoredSettings() {
    const settings = window.storageManager.getSettings() || {};
    
    // Theme
    if (settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    // Sound & Haptics Sync
    window.soundManager.setPreferences({
      soundEnabled: settings.soundEnabled ?? true,
      voiceEnabled: settings.voiceEnabled ?? false,
      hapticEnabled: settings.hapticEnabled ?? true,
      soundTheme: settings.soundTheme || 'crystal'
    });

    this.updateSoundHeaderIcons(settings.soundEnabled ?? true);
  }

  updateSoundHeaderIcons(isOn) {
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');
    if (iconOn && iconOff) {
      if (isOn) {
        iconOn.classList.remove('hidden');
        iconOff.classList.add('hidden');
      } else {
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
      }
    }
  }

  // =========================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================
  bindNavigation() {
    // Bottom Tab Items
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetView = tab.getAttribute('data-target');
        if (targetView) {
          this.switchView(targetView);
        }
      });
    });

    // Center FAB (Exercise Hero)
    const fabExercise = document.getElementById('btn-nav-exercise-center');
    if (fabExercise) {
      fabExercise.addEventListener('click', () => {
        this.startActiveProgramTodaySession();
      });
    }

    // Header Quick Sound Toggle
    const btnSound = document.getElementById('btn-topbar-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const settings = window.storageManager.getSettings();
        const nextState = !settings.soundEnabled;
        window.storageManager.setSettings({ soundEnabled: nextState });
        window.soundManager.setPreferences({ soundEnabled: nextState });
        this.updateSoundHeaderIcons(nextState);
        this.showToast(nextState ? '🔊 Sound enabled' : '🔇 Sound muted');
      });
    }
  }

  switchView(viewId) {
    this.currentView = viewId;

    // Toggle active screen
    document.querySelectorAll('.app-screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(viewId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Update Bottom Nav Tab Highlights
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.getAttribute('data-target') === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Scroll viewport to top
    const viewport = document.getElementById('screen-viewport');
    if (viewport) viewport.scrollTop = 0;

    // Refresh View-specific state
    if (viewId === 'view-home') this.renderHome();
    if (viewId === 'view-programs') this.renderPrograms();
    if (viewId === 'view-progress') this.renderProgress();
    if (viewId === 'view-learn') this.renderEducation();
    if (viewId === 'view-settings') this.renderSettings();
  }

  // =========================================================
  // SCREEN 1: HOME DASHBOARD LOGIC
  // =========================================================
  renderHome() {
    const stats = window.storageManager.getStats();
    const activeProgData = window.storageManager.getActiveProgram();
    const program = window.programManager.getProgramById(activeProgData.programId);

    // Dynamic Greeting Time Tag
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';
    const greetElem = document.getElementById('greeting-time-tag');
    if (greetElem) greetElem.textContent = greeting;

    // Streak counter in topbar & home
    const streakVal = document.getElementById('streak-counter-val');
    if (streakVal) streakVal.textContent = stats.currentStreak;
    const homeStreak = document.getElementById('home-stat-current-streak');
    if (homeStreak) homeStreak.textContent = stats.currentStreak;

    // Lifetime Stats
    const totalSess = document.getElementById('home-stat-total-sessions');
    if (totalSess) totalSess.textContent = stats.totalSessions;
    const totalMins = document.getElementById('home-stat-total-mins');
    if (totalMins) totalMins.textContent = stats.totalMinutes;

    // Hero Today Session Card details
    const heroChip = document.getElementById('hero-program-chip');
    const heroTitle = document.getElementById('hero-session-title');
    const heroDesc = document.getElementById('hero-session-desc');
    if (heroChip) heroChip.textContent = `${program.title} • Day ${activeProgData.currentDay}`;
    if (heroTitle) heroTitle.textContent = stats.todayCompleted ? "Today's Session Completed! 🎉" : "Gentle Lift & Conscious Release";
    if (heroDesc) {
      heroDesc.textContent = stats.todayCompleted 
        ? "You completed today's exercise! Feel free to practice an extra quick session or focus on deep relaxation breathing."
        : `Focus on smooth ${program.stats.contractHoldSeconds}s holds and full ${program.stats.relaxSeconds}s relaxation intervals. Breathe normally.`;
    }

    // Hero Start Button
    const btnHero = document.getElementById('btn-start-today-hero');
    if (btnHero) {
      btnHero.onclick = () => this.startActiveProgramTodaySession();
      if (stats.todayCompleted) {
        btnHero.innerHTML = '<span>▶ Practice Extra Session</span>';
      } else {
        btnHero.innerHTML = '<span class="btn-icon">▶</span><span>Start Today\'s Exercise</span>';
      }
    }

    // Quick Actions
    const btnQuick3 = document.getElementById('btn-quick-3min');
    if (btnQuick3) {
      btnQuick3.onclick = () => {
        const quickProg = window.programManager.getProgramById('quick_3min');
        const sessionConfig = window.programManager.buildFromProgram(quickProg, 1);
        this.launchExercisePlayer(sessionConfig);
      };
    }

    const btnQuickRelax = document.getElementById('btn-quick-relax');
    if (btnQuickRelax) {
      btnQuickRelax.onclick = () => {
        const relaxProg = window.programManager.getProgramById('relax_10');
        const sessionConfig = window.programManager.buildFromProgram(relaxProg, 1);
        this.launchExercisePlayer(sessionConfig);
      };
    }

    // Render Weekly 7-Day Consistency Row
    this.renderHomeWeeklyDays(stats.weeklyData);

    // Initialize Live Body Technique Demo on Home
    this.initHomeLiveDemo();

    // Wellness tip button
    const btnTipLearn = document.getElementById('btn-tip-learn-more');
    if (btnTipLearn) {
      btnTipLearn.onclick = () => this.switchView('view-learn');
    }
  }

  initHomeLiveDemo() {
    const homeSvg = document.getElementById('home-live-demo-svg');
    if (!homeSvg) return;

    if (!this.homePostureMode) this.homePostureMode = 'supine';

    // Posture switcher buttons on Home
    const postureBtns = document.querySelectorAll('.btn-home-posture');
    postureBtns.forEach(btn => {
      btn.onclick = () => {
        postureBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.homePostureMode = btn.getAttribute('data-posture') || 'supine';
        this.renderHomeLiveDemoSVG(this.homeDemoProgress || 0);
      };
    });

    const btnOpenStudio = document.getElementById('btn-home-open-full-studio');
    if (btnOpenStudio) {
      btnOpenStudio.onclick = () => {
        const modal = document.getElementById('exercise-demo-modal');
        if (modal) {
          modal.classList.remove('hidden');
          this.setStudioTab(this.homePostureMode || 'supine');
          this.startStudioAnimation();
        }
      };
    }

    // Auto-loop ticker for continuous home screen visual demonstration
    if (this.homeDemoInterval) clearInterval(this.homeDemoInterval);
    let forward = true;
    this.homeDemoProgress = 0;
    this.homeDemoInterval = setInterval(() => {
      if (forward) {
        this.homeDemoProgress += 1.5;
        if (this.homeDemoProgress >= 100) {
          this.homeDemoProgress = 100;
          forward = false;
        }
      } else {
        this.homeDemoProgress -= 1.5;
        if (this.homeDemoProgress <= 0) {
          this.homeDemoProgress = 0;
          forward = true;
        }
      }
      this.renderHomeLiveDemoSVG(this.homeDemoProgress);
    }, 45);
  }

  renderHomeLiveDemoSVG(progress) {
    const svg = document.getElementById('home-live-demo-svg');
    const pill = document.getElementById('home-demo-phase-pill');
    if (!svg) return;

    const ratio = Math.max(0, Math.min(1, progress / 100)); // 0 (full relax) to 1 (full lift)
    const isLifting = ratio > 0.35;

    if (pill) {
      if (ratio < 0.25) {
        pill.textContent = '🌿 Inhale & 100% Relax';
        pill.style.color = 'var(--color-relax)';
        pill.style.background = 'var(--color-relax-light)';
      } else if (ratio < 0.75) {
        pill.textContent = '🌊 Exhale & Gentle Lift ↑';
        pill.style.color = 'var(--color-primary)';
        pill.style.background = 'var(--color-primary-light)';
      } else {
        pill.textContent = '✨ Steady Gentle Hold';
        pill.style.color = 'var(--color-hold)';
        pill.style.background = 'var(--color-hold-light)';
      }
    }

    const posture = this.homePostureMode || 'supine';

    if (posture === 'supine') {
      const slingCurve = 22 - (ratio * 26); // from 22 (dropped) to -4 (lifted)
      const lungSize = 13 - (ratio * 4); // 13 down to 9
      const diaY = ratio * -6;

      svg.innerHTML = `
        <rect x="20" y="195" width="300" height="6" rx="3" fill="var(--border-color)"/>
        <!-- Head & Pillow -->
        <ellipse cx="65" cy="165" rx="18" ry="12" fill="#CBD5E1" opacity="0.6"/>
        <circle cx="65" cy="155" r="15" fill="var(--text-secondary)"/>
        <!-- Torso Line -->
        <path d="M 80 162 Q 120 162 170 166 Q 200 168 225 174" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round"/>
        <!-- Bent Legs with Feet Flat -->
        <path d="M 225 174 L 270 110 L 305 195" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Arms Resting -->
        <path d="M 100 168 L 170 178" fill="none" stroke="var(--text-muted)" stroke-width="6" stroke-linecap="round"/>
        <!-- Lungs Indicator -->
        <g transform="translate(125, 142)">
          <ellipse cx="-8" cy="0" rx="${lungSize * 0.8}" ry="${lungSize}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="1.5"/>
          <ellipse cx="8" cy="0" rx="${lungSize * 0.8}" ry="${lungSize}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="1.5"/>
        </g>
        <!-- Diaphragm -->
        <path d="M 105 ${158 + diaY} Q 125 ${150 + diaY} 145 ${158 + diaY}" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
        <!-- Pelvic Sling -->
        <g transform="translate(210, 166)">
          <path d="M -24 8 Q 0 ${slingCurve} 24 8" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
          <circle cx="0" cy="${slingCurve / 2}" r="5" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}"/>
          <g transform="translate(0, 8) scale(1, ${isLifting ? 1 : -1})">
            <line x1="0" y1="10" x2="0" y2="-6" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
            <polyline points="-4,-2 0,-8 4,-2" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
          </g>
          <text x="0" y="-12" text-anchor="middle" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
            ${isLifting ? 'Pelvic Lift ↑' : '100% Release ↓'}
          </text>
        </g>
      `;
    } else if (posture === 'seated') {
      const slingCurve = 18 - (ratio * 24);
      svg.innerHTML = `
        <g transform="translate(40, 0)">
          <!-- Chair -->
          <path d="M 100 110 L 100 200 M 100 160 L 160 160 L 160 200" fill="none" stroke="var(--border-color)" stroke-width="6" stroke-linecap="round"/>
          <circle cx="130" cy="45" r="16" fill="var(--text-secondary)"/>
          <path d="M 130 62 L 130 155" fill="none" stroke="var(--text-secondary)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 130 155 L 180 155 L 180 200" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 130 90 L 155 125 L 140 150" fill="none" stroke="var(--text-muted)" stroke-width="6" stroke-linecap="round"/>
          <!-- Pelvic Sling -->
          <g transform="translate(130, 154)">
            <path d="M -22 6 Q 0 ${slingCurve} 22 6" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
            <text x="32" y="5" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
              ${isLifting ? 'Lift Upward ↑' : 'Drop & Open 🌿'}
            </text>
          </g>
        </g>
      `;
    } else if (posture === 'standing') {
      const slingCurve = 16 - (ratio * 22);
      svg.innerHTML = `
        <g transform="translate(40, 0)">
          <circle cx="140" cy="35" r="15" fill="var(--text-secondary)"/>
          <path d="M 140 50 L 140 135" fill="none" stroke="var(--text-secondary)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 140 135 L 128 205 M 140 135 L 152 205" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round"/>
          <!-- Pelvic Sling -->
          <g transform="translate(140, 134)">
            <path d="M -20 6 Q 0 ${slingCurve} 20 6" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
            <text x="28" y="5" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
              ${isLifting ? 'Pelvic Lift ↑' : 'Baseline Release 🌿'}
            </text>
          </g>
        </g>
      `;
    }
  }

  renderHomeWeeklyDays(weeklyData) {
    const container = document.getElementById('home-weekly-days-container');
    const summaryLabel = document.getElementById('weekly-completion-summary');
    if (!container) return;

    let completedCount = 0;
    container.innerHTML = '';

    weeklyData.forEach(day => {
      if (day.completed) completedCount++;

      const bubble = document.createElement('div');
      bubble.className = 'weekly-day-bubble';

      const label = document.createElement('span');
      label.className = 'day-label';
      label.textContent = day.dayName;

      const circle = document.createElement('div');
      circle.className = `day-circle ${day.completed ? 'completed' : ''} ${day.isToday ? 'is-today' : ''}`;
      circle.textContent = day.completed ? '✓' : day.dayNum;

      bubble.appendChild(label);
      bubble.appendChild(circle);
      container.appendChild(bubble);
    });

    if (summaryLabel) {
      summaryLabel.textContent = `${completedCount} / 7 days`;
    }
  }

  startActiveProgramTodaySession() {
    const activeProg = window.storageManager.getActiveProgram();
    const program = window.programManager.getProgramById(activeProg.programId);
    const sessionConfig = window.programManager.buildFromProgram(program, activeProg.currentDay);
    this.launchExercisePlayer(sessionConfig);
  }

  // =========================================================
  // SCREEN 2: PROGRAMS & CUSTOM WORKOUTS LOGIC
  // =========================================================
  renderPrograms() {
    const activeProg = window.storageManager.getActiveProgram();
    const currentProg = window.programManager.getProgramById(activeProg.programId);
    const allPrograms = window.programManager.getAllPrograms();

    // Active Program Banner
    const activeTitle = document.getElementById('active-prog-title');
    const activeDesc = document.getElementById('active-prog-desc');
    const activeIcon = document.getElementById('active-prog-icon');
    const activeFill = document.getElementById('active-prog-progress-fill');
    const activeStepLabel = document.getElementById('active-prog-step-label');
    const activePct = document.getElementById('active-prog-pct');
    const btnContinue = document.getElementById('btn-continue-active-prog');

    if (activeTitle) activeTitle.textContent = currentProg.title;
    if (activeDesc) activeDesc.textContent = currentProg.description;
    if (activeIcon) activeIcon.textContent = currentProg.icon;

    const totalDays = currentProg.durationDays || 7;
    const completedCount = activeProg.completedDays ? activeProg.completedDays.length : 0;
    const pct = Math.min(100, Math.round((completedCount / totalDays) * 100));

    if (activeFill) activeFill.style.width = `${pct}%`;
    if (activeStepLabel) activeStepLabel.textContent = `Day ${activeProg.currentDay} of ${totalDays}`;
    if (activePct) activePct.textContent = `${pct}% Complete`;
    if (btnContinue) {
      btnContinue.textContent = `Continue Day ${activeProg.currentDay} Session`;
      btnContinue.onclick = () => this.startActiveProgramTodaySession();
    }

    // Render Preset Programs List
    const presetContainer = document.getElementById('preset-programs-list');
    if (presetContainer) {
      presetContainer.innerHTML = '';
      allPrograms.forEach(prog => {
        const isCurrent = prog.id === activeProg.programId;
        const card = document.createElement('div');
        card.className = 'program-card';
        card.innerHTML = `
          <div class="program-card-header">
            <div class="program-card-header-left">
              <span style="font-size: 1.4rem;">${prog.icon}</span>
              <div>
                <h4 class="program-card-title">${prog.title}</h4>
                <span class="program-card-tagline">${prog.tagline}</span>
              </div>
            </div>
            <span class="prog-chip-level">${prog.level}</span>
          </div>
          <p class="program-card-desc">${prog.description}</p>
          <div class="program-card-stats-row">
            <span>⏱️ ${prog.durationDays} Days</span>
            <span>🎯 ${prog.stats.contractHoldSeconds}s hold / ${prog.stats.relaxSeconds}s relax</span>
            <span>⚡ ${prog.stats.sets} sets × ${prog.stats.repsPerSet} reps</span>
          </div>
          <div class="program-card-actions">
            <button class="btn-primary btn-full btn-start-prog" data-id="${prog.id}">
              ${isCurrent ? '▶ Start Today\'s Session' : 'Set as Active & Start'}
            </button>
          </div>
        `;

        const startBtn = card.querySelector('.btn-start-prog');
        startBtn.onclick = () => {
          if (!isCurrent) {
            window.storageManager.setActiveProgram({
              programId: prog.id,
              currentDay: 1,
              startedAt: new Date().toISOString(),
              completedDays: []
            });
            this.showToast(`Active program set to ${prog.title}`);
          }
          const activeState = window.storageManager.getActiveProgram();
          const session = window.programManager.buildFromProgram(prog, activeState.currentDay);
          this.launchExercisePlayer(session);
        };

        presetContainer.appendChild(card);
      });
    }

    // Render Custom Routines
    this.renderCustomRoutines();
  }

  renderCustomRoutines() {
    const container = document.getElementById('custom-routines-container');
    if (!container) return;
    const customRoutines = window.storageManager.getCustomRoutines();

    if (customRoutines.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 14px; color: var(--text-muted); font-size: 0.82rem;">
          No custom routines created yet. Tap "+ Custom Session" above to create your own rhythm.
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    customRoutines.forEach(routine => {
      const item = document.createElement('div');
      item.className = 'custom-routine-item';
      item.innerHTML = `
        <div>
          <div class="custom-item-name">${routine.name}</div>
          <div class="custom-item-meta">Hold: ${routine.contractSeconds}s • Relax: ${routine.relaxSeconds}s • ${routine.sets} sets × ${routine.reps} reps</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-primary btn-outline-small btn-run-custom" title="Start Session">▶ Start</button>
          <button class="btn-delete-history btn-del-custom" title="Delete Routine">✕</button>
        </div>
      `;

      item.querySelector('.btn-run-custom').onclick = () => {
        const sessionConfig = window.programManager.generateSessionTimeline({
          title: routine.name,
          programId: 'custom_' + routine.id,
          contractSeconds: routine.contractSeconds,
          relaxSeconds: routine.relaxSeconds,
          reps: routine.reps,
          sets: routine.sets,
          restBetweenSets: routine.restBetweenSets
        });
        this.launchExercisePlayer(sessionConfig);
      };

      item.querySelector('.btn-del-custom').onclick = () => {
        if (confirm(`Delete custom routine "${routine.name}"?`)) {
          window.storageManager.deleteCustomRoutine(routine.id);
          this.renderCustomRoutines();
          this.showToast('Custom routine deleted');
        }
      };

      container.appendChild(item);
    });
  }

  bindProgramsAndCustom() {
    const btnOpenCustom = document.getElementById('btn-open-custom-builder');
    const modalCustom = document.getElementById('custom-builder-modal');
    const btnCloseCustom = document.getElementById('btn-close-custom-builder');
    const btnCancelCustom = document.getElementById('btn-cancel-custom');
    const formCustom = document.getElementById('custom-routine-form');

    if (btnOpenCustom && modalCustom) {
      btnOpenCustom.onclick = () => modalCustom.classList.remove('hidden');
    }

    const closeCustom = () => {
      if (modalCustom) modalCustom.classList.add('hidden');
    };
    if (btnCloseCustom) btnCloseCustom.onclick = closeCustom;
    if (btnCancelCustom) btnCancelCustom.onclick = closeCustom;

    // Custom form inputs calculation preview
    const updateCustomPreview = () => {
      const contract = parseInt(document.getElementById('custom-contract')?.value || 4);
      const relax = parseInt(document.getElementById('custom-relax')?.value || 6);
      const reps = parseInt(document.getElementById('custom-reps')?.value || 8);
      const sets = parseInt(document.getElementById('custom-sets')?.value || 2);
      const rest = parseInt(document.getElementById('custom-rest')?.value || 20);

      const totalSec = 3 + (sets * reps * (contract + relax)) + ((sets - 1) * rest) + 5;
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const preview = document.getElementById('custom-summary-preview');
      if (preview) {
        preview.textContent = `Estimated Duration: ~${mins} min ${secs} sec (${reps * sets} total reps)`;
      }
    };

    ['custom-contract', 'custom-relax', 'custom-reps', 'custom-sets', 'custom-rest'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateCustomPreview);
    });

    if (formCustom) {
      formCustom.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('custom-name').value.trim() || 'Custom Routine';
        const contractSeconds = parseInt(document.getElementById('custom-contract').value) || 4;
        const relaxSeconds = parseInt(document.getElementById('custom-relax').value) || 6;
        const reps = parseInt(document.getElementById('custom-reps').value) || 8;
        const sets = parseInt(document.getElementById('custom-sets').value) || 1;
        const restBetweenSets = parseInt(document.getElementById('custom-rest').value) || 15;

        const newRoutine = window.storageManager.addCustomRoutine({
          name,
          contractSeconds,
          relaxSeconds,
          reps,
          sets,
          restBetweenSets
        });

        closeCustom();
        this.renderCustomRoutines();
        this.showToast(`Custom session "${name}" created!`);

        // Launch immediately
        const sessionConfig = window.programManager.generateSessionTimeline({
          title: name,
          programId: newRoutine.id,
          contractSeconds,
          relaxSeconds,
          reps,
          sets,
          restBetweenSets
        });
        this.launchExercisePlayer(sessionConfig);
      };
    }
  }

  // =========================================================
  // SCREEN 3: PROGRESS & ANALYTICS LOGIC
  // =========================================================
  renderProgress() {
    const stats = window.storageManager.getStats();
    const history = window.storageManager.getHistory();
    const badges = window.storageManager.getBadges();

    // KPIs
    const pStreak = document.getElementById('progress-stat-streak');
    const pLongest = document.getElementById('progress-stat-longest');
    const pMinutes = document.getElementById('progress-stat-minutes');
    const pSessions = document.getElementById('progress-stat-sessions');

    if (pStreak) pStreak.textContent = stats.currentStreak;
    if (pLongest) pLongest.textContent = stats.longestStreak;
    if (pMinutes) pMinutes.textContent = stats.totalMinutes;
    if (pSessions) pSessions.textContent = stats.totalSessions;

    // Weekly SVG Bar Chart
    this.renderWeeklyBarChart(stats.weeklyData);

    // Monthly Calendar
    this.renderMonthlyCalendar(history);

    // Badges Grid
    this.renderBadgesGrid(badges);

    // History Log
    this.renderHistoryLog(history);
  }

  renderWeeklyBarChart(weeklyData) {
    const container = document.getElementById('weekly-bar-chart-container');
    if (!container) return;

    const maxMinutes = Math.max(8, ...weeklyData.map(d => d.minutes));
    const width = 320;
    const height = 150;
    const barWidth = 26;
    const gap = (width - 40 - (weeklyData.length * barWidth)) / (weeklyData.length - 1);

    let barsSvg = '';
    weeklyData.forEach((day, index) => {
      const x = 20 + index * (barWidth + gap);
      const barHeight = day.minutes > 0 ? Math.max(12, (day.minutes / maxMinutes) * 90) : 4;
      const y = 110 - barHeight;
      const fill = day.completed ? 'var(--color-primary)' : 'var(--border-color)';
      const textFill = day.isToday ? 'var(--color-primary)' : 'var(--text-muted)';
      const textWeight = day.isToday ? '800' : '600';

      barsSvg += `
        <g class="chart-bar-group">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${fill}">
            <title>${day.dayName}: ${day.minutes} mins (${day.sessionCount} sessions)</title>
          </rect>
          ${day.minutes > 0 ? `<text x="${x + barWidth/2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-primary)">${day.minutes}m</text>` : ''}
          <text x="${x + barWidth/2}" y="130" text-anchor="middle" font-size="11" font-weight="${textWeight}" fill="${textFill}">${day.dayName}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <!-- Baseline rule -->
        <line x1="10" y1="112" x2="${width - 10}" y2="112" stroke="var(--border-light)" stroke-width="1.5" />
        ${barsSvg}
      </svg>
    `;
  }

  renderMonthlyCalendar(history) {
    const container = document.getElementById('calendar-days-container');
    const monthLabel = document.getElementById('progress-current-month-label');
    if (!container) return;

    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (monthLabel) {
      monthLabel.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    const monthData = window.storageManager.getMonthActivityData(history);
    container.innerHTML = '';

    // Calculate leading empty cells for day of week alignment
    const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0 is Sun
    const leadingEmpty = (firstDayIndex + 6) % 7; // Monday-first offset

    for (let i = 0; i < leadingEmpty; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell';
      empty.style.opacity = '0';
      container.appendChild(empty);
    }

    monthData.forEach(day => {
      const cell = document.createElement('div');
      cell.className = `cal-day-cell ${day.completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}`;
      cell.textContent = day.completed ? '✓' : day.dayNum;
      cell.title = `${day.dateStr}: ${day.count} sessions`;
      container.appendChild(cell);
    });
  }

  renderBadgesGrid(badges) {
    const container = document.getElementById('badges-container');
    const countLabel = document.getElementById('badges-unlocked-count');
    if (!container) return;

    const unlockedCount = badges.filter(b => b.unlockedAt).length;
    if (countLabel) countLabel.textContent = `${unlockedCount} / ${badges.length} Unlocked`;

    container.innerHTML = '';
    badges.forEach(b => {
      const isUnlocked = !!b.unlockedAt;
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <span class="badge-icon">${b.icon}</span>
        <div class="badge-info">
          <h4>${b.name}</h4>
          <p>${b.desc}</p>
          ${isUnlocked ? `<span style="font-size: 0.68rem; color: #B45309; font-weight: 700;">Unlocked</span>` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderHistoryLog(history) {
    const container = document.getElementById('history-log-container');
    const totalCount = document.getElementById('history-total-count');
    if (!container) return;

    if (totalCount) totalCount.textContent = `${history.length} entries`;

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 0.82rem;">
          No sessions recorded yet. Start your first exercise today!
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    history.slice(0, 10).forEach(item => {
      const d = new Date(item.date);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const mins = Math.floor(item.durationSeconds / 60);
      const secs = item.durationSeconds % 60;

      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-item-left">
          <h4>${item.programTitle}</h4>
          <p>${dateStr} • ${item.repsCompleted} reps</p>
        </div>
        <div class="history-item-right">
          <span class="history-duration">${mins}m ${secs}s</span>
          <button class="btn-delete-history" data-id="${item.id}" title="Delete Record">✕</button>
        </div>
      `;

      row.querySelector('.btn-delete-history').onclick = (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('Delete this session log entry?')) {
          window.storageManager.deleteHistoryItem(id);
          this.renderProgress();
          this.renderHome();
          this.showToast('Session record deleted');
        }
      };

      container.appendChild(row);
    });
  }

  // =========================================================
  // SCREEN 4: LEARN & EDUCATION LIBRARY LOGIC
  // =========================================================
  renderEducation() {
    const articlesContainer = document.getElementById('education-articles-list');
    if (!articlesContainer) return;
    const articles = window.educationManager.getAllArticles();

    articlesContainer.innerHTML = '';
    articles.forEach(art => {
      const card = document.createElement('div');
      card.className = 'article-card';
      card.innerHTML = `
        <div class="article-card-left">
          <div class="article-card-icon">${art.icon}</div>
          <div>
            <span class="article-card-meta">${art.category} • ${art.readTime}</span>
            <h4 class="article-card-title">${art.title}</h4>
            <p class="article-card-summary">${art.summary}</p>
          </div>
        </div>
        <span style="color: var(--color-primary); font-weight: 700;">→</span>
      `;

      card.onclick = () => this.openArticleModal(art);
      articlesContainer.appendChild(card);
    });
  }

  openArticleModal(article) {
    const modal = document.getElementById('article-modal');
    const title = document.getElementById('article-modal-title');
    const category = document.getElementById('article-modal-category');
    const body = document.getElementById('article-modal-body');

    if (!modal) return;
    if (title) title.textContent = article.title;
    if (category) category.textContent = article.category;
    if (body) body.innerHTML = article.content;

    modal.classList.remove('hidden');
  }

  initAnatomyVisualizer() {
    const btnRelax = document.getElementById('btn-sling-relax');
    const btnContract = document.getElementById('btn-sling-contract');
    const btnCycle = document.getElementById('btn-sling-cycle');

    if (btnRelax) btnRelax.onclick = () => this.setAnatomyState('relax');
    if (btnContract) btnContract.onclick = () => this.setAnatomyState('contract');
    if (btnCycle) btnCycle.onclick = () => this.toggleAnatomyCycle();
  }

  setAnatomyState(state) {
    this.anatomyState = state;
    const sling = document.getElementById('anatomy-sling-path');
    const bladder = document.getElementById('anatomy-bladder');
    const arrows = document.getElementById('anatomy-arrows');
    const label = document.getElementById('anatomy-state-label');
    const btnRelax = document.getElementById('btn-sling-relax');
    const btnContract = document.getElementById('btn-sling-contract');

    if (state === 'contract') {
      // Lift sling upward (curve becomes shallower and lifts higher)
      if (sling) {
        sling.setAttribute('d', 'M 60 90 Q 160 105 260 90');
        sling.style.stroke = 'var(--color-primary)';
      }
      if (bladder) bladder.setAttribute('cy', '68');
      if (arrows) {
        arrows.setAttribute('transform', 'translate(160, 110) scale(1, 1)');
        arrows.style.opacity = '1';
      }
      if (label) {
        label.textContent = 'State: Active Contraction (Upward Lift)';
        label.style.color = 'var(--color-primary)';
      }
      if (btnRelax) btnRelax.classList.remove('active');
      if (btnContract) btnContract.classList.add('active');
    } else {
      // Relaxed baseline (sling drops lower into resting sling)
      if (sling) {
        sling.setAttribute('d', 'M 60 90 Q 160 145 260 90');
        sling.style.stroke = 'var(--color-relax)';
      }
      if (bladder) bladder.setAttribute('cy', '80');
      if (arrows) {
        arrows.setAttribute('transform', 'translate(160, 130) scale(1, -1)');
        arrows.style.opacity = '0.4';
      }
      if (label) {
        label.textContent = 'State: Resting Baseline (Full Release)';
        label.style.color = 'var(--color-relax)';
      }
      if (btnRelax) btnRelax.classList.add('active');
      if (btnContract) btnContract.classList.remove('active');
    }
  }

  toggleAnatomyCycle() {
    const btnCycle = document.getElementById('btn-sling-cycle');
    if (this.anatomyCycleTimer) {
      clearInterval(this.anatomyCycleTimer);
      this.anatomyCycleTimer = null;
      if (btnCycle) btnCycle.classList.remove('active');
    } else {
      if (btnCycle) btnCycle.classList.add('active');
      this.anatomyCycleTimer = setInterval(() => {
        const next = this.anatomyState === 'relax' ? 'contract' : 'relax';
        this.setAnatomyState(next);
      }, 2500);
    }
  }

  bindLearnAndQuiz() {
    // Article Modal Close
    const modalArt = document.getElementById('article-modal');
    const btnCloseArt1 = document.getElementById('btn-close-article-modal');
    const btnCloseArt2 = document.getElementById('btn-close-article-bottom');
    const closeArt = () => { if (modalArt) modalArt.classList.add('hidden'); };
    if (btnCloseArt1) btnCloseArt1.onclick = closeArt;
    if (btnCloseArt2) btnCloseArt2.onclick = closeArt;

    // Quiz Modal
    const btnOpenQuiz = document.getElementById('btn-open-quiz');
    const modalQuiz = document.getElementById('quiz-modal');
    const btnCloseQuiz = document.getElementById('btn-close-quiz');

    if (btnOpenQuiz && modalQuiz) {
      btnOpenQuiz.onclick = () => {
        this.renderQuizContent();
        modalQuiz.classList.remove('hidden');
      };
    }
    if (btnCloseQuiz && modalQuiz) {
      btnCloseQuiz.onclick = () => modalQuiz.classList.add('hidden');
    }
  }

  renderQuizContent() {
    const container = document.getElementById('quiz-content-area');
    if (!container) return;
    const questions = window.educationManager.getQuiz();

    let currentQ = 0;
    let score = 0;

    const renderQuestion = (qIndex) => {
      if (qIndex >= questions.length) {
        container.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
            <h3 style="font-size: 1.3rem; margin-bottom: 6px;">Quiz Completed!</h3>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">You scored ${score} out of ${questions.length}. You have a great grasp of safe, gentle pelvic floor technique.</p>
            <button class="btn-primary btn-full" id="btn-finish-quiz-done">Done</button>
          </div>
        `;
        document.getElementById('btn-finish-quiz-done').onclick = () => {
          document.getElementById('quiz-modal').classList.add('hidden');
        };
        return;
      }

      const q = questions[qIndex];
      container.innerHTML = `
        <div class="quiz-q-box">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">Question ${qIndex + 1} of ${questions.length}</div>
          <h4 class="quiz-q-title">${q.question}</h4>
          <div class="quiz-options-list">
            ${q.options.map((opt, i) => `
              <button class="quiz-opt-btn" data-index="${i}">${opt.text}</button>
            `).join('')}
          </div>
          <div id="quiz-feedback-box" class="quiz-feedback hidden"></div>
        </div>
      `;

      container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
        btn.onclick = () => {
          const optIdx = parseInt(btn.getAttribute('data-index'));
          const selected = q.options[optIdx];
          const feedbackBox = document.getElementById('quiz-feedback-box');

          // Disable all buttons
          container.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);

          if (selected.correct) {
            btn.classList.add('correct');
            score++;
            window.soundManager.playBell(659.25, 0.8);
          } else {
            btn.classList.add('wrong');
            // Highlight correct one
            container.querySelectorAll('.quiz-opt-btn').forEach((b, idx) => {
              if (q.options[idx].correct) b.classList.add('correct');
            });
            window.soundManager.playTone(300, 0.4, 'sine');
          }

          if (feedbackBox) {
            feedbackBox.innerHTML = `
              <strong>${selected.correct ? '✓ Correct!' : '💡 Tip:'}</strong> ${selected.feedback}
              <button class="btn-primary btn-full mt-medium" id="btn-next-q">Next Question →</button>
            `;
            feedbackBox.classList.remove('hidden');
            document.getElementById('btn-next-q').onclick = () => renderQuestion(qIndex + 1);
          }
        };
      });
    };

    renderQuestion(0);
  }

  // =========================================================
  // SCREEN 5: SETTINGS & DATA MANAGEMENT
  // =========================================================
  renderSettings() {
    const settings = window.storageManager.getSettings();
    const profile = window.storageManager.getProfile();
    const reminders = window.storageManager.getReminders();

    // Toggles
    const remToggle = document.getElementById('setting-reminders-toggle');
    const soundToggle = document.getElementById('setting-sound-toggle');
    const voiceToggle = document.getElementById('setting-voice-toggle');
    const hapticToggle = document.getElementById('setting-haptic-toggle');
    const soundThemeSelect = document.getElementById('setting-sound-theme');
    const themeSelect = document.getElementById('setting-theme-select');
    const goalSelect = document.getElementById('setting-goal-select');

    if (remToggle) remToggle.checked = settings.remindersEnabled ?? true;
    if (soundToggle) soundToggle.checked = settings.soundEnabled ?? true;
    if (voiceToggle) voiceToggle.checked = settings.voiceEnabled ?? false;
    if (hapticToggle) hapticToggle.checked = settings.hapticEnabled ?? true;
    if (soundThemeSelect) soundThemeSelect.value = settings.soundTheme || 'crystal';
    if (themeSelect) themeSelect.value = settings.theme || 'light';
    if (goalSelect && profile) goalSelect.value = profile.goal || 'awareness';

    // Render Reminders sublist
    this.renderRemindersSublist(reminders);
  }

  renderRemindersSublist(reminders) {
    const container = document.getElementById('reminders-list-container');
    if (!container) return;

    container.innerHTML = '';
    reminders.forEach(rem => {
      const row = document.createElement('div');
      row.className = 'reminder-row-item';
      row.innerHTML = `
        <div>
          <strong style="font-size: 0.9rem;">${rem.time}</strong>
          <span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 8px;">${rem.label}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="toggle-switch">
            <input type="checkbox" class="rem-toggle-item" data-id="${rem.id}" ${rem.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <button class="btn-delete-history btn-del-rem" data-id="${rem.id}">✕</button>
        </div>
      `;

      row.querySelector('.rem-toggle-item').onchange = (e) => {
        rem.enabled = e.target.checked;
        window.storageManager.saveReminders(reminders);
        this.showToast(rem.enabled ? `Reminder ${rem.time} enabled` : `Reminder disabled`);
      };

      row.querySelector('.btn-del-rem').onclick = () => {
        const filtered = reminders.filter(r => r.id !== rem.id);
        window.storageManager.saveReminders(filtered);
        this.renderRemindersSublist(filtered);
        this.showToast('Reminder removed');
      };

      container.appendChild(row);
    });
  }

  bindSettings() {
    // Sound settings change
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.onchange = (e) => {
        window.storageManager.setSettings({ soundEnabled: e.target.checked });
        window.soundManager.setPreferences({ soundEnabled: e.target.checked });
        this.updateSoundHeaderIcons(e.target.checked);
      };
    }

    const voiceToggle = document.getElementById('setting-voice-toggle');
    if (voiceToggle) {
      voiceToggle.onchange = (e) => {
        window.storageManager.setSettings({ voiceEnabled: e.target.checked });
        window.soundManager.setPreferences({ voiceEnabled: e.target.checked });
        if (e.target.checked) window.soundManager.speak('Voice cues enabled');
      };
    }

    const hapticToggle = document.getElementById('setting-haptic-toggle');
    if (hapticToggle) {
      hapticToggle.onchange = (e) => {
        window.storageManager.setSettings({ hapticEnabled: e.target.checked });
        window.soundManager.setPreferences({ hapticEnabled: e.target.checked });
        if (e.target.checked) window.soundManager.triggerVibrate([50]);
      };
    }

    const soundThemeSelect = document.getElementById('setting-sound-theme');
    if (soundThemeSelect) {
      soundThemeSelect.onchange = (e) => {
        window.storageManager.setSettings({ soundTheme: e.target.value });
        window.soundManager.setPreferences({ soundTheme: e.target.value });
        window.soundManager.onPhaseStart('contract');
      };
    }

    // Theme selector
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) {
      themeSelect.onchange = (e) => {
        window.storageManager.setSettings({ theme: e.target.value });
        this.applyStoredSettings();
      };
    }

    // Goal change
    const goalSelect = document.getElementById('setting-goal-select');
    if (goalSelect) {
      goalSelect.onchange = (e) => {
        window.storageManager.setProfile({ goal: e.target.value });
        this.showToast('Goal preference saved');
      };
    }

    // Add Reminder Button
    const btnAddRem = document.getElementById('btn-add-reminder');
    if (btnAddRem) {
      btnAddRem.onclick = () => {
        const timeStr = prompt('Enter reminder time (24h format, e.g. 14:30):', '12:00');
        if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
          const reminders = window.storageManager.getReminders();
          reminders.push({ id: 'rem_' + Date.now(), time: timeStr, label: 'Daily Session', enabled: true });
          window.storageManager.saveReminders(reminders);
          this.renderRemindersSublist(reminders);
          this.showToast(`Reminder set for ${timeStr}`);
        }
      };
    }

    // Test Notification
    const btnTestNotif = document.getElementById('btn-test-notification');
    if (btnTestNotif) {
      btnTestNotif.onclick = () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Floré Wellness', {
                body: 'Your wellness session is ready. (Discreet Reminder)',
                icon: '🌱'
              });
            }
          });
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Floré Wellness', {
            body: 'Your wellness session is ready. (Discreet Reminder)',
            icon: '🌱'
          });
        }
        this.showToast('🔔 "Your wellness session is ready."');
      };
    }

    // Export Data JSON
    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
      btnExport.onclick = () => {
        const json = window.storageManager.exportDataJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flore_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!');
      };
    }

    // Import Data JSON
    const btnImportTrigger = document.getElementById('btn-import-data-trigger');
    const fileInput = document.getElementById('file-import-input');
    if (btnImportTrigger && fileInput) {
      btnImportTrigger.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = window.storageManager.importDataJSON(ev.target.result);
            if (res.success) {
              this.applyStoredSettings();
              this.renderHome();
              this.renderPrograms();
              this.renderProgress();
              this.showToast('Data imported successfully!');
            } else {
              alert('Failed to import file: ' + res.error);
            }
          };
          reader.readAsText(file);
        }
      };
    }

    // Reset All Data
    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.onclick = () => {
        if (confirm('Are you sure you want to reset all data and clear session logs? This action cannot be undone.')) {
          window.storageManager.resetAllData();
          this.applyStoredSettings();
          this.renderHome();
          this.renderPrograms();
          this.renderProgress();
          this.showToast('App reset to clean state');
        }
      };
    }
  }

  // =========================================================
  // GUIDED EXERCISE PLAYER ENGINE (HERO FEATURE)
  // =========================================================
  launchExercisePlayer(sessionConfig) {
    window.soundManager.initAudio();
    const modal = document.getElementById('exercise-player-modal');
    if (!modal) return;

    this.exerciseSession = {
      config: sessionConfig,
      currentStepIndex: 0,
      phaseElapsedSeconds: 0,
      totalElapsedSeconds: 0,
      startTimeStamp: performance.now(),
      phaseStartTimeStamp: performance.now(),
      isPaused: false,
      repsCompleted: 0
    };

    modal.classList.remove('hidden');
    this.switchPlayerView(this.playerViewMode || 'posture');
    this.switchPlayerPosture(this.playerPostureMode || 'supine');
    this.startPhase(0);
  }

  startPhase(stepIndex) {
    if (!this.exerciseSession) return;
    const timeline = this.exerciseSession.config.timeline;

    if (stepIndex >= timeline.length) {
      this.completeSession();
      return;
    }

    this.exerciseSession.currentStepIndex = stepIndex;
    const currentStep = timeline[stepIndex];
    this.exerciseSession.phaseStartTimeStamp = performance.now();
    this.exerciseSession.phaseElapsedSeconds = 0;

    // Track completed reps
    if (currentStep.phase === 'relax' && currentStep.rep) {
      this.exerciseSession.repsCompleted = Math.max(this.exerciseSession.repsCompleted, currentStep.rep);
    }

    // Update Player UI & Color Themes
    this.updatePlayerUI(currentStep);

    // Trigger Audio & Haptic cues
    window.soundManager.onPhaseStart(currentStep.phase);

    // Start background-tolerant Animation Frame Loop
    if (this.timerAnimFrame) cancelAnimationFrame(this.timerAnimFrame);
    this.runTimerLoop();
  }

  runTimerLoop() {
    if (!this.exerciseSession || this.exerciseSession.isPaused) return;

    try {
      const timeline = this.exerciseSession.config.timeline;
      const currentStep = timeline[this.exerciseSession.currentStepIndex];
      const now = performance.now();

      const elapsedInPhase = (now - this.exerciseSession.phaseStartTimeStamp) / 1000;
      this.exerciseSession.phaseElapsedSeconds = elapsedInPhase;

      const remainingSecs = Math.max(0, Math.ceil(currentStep.duration - elapsedInPhase));
      const progressRatio = Math.min(1, Math.max(0, elapsedInPhase / currentStep.duration));

      // Update countdown text
      const secDisplay = document.getElementById('player-seconds');
      if (secDisplay) {
        secDisplay.textContent = remainingSecs < 10 ? `0${remainingSecs}` : `${remainingSecs}`;
      }

      // Update Live Posture HUD Timer
      const demoHudTimer = document.getElementById('demo-hud-timer');
      if (demoHudTimer) {
        demoHudTimer.textContent = `${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
      }

      // Update SVG Circular Ring stroke-dashoffset (741.4 is circumference)
      const ring = document.getElementById('timer-progress-ring');
      if (ring) {
        const circumference = 741.4;
        const offset = circumference * (1 - progressRatio);
        ring.style.strokeDashoffset = offset;
      }

      // Live demonstration continuous physics / animation updates
      this.updateDemonstrationLiveTick(currentStep, progressRatio);

      // Tick audio sound for last 3 seconds
      if (Math.floor(remainingSecs) <= 3 && Math.floor(remainingSecs) > 0) {
        if (this.exerciseSession.lastTick !== remainingSecs) {
          this.exerciseSession.lastTick = remainingSecs;
          window.soundManager.onTick(remainingSecs);
        }
      }

      // Update Overall Bar
      this.updateOverallProgressBar();

      // Check if current phase duration completed
      if (elapsedInPhase >= currentStep.duration) {
        this.startPhase(this.exerciseSession.currentStepIndex + 1);
        return;
      }
    } catch (err) {
      console.error('Error in runTimerLoop:', err);
    }

    this.timerAnimFrame = requestAnimationFrame(() => this.runTimerLoop());
  }

  updateOverallProgressBar() {
    if (!this.exerciseSession || !this.exerciseSession.config) return;
    const bar = document.getElementById('player-overall-bar');
    if (!bar) return;

    const timeline = this.exerciseSession.config.timeline;
    let totalDuration = 0;
    let elapsedSoFar = 0;

    for (let i = 0; i < timeline.length; i++) {
      totalDuration += timeline[i].duration;
      if (i < this.exerciseSession.currentStepIndex) {
        elapsedSoFar += timeline[i].duration;
      } else if (i === this.exerciseSession.currentStepIndex) {
        elapsedSoFar += Math.min(timeline[i].duration, this.exerciseSession.phaseElapsedSeconds || 0);
      }
    }

    const pct = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsedSoFar / totalDuration) * 100)) : 0;
    bar.style.width = `${pct}%`;
  }

  updatePlayerUI(step) {
    const playerContainer = document.querySelector('.player-container');
    const title = document.getElementById('player-title');
    const repInfo = document.getElementById('player-rep-info');
    const phaseBadge = document.getElementById('player-phase-badge');
    const cueText = document.getElementById('player-cue-text');
    const subcueText = document.getElementById('player-subcue-text');
    const hudPhase = document.getElementById('demo-hud-phase');

    if (title) title.textContent = this.exerciseSession.config.title;

    if (repInfo) {
      if (step.rep && step.set) {
        repInfo.textContent = `Rep ${step.rep} of ${step.totalReps} • Set ${step.set} of ${step.totalSets}`;
      } else {
        repInfo.textContent = step.phaseName;
      }
    }

    if (phaseBadge) phaseBadge.textContent = step.phaseName;
    if (hudPhase) hudPhase.textContent = step.phaseName;
    if (cueText) cueText.textContent = step.cue;
    if (subcueText) subcueText.textContent = step.subCue || '';

    // Apply Phase CSS Class to container for color morphing
    if (playerContainer) {
      playerContainer.classList.remove('phase-contract', 'phase-hold', 'phase-relax', 'phase-rest');
      if (step.phase === 'contract') playerContainer.classList.add('phase-contract');
      if (step.phase === 'hold') playerContainer.classList.add('phase-hold');
      if (step.phase === 'relax') playerContainer.classList.add('phase-relax');
      if (step.phase === 'rest' || step.phase === 'prepare' || step.phase === 'cooldown') playerContainer.classList.add('phase-rest');
    }

    // Update Static / Immediate Demonstration Visuals
    this.updateDemonstrationVisuals(step);
  }

  // Update Dynamic Posture & Elevator Visuals for Current Phase
  updateDemonstrationVisuals(step) {
    const isContract = step.phase === 'contract';
    const isHold = step.phase === 'hold';
    const isRelax = step.phase === 'relax';

    // 1. Supine Lying Posture Elements
    const supineSling = document.getElementById('demo-supine-sling');
    const supineLungs = document.querySelectorAll('#demo-supine-lungs ellipse');
    const supineDiaphragm = document.getElementById('demo-supine-diaphragm');
    const supineLiftArrow = document.getElementById('demo-supine-lift-arrow');

    // 2. Seated Posture Elements
    const seatedSling = document.getElementById('demo-seated-sling');
    const seatedLungs = document.querySelectorAll('#demo-seated-lungs ellipse');
    const seatedDiaphragm = document.getElementById('demo-seated-diaphragm');
    const seatedLiftArrow = document.getElementById('demo-seated-lift-arrow');

    // 3. Standing Posture Elements
    const standingSling = document.getElementById('demo-standing-sling');
    const standingLungs = document.querySelectorAll('#demo-standing-lungs ellipse');
    const standingLiftArrow = document.getElementById('demo-standing-lift-arrow');

    // 4. Elevator Elements
    const elevatorCab = document.getElementById('demo-elevator-cab');
    const cabLabel = document.getElementById('cab-status-label');
    const floors = document.querySelectorAll('.elevator-floor');

    // 5. Posture HUD Callouts
    const bellyCallout = document.getElementById('hud-belly-callout');
    const pelvicCallout = document.getElementById('hud-pelvic-callout');

    if (isContract || isHold) {
      // Inward and Upward Lift Wave
      if (supineSling) {
        supineSling.setAttribute('d', 'M -22 10 Q 0 -4 22 10');
        supineSling.style.stroke = isHold ? 'var(--color-hold)' : 'var(--color-primary)';
      }
      if (seatedSling) {
        seatedSling.setAttribute('d', 'M -18 8 Q 0 -6 18 8');
        seatedSling.style.stroke = isHold ? 'var(--color-hold)' : 'var(--color-primary)';
      }
      if (standingSling) {
        standingSling.setAttribute('d', 'M -16 6 Q 0 -6 16 6');
        standingSling.style.stroke = isHold ? 'var(--color-hold)' : 'var(--color-primary)';
      }

      // Arrows upward
      [supineLiftArrow, seatedLiftArrow, standingLiftArrow].forEach(arr => {
        if (arr) {
          arr.style.opacity = '1';
          arr.setAttribute('transform', 'translate(0, 0) scale(1, 1)');
        }
      });

      // Lungs smooth exhale
      [...supineLungs, ...seatedLungs, ...standingLungs].forEach(l => {
        if (l) l.setAttribute('rx', '7');
      });

      // Diaphragm rises
      if (supineDiaphragm) supineDiaphragm.setAttribute('transform', 'translate(0, -5)');
      if (seatedDiaphragm) seatedDiaphragm.setAttribute('transform', 'translate(0, -5)');

      // Elevator Moves Up to Floor 2
      if (elevatorCab) elevatorCab.style.bottom = '145px';
      if (cabLabel) cabLabel.textContent = isHold ? 'Holding Lift (F2)' : 'Lifting Up (F2)';
      floors.forEach(f => f.classList.remove('active'));
      const f2 = document.querySelector('.elevator-floor.floor-2');
      if (f2) f2.classList.add('active');

      if (bellyCallout) bellyCallout.textContent = 'Belly: Soft (No clenching)';
      if (pelvicCallout) pelvicCallout.textContent = isHold ? 'Pelvis: Steady Hold' : 'Pelvis: Gentle Lift ↑';

    } else if (isRelax) {
      // Full Release & Drop to baseline
      if (supineSling) {
        supineSling.setAttribute('d', 'M -22 10 Q 0 24 22 10');
        supineSling.style.stroke = 'var(--color-relax)';
      }
      if (seatedSling) {
        seatedSling.setAttribute('d', 'M -18 8 Q 0 18 18 8');
        seatedSling.style.stroke = 'var(--color-relax)';
      }
      if (standingSling) {
        standingSling.setAttribute('d', 'M -16 6 Q 0 16 16 6');
        standingSling.style.stroke = 'var(--color-relax)';
      }

      // Arrows downward drop
      [supineLiftArrow, seatedLiftArrow, standingLiftArrow].forEach(arr => {
        if (arr) {
          arr.style.opacity = '0.5';
          arr.setAttribute('transform', 'translate(0, 10) scale(1, -1)');
        }
      });

      // Lungs expand with calm inhale
      [...supineLungs, ...seatedLungs, ...standingLungs].forEach(l => {
        if (l) l.setAttribute('rx', '12');
      });

      // Diaphragm lowers
      if (supineDiaphragm) supineDiaphragm.setAttribute('transform', 'translate(0, 4)');
      if (seatedDiaphragm) seatedDiaphragm.setAttribute('transform', 'translate(0, 4)');

      // Elevator Descents to Ground Floor
      if (elevatorCab) elevatorCab.style.bottom = '8px';
      if (cabLabel) cabLabel.textContent = '100% Release (Ground)';
      floors.forEach(f => f.classList.remove('active'));
      const fg = document.querySelector('.elevator-floor.floor-g');
      if (fg) fg.classList.add('active');

      if (bellyCallout) bellyCallout.textContent = 'Belly: Gentle Rise on Inhale';
      if (pelvicCallout) pelvicCallout.textContent = 'Pelvis: 100% Full Drop 🌿';

    } else {
      // Rest / Prepare
      if (supineSling) {
        supineSling.setAttribute('d', 'M -22 10 Q 0 14 22 10');
        supineSling.style.stroke = 'var(--color-rest)';
      }
      if (seatedSling) {
        seatedSling.setAttribute('d', 'M -18 8 Q 0 10 18 8');
        seatedSling.style.stroke = 'var(--color-rest)';
      }
      if (standingSling) {
        standingSling.setAttribute('d', 'M -16 6 Q 0 8 16 6');
        standingSling.style.stroke = 'var(--color-rest)';
      }

      if (elevatorCab) elevatorCab.style.bottom = '8px';
      if (cabLabel) cabLabel.textContent = 'Rest & Baseline';
      floors.forEach(f => f.classList.remove('active'));

      if (bellyCallout) bellyCallout.textContent = 'Belly: Natural Breath';
      if (pelvicCallout) pelvicCallout.textContent = 'Pelvis: Resting Comfort';
    }
  }

  // Real-time smooth dynamic physics & motion tick
  updateDemonstrationLiveTick(step, progressRatio) {
    const isContract = step.phase === 'contract';
    const isHold = step.phase === 'hold';
    const isRelax = step.phase === 'relax';

    let liftRatio = 0; // 0 = full drop/relax, 1 = full lift
    if (isContract) {
      liftRatio = Math.min(1, Math.max(0, progressRatio));
    } else if (isHold) {
      const wobble = Math.sin(progressRatio * Math.PI * 6) * 0.05;
      liftRatio = Math.min(1, Math.max(0, 0.95 + wobble));
    } else if (isRelax) {
      liftRatio = Math.max(0, 1 - progressRatio);
    } else {
      liftRatio = 0;
    }

    // 1. Supine Lying Posture
    const supineSling = document.getElementById('demo-supine-sling');
    const supineDiaphragm = document.getElementById('demo-supine-diaphragm');
    const supineLungs = document.querySelectorAll('#demo-supine-lungs ellipse');
    const supineLiftArrow = document.getElementById('demo-supine-lift-arrow');

    if (supineSling) {
      const supineCurve = 22 - (liftRatio * 26); // from 22 (dropped) to -4 (lifted)
      supineSling.setAttribute('d', `M -22 10 Q 0 ${supineCurve} 22 10`);
      supineSling.style.stroke = isHold ? 'var(--color-hold)' : (liftRatio > 0.3 ? 'var(--color-primary)' : 'var(--color-relax)');
    }
    if (supineDiaphragm) {
      supineDiaphragm.setAttribute('transform', `translate(0, ${-liftRatio * 5})`);
    }
    if (supineLungs && supineLungs.length) {
      const lungSize = 12 - (liftRatio * 4);
      supineLungs.forEach(l => l.setAttribute('rx', `${lungSize * 0.8}`));
    }
    if (supineLiftArrow) {
      supineLiftArrow.style.opacity = liftRatio > 0.2 ? '1' : '0.4';
      supineLiftArrow.setAttribute('transform', `translate(0, ${liftRatio > 0.2 ? 0 : 8}) scale(1, ${liftRatio > 0.2 ? 1 : -1})`);
    }

    // 2. Seated Posture
    const seatedSling = document.getElementById('demo-seated-sling');
    const seatedDiaphragm = document.getElementById('demo-seated-diaphragm');
    const seatedLungs = document.querySelectorAll('#demo-seated-lungs ellipse');
    const seatedLiftArrow = document.getElementById('demo-seated-lift-arrow');

    if (seatedSling) {
      const seatedCurve = 18 - (liftRatio * 24);
      seatedSling.setAttribute('d', `M -18 8 Q 0 ${seatedCurve} 18 8`);
      seatedSling.style.stroke = isHold ? 'var(--color-hold)' : (liftRatio > 0.3 ? 'var(--color-primary)' : 'var(--color-relax)');
    }
    if (seatedDiaphragm) {
      seatedDiaphragm.setAttribute('transform', `translate(0, ${-liftRatio * 5})`);
    }
    if (seatedLungs && seatedLungs.length) {
      const lungSize = 11 - (liftRatio * 3.5);
      seatedLungs.forEach(l => l.setAttribute('rx', `${lungSize * 0.8}`));
    }
    if (seatedLiftArrow) {
      seatedLiftArrow.style.opacity = liftRatio > 0.2 ? '1' : '0.4';
      seatedLiftArrow.setAttribute('transform', `translate(0, ${liftRatio > 0.2 ? 0 : 8}) scale(1, ${liftRatio > 0.2 ? 1 : -1})`);
    }

    // 3. Standing Posture
    const standingSling = document.getElementById('demo-standing-sling');
    const standingLungs = document.querySelectorAll('#demo-standing-lungs ellipse');
    const standingLiftArrow = document.getElementById('demo-standing-lift-arrow');

    if (standingSling) {
      const standingCurve = 16 - (liftRatio * 22);
      standingSling.setAttribute('d', `M -16 6 Q 0 ${standingCurve} 16 6`);
      standingSling.style.stroke = isHold ? 'var(--color-hold)' : (liftRatio > 0.3 ? 'var(--color-primary)' : 'var(--color-relax)');
    }
    if (standingLungs && standingLungs.length) {
      const lungSize = 11 - (liftRatio * 3.5);
      standingLungs.forEach(l => l.setAttribute('rx', `${lungSize * 0.8}`));
    }
    if (standingLiftArrow) {
      standingLiftArrow.style.opacity = liftRatio > 0.2 ? '1' : '0.4';
      standingLiftArrow.setAttribute('transform', `translate(0, ${liftRatio > 0.2 ? 0 : 8}) scale(1, ${liftRatio > 0.2 ? 1 : -1})`);
    }

    // 4. Elevator Cab smooth glide
    const elevatorCab = document.getElementById('demo-elevator-cab');
    const cabLabel = document.getElementById('cab-status-label');
    const floors = document.querySelectorAll('.elevator-floor');

    if (elevatorCab) {
      const bottomY = 8 + (liftRatio * 137); // from 8px (Ground) to 145px (Floor 2)
      elevatorCab.style.bottom = `${bottomY}px`;
    }
    if (cabLabel) {
      if (isHold) {
        cabLabel.textContent = 'Holding Lift (F2)';
      } else if (liftRatio > 0.7) {
        cabLabel.textContent = 'Top Floor Lift (F2)';
      } else if (liftRatio > 0.3) {
        cabLabel.textContent = 'Passing Floor 1 ↑';
      } else {
        cabLabel.textContent = 'Ground Floor (Relax)';
      }
    }
    if (floors && floors.length) {
      floors.forEach(f => f.classList.remove('active'));
      if (liftRatio > 0.7) {
        document.querySelector('.elevator-floor.floor-2')?.classList.add('active');
      } else if (liftRatio > 0.25) {
        document.querySelector('.elevator-floor.floor-1')?.classList.add('active');
      } else {
        document.querySelector('.elevator-floor.floor-g')?.classList.add('active');
      }
    }
  }

  bindExerciseControls() {
    const btnPause = document.getElementById('btn-player-pause');
    const iconPause = document.getElementById('ctrl-icon-pause');
    const iconPlay = document.getElementById('ctrl-icon-play');
    const btnSkip = document.getElementById('btn-player-skip');
    const btnPrev = document.getElementById('btn-player-prev');
    const btnExit = document.getElementById('btn-player-exit');
    const btnPlayerSound = document.getElementById('btn-player-sound');

    // View Mode Tabs in Player (Focus Ring | Body Demo | Elevator)
    const viewTabs = document.querySelectorAll('.btn-player-view-tab');
    viewTabs.forEach(tab => {
      tab.onclick = () => {
        const mode = tab.getAttribute('data-view');
        this.switchPlayerView(mode);
      };
    });

    // Posture Selector Buttons in Player (Lying | Seated | Standing)
    const postureBtns = document.querySelectorAll('.btn-posture-choice');
    postureBtns.forEach(btn => {
      btn.onclick = () => {
        const posture = btn.getAttribute('data-posture');
        this.switchPlayerPosture(posture);
      };
    });

    if (btnPause) {
      btnPause.onclick = () => {
        if (!this.exerciseSession) return;
        this.exerciseSession.isPaused = !this.exerciseSession.isPaused;
        if (this.exerciseSession.isPaused) {
          if (iconPause) iconPause.classList.add('hidden');
          if (iconPlay) iconPlay.classList.remove('hidden');
          cancelAnimationFrame(this.timerAnimFrame);
          this.showToast('Session Paused');
        } else {
          if (iconPause) iconPause.classList.remove('hidden');
          if (iconPlay) iconPlay.classList.add('hidden');
          // Adjust phase start time forward by paused duration
          this.exerciseSession.phaseStartTimeStamp = performance.now() - (this.exerciseSession.phaseElapsedSeconds * 1000);
          this.runTimerLoop();
        }
      };
    }

    if (btnSkip) {
      btnSkip.onclick = () => {
        if (!this.exerciseSession) return;
        this.startPhase(this.exerciseSession.currentStepIndex + 1);
      };
    }

    if (btnPrev) {
      btnPrev.onclick = () => {
        if (!this.exerciseSession) return;
        this.startPhase(this.exerciseSession.currentStepIndex);
      };
    }

    if (btnExit) {
      btnExit.onclick = () => {
        if (confirm('Are you sure you want to stop this exercise session?')) {
          this.closeExercisePlayer();
        }
      };
    }

    if (btnPlayerSound) {
      btnPlayerSound.onclick = () => {
        const settings = window.storageManager.getSettings();
        const nextState = !settings.soundEnabled;
        window.storageManager.setSettings({ soundEnabled: nextState });
        window.soundManager.setPreferences({ soundEnabled: nextState });
        this.updateSoundHeaderIcons(nextState);
        this.showToast(nextState ? 'Sound on' : 'Muted');
      };
    }
  }

  switchPlayerView(mode) {
    this.playerViewMode = mode;
    document.querySelectorAll('.btn-player-view-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === mode);
    });

    const viewOrb = document.getElementById('player-view-orb');
    const viewPosture = document.getElementById('player-view-posture');
    const viewElevator = document.getElementById('player-view-elevator');
    const postureSelector = document.getElementById('player-posture-selector');

    if (viewOrb) {
      viewOrb.classList.toggle('hidden', mode !== 'orb');
      viewOrb.style.display = mode === 'orb' ? 'flex' : 'none';
    }
    if (viewPosture) {
      viewPosture.classList.toggle('hidden', mode !== 'posture');
      viewPosture.style.display = mode === 'posture' ? 'flex' : 'none';
    }
    if (viewElevator) {
      viewElevator.classList.toggle('hidden', mode !== 'elevator');
      viewElevator.style.display = mode === 'elevator' ? 'block' : 'none';
    }
    if (postureSelector) {
      postureSelector.style.display = mode === 'posture' ? 'flex' : 'none';
    }

    if (this.exerciseSession) {
      const step = this.exerciseSession.config.timeline[this.exerciseSession.currentStepIndex];
      this.updateDemonstrationVisuals(step);
    }
  }

  switchPlayerPosture(posture) {
    this.playerPostureMode = posture;
    document.querySelectorAll('.btn-posture-choice').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-posture') === posture);
    });

    const supineGroup = document.getElementById('demo-posture-supine');
    const seatedGroup = document.getElementById('demo-posture-seated');
    const standingGroup = document.getElementById('demo-posture-standing');
    const mat = document.getElementById('posture-mat');

    if (supineGroup) {
      supineGroup.classList.toggle('hidden', posture !== 'supine');
      supineGroup.style.display = posture === 'supine' ? 'inline' : 'none';
    }
    if (seatedGroup) {
      seatedGroup.classList.toggle('hidden', posture !== 'seated');
      seatedGroup.style.display = posture === 'seated' ? 'inline' : 'none';
    }
    if (standingGroup) {
      standingGroup.classList.toggle('hidden', posture !== 'standing');
      standingGroup.style.display = posture === 'standing' ? 'inline' : 'none';
    }
    if (mat) {
      mat.style.display = posture === 'supine' ? 'block' : 'none';
    }

    if (this.exerciseSession) {
      const step = this.exerciseSession.config.timeline[this.exerciseSession.currentStepIndex];
      this.updateDemonstrationVisuals(step);
    }
  }

  closeExercisePlayer() {
    if (this.timerAnimFrame) cancelAnimationFrame(this.timerAnimFrame);
    const modal = document.getElementById('exercise-player-modal');
    if (modal) modal.classList.add('hidden');
    this.exerciseSession = null;
  }

  completeSession() {
    if (!this.exerciseSession) return;
    const sessionConfig = this.exerciseSession.config;
    const totalReps = sessionConfig.totalReps || 8;
    const duration = sessionConfig.totalDurationSeconds || 180;

    // Trigger celebration fanfare
    window.soundManager.onSessionComplete();

    // Save session in on-device storage
    const { session, newBadges } = window.storageManager.saveSession({
      programId: sessionConfig.programId,
      programTitle: sessionConfig.title,
      durationSeconds: duration,
      repsCompleted: totalReps,
      totalReps: totalReps,
      dayNumber: sessionConfig.dayNumber
    });

    this.closeExercisePlayer();
    this.showCelebrationModal(session, newBadges);
  }

  showCelebrationModal(session, newBadges) {
    const modal = document.getElementById('session-complete-modal');
    if (!modal) return;

    const mins = Math.floor(session.durationSeconds / 60);
    const secs = session.durationSeconds % 60;
    const durElem = document.getElementById('complete-duration-val');
    const repsElem = document.getElementById('complete-reps-val');
    const streakElem = document.getElementById('complete-streak-val');

    if (durElem) durElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (repsElem) repsElem.textContent = `${session.repsCompleted}`;
    if (streakElem) {
      const stats = window.storageManager.getStats();
      streakElem.textContent = `${stats.currentStreak} Days`;
    }

    // New Badge banner
    const badgeBanner = document.getElementById('complete-new-badge-banner');
    const badgeName = document.getElementById('complete-badge-name');
    if (badgeBanner) {
      if (newBadges && newBadges.length > 0) {
        badgeBanner.classList.remove('hidden');
        if (badgeName) badgeName.textContent = newBadges[0].name;
      } else {
        badgeBanner.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');

    const btnDone = document.getElementById('btn-complete-done');
    if (btnDone) {
      btnDone.onclick = () => {
        modal.classList.add('hidden');
        this.renderHome();
        this.renderProgress();
        this.renderPrograms();
      };
    }
  }

  // =========================================================
  // ONBOARDING WIZARD LOGIC
  // =========================================================
  showOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const nextButtons = modal.querySelectorAll('.btn-next-step');
    nextButtons.forEach(btn => {
      btn.onclick = () => {
        const nextStepNum = btn.getAttribute('data-next');
        modal.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
        const nextStep = document.getElementById(`onboard-step-${nextStepNum}`);
        if (nextStep) nextStep.classList.add('active');
      };
    });

    // Level Chip Selection
    const levelChips = modal.querySelectorAll('.btn-level-chip');
    levelChips.forEach(chip => {
      chip.onclick = () => {
        levelChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
    });

    // Finish Onboarding
    const btnFinish = document.getElementById('btn-finish-onboarding');
    if (btnFinish) {
      btnFinish.onclick = () => {
        const selectedGoal = modal.querySelector('input[name="onboard-goal"]:checked')?.value || 'awareness';
        const selectedLevel = modal.querySelector('.btn-level-chip.active')?.getAttribute('data-level') || 'beginner';
        const reminderTime = document.getElementById('onboard-time-input')?.value || '09:00';

        window.storageManager.setProfile({
          isOnboarded: true,
          goal: selectedGoal,
          difficulty: selectedLevel,
          preferredReminderTime: reminderTime
        });

        // Set active program matching difficulty
        const progId = selectedLevel === 'intermediate' ? 'foundation_14' : 'beginner_7';
        window.storageManager.setActiveProgram({
          programId: progId,
          currentDay: 1,
          startedAt: new Date().toISOString(),
          completedDays: []
        });

        modal.classList.add('hidden');
        this.renderHome();
        this.renderPrograms();
        this.showToast('Welcome to Floré! Your gentle routine is ready.');
      };
    }
  }

  // =========================================================
  // DISCREET PRIVACY SHIELD (CAMOUFLAGE)
  // =========================================================
  bindDiscreetMode() {
    const screenDiscreet = document.getElementById('discreet-screen');
    const btnTopbarDiscreet = document.getElementById('btn-topbar-discreet');
    const btnDesktopDiscreet = document.getElementById('btn-quick-discreet');
    const btnSettingsDiscreet = document.getElementById('btn-trigger-discreet-settings');
    const btnExitDiscreet = document.getElementById('btn-exit-discreet');

    const activateShield = () => {
      if (screenDiscreet) screenDiscreet.classList.remove('hidden');
    };
    const deactivateShield = () => {
      if (screenDiscreet) screenDiscreet.classList.add('hidden');
    };

    if (btnTopbarDiscreet) btnTopbarDiscreet.onclick = activateShield;
    if (btnDesktopDiscreet) btnDesktopDiscreet.onclick = activateShield;
    if (btnSettingsDiscreet) btnSettingsDiscreet.onclick = activateShield;
    if (btnExitDiscreet) btnExitDiscreet.onclick = deactivateShield;

    // Quick ESC keyboard shortcut for privacy
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (screenDiscreet && !screenDiscreet.classList.contains('hidden')) {
          deactivateShield();
        } else {
          activateShield();
        }
      }
    });
  }

  // =========================================================
  // DESKTOP FRAME TOGGLE
  // =========================================================
  bindDeviceFrameToggle() {
    const btnToggle = document.getElementById('btn-device-toggle');
    const container = document.getElementById('app-container');
    const label = document.getElementById('device-mode-label');

    if (btnToggle && container) {
      btnToggle.onclick = () => {
        container.classList.toggle('fullscreen-mode');
        const isFullscreen = container.classList.contains('fullscreen-mode');
        if (label) label.textContent = isFullscreen ? 'Tablet Frame' : 'Mobile Frame';
      };
    }
  }

  // =========================================================
  // VISUAL EXERCISE DEMONSTRATION STUDIO
  // =========================================================
  bindDemonstrationStudio() {
    const modalDemo = document.getElementById('exercise-demo-modal');
    const btnHeroDemo = document.getElementById('btn-open-demo-hero');
    const btnLearnDemo = document.getElementById('btn-open-studio-learn');
    const btnCloseDemo = document.getElementById('btn-close-demo-modal');
    const btnPlayPause = document.getElementById('btn-studio-play-pause');
    const btnStep = document.getElementById('btn-studio-step');
    const slider = document.getElementById('studio-phase-slider');
    const btnStudioStart = document.getElementById('btn-studio-start-session');

    const openStudio = (tab = 'supine') => {
      this.studioActiveTab = tab;
      if (modalDemo) modalDemo.classList.remove('hidden');
      this.setStudioTab(tab);
      this.startStudioAnimation();
    };

    const closeStudio = () => {
      if (modalDemo) modalDemo.classList.add('hidden');
      this.stopStudioAnimation();
    };

    if (btnHeroDemo) btnHeroDemo.onclick = () => openStudio('supine');
    if (btnLearnDemo) btnLearnDemo.onclick = () => openStudio('supine');
    if (btnCloseDemo) btnCloseDemo.onclick = closeStudio;

    // Tabs inside Demonstration Studio
    const tabs = document.querySelectorAll('.btn-demo-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        const tabId = tab.getAttribute('data-tab');
        this.setStudioTab(tabId);
      };
    });

    // Play / Pause in Studio
    if (btnPlayPause) {
      btnPlayPause.onclick = () => {
        this.studioIsPlaying = !this.studioIsPlaying;
        btnPlayPause.textContent = this.studioIsPlaying ? '⏸️ Pause' : '▶️ Play';
        if (this.studioIsPlaying) {
          this.startStudioAnimation();
        } else {
          this.stopStudioAnimation();
        }
      };
    }

    // Step to Next Phase
    if (btnStep) {
      btnStep.onclick = () => {
        this.stopStudioAnimation();
        this.studioIsPlaying = false;
        if (btnPlayPause) btnPlayPause.textContent = '▶️ Play';
        this.studioPhaseVal = (this.studioPhaseVal + 50) % 150;
        this.updateStudioSVG(this.studioPhaseVal);
        if (slider) slider.value = Math.min(100, this.studioPhaseVal);
      };
    }

    // Range Slider Manual Scrub
    if (slider) {
      slider.oninput = (e) => {
        this.stopStudioAnimation();
        this.studioIsPlaying = false;
        if (btnPlayPause) btnPlayPause.textContent = '▶️ Play';
        const val = parseInt(e.target.value);
        this.studioPhaseVal = val;
        this.updateStudioSVG(val);
      };
    }

    // Start Guided Exercise from Studio
    if (btnStudioStart) {
      btnStudioStart.onclick = () => {
        closeStudio();
        // Set posture mode in player
        const postureMap = { 'supine': 'supine', 'seated': 'seated', 'standing': 'standing' };
        const selectedPosture = postureMap[this.studioActiveTab] || 'supine';
        this.switchPlayerPosture(selectedPosture);
        this.switchPlayerView('posture');
        this.startActiveProgramTodaySession();
      };
    }
  }

  setStudioTab(tabId) {
    this.studioActiveTab = tabId;
    document.querySelectorAll('.btn-demo-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });

    this.renderStudioTabContent(tabId);
    this.updateStudioSVG(this.studioPhaseVal);
  }

  startStudioAnimation() {
    this.stopStudioAnimation();
    let forward = true;
    this.studioAnimTimer = setInterval(() => {
      if (forward) {
        this.studioPhaseVal += 2;
        if (this.studioPhaseVal >= 100) {
          this.studioPhaseVal = 100;
          forward = false;
        }
      } else {
        this.studioPhaseVal -= 2;
        if (this.studioPhaseVal <= 0) {
          this.studioPhaseVal = 0;
          forward = true;
        }
      }

      const slider = document.getElementById('studio-phase-slider');
      if (slider) slider.value = this.studioPhaseVal;

      this.updateStudioSVG(this.studioPhaseVal);
    }, 50);
  }

  stopStudioAnimation() {
    if (this.studioAnimTimer) {
      clearInterval(this.studioAnimTimer);
      this.studioAnimTimer = null;
    }
  }

  renderStudioTabContent(tabId) {
    const guideContainer = document.getElementById('studio-technique-guide');
    if (!guideContainer) return;

    let guideHtml = '';
    if (tabId === 'supine') {
      guideHtml = `
        <div class="demo-guide-item">
          <span>🛏️</span>
          <div><strong>1. Setup:</strong> Lie flat on a comfortable mat with knees bent and feet resting flat on the floor.</div>
        </div>
        <div class="demo-guide-item">
          <span>🌊</span>
          <div><strong>2. Contraction & Lift:</strong> Exhale gently and lift the pelvic floor inward and upward toward your navel (30%–70% gentle effort).</div>
        </div>
        <div class="demo-guide-item">
          <span>🌿</span>
          <div><strong>3. 100% Release:</strong> Inhale softly into your lower belly and feel the pelvic sling drop all the way down to resting baseline.</div>
        </div>
        <div class="demo-guide-item">
          <span>⚠️</span>
          <div><strong>Key Rule:</strong> Keep glutes, thighs, and abdominal muscles completely relaxed. No squeezing your buttocks!</div>
        </div>
      `;
    } else if (tabId === 'seated') {
      guideHtml = `
        <div class="demo-guide-item">
          <span>🪑</span>
          <div><strong>1. Setup:</strong> Sit tall on a firm chair with feet flat and spine upright. Feel your sitting bones grounding into the seat.</div>
        </div>
        <div class="demo-guide-item">
          <span>🌊</span>
          <div><strong>2. The Lift:</strong> Imagine gently drawing your sitting bones toward each other and lifting inward.</div>
        </div>
        <div class="demo-guide-item">
          <span>🌿</span>
          <div><strong>3. The Release:</strong> Drop all tension. Feel your pelvic floor widen and rest against the seat surface.</div>
        </div>
      `;
    } else if (tabId === 'standing') {
      guideHtml = `
        <div class="demo-guide-item">
          <span>🚶</span>
          <div><strong>1. Setup:</strong> Stand with feet hip-width apart and knees soft (not locked). Keep pelvis in a neutral position.</div>
        </div>
        <div class="demo-guide-item">
          <span>🌊</span>
          <div><strong>2. The Lift:</strong> Gently squeeze and draw upward without tucking your tailbone under or clenching your hips.</div>
        </div>
        <div class="demo-guide-item">
          <span>🌿</span>
          <div><strong>3. The Release:</strong> Let go completely with a smooth diaphragmatic inhale.</div>
        </div>
      `;
    } else if (tabId === 'elevator') {
      guideHtml = `
        <div class="demo-guide-item">
          <span>🎚️</span>
          <div><strong>Ground Floor (100% Release):</strong> Muscles are completely loose, wide, and soft at resting baseline.</div>
        </div>
        <div class="demo-guide-item">
          <span>1️⃣</span>
          <div><strong>Floor 1 (Subtle Lift):</strong> Gentle 30% squeeze—ideal for endurance and muscle awareness.</div>
        </div>
        <div class="demo-guide-item">
          <span>2️⃣</span>
          <div><strong>Floor 2 (Full Lift):</strong> Controlled gentle contraction without breath holding.</div>
        </div>
        <div class="demo-guide-item">
          <span>⬇️</span>
          <div><strong>Always Return to Ground:</strong> Take 5+ seconds on Ground Floor to reset blood flow and muscle tone.</div>
        </div>
      `;
    } else if (tabId === 'breath') {
      guideHtml = `
        <div class="demo-guide-item">
          <span>🌬️</span>
          <div><strong>Inhale (Expansion):</strong> Diaphragm moves down, belly gently expands, and pelvic floor drops to rest.</div>
        </div>
        <div class="demo-guide-item">
          <span>💨</span>
          <div><strong>Exhale (Lift):</strong> Diaphragm moves up, gentle inward lift of pelvic floor.</div>
        </div>
        <div class="demo-guide-item">
          <span>🧘</span>
          <div><strong>The Piston Harmony:</strong> Breathing and the pelvic floor move in perfect downward/upward harmony.</div>
        </div>
      `;
    }
    guideContainer.innerHTML = guideHtml;
  }

  updateStudioSVG(progress) {
    const svg = document.getElementById('studio-demo-svg');
    const phaseBadge = document.getElementById('studio-phase-badge');
    if (!svg) return;

    const ratio = progress / 100; // 0 (full relax) to 1 (full lift)
    const isLifting = ratio > 0.3;

    if (phaseBadge) {
      if (ratio < 0.2) {
        phaseBadge.textContent = 'Phase: Inhale & 100% Full Relaxation Drop 🌿';
        phaseBadge.style.color = 'var(--color-relax)';
      } else if (ratio < 0.7) {
        phaseBadge.textContent = 'Phase: Gentle Inward-Upward Lift ↑ 🌊';
        phaseBadge.style.color = 'var(--color-primary)';
      } else {
        phaseBadge.textContent = 'Phase: Steady Gentle Hold (Floor 2) ⚡';
        phaseBadge.style.color = 'var(--color-hold)';
      }
    }

    if (this.studioActiveTab === 'supine') {
      // Dynamic Supine SVG Rendering
      const slingCurve = 22 - (ratio * 26); // from 22 (dropped) to -4 (lifted)
      const lungSize = 13 - (ratio * 4); // from 13 (inflated) to 9
      const diaY = ratio * -6; // diaphragm lifts on exhale

      svg.innerHTML = `
        <rect x="20" y="195" width="320" height="6" rx="3" fill="var(--border-color)"/>
        <!-- Head & Pillow -->
        <ellipse cx="65" cy="165" rx="18" ry="12" fill="#CBD5E1" opacity="0.6"/>
        <circle cx="65" cy="155" r="15" fill="var(--text-secondary)"/>
        <!-- Torso Line -->
        <path d="M 80 162 Q 120 162 170 166 Q 200 168 225 174" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round"/>
        <!-- Bent Knees -->
        <path d="M 225 174 L 270 110 L 305 195" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Resting Arms -->
        <path d="M 100 168 L 170 178" fill="none" stroke="var(--text-muted)" stroke-width="6" stroke-linecap="round"/>
        <!-- Lungs -->
        <g transform="translate(125, 142)">
          <ellipse cx="-8" cy="0" rx="${lungSize * 0.8}" ry="${lungSize}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="1.5"/>
          <ellipse cx="8" cy="0" rx="${lungSize * 0.8}" ry="${lungSize}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="1.5"/>
          <text x="0" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-muted)">Lungs (${isLifting ? 'Exhale' : 'Inhale'})</text>
        </g>
        <!-- Diaphragm Curve -->
        <path d="M 105 ${158 + diaY} Q 125 ${150 + diaY} 145 ${158 + diaY}" fill="none" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Pelvic Sling with Dynamic Curve -->
        <g transform="translate(210, 166)">
          <path d="M -26 8 Q 0 ${slingCurve} 26 8" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
          <circle cx="0" cy="${slingCurve / 2}" r="5" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}"/>
          <!-- Lift arrows -->
          <g transform="translate(0, 8) scale(1, ${isLifting ? 1 : -1})">
            <line x1="0" y1="10" x2="0" y2="-6" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
            <polyline points="-4,-2 0,-8 4,-2" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
          </g>
          <text x="0" y="-12" text-anchor="middle" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
            ${isLifting ? 'Pelvic Lift ↑' : '100% Release ↓'}
          </text>
        </g>
        <!-- Posture Callouts -->
        <rect x="24" y="16" width="140" height="24" rx="6" fill="var(--bg-surface)" stroke="var(--border-color)"/>
        <text x="32" y="32" font-size="9.5" font-weight="700" fill="var(--text-secondary)">Glutes: Soft & Relaxed</text>
        <rect x="196" y="16" width="140" height="24" rx="6" fill="var(--bg-surface)" stroke="var(--border-color)"/>
        <text x="204" y="32" font-size="9.5" font-weight="700" fill="var(--text-secondary)">Belly: No Pushing Down</text>
      `;
    } else if (this.studioActiveTab === 'seated') {
      const slingCurve = 18 - (ratio * 24);
      svg.innerHTML = `
        <g transform="translate(40, 0)">
          <!-- Chair -->
          <path d="M 100 110 L 100 200 M 100 160 L 160 160 L 160 200" fill="none" stroke="var(--border-color)" stroke-width="6" stroke-linecap="round"/>
          <circle cx="130" cy="45" r="16" fill="var(--text-secondary)"/>
          <path d="M 130 62 L 130 155" fill="none" stroke="var(--text-secondary)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 130 155 L 180 155 L 180 200" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 130 90 L 155 125 L 140 150" fill="none" stroke="var(--text-muted)" stroke-width="6" stroke-linecap="round"/>
          <!-- Pelvic Sling -->
          <g transform="translate(130, 154)">
            <path d="M -22 6 Q 0 ${slingCurve} 22 6" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
            <text x="32" y="5" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
              ${isLifting ? 'Lift Upward ↑' : 'Drop & Open 🌿'}
            </text>
          </g>
        </g>
      `;
    } else if (this.studioActiveTab === 'standing') {
      const slingCurve = 16 - (ratio * 22);
      svg.innerHTML = `
        <g transform="translate(40, 0)">
          <circle cx="140" cy="35" r="15" fill="var(--text-secondary)"/>
          <path d="M 140 50 L 140 135" fill="none" stroke="var(--text-secondary)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 140 135 L 128 205 M 140 135 L 152 205" fill="none" stroke="var(--text-secondary)" stroke-width="12" stroke-linecap="round"/>
          <!-- Pelvic Sling -->
          <g transform="translate(140, 134)">
            <path d="M -20 6 Q 0 ${slingCurve} 20 6" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="7" stroke-linecap="round"/>
            <text x="28" y="5" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
              ${isLifting ? 'Pelvic Lift ↑' : 'Baseline Release 🌿'}
            </text>
          </g>
        </g>
      `;
    } else if (this.studioActiveTab === 'elevator') {
      const cabY = 160 - (ratio * 120); // 160 (Ground) to 40 (Floor 2)
      svg.innerHTML = `
        <!-- Elevator Shaft Framework -->
        <rect x="70" y="20" width="220" height="180" rx="12" fill="var(--bg-surface)" stroke="var(--border-color)" stroke-width="2"/>
        <!-- Floor 2 -->
        <line x1="80" y1="60" x2="280" y2="60" stroke="var(--border-color)" stroke-dasharray="4"/>
        <text x="90" y="48" font-size="11" font-weight="800" fill="${ratio > 0.7 ? 'var(--color-hold)' : 'var(--text-muted)'}">Floor 2: Full Gentle Lift</text>
        <!-- Floor 1 -->
        <line x1="80" y1="120" x2="280" y2="120" stroke="var(--border-color)" stroke-dasharray="4"/>
        <text x="90" y="108" font-size="11" font-weight="800" fill="${ratio > 0.3 && ratio <= 0.7 ? 'var(--color-primary)' : 'var(--text-muted)'}">Floor 1: Subtle Awareness Lift</text>
        <!-- Ground Floor -->
        <line x1="80" y1="175" x2="280" y2="175" stroke="var(--border-color)" stroke-dasharray="4"/>
        <text x="90" y="168" font-size="11" font-weight="800" fill="${ratio <= 0.3 ? 'var(--color-relax)' : 'var(--text-muted)'}">Ground Floor: 100% Full Drop & Rest</text>
        <!-- Moving Elevator Cab -->
        <rect x="95" y="${cabY}" width="170" height="38" rx="8" fill="var(--color-primary)" opacity="0.95"/>
        <text x="180" y="${cabY + 24}" text-anchor="middle" font-size="12" font-weight="800" fill="#FFFFFF">
          ${ratio > 0.7 ? '✨ Full Lift (F2)' : ratio > 0.3 ? '🌊 Gentle Lift (F1)' : '🌿 100% Relaxed (G)'}
        </text>
      `;
    } else if (this.studioActiveTab === 'breath') {
      const lungR = 14 - (ratio * 5);
      const diaY = ratio * -10;
      const slingY = 18 - (ratio * 26);
      svg.innerHTML = `
        <g transform="translate(60, 20)">
          <text x="120" y="14" text-anchor="middle" font-size="12" font-weight="800" fill="var(--text-main)">
            ${isLifting ? 'Exhale Phase ➔ Diaphragm & Pelvis Lift Together' : 'Inhale Phase ➔ Diaphragm & Pelvis Drop & Expand'}
          </text>
          <!-- Lungs -->
          <ellipse cx="90" cy="70" rx="${lungR * 1.2}" ry="${lungR * 1.5}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="2"/>
          <ellipse cx="150" cy="70" rx="${lungR * 1.2}" ry="${lungR * 1.5}" fill="rgba(56, 189, 248, 0.4)" stroke="#38BDF8" stroke-width="2"/>
          <!-- Diaphragm Piston -->
          <path d="M 60 ${105 + diaY} Q 120 ${85 + diaY} 180 ${105 + diaY}" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
          <text x="120" y="${118 + diaY}" text-anchor="middle" font-size="10" font-weight="700" fill="#B45309">Breathing Diaphragm</text>
          <!-- Pelvic Floor Sling -->
          <path d="M 70 160 Q 120 ${160 + slingY} 170 160" fill="none" stroke="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}" stroke-width="6" stroke-linecap="round"/>
          <text x="120" y="185" text-anchor="middle" font-size="11" font-weight="800" fill="${isLifting ? 'var(--color-primary)' : 'var(--color-relax)'}">
            Pelvic Floor Sling (${isLifting ? 'Lift Upward' : 'Full Drop'})
          </text>
        </g>
      `;
    }
  }

  // =========================================================
  // TOAST POPUP HELPER
  // =========================================================
  showToast(message, duration = 2400) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Boot application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new KegelApp();
});
