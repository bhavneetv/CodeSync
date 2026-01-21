import {createClient} from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_Supabase_URL;
const supabaseKey = import.meta.env.VITE_Supabase_Anon_Key;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export default supabase;