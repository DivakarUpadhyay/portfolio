const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = 3098
const DEMO_FILE = path.join(__dirname, 'data', 'demo-projects.json')
const SCREENSHOTS_DIR = path.join(__dirname, 'public', 'screenshots')

// --- Admin credentials (change these) ---
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'portfolio2025'

// In-memory session store: token → expiry timestamp
const sessions = new Map()
const SESSION_TTL = 8 * 60 * 60 * 1000 // 8 hours

function createSession(ttl = SESSION_TTL) {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + ttl)
  return token
}
function isValidSession(token) {
  if (!token || !sessions.has(token)) return false
  if (Date.now() > sessions.get(token)) { sessions.delete(token); return false }
  return true
}
function getCookie(req, name) {
  const cookies = req.headers.cookie || ''
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))
  return match ? match.slice(name.length + 1) : null
}

// --- Supabase — primary database ---
const SB_URL  = 'https://rvyqwprkfzusjqblggvh.supabase.co'
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXF3cHJrZnp1c2pxYmxnZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzODIsImV4cCI6MjA5Njk4ODM4Mn0.EcZ9UvjW_dlCASav1sNuclS4bPX8fRpDjrEhPLINQpg'
const SB_EP   = `${SB_URL}/rest/v1/demo_projects`
const SB_HDR  = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' }

// Read all projects from Supabase; fall back to local JSON if unreachable
async function readProjects() {
  try {
    const r = await fetch(`${SB_EP}?select=*&order=id`, { headers: SB_HDR })
    if (r.ok) return await r.json()
  } catch(e) { console.error('SB read failed, using local backup:', e.message) }
  return JSON.parse(fs.readFileSync(DEMO_FILE, 'utf8'))
}

// Write to Supabase and sync local JSON as backup
async function sbUpsert(project) {
  try {
    const r = await fetch(SB_EP, { method: 'POST', headers: { ...SB_HDR, 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(project) })
    if (!r.ok) console.error('SB upsert error:', await r.text())
    else syncBackup()
  } catch(e) { console.error('SB upsert failed:', e.message) }
}
async function sbPatch(id, data) {
  try {
    const r = await fetch(`${SB_EP}?id=eq.${id}`, { method: 'PATCH', headers: SB_HDR, body: JSON.stringify(data) })
    if (!r.ok) console.error('SB patch error:', await r.text())
    else syncBackup()
  } catch(e) { console.error('SB patch failed:', e.message) }
}
async function sbDelete(id) {
  try {
    const r = await fetch(`${SB_EP}?id=eq.${id}`, { method: 'DELETE', headers: SB_HDR })
    if (!r.ok) console.error('SB delete error:', await r.text())
    else syncBackup()
  } catch(e) { console.error('SB delete failed:', e.message) }
}

// Sync local JSON from Supabase so it stays current as emergency backup
async function syncBackup() {
  try {
    const r = await fetch(`${SB_EP}?select=*&order=id`, { headers: SB_HDR })
    if (r.ok) fs.writeFileSync(DEMO_FILE, JSON.stringify(await r.json(), null, 2))
  } catch(e) { /* backup sync is best-effort */ }
}

// ── Learnings helpers ──────────────────────────────────────────────────────
const SB_LEARN_EP = `${SB_URL}/rest/v1/learnings`
const SB_IPREP_EP = `${SB_URL}/rest/v1/interview_prep`
const SB_HDR_FULL = { ...SB_HDR, 'Content-Type': 'application/json' }

async function sbReadLearnings() {
  try {
    const r = await fetch(`${SB_LEARN_EP}?select=*&order=created_at.desc`, { headers: SB_HDR_FULL })
    if (r.ok) return await r.json()
  } catch(e) { console.error('SB learnings read failed:', e.message) }
  return []
}
async function sbUpsertLearning(item) {
  try {
    if (!item.id) item.id = crypto.randomUUID()
    const r = await fetch(SB_LEARN_EP, { method: 'POST', headers: { ...SB_HDR_FULL, 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(item) })
    if (!r.ok) console.error('SB learning upsert error:', await r.text())
  } catch(e) { console.error('SB learning upsert failed:', e.message) }
}
async function sbPatchLearning(id, data) {
  try {
    const r = await fetch(`${SB_LEARN_EP}?id=eq.${id}`, { method: 'PATCH', headers: SB_HDR_FULL, body: JSON.stringify(data) })
    if (!r.ok) console.error('SB learning patch error:', await r.text())
  } catch(e) { console.error('SB learning patch failed:', e.message) }
}
async function sbDeleteLearning(id) {
  try {
    const r = await fetch(`${SB_LEARN_EP}?id=eq.${id}`, { method: 'DELETE', headers: SB_HDR_FULL })
    if (!r.ok) console.error('SB learning delete error:', await r.text())
  } catch(e) { console.error('SB learning delete failed:', e.message) }
}

// ── Interview Prep helpers ─────────────────────────────────────────────────
async function sbReadInterviewPrep() {
  try {
    const r = await fetch(`${SB_IPREP_EP}?select=*&order=created_at.desc`, { headers: SB_HDR_FULL })
    if (r.ok) return await r.json()
  } catch(e) { console.error('SB interview_prep read failed:', e.message) }
  return []
}
async function sbUpsertInterviewPrep(item) {
  try {
    if (!item.id) item.id = crypto.randomUUID()
    const r = await fetch(SB_IPREP_EP, { method: 'POST', headers: { ...SB_HDR_FULL, 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(item) })
    if (!r.ok) console.error('SB interview_prep upsert error:', await r.text())
  } catch(e) { console.error('SB interview_prep upsert failed:', e.message) }
}
async function sbPatchInterviewPrep(id, data) {
  try {
    const r = await fetch(`${SB_IPREP_EP}?id=eq.${id}`, { method: 'PATCH', headers: SB_HDR_FULL, body: JSON.stringify(data) })
    if (!r.ok) console.error('SB interview_prep patch error:', await r.text())
  } catch(e) { console.error('SB interview_prep patch failed:', e.message) }
}
async function sbDeleteInterviewPrep(id) {
  try {
    const r = await fetch(`${SB_IPREP_EP}?id=eq.${id}`, { method: 'DELETE', headers: SB_HDR_FULL })
    if (!r.ok) console.error('SB interview_prep delete error:', await r.text())
  } catch(e) { console.error('SB interview_prep delete failed:', e.message) }
}

// ── Topics helpers (stored in portfolio_data with key prefix "topic_") ────────
const SB_PD_EP = `${SB_URL}/rest/v1/portfolio_data`

async function sbReadTopics() {
  try {
    const r = await fetch(`${SB_PD_EP}?key=like.topic_%25&select=value`, { headers: SB_HDR })
    if (r.ok) {
      const rows = await r.json()
      return rows.map(row => row.value).filter(Boolean)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
  } catch(e) { console.error('sbReadTopics error:', e.message) }
  return []
}
async function sbUpsertTopic(topic) {
  const r = await fetch(SB_PD_EP, {
    method: 'POST',
    headers: { ...SB_HDR, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: `topic_${topic.slug}`, value: topic })
  })
  if (!r.ok) throw new Error(await r.text())
}
async function sbDeleteTopicKey(slug) {
  const r = await fetch(`${SB_PD_EP}?key=eq.topic_${encodeURIComponent(slug)}`, { method: 'DELETE', headers: SB_HDR })
  if (!r.ok) throw new Error(await r.text())
}

// ── Learning categories (stored in portfolio_data as "learning_categories") ─
const DEFAULT_LEARN_CATS = ['.NET/C#','JavaScript','TypeScript','React/Next.js','Python','DSA','System Design','Architecture','SQL/DB','Web3','DevOps','Cloud/AWS','Security','AI/ML','Testing','Other']

async function sbGetLearnCats() {
  try {
    const r = await fetch(`${SB_PD_EP}?key=eq.learning_categories&select=value`, { headers: SB_HDR })
    if (r.ok) {
      const rows = await r.json()
      const val = rows[0]?.value
      if (Array.isArray(val) && val.length) return val
    }
  } catch(e) { console.error('sbGetLearnCats error:', e.message) }
  return DEFAULT_LEARN_CATS
}

async function sbSetLearnCats(cats) {
  const r = await fetch(SB_PD_EP, {
    method: 'POST',
    headers: { ...SB_HDR, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: 'learning_categories', value: cats })
  })
  if (!r.ok) throw new Error(await r.text())
}

// ── Interview Prep categories ──────────────────────────────────────────────
const DEFAULT_IPREP_CATS = ['HR/Behavioral','Technical .NET','Technical JS','System Design','Database','Web3','General']

async function sbGetIprepCats() {
  try {
    const r = await fetch(`${SB_PD_EP}?key=eq.iprep_categories&select=value`, { headers: SB_HDR })
    if (r.ok) {
      const rows = await r.json()
      const val = rows[0]?.value
      if (Array.isArray(val) && val.length) return val
    }
  } catch(e) { console.error('sbGetIprepCats error:', e.message) }
  return DEFAULT_IPREP_CATS
}

async function sbSetIprepCats(cats) {
  const r = await fetch(SB_PD_EP, {
    method: 'POST',
    headers: { ...SB_HDR, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: 'iprep_categories', value: cats })
  })
  if (!r.ok) throw new Error(await r.text())
}

// ── Learning file upload to Supabase Storage ───────────────────────────────
async function sbLearnFileUpload(filename, mime, data) {
  const r = await fetch(`${SB_URL}/storage/v1/object/learning-files/${filename}`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': mime, 'x-upsert': 'true' },
    body: data
  })
  if (!r.ok) throw new Error(await r.text())
  return `${SB_URL}/storage/v1/object/public/learning-files/${filename}`
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch(e) { reject(e) } })
    req.on('error', reject)
  })
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Admin Login</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f6f8;color:#111;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
.logo-icon{width:34px;height:34px;background:#c09030;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px}
.logo-text{font-size:15px;font-weight:700;color:#111}
.logo-sub{font-size:11px;color:#aaa;font-family:monospace;margin-top:1px}
h1{font-size:20px;font-weight:700;color:#111;margin-bottom:5px}
p{font-size:13px;color:#888;margin-bottom:24px}
label{display:block;font-size:10.5px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
input{width:100%;padding:10px 13px;background:#fafafa;border:1px solid rgba(0,0,0,.14);border-radius:7px;color:#111;font-size:13px;outline:none;transition:border-color .2s;font-family:inherit}
input:focus{border-color:#c09030;box-shadow:0 0 0 3px rgba(192,144,48,.1);background:#fff}
.field{margin-bottom:16px}
.error{background:#fef2f2;border:1px solid rgba(220,38,38,.2);border-radius:7px;padding:9px 13px;font-size:12px;color:#dc2626;margin-bottom:16px;display:none}
.error.show{display:block}
button{width:100%;padding:11px;background:#c09030;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;transition:background .15s;font-family:inherit}
button:hover{background:#a87828}
button:active{background:#906520}
.hint{text-align:center;font-size:11px;color:#999;margin-top:18px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">📁</div>
    <div><div class="logo-text">Portfolio Admin</div><div class="logo-sub">localhost:3098</div></div>
  </div>
  <h1>Sign in</h1>
  <p>Enter your credentials to manage demo projects</p>
  <div class="error" id="err">Invalid username or password</div>
  <form method="POST" action="/api/login" id="loginForm">
    <div class="field">
      <label>Username</label>
      <input type="text" name="username" id="usernameInput" autocomplete="username" required/>
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" name="password" autocomplete="current-password" required/>
    </div>
    <div class="remember-row">
      <label class="remember-label">
        <input type="checkbox" id="rememberMe" name="rememberMe" value="1"/>
        <span>Keep me signed in for 30 days</span>
      </label>
    </div>
    <button type="submit">Sign in →</button>
  </form>
  <div class="hint">Admin access only</div>
</div>
<style>
.remember-row{display:flex;align-items:center;margin-bottom:16px;margin-top:-4px}
.remember-label{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:#888;user-select:none}
.remember-label input[type=checkbox]{width:14px;height:14px;accent-color:#c09030;cursor:pointer;flex-shrink:0}
.remember-label span{font-size:12px;color:#888}
</style>
<script>
(function(){
  if (new URLSearchParams(location.search).get('err'))
    document.getElementById('err').classList.add('show')

  // Read username from cookie (set by server on previous remember-me login)
  function getCookie(name) {
    const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))
    return match ? decodeURIComponent(match.slice(name.length + 1)) : ''
  }
  const savedUser = getCookie('admin_remember_user')
  if (savedUser) {
    document.getElementById('usernameInput').value = savedUser
    document.getElementById('rememberMe').checked = true
  }
})()
</script>
</body>
</html>`

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portfolio Admin — Demo Projects</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f6f8;color:#111;min-height:100vh;font-size:14px}
.topbar{background:#fff;border-bottom:1px solid rgba(0,0,0,.09);padding:0 28px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.topbar h1{font-size:15px;font-weight:700;color:#111;letter-spacing:-.01em}
.topbar-right{display:flex;align-items:center;gap:16px}
.topbar span{font-size:11px;color:#999;font-family:monospace}
.topbar-signout{background:transparent;border:1px solid rgba(0,0,0,.12);color:#666;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s}
.topbar-signout:hover{border-color:#c09030;color:#c09030}
.admin-nav{background:#fff;border-bottom:1px solid rgba(0,0,0,.08);padding:0 28px;display:flex;gap:2px}
.nav-item{display:inline-flex;align-items:center;gap:5px;padding:12px 14px;font-size:12px;font-weight:500;color:#777;text-decoration:none;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;font-family:inherit}
.nav-item:hover{color:#333;border-bottom-color:rgba(0,0,0,.15)}
.nav-item.active{color:#c09030;border-bottom-color:#c09030;font-weight:600}
.wrap{max-width:1280px;margin:0 auto;padding:24px 28px}
.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.toolbar h2{font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.08em}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
.btn-primary{background:#c09030;color:#fff}
.btn-primary:hover{background:#a87828}
.btn-danger{background:#fff;color:#dc2626;border:1px solid rgba(220,38,38,.25)}
.btn-danger:hover{background:#fef2f2;border-color:#dc2626}
.btn-secondary{background:#fff;color:#444;border:1px solid rgba(0,0,0,.15)}
.btn-secondary:hover{background:#f5f5f5;border-color:rgba(0,0,0,.25)}
.btn-sm{padding:4px 10px;font-size:11px;border-radius:5px}
.btn-soft{background:#fff7ed;color:#c2620a;border:1px solid rgba(194,98,10,.2)}
.btn-soft:hover{background:#ffedd5}
/* Cards grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:10px;overflow:hidden;transition:box-shadow .2s,border-color .2s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.card:hover{border-color:rgba(0,0,0,.16);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.card-img{width:100%;height:150px;object-fit:cover;background:#f0f0f0;display:block}
.card-img-placeholder{width:100%;height:150px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;font-family:monospace}
.card-body{padding:14px}
.card-name{font-size:14px;font-weight:600;color:#111;margin-bottom:4px}
.card-desc{font-size:12px;color:#777;line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-tags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}
.tag{background:#f0f0f0;border:1px solid rgba(0,0,0,.08);color:#777;font-size:10px;padding:2px 7px;border-radius:20px;font-family:monospace}
.card-actions{display:flex;gap:6px}
.cat-badge{display:inline-block;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;padding:2px 7px;border-radius:20px;margin-bottom:8px}
.cat-api{background:#fffbeb;color:#b45309;border:1px solid rgba(180,83,9,.2)}
.cat-web3{background:#f5f3ff;color:#7c3aed;border:1px solid rgba(124,58,237,.2)}
.cat-web{background:#eff6ff;color:#2563eb;border:1px solid rgba(37,99,235,.2)}
.cat-cli{background:#f0fdf4;color:#16a34a;border:1px solid rgba(22,163,74,.2)}
.empty{text-align:center;padding:60px 20px;color:#bbb;font-size:13px}
.card.inactive{opacity:.5;filter:grayscale(.5)}
.card.inactive .card-name::after{content:' — Deactivated';color:#bbb;font-size:11px;font-weight:400}
.deact-section{margin-top:36px}
.deact-label{font-size:11px;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,.07)}
/* Modal */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:12px;width:100%;max-width:580px;max-height:92vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.modal-head{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center}
.modal-head h3{font-size:14px;font-weight:700;color:#111}
.modal-close{background:none;border:none;color:#bbb;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px;border-radius:4px}
.modal-close:hover{background:#f0f0f0;color:#333}
.modal-body{padding:18px 20px}
.field{margin-bottom:13px}
.field label{display:block;font-size:10.5px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.field input,.field textarea,.field select{width:100%;background:#fff;border:1px solid rgba(0,0,0,.14);border-radius:7px;padding:8px 11px;color:#111;font-size:13px;font-family:inherit;transition:border-color .15s;outline:none}
.field input:focus,.field textarea:focus,.field select:focus{border-color:#c09030;box-shadow:0 0 0 3px rgba(192,144,48,.1)}
.field textarea{resize:vertical;min-height:80px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.img-preview{width:100%;height:130px;object-fit:cover;border-radius:7px;margin-top:7px;background:#f5f5f5;border:1px solid rgba(0,0,0,.08);display:none}
.img-preview.show{display:block}
.upload-area{border:2px dashed rgba(0,0,0,.12);border-radius:8px;padding:18px;text-align:center;cursor:pointer;transition:border-color .15s;margin-top:7px}
.upload-area:hover{border-color:#c09030}
.upload-area p{font-size:12px;color:#bbb;margin-top:4px}
.modal-foot{padding:12px 20px;border-top:1px solid rgba(0,0,0,.07);display:flex;justify-content:flex-end;gap:8px;background:#fafafa;border-radius:0 0 12px 12px}
.toast{position:fixed;bottom:20px;right:20px;background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:500;z-index:200;transform:translateY(80px);opacity:0;transition:all .3s;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.toast.show{transform:translateY(0);opacity:1}
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes loaderPulse{0%,100%{opacity:.5}50%{opacity:1}}
.page-loader{display:none;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:14px;width:100%}
.page-loader.show{display:flex}
.loader-ring{width:36px;height:36px;border:3px solid rgba(192,144,48,.15);border-top-color:#c09030;border-radius:50%;animation:spin .7s linear infinite}
.loader-label{font-size:11px;font-weight:600;color:#ccc;text-transform:uppercase;letter-spacing:.1em;animation:loaderPulse 1.4s ease-in-out infinite}
@media(max-width:768px){.topbar,.admin-nav{padding:0 16px}.wrap{padding:16px}.field-row{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="topbar">
  <h1>📁 Portfolio Admin</h1>
  <div class="topbar-right">
    <span>Demo Projects Manager · localhost:3098</span>
    <form method="POST" action="/api/logout" style="margin:0"><button type="submit" class="topbar-signout">Sign out</button></form>
  </div>
</div>
<nav class="admin-nav">
  <a href="/" class="nav-item active">📁 Projects</a>
  <a href="/learnings" class="nav-item">📚 Learnings</a>
  <a href="/interview-prep" class="nav-item">🎯 Interview Prep</a>
  <a href="/topics" class="nav-item">📝 Topics</a>
</nav>
<div class="wrap">
  <div class="toolbar">
    <h2 id="count"></h2>
    <button class="btn btn-primary" onclick="openAdd()">+ Add Project</button>
  </div>
  <div class="page-loader" id="loader"><div class="loader-ring"></div><span class="loader-label">Loading</span></div>
  <div id="grid"></div>
</div>

<!-- Modal -->
<div class="modal-bg" id="modal" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <h3 id="modal-title">Add Project</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="f-id"/>
      <div class="field">
        <label>Project Name *</label>
        <input type="text" id="f-name" placeholder="e.g. My Cool Project"/>
      </div>
      <div class="field">
        <label>Description *</label>
        <textarea id="f-desc" placeholder="What does this project do?"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Category</label>
          <select id="f-cat">
            <option value="api">API / Backend</option>
            <option value="web3">Web3</option>
            <option value="web">Web</option>
            <option value="cli">CLI / Tool</option>
          </select>
        </div>
        <div class="field">
          <label>Tags (comma separated)</label>
          <input type="text" id="f-tags" placeholder="Next.js, Solidity, MSSQL"/>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>GitHub URL</label>
          <input type="url" id="f-github" placeholder="https://github.com/..."/>
        </div>
        <div class="field">
          <label>Live Demo URL</label>
          <input type="url" id="f-demo" placeholder="https://..."/>
        </div>
      </div>
      <div class="field">
        <label>Screenshot</label>
        <div class="upload-area" onclick="document.getElementById('f-file').click()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5" style="margin:0 auto"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p>Click to upload screenshot</p>
          <p id="f-filename" style="color:#d4a847;margin-top:4px"></p>
        </div>
        <input type="file" id="f-file" accept="image/*" style="display:none" onchange="previewFile(this)"/>
        <img id="f-preview" class="img-preview" alt="preview"/>
        <div class="field" style="margin-top:10px;margin-bottom:0">
          <label>Or paste screenshot URL</label>
          <input type="text" id="f-screenshot" placeholder="/screenshots/myproject.png" oninput="previewUrl(this.value)"/>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProject()">Save Project</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let projects = []
let editingId = null
let uploadedFile = null

function imgErr(el) { el.style.display='none'; if(el.nextElementSibling) el.nextElementSibling.style.display='flex' }

async function load() {
  const loader = document.getElementById('loader')
  loader.classList.add('show')
  const res = await fetch('/api/projects')
  projects = await res.json()
  render()
  loader.classList.remove('show')
}

function renderCard(p, i, animIdx) {
  const delay = Math.min(animIdx || 0, 12) * 0.045
  const imgHtml = p.screenshot
    ? '<img class="card-img" src="' + p.screenshot + '" alt="' + p.name + '" onerror="imgErr(this)"/><div class="card-img-placeholder" style="display:none">No Image</div>'
    : '<div class="card-img-placeholder">No Screenshot</div>'
  const tagsHtml = (p.tags||[]).map(t => '<span class="tag">' + t + '</span>').join('')
  const actionsHtml = p.active === false
    ? '<button class="btn btn-secondary btn-sm" data-id="' + p.id + '" onclick="restoreProject(this.dataset.id)">↩ Restore</button> <button class="btn btn-danger btn-sm" data-id="' + p.id + '" onclick="hardDeleteProject(this.dataset.id)">🗑 Delete Forever</button>'
    : '<button class="btn btn-secondary btn-sm" data-idx="' + i + '" onclick="openEdit(+this.dataset.idx)">✏️ Edit</button> ' +
      (p.demo ? '<a href="' + p.demo + '" target="_blank" class="btn btn-secondary btn-sm">🔗 Demo</a> ' : '') +
      (p.github ? '<a href="' + p.github + '" target="_blank" class="btn btn-secondary btn-sm">GitHub</a> ' : '') +
      '<button class="btn btn-soft btn-sm" data-id="' + p.id + '" onclick="softDeleteProject(this.dataset.id)">⊘ Deactivate</button>'
  return '<div class="card' + (p.active === false ? ' inactive' : '') + '" style="animation:cardIn .22s ease both;animation-delay:' + delay + 's">' +
    imgHtml +
    '<div class="card-body">' +
    '<span class="cat-badge cat-' + p.category + '">' + p.category + '</span>' +
    '<div class="card-name">' + p.name + '</div>' +
    '<div class="card-desc">' + p.description + '</div>' +
    '<div class="card-tags">' + tagsHtml + '</div>' +
    '<div class="card-actions">' + actionsHtml + '</div>' +
    '</div></div>'
}

function render() {
  const grid = document.getElementById('grid')
  const active = projects.filter(p => p.active !== false)
  const inactive = projects.filter(p => p.active === false)
  document.getElementById('count').textContent = active.length + ' Active · ' + inactive.length + ' Deactivated'
  if (!projects.length) {
    grid.innerHTML = '<div class="empty">No demo projects yet. Click "Add Project" to get started.</div>'
    return
  }
  let html = '<div class="grid">' + active.map((p,i) => renderCard(p, projects.indexOf(p), i)).join('') + '</div>'
  if (inactive.length) {
    html += '<div class="deact-section"><div class="deact-label">Deactivated (hidden from portfolio)</div><div class="grid">' +
      inactive.map((p,i) => renderCard(p, projects.indexOf(p), active.length + i)).join('') + '</div></div>'
  }
  grid.innerHTML = html
}

function openAdd() {
  editingId = null
  uploadedFile = null
  document.getElementById('modal-title').textContent = 'Add Demo Project'
  document.getElementById('f-id').value = ''
  document.getElementById('f-name').value = ''
  document.getElementById('f-desc').value = ''
  document.getElementById('f-cat').value = 'web'
  document.getElementById('f-tags').value = ''
  document.getElementById('f-github').value = ''
  document.getElementById('f-demo').value = ''
  document.getElementById('f-screenshot').value = ''
  document.getElementById('f-preview').classList.remove('show')
  document.getElementById('f-filename').textContent = ''
  document.getElementById('f-file').value = ''
  document.getElementById('modal').style.display = 'flex'
}

function openEdit(i) {
  const p = projects[i]
  editingId = p.id
  uploadedFile = null
  document.getElementById('modal-title').textContent = 'Edit Project'
  document.getElementById('f-id').value = p.id
  document.getElementById('f-name').value = p.name
  document.getElementById('f-desc').value = p.description
  document.getElementById('f-cat').value = p.category
  document.getElementById('f-tags').value = (p.tags||[]).join(', ')
  document.getElementById('f-github').value = p.github || ''
  document.getElementById('f-demo').value = p.demo || ''
  document.getElementById('f-screenshot').value = p.screenshot || ''
  document.getElementById('f-file').value = ''
  document.getElementById('f-filename').textContent = ''
  const prev = document.getElementById('f-preview')
  if (p.screenshot) {
    prev.src = p.screenshot
    prev.classList.add('show')
  } else {
    prev.classList.remove('show')
  }
  document.getElementById('modal').style.display = 'flex'
}

function closeModal() {
  document.getElementById('modal').style.display = 'none'
}

function previewFile(input) {
  if (!input.files[0]) return
  uploadedFile = input.files[0]
  document.getElementById('f-filename').textContent = uploadedFile.name
  const reader = new FileReader()
  reader.onload = e => {
    const prev = document.getElementById('f-preview')
    prev.src = e.target.result
    prev.classList.add('show')
  }
  reader.readAsDataURL(uploadedFile)
}

function previewUrl(url) {
  const prev = document.getElementById('f-preview')
  if (url) {
    prev.src = url.startsWith('/') ? 'http://localhost:3099'+url : url
    prev.classList.add('show')
  } else {
    prev.classList.remove('show')
  }
}

async function saveProject() {
  const name = document.getElementById('f-name').value.trim()
  const desc = document.getElementById('f-desc').value.trim()
  if (!name || !desc) { toast('Name and description are required'); return }

  let screenshotPath = document.getElementById('f-screenshot').value.trim()

  if (uploadedFile) {
    const fd = new FormData()
    fd.append('file', uploadedFile)
    const up = await fetch('/api/upload', { method: 'POST', body: fd })
    const upRes = await up.json()
    if (upRes.path) screenshotPath = upRes.path
  }

  const id = editingId || name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + Date.now().toString(36)
  const project = {
    id,
    name,
    description: desc,
    tags: document.getElementById('f-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    category: document.getElementById('f-cat').value,
    github: document.getElementById('f-github').value.trim(),
    demo: document.getElementById('f-demo').value.trim(),
    screenshot: screenshotPath
  }

  const res = await fetch('/api/projects', {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  })
  if (res.ok) {
    closeModal()
    await load()
    toast(editingId ? 'Project updated!' : 'Project added!')
  } else {
    toast('Error saving project')
  }
}

async function softDeleteProject(id) {
  if (!confirm('Deactivate this project? It will be hidden from your portfolio but can be restored anytime.')) return
  await fetch('/api/projects/soft/' + id, { method: 'DELETE' })
  await load()
  toast('Project deactivated — still in JSON, hidden from portfolio')
}

async function hardDeleteProject(id) {
  if (!confirm('PERMANENTLY delete this project? This cannot be undone.')) return
  await fetch('/api/projects/hard/' + id, { method: 'DELETE' })
  await load()
  toast('Project permanently deleted')
}

async function restoreProject(id) {
  await fetch('/api/projects/restore/' + id, { method: 'PUT' })
  await load()
  toast('Project restored and visible on portfolio')
}

function toast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2500)
}

load()
</script>
</body>
</html>`

// ── Shared admin nav snippet (injected into both pages) ───────────────────
const ADMIN_NAV_STYLES = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f6f8;color:#111;min-height:100vh;font-size:14px}
/* ── Topbar ── */
.topbar{background:#fff;border-bottom:1px solid rgba(0,0,0,.09);padding:0 28px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.topbar h1{font-size:15px;font-weight:700;color:#111;letter-spacing:-.01em}
.topbar-right{display:flex;align-items:center;gap:16px}
.topbar span{font-size:11px;color:#999;font-family:monospace}
.topbar-signout{background:transparent;border:1px solid rgba(0,0,0,.12);color:#666;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s}
.topbar-signout:hover{border-color:#c09030;color:#c09030}
/* ── Nav ── */
.admin-nav{background:#fff;border-bottom:1px solid rgba(0,0,0,.08);padding:0 28px;display:flex;gap:2px}
.nav-item{display:inline-flex;align-items:center;gap:5px;padding:12px 14px;font-size:12px;font-weight:500;color:#777;text-decoration:none;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
.nav-item:hover{color:#333;border-bottom-color:rgba(0,0,0,.15)}
.nav-item.active{color:#c09030;border-bottom-color:#c09030;font-weight:600}
/* ── Layout ── */
.wrap{max-width:1280px;margin:0 auto;padding:24px 28px}
/* ── Toolbar ── */
.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.toolbar h2{font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em}
/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
.btn-primary{background:#c09030;color:#fff}
.btn-primary:hover{background:#a87828}
.btn-danger{background:#fff;color:#dc2626;border:1px solid rgba(220,38,38,.25)}
.btn-danger:hover{background:#fef2f2;border-color:#dc2626}
.btn-secondary{background:#fff;color:#444;border:1px solid rgba(0,0,0,.15)}
.btn-secondary:hover{background:#f5f5f5;border-color:rgba(0,0,0,.25)}
.btn-sm{padding:4px 10px;font-size:11px;border-radius:5px}
/* ── Filter pills ── */
.filter-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
.filter-btn{padding:4px 13px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid rgba(0,0,0,.12);background:#fff;color:#666;transition:all .15s}
.filter-btn:hover{border-color:#c09030;color:#c09030}
.filter-btn.active{background:#c09030;border-color:#c09030;color:#fff}
/* ── Table ── */
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid rgba(0,0,0,.08);box-shadow:0 1px 3px rgba(0,0,0,.04)}
thead tr{background:#fafafa;border-bottom:1px solid rgba(0,0,0,.08)}
th{padding:9px 13px;text-align:left;font-size:10.5px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.07em}
td{padding:9px 13px;font-size:12.5px;color:#333;border-bottom:1px solid rgba(0,0,0,.05);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(192,144,48,.03)}
/* ── Badges ── */
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600}
.badge-high{background:#fef2f2;color:#dc2626;border:1px solid rgba(220,38,38,.2)}
.badge-medium{background:#fffbeb;color:#b45309;border:1px solid rgba(180,83,9,.2)}
.badge-low{background:#f0fdf4;color:#16a34a;border:1px solid rgba(22,163,74,.2)}
.badge-todo{background:#f5f5f5;color:#777;border:1px solid rgba(0,0,0,.1)}
.badge-inprogress{background:#eff6ff;color:#2563eb;border:1px solid rgba(37,99,235,.2)}
.badge-done{background:#f0fdf4;color:#16a34a;border:1px solid rgba(22,163,74,.2)}
.badge-active{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:#f0fdf4;color:#16a34a;border:1px solid rgba(22,163,74,.2)}
.badge-inactive{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:#f5f5f5;color:#999;border:1px solid rgba(0,0,0,.1)}
/* ── Inline controls ── */
.inline-status{background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:5px;color:#444;padding:3px 7px;font-size:11px;cursor:pointer;outline:none}
.inline-status:focus{border-color:#c09030}
.tag-chip{display:inline-block;padding:1px 7px;border-radius:20px;font-size:10px;background:#f0f0f0;border:1px solid rgba(0,0,0,.1);color:#555;margin:1px}
.file-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:5px;font-size:11px;background:#f5f5f5;border:1px solid rgba(0,0,0,.1);color:#555;margin:2px;text-decoration:none}
.file-chip:hover{border-color:#c09030;color:#c09030}
.file-chip-rm{background:none;border:none;color:#bbb;cursor:pointer;font-size:12px;margin-left:2px;padding:0}
.file-chip-rm:hover{color:#dc2626}
/* ── Modal ── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:12px;width:100%;max-width:580px;max-height:92vh;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#ddd #fff;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.modal::-webkit-scrollbar{width:4px}
.modal::-webkit-scrollbar-track{background:#fff}
.modal::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
.modal::-webkit-scrollbar-thumb:hover{background:#c09030}
.modal-head{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center}
.modal-head h3{font-size:14px;font-weight:700;color:#111}
.modal-close{background:none;border:none;color:#bbb;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px;border-radius:4px}
.modal-close:hover{background:#f0f0f0;color:#333}
.modal-body{padding:18px 20px}
.field{margin-bottom:13px}
.field label{display:block;font-size:10.5px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.field input,.field textarea,.field select{width:100%;background:#fff;border:1px solid rgba(0,0,0,.14);border-radius:7px;padding:8px 11px;color:#111;font-size:13px;font-family:inherit;transition:border-color .15s;outline:none}
.field input:focus,.field textarea:focus,.field select:focus{border-color:#c09030;box-shadow:0 0 0 3px rgba(192,144,48,.1)}
.field textarea{resize:vertical;min-height:80px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.field-hint{font-size:11px;color:#999;margin-top:4px;font-family:monospace}
.modal-foot{padding:12px 20px;border-top:1px solid rgba(0,0,0,.07);display:flex;justify-content:flex-end;gap:8px;background:#fafafa;border-radius:0 0 12px 12px}
.upload-area{border:2px dashed rgba(0,0,0,.12);border-radius:8px;padding:16px;text-align:center;cursor:pointer;transition:border-color .15s}
.upload-area:hover{border-color:#c09030}
.upload-area p{font-size:12px;color:#aaa;margin-top:4px}
/* ── Toast ── */
.toast{position:fixed;bottom:20px;right:20px;background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:500;z-index:200;transform:translateY(80px);opacity:0;transition:all .3s;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.toast.show{transform:translateY(0);opacity:1}
/* ── Empty state ── */
.empty-state{text-align:center;padding:56px 20px;color:#bbb;font-size:13px}
/* ── Pagination ── */
.pagination{display:flex;align-items:center;justify-content:flex-end;gap:5px;padding:14px 0 2px;flex-wrap:wrap}
.pg-btn{background:#fff;border:1px solid rgba(0,0,0,.13);color:#555;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:inherit}
.pg-btn:hover:not(:disabled){background:#f5f5f5;border-color:rgba(0,0,0,.22)}
.pg-btn:disabled{opacity:.32;cursor:default}
.pg-num{background:#fff;border:1px solid rgba(0,0,0,.12);color:#555;min-width:30px;height:30px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;padding:0 2px}
.pg-num:hover{background:#f5f5f5;border-color:rgba(0,0,0,.22)}
.pg-num.active{background:#c09030;border-color:#c09030;color:#fff}
.pg-info{font-size:11px;color:#aaa;margin-right:6px}
/* ── Loader & row animations ── */
@keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes loaderPulse{0%,100%{opacity:.5}50%{opacity:1}}
.page-loader{display:none;flex-direction:column;align-items:center;justify-content:center;padding:64px 20px;gap:14px;width:100%}
.page-loader.show{display:flex}
.loader-ring{width:36px;height:36px;border:3px solid rgba(192,144,48,.15);border-top-color:#c09030;border-radius:50%;animation:spin .7s linear infinite}
.loader-label{font-size:11px;font-weight:600;color:#ccc;text-transform:uppercase;letter-spacing:.1em;animation:loaderPulse 1.4s ease-in-out infinite}
/* ── Responsive ── */
@media(max-width:768px){
  .topbar{padding:0 16px}
  .admin-nav{padding:0 16px;overflow-x:auto}
  .wrap{padding:16px}
  .field-row{grid-template-columns:1fr}
  td,th{padding:8px 10px;font-size:11.5px}
  .btn{padding:7px 12px;font-size:11px}
}
@media(max-width:480px){
  .toolbar{flex-direction:column;align-items:flex-start}
  table{font-size:11px}
  .nav-item{padding:10px 10px;font-size:11px}
}
`

const LEARNINGS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portfolio Admin — Learnings</title>
<style>${ADMIN_NAV_STYLES}</style>
</head>
<body>
<div class="topbar">
  <h1>📚 Portfolio Admin</h1>
  <div class="topbar-right">
    <span>Learnings Manager · localhost:3098</span>
    <form method="POST" action="/api/logout" style="margin:0"><button type="submit" class="topbar-signout">Sign out</button></form>
  </div>
</div>
<nav class="admin-nav">
  <a href="/" class="nav-item">📁 Projects</a>
  <a href="/learnings" class="nav-item active">📚 Learnings</a>
  <a href="/interview-prep" class="nav-item">🎯 Interview Prep</a>
  <a href="/topics" class="nav-item">📝 Topics</a>
</nav>
<div class="wrap">
  <div class="toolbar">
    <h2 id="count">Learnings</h2>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary" onclick="openCatModal()" style="font-size:12px">⚙ Categories</button>
      <button class="btn btn-primary" onclick="openAdd()">+ Add Learning</button>
    </div>
  </div>
  <div class="filter-row" id="filters">
    <button class="filter-btn active" data-cat="all" onclick="setFilter(this,'cat')">All</button>
  </div>
  <div class="page-loader" id="loader"><div class="loader-ring"></div><span class="loader-label">Loading</span></div>
  <table id="main-table" style="opacity:0;transition:opacity .25s ease">
    <thead>
      <tr>
        <th>#</th>
        <th>Title / Tags</th>
        <th>Category</th>
        <th>Priority</th>
        <th>Status</th>
        <th>Files</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty-state" id="empty" style="display:none">No learnings yet. Click "+ Add Learning" to get started.</div>
  <div class="pagination" id="pagination"></div>
</div>

<!-- Modal -->
<div class="modal-bg" id="modal" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <h3 id="modal-title">Add Learning</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="f-id"/>
      <div class="field">
        <label>Title *</label>
        <input type="text" id="f-title" placeholder="e.g. SOLID Principles Deep Dive"/>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Category</label>
          <select id="f-category"></select>
        </div>
        <div class="field">
          <label>Priority</label>
          <select id="f-priority">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Status</label>
        <select id="f-status">
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="f-description" placeholder="Brief overview of what this learning covers..."></textarea>
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea id="f-notes" placeholder="Key takeaways, code snippets, links..."></textarea>
      </div>
      <div class="field">
        <label>Source URL <span style="color:#555;font-size:10px;font-weight:400;text-transform:none;letter-spacing:0">🔒 Admin only — not shown on public page</span></label>
        <input type="url" id="f-source" placeholder="https://docs.microsoft.com/..."/>
        <div class="field-hint">This URL is stored for your reference only and is never exposed in the public portfolio.</div>
      </div>
      <div class="field">
        <label>Tags (comma-separated)</label>
        <input type="text" id="f-tags" placeholder="SOLID, OOP, Design Patterns"/>
      </div>
      <div class="field">
        <label>Files</label>
        <div id="existing-files" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"></div>
        <div class="upload-area" onclick="document.getElementById('f-files').click()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5" style="margin:0 auto"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p>Click to upload files (images, PDF, Excel, Word, CSV)</p>
          <p id="f-filenames" style="color:#d4a847;margin-top:4px;font-size:11px"></p>
        </div>
        <input type="file" id="f-files" multiple accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.csv" style="display:none" onchange="onFilesChange(this)"/>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-btn" onclick="saveLearning()">Save</button>
    </div>
  </div>
</div>

<!-- Category Management Modal -->
<div class="modal-bg" id="cat-modal" style="display:none" onclick="if(event.target===this)closeCatModal()">
  <div class="modal" style="max-width:420px">
    <div class="modal-head">
      <h3>⚙ Manage Categories</h3>
      <button class="modal-close" onclick="closeCatModal()">×</button>
    </div>
    <div class="modal-body">
      <div id="cat-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>
      <div style="display:flex;gap:8px">
        <input type="text" id="new-cat-input" placeholder="New category name…"
          style="flex:1;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;color:#e0e0e0;font-size:13px;font-family:inherit;outline:none"
          onkeydown="if(event.key==='Enter')addCat()"
          onfocus="this.style.borderColor='#d4a847'" onblur="this.style.borderColor='#2a2a2a'"/>
        <button class="btn btn-primary" onclick="addCat()" style="white-space:nowrap">+ Add</button>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeCatModal()">Close</button>
      <button class="btn btn-primary" id="cat-save-btn" onclick="saveCats()">Save to DB</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let items = []
let activeCat = 'all'
let editingId = null
let pendingFiles = []
let existingFiles = []
let categories = []
let currentPage = 1
const PAGE_SIZE = 10

async function loadCats() {
  const res = await fetch('/api/learning-categories')
  categories = await res.json()
  renderCatFilters()
  renderCatDropdown()
}

function renderCatFilters() {
  const row = document.getElementById('filters')
  const current = activeCat
  row.innerHTML = '<button class="filter-btn' + (current==='all'?' active':'') + '" data-cat="all" onclick="setFilter(this)">All</button>' +
    categories.map(c => '<button class="filter-btn' + (current===c?' active':'') + '" data-cat="' + c + '" onclick="setFilter(this)">' + c + '</button>').join('')
}

function renderCatDropdown(selected) {
  const sel = document.getElementById('f-category')
  if (!sel) return
  const cur = selected || sel.value || categories[0] || ''
  sel.innerHTML = categories.map(c => '<option value="' + c + '"' + (c===cur?' selected':'') + '>' + c + '</option>').join('')
}

async function load() {
  const loader = document.getElementById('loader')
  const tbl = document.getElementById('main-table')
  loader.classList.add('show')
  tbl.style.opacity = '0'
  await loadCats()
  const res = await fetch('/api/learnings')
  items = await res.json()
  render()
  loader.classList.remove('show')
  requestAnimationFrame(() => { tbl.style.opacity = '1' })
}

function setFilter(btn) {
  document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  activeCat = btn.dataset.cat
  currentPage = 1
  render()
}

function priorityBadge(p) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }
  return '<span class="badge ' + (map[p]||'badge-low') + '">' + (p||'Low') + '</span>'
}
function statusBadge(s) {
  const cls = s === 'Done' ? 'badge-done' : s === 'In Progress' ? 'badge-inprogress' : 'badge-todo'
  return '<span class="badge ' + cls + '">' + (s||'Todo') + '</span>'
}
function fileIcon(name) {
  const ext = (name||'').split('.').pop().toLowerCase()
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📄'
  if (['xlsx','xls'].includes(ext)) return '📊'
  if (['docx','doc'].includes(ext)) return '📝'
  if (ext === 'csv') return '📋'
  return '📎'
}

function render() {
  const filtered = activeCat === 'all' ? items : items.filter(i => i.category === activeCat)
  const tbody = document.getElementById('tbody')
  const empty = document.getElementById('empty')
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  currentPage = Math.min(currentPage, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const slice = filtered.slice(start, start + PAGE_SIZE)
  document.getElementById('count').textContent = filtered.length + ' Learning' + (filtered.length !== 1 ? 's' : '')
  if (!filtered.length) { tbody.innerHTML = ''; empty.style.display = 'block'; renderPagination(0); return }
  empty.style.display = 'none'
  tbody.innerHTML = slice.map((item, idx) => {
    const globalIdx = start + idx
    const tags = (item.tags || []).map(t => '<span class="tag-chip">' + t + '</span>').join('')
    const files = (item.files || []).map(f => '<a class="file-chip" href="' + f.url + '" target="_blank">' + fileIcon(f.name) + ' ' + f.name + '</a>').join('')
    const jsonAttr = JSON.stringify(item).replace(/"/g, '&quot;')
    return '<tr style="animation:rowIn .2s ease both;animation-delay:' + (idx*0.028) + 's">' +
      '<td style="color:#555;font-size:11px">' + (globalIdx+1) + '</td>' +
      '<td><div style="font-weight:500;color:#111;margin-bottom:3px">' + item.title + '</div>' +
      '<div>' + tags + '</div></td>' +
      '<td><span style="font-size:11px;color:#666">' + (item.category||'') + '</span></td>' +
      '<td>' + priorityBadge(item.priority) + '</td>' +
      '<td><select class="inline-status" data-id="' + item.id + '" onchange="quickStatus(this.dataset.id,this.value)">' +
        ['Todo','In Progress','Done'].map(s => '<option value="' + s + '"' + (item.status===s?' selected':'') + '>' + s + '</option>').join('') +
      '</select></td>' +
      '<td>' + (files || '<span style="color:#444;font-size:11px">—</span>') + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn btn-secondary btn-sm" data-json="' + jsonAttr + '" onclick="openEdit(this.dataset.json)" style="margin-right:6px">✏️ Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-id="' + item.id + '" onclick="del(this.dataset.id)">🗑</button>' +
      '</td>' +
    '</tr>'
  }).join('')
  renderPagination(filtered.length)
}

function renderPagination(total) {
  const pg = document.getElementById('pagination')
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) { pg.innerHTML = ''; return }
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, total)
  let html = '<span class="pg-info">' + start + '–' + end + ' of ' + total + '</span>'
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '>← Prev</button>'
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += '<span class="pg-info">…</span>'
      continue
    }
    html += '<button class="pg-num' + (i===currentPage?' active':'') + '" onclick="goPage(' + i + ')">' + i + '</button>'
  }
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage+1) + ')" ' + (currentPage===totalPages?'disabled':'') + '>Next →</button>'
  pg.innerHTML = html
}

function goPage(n) { currentPage = n; render(); window.scrollTo({top:0,behavior:'smooth'}) }

async function quickStatus(id, status) {
  await fetch('/api/learnings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  const i = items.find(x => x.id === id)
  if (i) i.status = status
}

function openAdd() {
  editingId = null
  pendingFiles = []
  existingFiles = []
  document.getElementById('modal-title').textContent = 'Add Learning'
  document.getElementById('f-id').value = ''
  document.getElementById('f-title').value = ''
  renderCatDropdown(categories[0])
  document.getElementById('f-priority').value = 'Medium'
  document.getElementById('f-status').value = 'Todo'
  document.getElementById('f-description').value = ''
  document.getElementById('f-notes').value = ''
  document.getElementById('f-source').value = ''
  document.getElementById('f-tags').value = ''
  document.getElementById('f-files').value = ''
  document.getElementById('f-filenames').textContent = ''
  document.getElementById('existing-files').innerHTML = ''
  document.getElementById('modal').style.display = 'flex'
}

function openEdit(jsonStr) {
  const item = JSON.parse(jsonStr)
  editingId = item.id
  pendingFiles = []
  existingFiles = [...(item.files || [])]
  document.getElementById('modal-title').textContent = 'Edit Learning'
  document.getElementById('f-id').value = item.id
  document.getElementById('f-title').value = item.title || ''
  renderCatDropdown(item.category || categories[0])
  document.getElementById('f-priority').value = item.priority || 'Medium'
  document.getElementById('f-status').value = item.status || 'Todo'
  document.getElementById('f-description').value = item.description || ''
  document.getElementById('f-notes').value = item.notes || ''
  document.getElementById('f-source').value = item.source || ''
  document.getElementById('f-tags').value = (item.tags||[]).join(', ')
  document.getElementById('f-files').value = ''
  document.getElementById('f-filenames').textContent = ''
  renderExistingFiles()
  document.getElementById('modal').style.display = 'flex'
}

function renderExistingFiles() {
  const el = document.getElementById('existing-files')
  el.innerHTML = existingFiles.map((f, i) =>
    '<span class="file-chip">' + fileIcon(f.name) + ' ' + f.name +
    '<button class="file-chip-rm" onclick="removeFile(' + i + ')">×</button></span>'
  ).join('')
}

function removeFile(i) {
  existingFiles.splice(i, 1)
  renderExistingFiles()
}

function onFilesChange(input) {
  pendingFiles = Array.from(input.files)
  document.getElementById('f-filenames').textContent = pendingFiles.map(f => f.name).join(', ')
}

function closeModal() {
  document.getElementById('modal').style.display = 'none'
}

function openCatModal() {
  renderCatList()
  document.getElementById('cat-modal').style.display = 'flex'
  document.getElementById('new-cat-input').value = ''
}

function closeCatModal() {
  document.getElementById('cat-modal').style.display = 'none'
}

function renderCatList() {
  document.getElementById('cat-list').innerHTML = categories.map((c, i) =>
    '<div style="display:flex;align-items:center;justify-content:space-between;background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:8px 12px">' +
      '<span style="font-size:13px;color:#e0e0e0">' + c + '</span>' +
      '<button onclick="removeCat(' + i + ')" style="background:none;border:none;color:#666;cursor:pointer;font-size:18px;line-height:1;padding:0 4px" title="Remove">×</button>' +
    '</div>'
  ).join('')
}

function addCat() {
  const input = document.getElementById('new-cat-input')
  const name = input.value.trim()
  if (!name) return
  if (categories.includes(name)) { toast('Category already exists'); return }
  categories.push(name)
  input.value = ''
  renderCatList()
  toast('Added — click "Save to DB" to persist')
}

function removeCat(i) {
  const name = categories[i]
  categories.splice(i, 1)
  renderCatList()
  toast('Removed "' + name + '" — click "Save to DB" to persist')
}

async function saveCats() {
  const btn = document.getElementById('cat-save-btn')
  btn.disabled = true; btn.textContent = 'Saving...'
  try {
    const res = await fetch('/api/learning-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories })
    })
    if (res.ok) {
      renderCatFilters()
      renderCatDropdown()
      closeCatModal()
      toast('Categories saved!')
    } else { toast('Error saving categories') }
  } catch(e) { toast('Error: ' + e.message) }
  finally { btn.disabled = false; btn.textContent = 'Save to DB' }
}

async function saveLearning() {
  const title = document.getElementById('f-title').value.trim()
  if (!title) { toast('Title is required'); return }
  const saveBtn = document.getElementById('save-btn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Saving...'

  // Upload pending files one by one
  const uploadedFiles = [...existingFiles]
  for (const file of pendingFiles) {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch('/api/learn-upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (j.file) uploadedFiles.push(j.file)
    } catch(e) { console.error('File upload failed:', e) }
  }

  const payload = {
    id: editingId || undefined,
    title,
    category: document.getElementById('f-category').value,
    priority: document.getElementById('f-priority').value,
    status: document.getElementById('f-status').value,
    description: document.getElementById('f-description').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    source: document.getElementById('f-source').value.trim(),
    tags: document.getElementById('f-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    files: uploadedFiles
  }
  if (!payload.id) delete payload.id

  const res = await fetch('/api/learnings', {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  saveBtn.disabled = false
  saveBtn.textContent = 'Save'
  if (res.ok) {
    closeModal()
    await load()
    toast(editingId ? 'Learning updated!' : 'Learning added!')
  } else {
    toast('Error saving learning')
  }
}

async function del(id) {
  if (!confirm('Delete this learning? This cannot be undone.')) return
  await fetch('/api/learnings/' + id, { method: 'DELETE' })
  await load()
  toast('Learning deleted')
}

function toast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2500)
}

load()
</script>
</body>
</html>`

const INTERVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portfolio Admin — Interview Prep</title>
<style>${ADMIN_NAV_STYLES}
.diff-easy{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.2)}
.diff-medium{background:rgba(251,191,36,.12);color:#fbbf24;border:1px solid rgba(251,191,36,.2)}
.diff-hard{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.2)}
</style>
</head>
<body>
<div class="topbar">
  <h1>🎯 Portfolio Admin</h1>
  <div class="topbar-right">
    <span>Interview Prep Manager · localhost:3098</span>
    <form method="POST" action="/api/logout" style="margin:0"><button type="submit" class="topbar-signout">Sign out</button></form>
  </div>
</div>
<nav class="admin-nav">
  <a href="/" class="nav-item">📁 Projects</a>
  <a href="/learnings" class="nav-item">📚 Learnings</a>
  <a href="/interview-prep" class="nav-item active">🎯 Interview Prep</a>
  <a href="/topics" class="nav-item">📝 Topics</a>
</nav>
<div class="wrap">
  <div class="toolbar">
    <h2 id="count">Interview Prep</h2>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary" onclick="openCatModal()" style="font-size:12px">⚙ Categories</button>
      <button class="btn btn-primary" onclick="openAdd()">+ Add Question</button>
    </div>
  </div>
  <div class="filter-row" id="filters-cat">
    <button class="filter-btn active" data-cat="all" data-type="cat" onclick="setFilter(this)">All Categories</button>
  </div>
  <div class="filter-row" style="margin-top:-8px">
    <button class="filter-btn active" data-diff="all" data-type="diff" onclick="setFilter(this)">All Difficulties</button>
    <button class="filter-btn" data-diff="Easy" data-type="diff" onclick="setFilter(this)">🟢 Easy</button>
    <button class="filter-btn" data-diff="Medium" data-type="diff" onclick="setFilter(this)">🟡 Medium</button>
    <button class="filter-btn" data-diff="Hard" data-type="diff" onclick="setFilter(this)">🔴 Hard</button>
  </div>
  <div class="page-loader" id="loader"><div class="loader-ring"></div><span class="loader-label">Loading</span></div>
  <table id="main-table" style="opacity:0;transition:opacity .25s ease">
    <thead>
      <tr>
        <th>#</th>
        <th>Question</th>
        <th>Category</th>
        <th>Difficulty</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty-state" id="empty" style="display:none">No questions yet. Click "+ Add Question" to get started.</div>
  <div class="pagination" id="pagination"></div>
</div>

<!-- Modal -->
<div class="modal-bg" id="modal" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <h3 id="modal-title">Add Question</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="f-id"/>
      <div class="field">
        <label>Question *</label>
        <textarea id="f-question" rows="3" placeholder="e.g. Explain the difference between IEnumerable and IQueryable in C#"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Category</label>
          <select id="f-category"></select>
        </div>
        <div class="field">
          <label>Difficulty</label>
          <select id="f-difficulty">
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Status</label>
        <select id="f-status">
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
      <div class="field">
        <label>Answer / Notes</label>
        <textarea id="f-answer" rows="5" placeholder="Your prepared answer, key points, examples..."></textarea>
      </div>
      <div class="field">
        <label>Tags (comma-separated)</label>
        <input type="text" id="f-tags" placeholder="async, await, C#"/>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-btn" onclick="saveQuestion()">Save</button>
    </div>
  </div>
</div>

<!-- Category Management Modal -->
<div class="modal-bg" id="cat-modal" style="display:none" onclick="if(event.target===this)closeCatModal()">
  <div class="modal" style="max-width:420px">
    <div class="modal-head">
      <h3>⚙ Manage Categories</h3>
      <button class="modal-close" onclick="closeCatModal()">×</button>
    </div>
    <div class="modal-body">
      <div id="cat-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>
      <div style="display:flex;gap:8px">
        <input type="text" id="new-cat-input" placeholder="New category name…"
          style="flex:1;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;color:#e0e0e0;font-size:13px;font-family:inherit;outline:none"
          onkeydown="if(event.key==='Enter')addCat()"
          onfocus="this.style.borderColor='#d4a847'" onblur="this.style.borderColor='#2a2a2a'"/>
        <button class="btn btn-primary" onclick="addCat()" style="white-space:nowrap">+ Add</button>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeCatModal()">Close</button>
      <button class="btn btn-primary" id="cat-save-btn" onclick="saveCats()">Save to DB</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let items = []
let categories = []
let activeCat = 'all'
let activeDiff = 'all'
let editingId = null
let currentPage = 1
const PAGE_SIZE = 10

async function loadCats() {
  const res = await fetch('/api/iprep-categories')
  categories = await res.json()
  renderCatFilters()
  renderCatDropdown()
}

function renderCatFilters() {
  const row = document.getElementById('filters-cat')
  const current = activeCat
  row.innerHTML = '<button class="filter-btn' + (current==='all'?' active':'') + '" data-cat="all" data-type="cat" onclick="setFilter(this)">All Categories</button>' +
    categories.map(c => '<button class="filter-btn' + (current===c?' active':'') + '" data-cat="' + c + '" data-type="cat" onclick="setFilter(this)">' + c + '</button>').join('')
}

function renderCatDropdown(selected) {
  const sel = document.getElementById('f-category')
  if (!sel) return
  const cur = selected || sel.value || categories[0] || ''
  sel.innerHTML = categories.map(c => '<option value="' + c + '"' + (c===cur?' selected':'') + '>' + c + '</option>').join('')
}

async function load() {
  const loader = document.getElementById('loader')
  const tbl = document.getElementById('main-table')
  loader.classList.add('show')
  tbl.style.opacity = '0'
  await loadCats()
  const res = await fetch('/api/interview-prep')
  items = await res.json()
  render()
  loader.classList.remove('show')
  requestAnimationFrame(() => { tbl.style.opacity = '1' })
}

function setFilter(btn) {
  const type = btn.dataset.type
  if (type === 'cat') {
    document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeCat = btn.dataset.cat
  } else {
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeDiff = btn.dataset.diff
  }
  currentPage = 1
  render()
}

function openCatModal() {
  renderCatList()
  document.getElementById('cat-modal').style.display = 'flex'
  document.getElementById('new-cat-input').value = ''
}

function closeCatModal() {
  document.getElementById('cat-modal').style.display = 'none'
}

function renderCatList() {
  document.getElementById('cat-list').innerHTML = categories.map((c, i) =>
    '<div style="display:flex;align-items:center;justify-content:space-between;background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:8px 12px">' +
      '<span style="font-size:13px;color:#e0e0e0">' + c + '</span>' +
      '<button onclick="removeCat(' + i + ')" style="background:none;border:none;color:#666;cursor:pointer;font-size:18px;line-height:1;padding:0 4px" title="Remove">×</button>' +
    '</div>'
  ).join('')
}

function addCat() {
  const input = document.getElementById('new-cat-input')
  const name = input.value.trim()
  if (!name) return
  if (categories.includes(name)) { toast('Category already exists'); return }
  categories.push(name)
  input.value = ''
  renderCatList()
  toast('Added — click "Save to DB" to persist')
}

function removeCat(i) {
  const name = categories[i]
  categories.splice(i, 1)
  renderCatList()
  toast('Removed "' + name + '" — click "Save to DB" to persist')
}

async function saveCats() {
  const btn = document.getElementById('cat-save-btn')
  btn.disabled = true; btn.textContent = 'Saving...'
  try {
    const res = await fetch('/api/iprep-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories })
    })
    if (res.ok) {
      renderCatFilters()
      renderCatDropdown()
      closeCatModal()
      toast('Categories saved!')
    } else { toast('Error saving categories') }
  } catch(e) { toast('Error: ' + e.message) }
  finally { btn.disabled = false; btn.textContent = 'Save to DB' }
}

function diffBadge(d) {
  const cls = d === 'Easy' ? 'diff-easy' : d === 'Hard' ? 'diff-hard' : 'diff-medium'
  const icon = d === 'Easy' ? '🟢' : d === 'Hard' ? '🔴' : '🟡'
  return '<span class="badge ' + cls + '">' + icon + ' ' + (d||'Medium') + '</span>'
}

function render() {
  let filtered = items
  if (activeCat !== 'all') filtered = filtered.filter(i => i.category === activeCat)
  if (activeDiff !== 'all') filtered = filtered.filter(i => i.difficulty === activeDiff)
  const tbody = document.getElementById('tbody')
  const empty = document.getElementById('empty')
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  currentPage = Math.min(currentPage, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const slice = filtered.slice(start, start + PAGE_SIZE)
  document.getElementById('count').textContent = filtered.length + ' Question' + (filtered.length !== 1 ? 's' : '')
  if (!filtered.length) { tbody.innerHTML = ''; empty.style.display = 'block'; renderPagination(0); return }
  empty.style.display = 'none'
  tbody.innerHTML = slice.map((item, idx) => {
    const globalIdx = start + idx
    const q = (item.question||'').length > 80 ? item.question.slice(0,80) + '...' : item.question
    const jsonAttr = JSON.stringify(item).replace(/"/g, '&quot;')
    return '<tr style="animation:rowIn .2s ease both;animation-delay:' + (idx*0.028) + 's">' +
      '<td style="color:#555;font-size:11px">' + (globalIdx+1) + '</td>' +
      '<td style="max-width:360px"><span style="font-size:13px;color:#111">' + q + '</span></td>' +
      '<td><span style="font-size:11px;color:#666">' + (item.category||'') + '</span></td>' +
      '<td>' + diffBadge(item.difficulty) + '</td>' +
      '<td><select class="inline-status" data-id="' + item.id + '" onchange="quickStatus(this.dataset.id,this.value)">' +
        ['Todo','In Progress','Done'].map(s => '<option value="' + s + '"' + (item.status===s?' selected':'') + '>' + s + '</option>').join('') +
      '</select></td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn btn-secondary btn-sm" data-json="' + jsonAttr + '" onclick="openEdit(this.dataset.json)" style="margin-right:6px">✏️ Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-id="' + item.id + '" onclick="del(this.dataset.id)">🗑</button>' +
      '</td>' +
    '</tr>'
  }).join('')
  renderPagination(filtered.length)
}

function renderPagination(total) {
  const pg = document.getElementById('pagination')
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) { pg.innerHTML = ''; return }
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, total)
  let html = '<span class="pg-info">' + start + '–' + end + ' of ' + total + '</span>'
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '>← Prev</button>'
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += '<span class="pg-info">…</span>'
      continue
    }
    html += '<button class="pg-num' + (i===currentPage?' active':'') + '" onclick="goPage(' + i + ')">' + i + '</button>'
  }
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage+1) + ')" ' + (currentPage===totalPages?'disabled':'') + '>Next →</button>'
  pg.innerHTML = html
}

function goPage(n) { currentPage = n; render(); window.scrollTo({top:0,behavior:'smooth'}) }

async function quickStatus(id, status) {
  await fetch('/api/interview-prep/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  const i = items.find(x => x.id === id)
  if (i) i.status = status
}

function openAdd() {
  editingId = null
  document.getElementById('modal-title').textContent = 'Add Question'
  document.getElementById('f-id').value = ''
  document.getElementById('f-question').value = ''
  renderCatDropdown(categories[0])
  document.getElementById('f-difficulty').value = 'Medium'
  document.getElementById('f-status').value = 'Todo'
  document.getElementById('f-answer').value = ''
  document.getElementById('f-tags').value = ''
  document.getElementById('modal').style.display = 'flex'
}

function openEdit(jsonStr) {
  const item = JSON.parse(jsonStr)
  editingId = item.id
  document.getElementById('modal-title').textContent = 'Edit Question'
  document.getElementById('f-id').value = item.id
  document.getElementById('f-question').value = item.question || ''
  renderCatDropdown(item.category || categories[0])
  document.getElementById('f-difficulty').value = item.difficulty || 'Medium'
  document.getElementById('f-status').value = item.status || 'Todo'
  document.getElementById('f-answer').value = item.answer || ''
  document.getElementById('f-tags').value = (item.tags||[]).join(', ')
  document.getElementById('modal').style.display = 'flex'
}

function closeModal() {
  document.getElementById('modal').style.display = 'none'
}

async function saveQuestion() {
  const question = document.getElementById('f-question').value.trim()
  if (!question) { toast('Question is required'); return }
  const saveBtn = document.getElementById('save-btn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Saving...'

  const payload = {
    id: editingId || undefined,
    question,
    category: document.getElementById('f-category').value,
    difficulty: document.getElementById('f-difficulty').value,
    status: document.getElementById('f-status').value,
    answer: document.getElementById('f-answer').value.trim(),
    tags: document.getElementById('f-tags').value.split(',').map(t=>t.trim()).filter(Boolean)
  }
  if (!payload.id) delete payload.id

  const res = await fetch('/api/interview-prep', {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  saveBtn.disabled = false
  saveBtn.textContent = 'Save'
  if (res.ok) {
    closeModal()
    await load()
    toast(editingId ? 'Question updated!' : 'Question added!')
  } else {
    toast('Error saving question')
  }
}

async function del(id) {
  if (!confirm('Delete this question? This cannot be undone.')) return
  await fetch('/api/interview-prep/' + id, { method: 'DELETE' })
  await load()
  toast('Question deleted')
}

function toast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2500)
}

load()
</script>
</body>
</html>`

const TOPICS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portfolio Admin — Topics</title>
<script src="https://unpkg.com/marked@9/marked.min.js"><\/script>
<style>
${ADMIN_NAV_STYLES}
.modal{max-width:860px}
.md-tabs{display:flex;gap:4px;margin-bottom:8px}
.md-tab{padding:5px 14px;font-size:12px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:#f5f5f5;color:#777;cursor:pointer;font-family:inherit;transition:all .15s}
.md-tab.active{background:#fff3d6;border-color:#c09030;color:#c09030}
.md-editor{width:100%;height:300px;background:#fafafa;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:12px;color:#222;font-family:'Courier New',monospace;font-size:13px;line-height:1.6;resize:vertical;outline:none;transition:border-color .15s}
.md-editor:focus{border-color:#c09030;box-shadow:0 0 0 3px rgba(192,144,48,.1)}
.md-preview{min-height:300px;max-height:400px;padding:16px;background:#fafafa;border:1px solid rgba(0,0,0,.1);border-radius:8px;font-size:13px;line-height:1.7;color:#333;display:none;overflow-y:auto}
.md-preview h1,.md-preview h2,.md-preview h3{color:#111;margin:14px 0 7px;font-weight:600}
.md-preview h1{font-size:20px;border-bottom:1px solid rgba(0,0,0,.08);padding-bottom:6px}
.md-preview h2{font-size:16px}.md-preview h3{font-size:14px}
.md-preview p{margin:0 0 10px}
.md-preview code{background:#f0f0f0;border:1px solid rgba(0,0,0,.1);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#c09030}
.md-preview pre{background:#1e1e1e;border:1px solid rgba(0,0,0,.1);padding:12px;border-radius:8px;overflow-x:auto;margin:10px 0}
.md-preview pre code{background:none;border:none;padding:0;color:#e0e0e0;font-size:12px}
.md-preview ul,.md-preview ol{padding-left:20px;margin:0 0 10px}
.md-preview li{margin:3px 0}
.md-preview blockquote{border-left:3px solid #c09030;padding-left:12px;color:#777;font-style:italic;margin:10px 0}
.md-preview table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
.md-preview th,.md-preview td{padding:6px 10px;border:1px solid rgba(0,0,0,.1);text-align:left}
.md-preview th{background:#f5f5f5;color:#555;font-weight:600}
.md-preview a{color:#c09030;text-decoration:none}
.md-preview a:hover{text-decoration:underline}
.md-preview hr{border:none;border-top:1px solid rgba(0,0,0,.08);margin:16px 0}
.md-preview img{max-width:100%;border-radius:6px}
.upload-strip{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.upload-lbl{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:#fff;border:1px solid rgba(0,0,0,.14);border-radius:6px;font-size:11px;color:#666;cursor:pointer;font-family:inherit;transition:all .15s}
.upload-lbl:hover{border-color:#c09030;color:#c09030}
</style>
</head>
<body>
<div class="topbar">
  <h1>📝 Portfolio Admin</h1>
  <div class="topbar-right">
    <span>Topics Manager · localhost:3098</span>
    <form method="POST" action="/api/logout" style="margin:0"><button type="submit" class="topbar-signout">Sign out</button></form>
  </div>
</div>
<nav class="admin-nav">
  <a href="/" class="nav-item">📁 Projects</a>
  <a href="/learnings" class="nav-item">📚 Learnings</a>
  <a href="/interview-prep" class="nav-item">🎯 Interview Prep</a>
  <a href="/topics" class="nav-item active">📝 Topics</a>
</nav>
<div class="wrap">
  <div class="toolbar">
    <h2 id="count">Topics</h2>
    <button class="btn btn-primary" onclick="openAdd()">+ Add Topic</button>
  </div>
  <div class="page-loader" id="loader"><div class="loader-ring"></div><span class="loader-label">Loading</span></div>
  <table id="topics-table" style="opacity:0;transition:opacity .25s ease">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Title</th>
        <th>Slug / URL</th>
        <th style="width:90px">Status</th>
        <th style="width:110px">Created</th>
        <th style="width:220px">Actions</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty-state" id="empty" style="display:none">No topics yet. Click &ldquo;+ Add Topic&rdquo; to get started.</div>
  <div class="pagination" id="pagination"></div>
</div>

<div class="modal-bg" id="modal" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <h3 id="modal-title">Add Topic</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="f-slug"/>
      <div class="field">
        <label>Topic Title</label>
        <input type="text" id="f-title" placeholder="e.g. Introduction to Web3" oninput="autoSlug()"/>
        <div class="field-hint">URL: /pool/<span id="slug-prev" style="color:#d4a847;font-style:italic">auto-generated</span></div>
      </div>
      <div class="field">
        <label>Markdown Content</label>
        <div class="upload-strip">
          <label class="upload-lbl">
            📄 Upload .md file
            <input type="file" id="md-file" accept=".md,.markdown,.txt" style="display:none" onchange="readMdFile(this)"/>
          </label>
          <span style="font-size:11px;color:#444">or write / paste in the editor below</span>
        </div>
        <div class="md-tabs">
          <button class="md-tab active" id="tab-write" onclick="setTab('write')">Write</button>
          <button class="md-tab" id="tab-preview" onclick="setTab('preview')">Preview</button>
        </div>
        <textarea id="f-content" class="md-editor" placeholder="# Topic Title&#10;&#10;Write your markdown here...&#10;&#10;## Section&#10;&#10;- Point one&#10;- Point two"></textarea>
        <div id="md-preview" class="md-preview"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-btn" onclick="saveTopic()">Save Topic</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let allTopics = [], editingSlug = null, currentPage = 1
const PAGE_SIZE = 10

async function load() {
  const loader = document.getElementById('loader')
  const tbl = document.getElementById('topics-table')
  loader.classList.add('show')
  tbl.style.opacity = '0'
  const data = await fetch('/api/topics').then(r => r.json()).catch(() => [])
  allTopics = Array.isArray(data) ? data : []
  render()
  loader.classList.remove('show')
  requestAnimationFrame(() => { tbl.style.opacity = '1' })
}

function render() {
  const tbody = document.getElementById('tbody')
  const n = allTopics.length
  const totalPages = Math.max(1, Math.ceil(n / PAGE_SIZE))
  currentPage = Math.min(currentPage, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const slice = allTopics.slice(start, start + PAGE_SIZE)
  document.getElementById('count').textContent = n + ' topic' + (n !== 1 ? 's' : '')
  document.getElementById('topics-table').style.display = n ? '' : 'none'
  document.getElementById('empty').style.display = n ? 'none' : 'block'
  tbody.innerHTML = slice.map((t, i) => {
    const globalIdx = start + i
    const date = t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'
    const jsonAttr = JSON.stringify(t).replace(/"/g, '&quot;')
    const newActive = !t.active
    return '<tr style="animation:rowIn .2s ease both;animation-delay:' + (i*0.028) + 's">' +
      '<td style="color:#555;font-size:11px">' + (globalIdx + 1) + '</td>' +
      '<td><span style="font-weight:500;color:#111">' + t.title + '</span></td>' +
      '<td><code style="font-size:11px;color:#8a6100;background:#fff8e6;padding:2px 7px;border-radius:4px;border:1px solid #f0d98a">/pool/' + t.slug + '</code></td>' +
      '<td><span class="' + (t.active ? 'badge-active' : 'badge-inactive') + '">' + (t.active ? 'Active' : 'Inactive') + '</span></td>' +
      '<td style="font-size:11px;color:#666">' + date + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn btn-secondary btn-sm" style="margin-right:5px" data-json="' + jsonAttr + '" onclick="openEdit(this.dataset.json)">✏️ Edit</button>' +
        '<button class="btn btn-secondary btn-sm" style="margin-right:5px" data-slug="' + t.slug + '" data-active="' + newActive + '" onclick="toggleActive(this)">' + (t.active ? 'Deactivate' : 'Activate') + '</button>' +
        '<button class="btn btn-danger btn-sm" data-slug="' + t.slug + '" onclick="del(this.dataset.slug)">🗑</button>' +
      '</td>' +
    '</tr>'
  }).join('')
  renderPagination(n)
}

function renderPagination(total) {
  const pg = document.getElementById('pagination')
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) { pg.innerHTML = ''; return }
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, total)
  let html = '<span class="pg-info">' + start + '–' + end + ' of ' + total + '</span>'
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '>← Prev</button>'
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += '<span class="pg-info">…</span>'
      continue
    }
    html += '<button class="pg-num' + (i===currentPage?' active':'') + '" onclick="goPage(' + i + ')">' + i + '</button>'
  }
  html += '<button class="pg-btn" onclick="goPage(' + (currentPage+1) + ')" ' + (currentPage===totalPages?'disabled':'') + '>Next →</button>'
  pg.innerHTML = html
}

function goPage(n) { currentPage = n; render(); window.scrollTo({top:0,behavior:'smooth'}) }

function openAdd() {
  editingSlug = null
  document.getElementById('modal-title').textContent = 'Add Topic'
  document.getElementById('f-title').value = ''
  document.getElementById('f-slug').value = ''
  document.getElementById('f-content').value = ''
  const prev = document.getElementById('slug-prev')
  prev.textContent = 'auto-generated'
  prev.style.fontStyle = 'italic'
  document.getElementById('md-file').value = ''
  setTab('write')
  document.getElementById('modal').style.display = 'flex'
  setTimeout(() => document.getElementById('f-title').focus(), 50)
}

function openEdit(json) {
  const t = typeof json === 'string' ? JSON.parse(json) : json
  editingSlug = t.slug
  document.getElementById('modal-title').textContent = 'Edit Topic'
  document.getElementById('f-title').value = t.title || ''
  document.getElementById('f-slug').value = t.slug || ''
  const prev = document.getElementById('slug-prev')
  prev.textContent = t.slug || '—'
  prev.style.fontStyle = 'normal'
  document.getElementById('f-content').value = t.content || ''
  document.getElementById('md-file').value = ''
  setTab('write')
  document.getElementById('modal').style.display = 'flex'
}

function closeModal() { document.getElementById('modal').style.display = 'none' }

function autoSlug() {
  if (editingSlug) return
  const slug = document.getElementById('f-title').value
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  document.getElementById('f-slug').value = slug
  const prev = document.getElementById('slug-prev')
  prev.style.fontStyle = slug ? 'normal' : 'italic'
  prev.textContent = slug || 'auto-generated'
}

function readMdFile(input) {
  const file = input.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    document.getElementById('f-content').value = e.target.result
    setTab('write')
    toast('Loaded: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)')
  }
  reader.readAsText(file)
}

function setTab(tab) {
  const editor = document.getElementById('f-content')
  const preview = document.getElementById('md-preview')
  const tw = document.getElementById('tab-write')
  const tp = document.getElementById('tab-preview')
  if (tab === 'preview') {
    const md = editor.value
    preview.innerHTML = (window.marked && marked.parse) ? marked.parse(md) : '<pre style="white-space:pre-wrap">' + md.replace(/</g, '&lt;') + '</pre>'
    preview.style.display = 'block'
    editor.style.display = 'none'
    tw.classList.remove('active'); tp.classList.add('active')
  } else {
    preview.style.display = 'none'
    editor.style.display = 'block'
    tw.classList.add('active'); tp.classList.remove('active')
    editor.focus()
  }
}

async function saveTopic() {
  const title = document.getElementById('f-title').value.trim()
  const slug = document.getElementById('f-slug').value.trim()
  const content = document.getElementById('f-content').value
  if (!title) { toast('Title is required'); return }
  if (!slug) { toast('Slug is required'); return }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) { toast('Slug: lowercase, numbers, hyphens only'); return }

  const btn = document.getElementById('save-btn')
  btn.disabled = true; btn.textContent = 'Saving...'

  const now = new Date().toISOString()
  const payload = { title, slug, content, active: true, updated_at: now }
  if (!editingSlug) payload.created_at = now

  const method = editingSlug ? 'PUT' : 'POST'
  const url = editingSlug ? '/api/topics/' + editingSlug : '/api/topics'

  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    btn.disabled = false; btn.textContent = 'Save Topic'
    if (res.ok) { closeModal(); await load(); toast(editingSlug ? 'Topic updated!' : 'Topic added!') }
    else { toast('Error: ' + (await res.text()).slice(0, 100)) }
  } catch(e) { btn.disabled = false; btn.textContent = 'Save Topic'; toast('Error: ' + e.message) }
}

async function toggleActive(btn) {
  const slug = btn.dataset.slug
  const active = btn.dataset.active === 'true'
  await fetch('/api/topics/' + slug, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active })
  })
  await load()
  toast('Topic ' + (active ? 'activated' : 'deactivated'))
}

async function del(slug) {
  if (!confirm('Delete topic "' + slug + '"? This cannot be undone.')) return
  await fetch('/api/topics/' + slug, { method: 'DELETE' })
  await load()
  toast('Topic deleted')
}

function toast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

load()
<\/script>
</body>
</html>`

const server = http.createServer(async (req, res) => {
  const url = req.url
  const method = req.method

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Login page
  if (url === '/login' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(LOGIN_HTML)
    return
  }

  // Login POST — validate credentials and issue session cookie
  if (url === '/api/login' && method === 'POST') {
    let body = ''
    for await (const chunk of req) body += chunk
    const params = new URLSearchParams(body)
    const user = params.get('username') || ''
    const pass = params.get('password') || ''
    const remember = params.get('rememberMe') === '1'
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      const ttl = remember ? 30 * 24 * 60 * 60 * 1000 : SESSION_TTL
      const token = createSession(ttl)
      const cookies = [
        `admin_token=${token}; HttpOnly; Path=/; Max-Age=${ttl / 1000}`,
        remember
          ? `admin_remember_user=${encodeURIComponent(user)}; Path=/; Max-Age=${ttl / 1000}`
          : 'admin_remember_user=; Path=/; Max-Age=0'
      ]
      res.writeHead(302, { 'Set-Cookie': cookies, 'Location': '/' })
    } else {
      res.writeHead(302, { 'Location': '/login?err=1' })
    }
    res.end()
    return
  }

  // Logout — clear session and remember-me cookies
  if (url === '/api/logout' && method === 'POST') {
    const token = getCookie(req, 'admin_token')
    if (token) sessions.delete(token)
    res.writeHead(302, {
      'Set-Cookie': [
        'admin_token=; HttpOnly; Path=/; Max-Age=0',
        'admin_remember_user=; Path=/; Max-Age=0'
      ],
      'Location': '/login'
    })
    res.end()
    return
  }

  // Session guard — all routes below require login
  const token = getCookie(req, 'admin_token')
  if (!isValidSession(token)) {
    res.writeHead(302, { 'Location': '/login' })
    res.end()
    return
  }

  // Serve admin UI
  if (url === '/' || url === '/admin') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(HTML)
    return
  }

  // Serve screenshots as static files
  if (url.startsWith('/screenshots/')) {
    const safeName = path.basename(url)
    const filePath = path.join(SCREENSHOTS_DIR, safeName)
    if (fs.existsSync(filePath)) {
      const ext = path.extname(safeName).toLowerCase()
      const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp' }[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': mime })
      res.end(fs.readFileSync(filePath))
    } else {
      res.writeHead(404); res.end('Not found')
    }
    return
  }

  // GET all projects — reads from Supabase (primary DB)
  if (url === '/api/projects' && method === 'GET') {
    const projects = await readProjects()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(projects))
    return
  }

  // POST add project — writes to Supabase, backup syncs automatically
  if (url === '/api/projects' && method === 'POST') {
    const body = await parseBody(req)
    await sbUpsert(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // PUT update project — writes to Supabase
  if (url === '/api/projects' && method === 'PUT') {
    const body = await parseBody(req)
    await sbUpsert(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // SOFT delete — sets active: false in Supabase
  if (url.startsWith('/api/projects/soft/') && method === 'DELETE') {
    const id = url.replace('/api/projects/soft/', '')
    await sbPatch(id, { active: false })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // HARD delete — removes from Supabase permanently
  if (url.startsWith('/api/projects/hard/') && method === 'DELETE') {
    const id = url.replace('/api/projects/hard/', '')
    await sbDelete(id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // RESTORE — sets active: true in Supabase
  if (url.startsWith('/api/projects/restore/') && method === 'PUT') {
    const id = url.replace('/api/projects/restore/', '')
    await sbPatch(id, { active: true })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // POST upload screenshot → Supabase Storage (primary) + local backup
  if (url === '/api/upload' && method === 'POST') {
    const boundary = req.headers['content-type']?.split('boundary=')[1]
    if (!boundary) { res.writeHead(400); res.end('No boundary'); return }

    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const buf = Buffer.concat(chunks)
    const raw = buf.toString('binary')

    const fileMatch = raw.match(/filename="([^"]+)"/)
    const filename = fileMatch ? fileMatch[1] : `upload-${Date.now()}.png`
    const ext = path.extname(filename).toLowerCase() || '.png'
    const saveName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()

    const sep = '\r\n\r\n'
    const start = raw.indexOf(sep) + sep.length
    const end = raw.lastIndexOf(`\r\n--${boundary}`)
    const fileData = buf.slice(start, end)

    // Save to local disk as backup
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, saveName), fileData)

    // Upload to Supabase Storage
    const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp' }
    const mime = mimeMap[ext] || 'application/octet-stream'
    try {
      const sbRes = await fetch(`${SB_URL}/storage/v1/object/screenshots/${saveName}`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': mime, 'x-upsert': 'true' },
        body: fileData
      })
      if (!sbRes.ok) {
        const err = await sbRes.text()
        console.error('Storage upload error:', err)
      }
    } catch(e) { console.error('Storage upload failed:', e.message) }

    // Return Supabase public URL so it works everywhere (local + Vercel)
    const publicUrl = `${SB_URL}/storage/v1/object/public/screenshots/${saveName}`
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ path: publicUrl }))
    return
  }

  // ── Learnings pages ──────────────────────────────────────────────────────
  if (url === '/learnings' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(LEARNINGS_HTML)
    return
  }

  if (url === '/interview-prep' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(INTERVIEW_HTML)
    return
  }

  // ── Learnings API ─────────────────────────────────────────────────────────
  if (url === '/api/learnings' && method === 'GET') {
    const data = await sbReadLearnings()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  if (url === '/api/learnings' && (method === 'POST' || method === 'PUT')) {
    const body = await parseBody(req)
    await sbUpsertLearning(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.match(/^\/api\/learnings\/[^/]+$/) && method === 'PATCH') {
    const id = url.replace('/api/learnings/', '')
    const body = await parseBody(req)
    await sbPatchLearning(id, body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.match(/^\/api\/learnings\/[^/]+$/) && method === 'DELETE') {
    const id = url.replace('/api/learnings/', '')
    await sbDeleteLearning(id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // ── Interview Prep API ────────────────────────────────────────────────────
  if (url === '/api/interview-prep' && method === 'GET') {
    const data = await sbReadInterviewPrep()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  if (url === '/api/interview-prep' && (method === 'POST' || method === 'PUT')) {
    const body = await parseBody(req)
    await sbUpsertInterviewPrep(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.match(/^\/api\/interview-prep\/[^/]+$/) && method === 'PATCH') {
    const id = url.replace('/api/interview-prep/', '')
    const body = await parseBody(req)
    await sbPatchInterviewPrep(id, body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.match(/^\/api\/interview-prep\/[^/]+$/) && method === 'DELETE') {
    const id = url.replace('/api/interview-prep/', '')
    await sbDeleteInterviewPrep(id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // ── Learning file upload ───────────────────────────────────────────────────
  if (url === '/api/learn-upload' && method === 'POST') {
    const boundary = req.headers['content-type']?.split('boundary=')[1]
    if (!boundary) { res.writeHead(400); res.end('No boundary'); return }

    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const buf = Buffer.concat(chunks)
    const raw = buf.toString('binary')

    const fileMatch = raw.match(/filename="([^"]+)"/)
    const origName = fileMatch ? fileMatch[1] : `file-${Date.now()}.bin`
    const ext = path.extname(origName).toLowerCase() || '.bin'
    const safeName = ('learn-' + Date.now() + '-' + origName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()).slice(0, 120)

    const sep = '\r\n\r\n'
    const start = raw.indexOf(sep) + sep.length
    const end = raw.lastIndexOf('\r\n--' + boundary)
    const fileData = buf.slice(start, end)

    const mimeMap = {
      '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif',
      '.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf',
      '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls':'application/vnd.ms-excel',
      '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc':'application/msword','.csv':'text/csv'
    }
    const mime = mimeMap[ext] || 'application/octet-stream'

    try {
      const publicUrl = await sbLearnFileUpload(safeName, mime, fileData)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ file: { name: origName, url: publicUrl, type: mime } }))
    } catch(e) {
      console.error('Learn file upload error:', e.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // ── Topics page ─────────────────────────────────────────────────────────────
  if (url === '/topics' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(TOPICS_HTML)
    return
  }

  // GET all topics
  if (url === '/api/topics' && method === 'GET') {
    const data = await sbReadTopics()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  // POST new topic
  if (url === '/api/topics' && method === 'POST') {
    const body = await parseBody(req)
    await sbUpsertTopic(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // PUT update topic (oldSlug in URL; body may carry a new slug)
  if (url.match(/^\/api\/topics\/[^/]+$/) && method === 'PUT') {
    const oldSlug = url.replace('/api/topics/', '')
    const body = await parseBody(req)
    if (body.slug && body.slug !== oldSlug) await sbDeleteTopicKey(oldSlug)
    await sbUpsertTopic(body)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // PATCH topic (active toggle)
  if (url.match(/^\/api\/topics\/[^/]+$/) && method === 'PATCH') {
    const slug = url.replace('/api/topics/', '')
    const body = await parseBody(req)
    const all = await sbReadTopics()
    const current = all.find(t => t.slug === slug)
    if (!current) { res.writeHead(404); res.end('Not found'); return }
    await sbUpsertTopic({ ...current, ...body, updated_at: new Date().toISOString() })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // DELETE topic
  if (url.match(/^\/api\/topics\/[^/]+$/) && method === 'DELETE') {
    const slug = url.replace('/api/topics/', '')
    await sbDeleteTopicKey(slug)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // Interview Prep categories
  if (url === '/api/iprep-categories' && method === 'GET') {
    const cats = await sbGetIprepCats()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(cats))
    return
  }
  if (url === '/api/iprep-categories' && method === 'PUT') {
    const body = await parseBody(req)
    await sbSetIprepCats(body.categories)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // Learning categories
  if (url === '/api/learning-categories' && method === 'GET') {
    const cats = await sbGetLearnCats()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(cats))
    return
  }
  if (url === '/api/learning-categories' && method === 'PUT') {
    const body = await parseBody(req)
    await sbSetLearnCats(body.categories)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, async () => {
  console.log(`\n✅ Admin panel running at http://localhost:${PORT}`)
  try {
    const r = await fetch(`${SB_EP}?select=id`, { headers: SB_HDR })
    const rows = r.ok ? await r.json() : []
    console.log(`✅ Supabase: connected — ${rows.length} projects in DB\n`)
  } catch(e) { console.warn('⚠️  Supabase unreachable, using local JSON backup\n') }
})
