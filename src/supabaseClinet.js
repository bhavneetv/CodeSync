import {createClient} from '@supabase/supabase-js';
// const supabaseUrl = import.meta.env.VITE_Supabase_URL;
// const supabaseKey = import.meta.env.VITE_Supabase_Anon_Key;
const supabaseUrl = "https://nptlwziwtttxplwgxjvn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdGx3eml3dHR0eHBsd2d4anZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTE2MzUsImV4cCI6MjA4NDU2NzYzNX0.EnDhgTc4xiCmPwowkCj3POGpShBxTDtwiVXe7s1Hw7U"
;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export default supabase;