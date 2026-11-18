import test from "node:test";
import assert from "node:assert/strict";
import {getFestappConnection,FESTAPP_TEST_URL,FESTAPP_TEST_SPACE_ID} from "../src/lib/supabaseClient.js";
import {FESTAPP_SUPABASE_URL,FESTAPP_SPACE_ID} from "../src/lib/supabaseSharedRead.js";
test("live configuration remains unchanged without TEST flag",()=>{
 const config=getFestappConnection({VITE_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_live"});
 assert.equal(config.url,FESTAPP_SUPABASE_URL);
 assert.equal(config.spaceId,FESTAPP_SPACE_ID);
 assert.equal(config.testMode,false);
});
test("TEST mode fails closed without its own key",()=>{
 assert.equal(getFestappConnection({VITE_FESTAPP_TEST_MODE:"true",VITE_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_live"}),null);
});
test("TEST mode uses a distinct project and space",()=>{
 const config=getFestappConnection({VITE_FESTAPP_TEST_MODE:"true",VITE_FESTAPP_TEST_PUBLISHABLE_KEY:"sb_publishable_test"});
 assert.equal(config.url,FESTAPP_TEST_URL);
 assert.equal(config.spaceId,FESTAPP_TEST_SPACE_ID);
 assert.equal(config.key,"sb_publishable_test");
 assert.equal(config.testMode,true);
 assert.notEqual(config.url,FESTAPP_SUPABASE_URL);
});
