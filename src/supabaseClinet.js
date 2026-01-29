import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.supabaseUrl;
const supabaseKey = import.meta.supabaseKey;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export default supabase