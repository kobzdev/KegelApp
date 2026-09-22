# Floré — Pelvic Floor & Kegel Wellness App

A private, gentle, guided pelvic floor and Kegel wellness mobile web application for adults.

## 🚀 Deployment Guide

### Deploying to Vercel (Recommended — Instant 1-Click)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. **Important Settings**:
   - **Framework Preset**: Select `Other` (Static Site).
   - **Root Directory**: If your files are in a subfolder (like `app1`), click *Edit* and select `app1`. If files are in the main repo root, leave it as `./`.
   - **Build & Output Settings**: Leave all build commands empty/blank.
5. Click **Deploy**.

---

### Deploying to GitHub Pages
1. In your GitHub repository, ensure all files (`index.html`, `styles.css`, and the `js/` folder) are in the root or `docs/` folder.
2. Go to **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment** → **Branch**:
   - Select `main` (or `master`) branch.
   - Select `/ (root)` folder.
4. Click **Save**. Your site will be published at `https://<username>.github.io/<repo-name>/`.

---

## 📁 Project Structure
```
app1/
├── index.html        # Main application markup & modals
├── styles.css        # Complete modern design system (Light/Dark themes, CSS variables)
├── vercel.json       # Vercel static routing configuration
├── package.json      # Project metadata
├── server.js         # Local zero-dependency development server
└── js/
    ├── app.js        # Core controller & visual movement demonstration engine
    ├── audio.js      # Web Audio API acoustic tones, voice cues & haptic feedback
    ├── storage.js    # 100% on-device LocalStorage privacy manager & streak tracking
    ├── programs.js   # Multi-day programs & exercise timeline generator
    └── education.js  # Educational articles & interactive technique quizzes
```
