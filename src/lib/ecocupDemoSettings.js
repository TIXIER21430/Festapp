// Demo-only preferences. Never treat browser storage as a shared stock source.
export const ECOCUP_DEMO_SETTINGS_KEY = "festapp-demo-ecocups-settings-v1";
export const DEFAULT_ECOCUP_SETTINGS = Object.freeze({openingBalance:"0",alertThreshold:"100"});

export function parseDemoEcocupSettings(raw) {
  if (typeof raw !== "string" || raw.length > 256) return {...DEFAULT_ECOCUP_SETTINGS};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Invalid settings");
    const valid = value => typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value) && Number.isSafeInteger(Number(value));
    if (!valid(parsed.openingBalance) || !valid(parsed.alertThreshold)) throw new TypeError("Invalid settings");
    return {openingBalance:parsed.openingBalance,alertThreshold:parsed.alertThreshold};
  } catch {
    return {...DEFAULT_ECOCUP_SETTINGS};
  }
}
export function serializeDemoEcocupSettings(settings) {
  const result = parseDemoEcocupSettings(JSON.stringify(settings));
  if (result.openingBalance !== settings?.openingBalance || result.alertThreshold !== settings?.alertThreshold) {
    throw new TypeError("Invalid ecocup demo settings");
  }
  return JSON.stringify(result);
}
