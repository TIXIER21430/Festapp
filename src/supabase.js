import { createClient } from "@supabase/supabase-js";

// FEST'APP utilise son propre projet Supabase, jamais celui de TIXAPP.
// Seule une clé publishable (ou legacy anon) peut être placée dans VITE_*.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();

export const isCloudConfigured = Boolean(url && key);
export const supabase = isCloudConfigured ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;

function requireCloud() {
  if (!supabase) throw new Error("FEST'APP n'est pas encore connecté à son projet Supabase.");
  return supabase;
}

export async function signInMember(email, password) {
  const client = requireCloud();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const member = await getCurrentMember();
  if (!member) {
    await client.auth.signOut();
    throw new Error("Compte non autorisé : adresse non inscrite parmi les membres du bureau.");
  }
  return member;
}

export async function getCurrentMember() {
  const client = requireCloud();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const response = await client.from("festapp_members").select("user_id, display_name").eq("user_id", user.id).maybeSingle();
  if (response.error) throw response.error;
  return response.data;
}

export async function signOutMember() {
  const { error } = await requireCloud().auth.signOut();
  if (error) throw error;
}

// L'API ci-dessous n'est utilisée qu'après connexion et validation du membre.
// L'accès réel est imposé par RLS au niveau PostgreSQL.
export async function listRecords(module) {
  const { data, error } = await requireCloud().from("festapp_records")
    .select("id,module,fields,created_at,updated_at").eq("module", module)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRecord(module, fields) {
  const { data, error } = await requireCloud().from("festapp_records")
    .insert({ module, fields }).select("id,module,fields,created_at,updated_at").single();
  if (error) throw error;
  return data;
}

export async function updateRecord(id, fields) {
  const { data, error } = await requireCloud().from("festapp_records")
    .update({ fields, updated_at: new Date().toISOString() }).eq("id", id)
    .select("id,module,fields,created_at,updated_at").single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(id) {
  const { error } = await requireCloud().from("festapp_records").delete().eq("id", id);
  if (error) throw error;
}

export async function getSetting(settingKey) {
  const { data, error } = await requireCloud().from("festapp_settings")
    .select("value").eq("setting_key", settingKey).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function saveSetting(settingKey, value) {
  const { error } = await requireCloud().from("festapp_settings")
    .upsert({ setting_key: settingKey, value }, { onConflict: "setting_key" });
  if (error) throw error;
}
