import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vahcsalnnswfhdaqlueu.supabase.co";

const supabaseAnonKey = "sb_publishable_UiV46W4cGfx7HhW0f47VPA_TYrFFfJG";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
