// ============================================================
// Configuração do backend (Supabase)
// ------------------------------------------------------------
// Enquanto SUPABASE_URL/ANON_KEY estiverem VAZIOS, a plataforma
// funciona em modo LOCAL (dados salvos no navegador).
// Preencha com os dados do SEU projeto Supabase para ativar o
// backend na nuvem (banco Postgres + login real compartilhado).
// ============================================================
window.TP_CONFIG = {
  // Project Settings > API, no painel do Supabase:
  SUPABASE_URL: "https://tczyyflnqxvknbhqrevt.supabase.co",            // ex.: "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjenl5ZmxucXh2a25iaHFyZXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTA4MDksImV4cCI6MjA5NzQ4NjgwOX0.D09EEt0cIZ0YkGa2lfUTcdJ0TpDPt2Pe90x-3VRXUt8",       // chave "anon public"

  // E-mail real da conta de administrador no Supabase.
  // No login, digitar "admin" usa este e-mail automaticamente.
  ADMIN_EMAIL: "thiagohccarvalho00@gmail.com",

  // Senha do admin usada APENAS no modo LOCAL (demo, sem Supabase).
  ADMIN_LOCAL_SENHA: "admin2026"
};
