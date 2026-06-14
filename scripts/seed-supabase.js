const fs   = require('fs')
const path = require('path')

const SB_URL = 'https://rvyqwprkfzusjqblggvh.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXF3cHJrZnp1c2pxYmxnZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzODIsImV4cCI6MjA5Njk4ODM4Mn0.EcZ9UvjW_dlCASav1sNuclS4bPX8fRpDjrEhPLINQpg'
const DATA  = path.join(__dirname, '..', 'data')
const HDR   = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }

async function upsertPortfolio(key) {
  const value = JSON.parse(fs.readFileSync(path.join(DATA, `${key}.json`), 'utf8'))
  const res = await fetch(`${SB_URL}/rest/v1/portfolio_data`, {
    method: 'POST', headers: HDR, body: JSON.stringify({ key, value })
  })
  console.log(res.ok ? `  ✅ portfolio_data → ${key}` : `  ❌ ${key}: ${await res.text()}`)
}

async function upsertDemoProjects() {
  const items = JSON.parse(fs.readFileSync(path.join(DATA, 'demo-projects.json'), 'utf8'))
  for (const p of items) {
    const res = await fetch(`${SB_URL}/rest/v1/demo_projects`, {
      method: 'POST', headers: HDR, body: JSON.stringify(p)
    })
    console.log(res.ok ? `  ✅ demo_projects  → ${p.name}` : `  ❌ ${p.id}: ${await res.text()}`)
  }
}

async function main() {
  console.log('\n🚀 Seeding Supabase from local JSON...\n')
  for (const key of ['profile', 'skills', 'experience', 'projects']) {
    await upsertPortfolio(key)
  }
  await upsertDemoProjects()
  console.log('\n🎉 Done! All data is now in Supabase.\n')
}

main().catch(console.error)
