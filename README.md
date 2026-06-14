# Divakar R. Upadhyay — Portfolio

Next.js 15 portfolio SPA. Static export — host anywhere (Vercel, Netlify, GitHub Pages).

---

## Quick Start

```bash
cd docs/portfolio
npm install
npm run dev        # http://localhost:3000
npm run build      # generates /out for static hosting
```

---

## How to Update Content

All content lives in the `data/` folder as plain JSON — no code changes needed.

### Update personal info
Edit **`data/profile.json`** — name, bio, stats, contact details, resume PDF path.

### Add / edit a project
Edit **`data/projects.json`**.

```jsonc
{
  "id": "my-project",
  "type": "Category · Subcategory",
  "name": "Project Name",
  "description": "One paragraph describing the project.",
  "tags": ["C#", "Angular", "MSSQL"],
  "category": "enterprise",        // enterprise | integration | web3 | healthtech | fintech
  "github": "https://github.com/...",   // "" to hide
  "demo":   "https://live-url.com",     // "" to hide
  "screenshot": "/screenshots/my-project.png",  // "" to show placeholder
  "featured": false
}
```

**To add a screenshot:**
1. Drop the image file into `public/screenshots/`
2. Set `"screenshot": "/screenshots/your-file.png"` in the project entry

### Add / edit experience
Edit **`data/experience.json`** — each entry has `period`, `role`, `company`, `companyUrl`, `client`, `badge`, `highlights[]`, `tech[]`.

### Add / edit skills
Edit **`data/skills.json`** — array of groups, each with `group` name and `tags[]` (name + primary flag).

---

## Adding Your Resume

Replace `public/Divakar-SoftwareEngineer.pdf` with your latest PDF.
The `data/profile.json` field `resumePdf` controls the path (default: `/Divakar-SoftwareEngineer.pdf`).

---

## Hosting

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
```

### GitHub Pages
1. Create a separate private/public repo for the portfolio
2. `npm run build` → commit the `out/` folder
3. Enable GitHub Pages → source: `out/` branch

### Netlify
Drag and drop the `out/` folder into Netlify's deploy UI.

---

## Project Structure

```
docs/portfolio/
├── data/               ← Edit these JSON files to update content
│   ├── profile.json
│   ├── experience.json
│   ├── projects.json
│   └── skills.json
├── public/
│   ├── Divakar-SoftwareEngineer.pdf
│   └── screenshots/    ← Drop project screenshots here
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css  ← All design tokens and styles
    ├── components/      ← One component per section
    └── hooks/
        └── useReveal.ts ← Scroll-triggered animations
```
