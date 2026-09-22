// Storage Manager for Pelvic Floor & Kegel Wellness App
// 100% On-Device LocalStorage - Private, Secure, Zero External Tracking

const STORAGE_KEYS = {
  USER_PROFILE: 'kegel_user_profile',
  ACTIVE_PROGRAM: 'kegel_active_program',
  SESSION_HISTORY: 'kegel_session_history',
  CUSTOM_ROUTINES: 'kegel_custom_routines',
  BADGES: 'kegel_unlocked_badges',
  REMINDERS: 'kegel_reminders',
  APP_SETTINGS: 'kegel_app_settings'
};

const DEFAULT_PROFILE = {
  isOnboarded: false,
  goal: 'awareness', // 'awareness' | 'habit' | 'bladder' | 'general' | 'postpartum'
  difficulty: 'beginner', // 'beginner' | 'intermediate' | 'advanced'
  preferredReminderTime: '09:00',
  dailyGoalMinutes: 5,
  dailyGoalSessions: 1,
  createdAt: new Date().toISOString()
};

const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark' | 'auto'
  discreetMode: false,
  discreetCoverTitle: 'Personal Habit & Wellness Journal',
  soundEnabled: true,
  voiceEnabled: false,
  hapticEnabled: true,
  soundVolume: 0.6,
  soundTheme: 'crystal',
  remindersEnabled: true
};

const DEFAULT_BADGES = [
  { id: 'first_step', name: 'First Step', desc: 'Completed your first guided session', icon: '🌱', unlockedAt: null },
  { id: 'streak_3', name: '3-Day Rhythm', desc: 'Maintained a 3-day exercise streak', icon: '🔥', unlockedAt: null },
  { id: 'streak_7', name: 'Week of Wellness', desc: 'Completed 7 days in a row', icon: '⭐', unlockedAt: null },
  { id: 'reps_50', name: '50 Gentle Reps', desc: 'Completed 50 total contractions', icon: '🌊', unlockedAt: null },
  { id: 'reps_200', name: 'Strength & Tone', desc: 'Completed 200 total contractions', icon: '💎', unlockedAt: null },
  { id: 'program_complete', name: 'Program Champion', desc: 'Finished a full guided program', icon: '🏆', unlockedAt: null },
  { id: 'relax_master', name: 'Master of Ease', desc: 'Completed a deep relaxation session', icon: '🌿', unlockedAt: null },
  { id: 'habit_hero', name: 'Habit Builder', desc: 'Reached 15 total completed sessions', icon: '🎯', unlockedAt: null }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    if (!this.getProfile()) {
      this.setProfile(DEFAULT_PROFILE);
    }
    if (!this.getSettings()) {
      this.setSettings(DEFAULT_SETTINGS);
    }
    if (!this.getBadges()) {
      this.saveBadges(DEFAULT_BADGES);
    }
    if (!this.getCustomRoutines()) {
      this.saveCustomRoutines([]);
    }
    if (!this.getReminders()) {
      this.saveReminders([
        { id: 'rem_1', time: '09:00', label: 'Morning Calm Session', enabled: true },
        { id: 'rem_2', time: '20:30', label: 'Evening Relaxation', enabled: false }
      ]);
    }
    // Seed initial historical records if none exist for an engaging initial impression
    if (!this.getHistory() || this.getHistory().length === 0) {
      this.seedRealisticDemoHistory();
    }
  }

  // Profile
  getProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE));
    } catch {
      return null;
    }
  }

  setProfile(profile) {
    const current = this.getProfile() || {};
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  // Settings
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_SETTINGS));
    } catch {
      return null;
    }
  }

  setSettings(settings) {
    const current = this.getSettings() || {};
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // Active Program
  getActiveProgram() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      if (!data) {
        return {
          programId: 'beginner_7',
          currentDay: 4,
          startedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          completedDays: [1, 2, 3]
        };
      }
      return JSON.parse(data);
    } catch {
      return { programId: 'beginner_7', currentDay: 1, startedAt: new Date().toISOString(), completedDays: [] };
    }
  }

  setActiveProgram(programData) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM, JSON.stringify(programData));
  }

  advanceActiveProgramDay(dayNumber) {
    const prog = this.getActiveProgram();
    if (!prog.completedDays.includes(dayNumber)) {
      prog.completedDays.push(dayNumber);
    }
    prog.currentDay = Math.max(prog.currentDay, dayNumber + 1);
    this.setActiveProgram(prog);
    return prog;
  }

  // History & Session Logs
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY)) || [];
    } catch {
      return [];
    }
  }

  saveSession(sessionData) {
    const history = this.getHistory();
    const newEntry = {
      id: 'sess_' + Date.now(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      programId: sessionData.programId || 'quick_session',
      programTitle: sessionData.programTitle || "Today's Guided Session",
      durationSeconds: sessionData.durationSeconds || 180,
      repsCompleted: sessionData.repsCompleted || 8,
      totalReps: sessionData.totalReps || 8,
      rating: sessionData.rating || 'comfortable',
      notes: sessionData.notes || ''
    };

    history.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));

    // Update active program if applicable
    if (sessionData.dayNumber) {
      this.advanceActiveProgramDay(sessionData.dayNumber);
    }

    // Check & award badges
    const newBadges = this.checkAndAwardBadges(history);

    return { session: newEntry, newBadges };
  }

  deleteHistoryItem(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
    return history;
  }

  // Badges & Achievements
  getBadges() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)) || DEFAULT_BADGES;
    } catch {
      return DEFAULT_BADGES;
    }
  }

  saveBadges(badges) {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }

  checkAndAwardBadges(history) {
    const badges = this.getBadges();
    const newlyUnlocked = [];
    const stats = this.getStats();

    badges.forEach(b => {
      if (!b.unlockedAt) {
        let unlock = false;
        if (b.id === 'first_step' && history.length >= 1) unlock = true;
        if (b.id === 'streak_3' && stats.currentStreak >= 3) unlock = true;
        if (b.id === 'streak_7' && stats.currentStreak >= 7) unlock = true;
        if (b.id === 'reps_50' && stats.totalReps >= 50) unlock = true;
        if (b.id === 'reps_200' && stats.totalReps >= 200) unlock = true;
        if (b.id === 'habit_hero' && history.length >= 15) unlock = true;
        if (b.id === 'relax_master' && history.some(h => h.programId && h.programId.includes('relax'))) unlock = true;

        if (unlock) {
          b.unlockedAt = new Date().toISOString();
          newlyUnlocked.push(b);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveBadges(badges);
    }
    return newlyUnlocked;
  }

  // Custom Routines
  getCustomRoutines() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_ROUTINES)) || [];
    } catch {
      return [];
    }
  }

  saveCustomRoutines(routines) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ROUTINES, JSON.stringify(routines));
  }

  addCustomRoutine(routine) {
    const routines = this.getCustomRoutines();
    const newRoutine = {
      id: 'custom_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...routine
    };
    routines.unshift(newRoutine);
    this.saveCustomRoutines(routines);
    return newRoutine;
  }

  deleteCustomRoutine(id) {
    let routines = this.getCustomRoutines();
    routines = routines.filter(r => r.id !== id);
    this.saveCustomRoutines(routines);
    return routines;
  }

  // Reminders
  getReminders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REMINDERS)) || [];
    } catch {
      return [];
    }
  }

  saveReminders(reminders) {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }

  // Calculations & Analytics Aggregation
  getStats() {
    const history = this.getHistory();
    const totalSessions = history.length;
    let totalSeconds = 0;
    let totalReps = 0;

    history.forEach(item => {
      totalSeconds += item.durationSeconds || 0;
      totalReps += item.repsCompleted || 0;
    });

    const totalMinutes = Math.round(totalSeconds / 60);

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(history);

    // Weekly completion (this week)
    const weeklyData = this.getWeeklyActivityData(history);
    const weeklyCompletedCount = weeklyData.filter(d => d.completed).length;

    // Is today completed?
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCompleted = history.some(item => item.date.startsWith(todayStr));

    return {
      totalSessions,
      totalMinutes,
      totalReps,
      currentStreak,
      longestStreak,
      weeklyCompletedCount,
      weeklyData,
      todayCompleted
    };
  }

  calculateStreaks(history) {
    if (!history || history.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Extract unique dates sorted ascending
    const dates = Array.from(
      new Set(history.map(item => item.date.split('T')[0]))
    ).sort();

    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      if (prevDate) {
        const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = d;
    }

    // Check if current streak is active (completed today or yesterday)
    const lastActiveDate = dates[dates.length - 1];
    if (lastActiveDate === todayStr || lastActiveDate === yesterdayStr) {
      // Find streak backwards from lastActiveDate
      let streakCount = 1;
      let checkDate = new Date(lastActiveDate);
      for (let i = dates.length - 2; i >= 0; i--) {
        const prev = new Date(dates[i]);
        const diff = Math.round((checkDate - prev) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streakCount++;
          checkDate = prev;
        } else {
          break;
        }
      }
      currentStreak = streakCount;
    } else {
      currentStreak = 0;
    }

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
  }

  // 7-day Monday through Sunday activity
  getWeeklyActivityData(history) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    // Get Monday of current week
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const dateStr = dateObj.toISOString().split('T')[0];
      const isToday = dateStr === now.toISOString().split('T')[0];
      const isPastOrToday = dateObj <= now;

      // Find sessions on this day
      const daySessions = history.filter(h => h.date.startsWith(dateStr));
      const totalMins = daySessions.reduce((acc, s) => acc + Math.round((s.durationSeconds || 0) / 60), 0);

      week.push({
        dayName: days[i],
        dateStr,
        dayNum: dateObj.getDate(),
        completed: daySessions.length > 0,
        sessionCount: daySessions.length,
        minutes: totalMins,
        isToday,
        isPastOrToday
      });
    }
    return week;
  }

  // Monthly activity for calendar view (last 28-31 days)
  getMonthActivityData(history) {
    const daysInMonth = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= numDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().split('T')[0];
      const daySessions = history.filter(h => h.date.startsWith(dateStr));

      daysInMonth.push({
        dayNum: d,
        dateStr,
        completed: daySessions.length > 0,
        count: daySessions.length,
        isToday: dateStr === now.toISOString().split('T')[0]
      });
    }
    return daysInMonth;
  }

  // Seed sample realistic demo data so the prototype looks rich, lively, and warm
  seedRealisticDemoHistory() {
    const history = [];
    const now = new Date();

    // 4 completed days in the past week to showcase a 4-day streak!
    for (let i = 4; i >= 1; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(9, 15 + i * 3, 0);

      history.push({
        id: 'sess_seed_' + i,
        date: d.toISOString(),
        timestamp: d.getTime(),
        programId: 'beginner_7',
        programTitle: 'Beginner Kickstart',
        durationSeconds: 160 + i * 10,
        repsCompleted: 8,
        totalReps: 8,
        rating: 'comfortable',
        notes: 'Felt very relaxing. Focused on normal breathing.'
      });
    }

    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));

    // Unlock First Step badge
    const badges = DEFAULT_BADGES;
    badges[0].unlockedAt = new Date(Date.now() - 4 * 86400000).toISOString();
    badges[1].unlockedAt = new Date(Date.now() - 1 * 86400000).toISOString();
    this.saveBadges(badges);
  }

  // Export Data JSON
  exportDataJSON() {
    const data = {
      profile: this.getProfile(),
      settings: this.getSettings(),
      activeProgram: this.getActiveProgram(),
      history: this.getHistory(),
      customRoutines: this.getCustomRoutines(),
      badges: this.getBadges(),
      reminders: this.getReminders(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

  // Import Data JSON
  importDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.profile));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(data.settings));
      if (data.activeProgram) localStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM, JSON.stringify(data.activeProgram));
      if (data.history) localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(data.history));
      if (data.customRoutines) localStorage.setItem(STORAGE_KEYS.CUSTOM_ROUTINES, JSON.stringify(data.customRoutines));
      if (data.badges) localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(data.badges));
      if (data.reminders) localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data.reminders));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Clear/Reset all local data
  resetAllData() {
    localStorage.clear();
    this.init();
    return true;
  }
}

// Export singleton
window.storageManager = new StorageManager();
