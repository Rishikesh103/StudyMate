import { createClient } from "@supabase/supabase-js";

// Use Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Create Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);
