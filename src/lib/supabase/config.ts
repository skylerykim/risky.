// Supabase connection details.
//
// The URL and anon key are PUBLIC by design (the anon key is shipped to every
// browser; Row Level Security is what protects the data, not key secrecy). We
// bake them in as defaults so the app works on any deploy without needing
// build-time env vars, the same "just set it and go" reliability as the
// firewood dashboard. Env vars still override these if you ever set them.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hjftbtxipzhkyakwiwci.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZnRidHhpcHpoa3lha3dpd2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODQzMjQsImV4cCI6MjA5NzM2MDMyNH0.Bjfh14TIGMQV_OfcQmy0ogUkKxOWaF-ckkFIickaXFw";
