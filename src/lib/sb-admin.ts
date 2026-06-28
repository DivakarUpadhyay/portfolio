export const SB_URL = 'https://rvyqwprkfzusjqblggvh.supabase.co'
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXF3cHJrZnp1c2pxYmxnZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzODIsImV4cCI6MjA5Njk4ODM4Mn0.EcZ9UvjW_dlCASav1sNuclS4bPX8fRpDjrEhPLINQpg'
// Service role key bypasses RLS — required for admin writes. Set in Vercel env vars.
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SB_KEY
export const SB_HDR = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}
export const SB_WRITE_HDR = {
  apikey: SB_SERVICE_KEY,
  Authorization: `Bearer ${SB_SERVICE_KEY}`,
  'Content-Type': 'application/json',
}
export const PREFER_UPSERT = 'resolution=merge-duplicates'
