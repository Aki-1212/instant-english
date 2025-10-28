import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://jtznsuhkvjukqoltncjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0em5zdWhrdmp1a3FvbHRuY2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Mzg0NzAsImV4cCI6MjA3NzExNDQ3MH0.mu6vPCOI-8rkIpuSWB5XCH_aAL_Ji_190NgTh4lZY88' // Supabase ダッシュボードの anon key
export const supabase = createClient(supabaseUrl, supabaseKey)
