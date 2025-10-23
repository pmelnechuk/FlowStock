import { createClient } from '@supabase/supabase-js';

// --- PEGA TUS CREDENCIALES DE SUPABASE AQUÍ ---
// 1. Ve a tu proyecto en Supabase.
// 2. Ve a Project Settings > API.
// 3. Copia la "Project URL" y pégala en supabaseUrl.
// 4. Copia la "anon public Key" y pégala en supabaseAnonKey.

const supabaseUrl = "https://qbvwjudrdxofvfbcgalx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidndqdWRyZHhvZnZmYmNnYWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzM0NTUsImV4cCI6MjA3Njc0OTQ1NX0.NsOatSitC3pkG3kx-5QD8wiS-O4F5i-3r7EIjRLurq0";


// Verificamos que las credenciales hayan sido reemplazadas.
export const isSupabaseConfigured = 
    !!supabaseUrl && 
    !!supabaseAnonKey && 
    !supabaseUrl.includes('TU_SUPABASE_URL_AQUI') && 
    !supabaseAnonKey.includes('TU_SUPABASE_ANON_KEY_AQUI');

// Si no está configurado, createClient recibirá strings vacíos.
// La lógica de la app en App.tsx evitará que se use un cliente no configurado.
export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : '', 
    isSupabaseConfigured ? supabaseAnonKey : ''
);
