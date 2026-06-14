const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '../public/screenshots')
fs.mkdirSync(outDir, { recursive: true })

const projects = [
  // Company work
  { id: 'amg-web3',        label: 'AMG Web3 Ecosystem',           sub: 'Web3 · Blockchain',       g1: '#4338ca', g2: '#7c3aed' },
  { id: 'acer-css',        label: 'Acer Contact Service System',  sub: 'Enterprise · Logistics',   g1: '#0369a1', g2: '#0891b2' },
  { id: 'healthassure',    label: 'HealthAssure Platform',        sub: 'HealthTech · Platform',    g1: '#059669', g2: '#10b981' },
  { id: 'igi-lab',         label: 'IGI Laboratory System',        sub: 'Diamond Industry · Lab',   g1: '#b45309', g2: '#d97706' },
  { id: 'bajaj-giftcard',  label: 'Bajaj Electricals Gift Card',  sub: 'FinTech · E-commerce',     g1: '#dc2626', g2: '#f97316' },
  { id: 'fedex-edi',       label: 'FedEx / TNT EDI Integration',  sub: 'Integration · Logistics',  g1: '#7c3aed', g2: '#db2777' },
  { id: 'defexpo',         label: 'DefExpo & ITME Platform',      sub: 'Event Management',         g1: '#334155', g2: '#475569' },
  { id: 'bajaj-finserv',   label: 'Bajaj FinServ Web Platform',   sub: 'FinTech · Web',            g1: '#0f766e', g2: '#0284c7' },
  // Demo projects
  { id: 'dotnet-clean-api',       label: '.NET 8 Clean Architecture',     sub: 'API / Backend',    g1: '#4338ca', g2: '#6366f1' },
  { id: 'erc20-token-hardhat',    label: 'ERC-20 Token + Hardhat',       sub: 'Web3 · Solidity',  g1: '#7c3aed', g2: '#a855f7' },
  { id: 'angular-admin-dashboard',label: 'Angular Admin Dashboard',      sub: 'Web · Angular',    g1: '#c2410c', g2: '#ea580c' },
  { id: 'crypto-price-tracker',   label: 'Crypto Price Tracker',         sub: 'Web · Next.js',    g1: '#0369a1', g2: '#7c3aed' },
  { id: 'edi-parser-cli',         label: 'EDI X12 / EDIFACT Parser',     sub: 'CLI · .NET',       g1: '#334155', g2: '#0f766e' },
  { id: 'health-api-integration', label: 'Healthcare API SDK',           sub: 'API · .NET',       g1: '#059669', g2: '#0284c7' },
]

const svgTpl = (label, sub, g1, g2) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${g1};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${g2};stop-opacity:1"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="80" y="260" width="1040" height="1" fill="rgba(255,255,255,0.15)"/>
  <text x="600" y="270" font-family="Georgia, serif" font-size="62" font-weight="700"
    fill="white" text-anchor="middle" dominant-baseline="middle"
    style="letter-spacing:-1px">${label}</text>
  <text x="600" y="350" font-family="monospace" font-size="20" font-weight="400"
    fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="middle"
    style="letter-spacing:4px;text-transform:uppercase">${sub}</text>
</svg>`

projects.forEach(({ id, label, sub, g1, g2 }) => {
  const svg = svgTpl(label, sub, g1, g2)
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg)
  console.log(`✓ ${id}.svg`)
})

console.log(`\nDone — ${projects.length} placeholders written to public/screenshots/`)
