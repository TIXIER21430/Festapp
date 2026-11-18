import {validateDemoData} from './demoBackup.js';
import {parseVolunteerNeeds} from './volunteerNeeds.js';
import {DEFAULT_ECOCUP_SETTINGS,serializeDemoEcocupSettings} from './ecocupDemoSettings.js';
import {validateTillConfig} from './tillConfig.js';

const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'
 ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;

export function makeTestSyncPayload({data={},volunteerNeeds={},ecocupSettings=DEFAULT_ECOCUP_SETTINGS,tillConfig={}}={}){
 const payload={
  data:validateDemoData(data),
  volunteerNeeds:parseVolunteerNeeds(JSON.stringify(volunteerNeeds)),
  ecocupSettings:JSON.parse(serializeDemoEcocupSettings(ecocupSettings)),
  tillConfig:validateTillConfig(tillConfig)
 };
 if(new TextEncoder().encode(JSON.stringify(payload)).length>900_000)throw new RangeError('Trop de données pour la copie TEST. Conserve un ZIP local.');
 return payload;
}

export function readTestSyncPayload(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('Copie cloud invalide.');
 return makeTestSyncPayload({
  data:raw.data??{},
  volunteerNeeds:raw.volunteerNeeds??{},
  ecocupSettings:raw.ecocupSettings??DEFAULT_ECOCUP_SETTINGS,
  tillConfig:raw.tillConfig??{}
 });
}

export function testSyncText(payload){return JSON.stringify(canonical(readTestSyncPayload(payload)));}

export function sameTestPayload(left,right){return testSyncText(left)===testSyncText(right);}

export function testSyncRecordCount(payload){return Object.values(payload.data).reduce((sum,rows)=>sum+rows.length,0);}
