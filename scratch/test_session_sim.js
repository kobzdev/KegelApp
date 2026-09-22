const fs = require('fs');
const storageMap = {};
global.localStorage = {
  getItem: (k) => storageMap[k] || null,
  setItem: (k, v) => { storageMap[k] = v; },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => {}
};
global.window = {
  addEventListener: () => {},
  localStorage: global.localStorage,
  speechSynthesis: { cancel: () => {}, speak: () => {} }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 10);
global.cancelAnimationFrame = (id) => clearTimeout(id);
const makeEl = () => {
  const el = {
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    setAttribute: () => {},
    querySelectorAll: () => [],
    addEventListener: () => {},
    appendChild: () => {},
    querySelector: () => el
  };
  return el;
};

global.document = {
  body: { classList: { add: () => {}, remove: () => {} } },
  getElementById: (id) => makeEl(),
  querySelectorAll: () => [],
  querySelector: () => makeEl(),
  addEventListener: () => {},
  createElement: () => makeEl()
};

// Load all modules
const storageCode = fs.readFileSync('js/storage.js', 'utf8');
const audioCode = fs.readFileSync('js/audio.js', 'utf8');
const programsCode = fs.readFileSync('js/programs.js', 'utf8');
const educationCode = fs.readFileSync('js/education.js', 'utf8');
const appCode = fs.readFileSync('js/app.js', 'utf8');

const combined = `
${storageCode}
${audioCode}
${programsCode}
${educationCode}
${appCode}

const app = new KegelApp();
console.log('✓ KegelApp initialized.');

const prog = window.programManager.getProgramById('beginner_7');
const sessionConfig = window.programManager.buildFromProgram(prog, 1);
console.log('✓ Session config built. Total steps in workout:', sessionConfig.timeline.length);

app.launchExercisePlayer(sessionConfig);
console.log('Step 0 (Start):', app.exerciseSession.currentStepIndex, 'Phase:', sessionConfig.timeline[0].phase);

// Simulate 3.2 seconds passed on Prepare phase
app.exerciseSession.phaseStartTimeStamp = performance.now() - 3200;
app.runTimerLoop();

console.log('Step after 3.2s:', app.exerciseSession.currentStepIndex, 'Phase:', sessionConfig.timeline[app.exerciseSession.currentStepIndex].phase);

if (app.exerciseSession.currentStepIndex === 1 && sessionConfig.timeline[1].phase === 'contract') {
  console.log('✓ PASS: Timer loop smoothly transitions from 3s Prepare to Contract phase!');
} else {
  console.error('❌ FAIL: Transition did not happen correctly.');
  process.exit(1);
}

// Simulate full contract phase (3.1s)
app.exerciseSession.phaseStartTimeStamp = performance.now() - 3100;
app.runTimerLoop();
console.log('Step after Contract:', app.exerciseSession.currentStepIndex, 'Phase:', sessionConfig.timeline[app.exerciseSession.currentStepIndex].phase);

if (app.exerciseSession.currentStepIndex === 2 && sessionConfig.timeline[2].phase === 'relax') {
  console.log('✓ PASS: Timer loop smoothly transitions from Contract to Relax phase!');
}
`;

eval(combined);
