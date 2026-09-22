const fs = require('fs');

// Read all scripts
const storageCode = fs.readFileSync('js/storage.js', 'utf8');
const audioCode = fs.readFileSync('js/audio.js', 'utf8');
const programsCode = fs.readFileSync('js/programs.js', 'utf8');
const educationCode = fs.readFileSync('js/education.js', 'utf8');
const appCode = fs.readFileSync('js/app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

console.log('✓ All source files loaded successfully.');
console.log('HTML size:', html.length);
console.log('App JS size:', appCode.length);

// Verify critical DOM elements exist in HTML
const requiredIds = [
  'home-live-demo-svg',
  'home-demo-phase-pill',
  'btn-home-open-full-studio',
  'btn-open-demo-hero',
  'exercise-demo-modal',
  'btn-close-demo-modal',
  'studio-demo-svg',
  'studio-phase-badge',
  'studio-phase-slider',
  'studio-technique-guide',
  'btn-studio-play-pause',
  'btn-studio-step',
  'btn-studio-start-session',
  'exercise-player-modal',
  'player-view-orb',
  'player-view-posture',
  'player-view-elevator',
  'player-posture-selector',
  'live-posture-svg',
  'demo-posture-supine',
  'demo-posture-seated',
  'demo-posture-standing',
  'demo-supine-sling',
  'demo-seated-sling',
  'demo-standing-sling',
  'demo-elevator-cab',
  'btn-start-today-hero'
];

let missing = [];
requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    missing.push(id);
  }
});

if (missing.length > 0) {
  console.error('❌ Missing DOM IDs:', missing);
  process.exit(1);
} else {
  console.log('✓ All 27 critical demonstration & player DOM IDs are present in index.html!');
}
