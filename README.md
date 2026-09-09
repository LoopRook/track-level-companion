# 🚂 Track Level Companion

A field-ready, mobile-first **Progressive Web App (PWA)** built specifically for leveling miniature railroad and live steam tracks (optimized for **7¼″ scale**, but adaptable to any gauge).

Designed to be used trackside under direct sunlight on a smartphone, tablet, or laptop.

---

## ✨ Features

- **Laser Level Inversion Math:** Measures down from a horizontal laser plane to the rail head. The app automatically calculates true physical relative elevations (`Elevation = Datum - Reading`) so dips and crests match physical reality.
- **Field-Friendly Fractional Keypad:** Large touch targets designed for work gloves and outdoor visibility. Fast entry of feet, inches, and $1/16″$ fractions (`1' 4 3/8"`, `16 3/8"`), plus quick $\pm 1/16″$ and $\pm 1/4″$ nudge buttons.
- **The "Gentle Graph":** Interactive visual profile chart showing the actual rail head vs. target alignment. Includes a **Vertical Exaggeration** control ($10\times, 20\times, 50\times$) so a $\frac{1}{4}″$ dip over 50 feet is immediately visible.
- **Actionable Trackside Checklist:** Real-time table indicating exact corrective action at each station:
  - `LIFT +3/8"` (Blue badge)
  - `LOWER -1/4"` (Amber badge)
  - `ON GRADE ✓` (Green badge within $\pm 1/16″$ tolerance)
  - One-tap checkmarks to track progress as the crew tamps and jacks down the line.
- **Multiple Alignment & Grade Modes:**
  - **Target Grade %:** Specify a climbing or descending slope (e.g. $0.0\%$ flat, $+0.5\%$, $+1.0\%$).
  - **End-to-End Grade:** Connects station 0 directly to the last station for a continuous straight incline.
  - **Best-Fit Regression:** Calculates the least-squares optimum line to minimize overall track jacking/ballast moving.
  - **Smooth Curve:** Rolling average curve to smooth out local dips without forcing a rigid straight slope.
- **High-Contrast Sunlight Mode:** Clean, bright daylight theme designed for readability in bright outdoor sunlight, plus dark mode for evening shop review.
- **100% Offline Resilience (PWA):** Built-in Service Worker allows full offline functionality in remote backyards or club tracks with no cellular signal. Can be added to your home screen on Android or iOS.
- **Data Persistence & CSV Export:** Auto-saves to `localStorage`. Export to CSV anytime to open in Google Sheets or Excel, or import past track runs.

---

## 🚀 Live Deployment to GitHub Pages

The repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Steps to Deploy:
1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Track Level Companion"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. That's it! Every time you push to `main`, GitHub Actions will test, build, and publish the app to:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

---

## 📱 How to "Install" on Phone (PWA)

### On Android (Chrome):
1. Open the GitHub Pages URL in Google Chrome.
2. Tap the **three dots menu (⋮)** in the top right.
3. Tap **"Add to Home screen"** (or "Install app").
4. It will now launch full-screen like a native app, with an app icon, and work completely offline!

### On iPhone / iPad (Safari):
1. Open the GitHub Pages URL in Safari.
2. Tap the **Share** button (box with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.

---

## 💻 Local Development

Requires [Node.js](https://nodejs.org/) (v18+).

```bash
# Install dependencies
npm install

# Run automated unit tests (math, fractions, grade models)
npm run test

# Start local development server
npm run dev

# Build production bundle
npm run build
```
