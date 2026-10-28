const SUPABASE_URL = "https://dtwjulokzfzkxngarrax.supabase.co";
const SUPABASE_KEY = "sb_publishable_NnGoNuWIzw-LuN_Xebv8ag_TDBRNT8Y";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Small helpers and shared data used by every other file
const $ = (id) => document.getElementById(id);
const n0 = (x) => Number(x) || 0;

let players = [];        // the loaded player list
let adminPassword = "";  // set after the password popup succeeds
