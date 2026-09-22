// Guided Programs & Session Sequence Generator for Pelvic Floor Wellness

const PRESET_PROGRAMS = [
  {
    id: 'beginner_7',
    title: 'Beginner Kickstart',
    durationDays: 7,
    level: 'Beginner',
    tagline: 'Learn muscle awareness & gentle coordination',
    description: 'Perfect for starting out. Emphasizes finding the pelvic floor muscles, gentle contractions, and complete muscle release.',
    icon: '🌱',
    color: '#0D9488',
    stats: {
      contractHoldSeconds: 3,
      relaxSeconds: 5,
      repsPerSet: 8,
      sets: 1,
      restBetweenSets: 15,
      estMinutes: 2
    },
    benefits: [
      'Learn how to identify & isolate the pelvic floor',
      'Prevent common clenching mistakes',
      'Build baseline neuromuscular connection',
      'Prioritize full relaxation between each repetition'
    ]
  },
  {
    id: 'foundation_14',
    title: 'Foundation Builder',
    durationDays: 14,
    level: 'Foundation',
    tagline: 'Establish gentle tone and natural endurance',
    description: 'Step up to two gentle sets. Reinforces steady breathwork and rhythmic holding without straining.',
    icon: '🌿',
    color: '#0284C7',
    stats: {
      contractHoldSeconds: 4,
      relaxSeconds: 5,
      repsPerSet: 10,
      sets: 2,
      restBetweenSets: 20,
      estMinutes: 4
    },
    benefits: [
      'Gradually increase hold endurance to 4 seconds',
      'Two gentle sets with structured resting intervals',
      'Support bladder confidence & posture balance'
    ]
  },
  {
    id: 'habit_30',
    title: 'Habit Builder',
    durationDays: 30,
    level: 'Intermediate',
    tagline: 'Build an effortless, lifelong daily wellness habit',
    description: 'A progressive 30-day journey designed to cement pelvic floor wellness into your daily morning or evening routine.',
    icon: '⭐',
    color: '#059669',
    stats: {
      contractHoldSeconds: 5,
      relaxSeconds: 6,
      repsPerSet: 10,
      sets: 2,
      restBetweenSets: 20,
      estMinutes: 5
    },
    benefits: [
      '5-second smooth holds paired with generous 6-second rest',
      'Build long-term pelvic health resilience',
      'Calm, repeatable daily practice'
    ]
  },
  {
    id: 'intermediate_30',
    title: 'Intermediate Control',
    durationDays: 30,
    level: 'Intermediate +',
    tagline: 'Develop dynamic control, endurance & quick response',
    description: 'Includes sustained 6-second contractions followed by thorough relaxation to train both slow and fast-twitch muscle fibers.',
    icon: '💎',
    color: '#7C3AED',
    stats: {
      contractHoldSeconds: 6,
      relaxSeconds: 6,
      repsPerSet: 12,
      sets: 2,
      restBetweenSets: 25,
      estMinutes: 6
    },
    benefits: [
      'Enhanced muscle control and awareness',
      'Sustained endurance with equal recovery time',
      'Optimal support for core and pelvic vitality'
    ]
  },
  {
    id: 'relax_10',
    title: 'Deep Pelvic Release',
    durationDays: 10,
    level: 'All Levels',
    tagline: 'Down-training & conscious relaxation for tight muscles',
    description: 'Specially crafted for those with pelvic tension or hypertonicity. Focuses 80% of the session on gentle diaphragmatic breathing and dropping muscular tension.',
    icon: '🌸',
    color: '#EC4899',
    stats: {
      contractHoldSeconds: 2,
      relaxSeconds: 8,
      repsPerSet: 6,
      sets: 2,
      restBetweenSets: 20,
      estMinutes: 3
    },
    benefits: [
      'Release chronic pelvic floor tension',
      'Deep 8-second diaphragmatic relaxation window',
      'Reduce discomfort from over-tightening'
    ]
  },
  {
    id: 'quick_3min',
    title: 'Express 3-Minute Refresh',
    durationDays: 1,
    level: 'Quick Session',
    tagline: 'A quick, energizing mindful pause anytime during the day',
    description: 'Short on time? A gentle 3-minute tune-up you can do at your desk, lying down, or during a quiet break.',
    icon: '⚡',
    color: '#F59E0B',
    stats: {
      contractHoldSeconds: 4,
      relaxSeconds: 5,
      repsPerSet: 8,
      sets: 2,
      restBetweenSets: 15,
      estMinutes: 3
    },
    benefits: [
      'Fits into any busy schedule',
      'Maintains daily consistency streak',
      'Gentle mental and physical reset'
    ]
  }
];

class ProgramManager {
  constructor() {
    this.programs = PRESET_PROGRAMS;
  }

  getAllPrograms() {
    return this.programs;
  }

  getProgramById(id) {
    return this.programs.find(p => p.id === id) || this.programs[0];
  }

  // Generate sequence of timed exercise phases for a session
  generateSessionTimeline(config) {
    const {
      title = 'Guided Session',
      programId = 'quick_session',
      contractSeconds = 3,
      holdSeconds = 0, // optional split
      relaxSeconds = 5,
      reps = 8,
      sets = 1,
      restBetweenSets = 15,
      dayNumber = null
    } = config;

    const timeline = [];
    let stepId = 0;

    // 1. Initial Preparation Phase (3s)
    timeline.push({
      id: `step_${stepId++}`,
      phase: 'prepare',
      phaseName: 'Get Ready',
      duration: 3,
      cue: 'Find a comfortable position. Breathe in gently and relax your belly.',
      subCue: 'Session starting in 3 seconds...',
      color: '#64748B',
      orbScale: 1.0,
      orbState: 'idle'
    });

    for (let currentSet = 1; currentSet <= sets; currentSet++) {
      for (let currentRep = 1; currentRep <= reps; currentRep++) {
        // Contract Phase
        timeline.push({
          id: `step_${stepId++}`,
          phase: 'contract',
          phaseName: 'Contract & Lift',
          duration: contractSeconds,
          cue: 'Gently lift and squeeze your pelvic floor inward and upward.',
          subCue: 'Keep abdomen, glutes, and thighs relaxed. Breathe normally.',
          color: '#0D9488',
          orbScale: 0.72,
          orbState: 'contract',
          rep: currentRep,
          totalReps: reps,
          set: currentSet,
          totalSets: sets
        });

        // Optional separate Hold phase if specified
        if (holdSeconds > 0) {
          timeline.push({
            id: `step_${stepId++}`,
            phase: 'hold',
            phaseName: 'Hold Smoothly',
            duration: holdSeconds,
            cue: 'Hold the gentle lift steady. Do not hold your breath.',
            subCue: 'Smooth and steady tension.',
            color: '#0284C7',
            orbScale: 0.72,
            orbState: 'hold',
            rep: currentRep,
            totalReps: reps,
            set: currentSet,
            totalSets: sets
          });
        }

        // Relax Phase (CRITICAL: equal or longer than hold!)
        timeline.push({
          id: `step_${stepId++}`,
          phase: 'relax',
          phaseName: 'Relax & Let Go',
          duration: relaxSeconds,
          cue: 'Completely release. Feel the pelvic floor drop back to resting baseline.',
          subCue: 'Allow belly to rise with a gentle inhale. Full relaxation.',
          color: '#10B981',
          orbScale: 1.35,
          orbState: 'relax',
          rep: currentRep,
          totalReps: reps,
          set: currentSet,
          totalSets: sets
        });
      }

      // Rest phase between sets (if more than 1 set and not the last set)
      if (sets > 1 && currentSet < sets) {
        timeline.push({
          id: `step_${stepId++}`,
          phase: 'rest',
          phaseName: 'Rest & Breathe',
          duration: restBetweenSets,
          cue: 'Set finished! Take slow, rhythmic breaths. Let all tension dissipate.',
          subCue: `Preparing for Set ${currentSet + 1} of ${sets}...`,
          color: '#64748B',
          orbScale: 1.0,
          orbState: 'rest',
          set: currentSet,
          totalSets: sets
        });
      }
    }

    // Final Cool Down Phase (5s)
    timeline.push({
      id: `step_${stepId++}`,
      phase: 'cooldown',
      phaseName: 'Cool Down',
      duration: 5,
      cue: 'Wonderful job. Take one final deep breath in and release fully.',
      subCue: 'Completing session...',
      color: '#10B981',
      orbScale: 1.1,
      orbState: 'cooldown'
    });

    const totalDurationSeconds = timeline.reduce((acc, step) => acc + step.duration, 0);

    return {
      title,
      programId,
      dayNumber,
      timeline,
      totalDurationSeconds,
      totalReps: reps * sets,
      sets,
      repsPerSet: reps
    };
  }

  // Helper to build timeline from a Program Model
  buildFromProgram(program, dayNumber = 1) {
    const stats = program.stats;
    return this.generateSessionTimeline({
      title: `${program.title} — Day ${dayNumber}`,
      programId: program.id,
      dayNumber: dayNumber,
      contractSeconds: stats.contractHoldSeconds,
      relaxSeconds: stats.relaxSeconds,
      reps: stats.repsPerSet,
      sets: stats.sets,
      restBetweenSets: stats.restBetweenSets
    });
  }
}

// Export singleton
window.programManager = new ProgramManager();
