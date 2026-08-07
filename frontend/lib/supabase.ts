import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kmpodmsxswoavvffkggg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcG9kbXN4c3dvYXZ2ZmZrZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODg1NjEsImV4cCI6MjEwMTY2NDU2MX0.pot8nD0l2_B2Q-xSKrC2uqltMPVy2lwaA58KWmAED30";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
