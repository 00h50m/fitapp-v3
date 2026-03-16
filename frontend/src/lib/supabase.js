import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gsixrfvbusezudqbquiu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXhyZnZidXNlenVkcWJxdWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTIxMTEsImV4cCI6MjA4NjMyODExMX0.7TAhXexcqjhfCcL1CDPx1llz46uGIWZkYaW32BiGzTw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,      // mantém sessão no localStorage
    detectSessionInUrl: false,
    storageKey: "Santana Method-auth", // chave única no localStorage
  },
});