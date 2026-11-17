// Local-only demo persistence. Never synchronizes or sends data to Supabase.
import {validateDemoData} from "./demoBackup.js";

export const DEMO_STORAGE_KEY = "festapp-demo-v1";

export function readDemoStorage(storage, seed = {}) {
  const fallback = validateDemoData(seed);
  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY);
    if (raw === null) return {data:fallback,warning:""};
    const parsed = JSON.parse(raw);
    const saved = validateDemoData(parsed);
    return {data:{...fallback,...saved},warning:""};
  } catch {
    return {data:fallback,warning:"Impossible de lire les fiches locales. Les données enregistrées n'ont pas été effacées : vérifiez le stockage de cet appareil avant toute modification."};
  }
}

export function writeDemoStorage(storage, data) {
  try {
    const validated = validateDemoData(data);
    storage.setItem(DEMO_STORAGE_KEY,JSON.stringify(validated));
    return {saved:true,warning:""};
  } catch {
    return {saved:false,warning:"Enregistrement local impossible (stockage plein ou bloqué). Les changements restent visibles mais peuvent disparaître à la fermeture : téléchargez immédiatement une sauvegarde JSON."};
  }
}
