
import { createClient } from '@supabase/supabase-js';

// --- PEGA TUS CREDENCIALES DE SUPABASE AQUÍ ---
// 1. Ve a tu proyecto en Supabase.
// 2. Ve a Project Settings > API.
// 3. Copia la "Project URL" y pégala en supabaseUrl.
// 4. Copia la "anon public Key" y pégala en supabaseAnonKey.

const supabaseUrl = "https://ebidtdjjtdphifgtacgj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaWR0ZGpqdGRwaGlmZ3RhY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTc5NjEsImV4cCI6MjA3ODc5Mzk2MX0.HtlyELiVP0MMTm3B9Ja_-GmByR4y7tXwuluSnlKgm40";


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
    isSupabaseConfigured ? supabaseAnonKey : '',
    {
        auth: {
            // Desactiva la persistencia de la sesión en el almacenamiento del navegador (localStorage).
            // El usuario deberá iniciar sesión cada vez que la página se cargue.
            persistSession: false
        }
    }
);
