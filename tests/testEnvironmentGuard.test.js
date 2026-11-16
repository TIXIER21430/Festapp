import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIsolatedTestBackend } from '../src/lib/testEnvironmentGuard.js';
const ref = 'abcdefghijklmnopqrst';
const url = 'https://' + ref + '.supabase.co';
test('accepts only an explicitly confirmed exact test project', () => {
 assert.deepEqual(assertIsolatedTestBackend({url,expectedProjectRef:ref,confirmedTestProject:true}),{projectRef:ref,url});
});
test('rejects missing confirmation and configuration', () => {
 assert.throws(()=>assertIsolatedTestBackend({url,expectedProjectRef:ref}));
 assert.throws(()=>assertIsolatedTestBackend({url,confirmedTestProject:true}));
});
test('rejects other project, local and spoofed URLs', () => {
 for(const bad of ['https://otherprojectabcdefgh.supabase.co','http://'+ref+'.supabase.co','http://localhost:54321','https://'+ref+'.supabase.co.evil.org','https://'+ref+'.supabase.co/extra','https://'+ref+'.supabase.co/?key=1','https://user:pass@'+ref+'.supabase.co']) {
  assert.throws(()=>assertIsolatedTestBackend({url:bad,expectedProjectRef:ref,confirmedTestProject:true}),bad);
 }
});

test('rejects malformed project references and alternate ports', () => {
 for (const badRef of ['', 'short', 'ABCDEFGHIJKLMNOPQRST', 'abcdefghijklmnopqrs-', 'abcdefghijklmnopqrstu', 'abcdefghijklmnopqrs ' + 'x']) {
  assert.throws(() => assertIsolatedTestBackend({url, expectedProjectRef:badRef, confirmedTestProject:true}), badRef);
 }
 for (const badUrl of [url + ':444', url + ':8443', url + '/path', url + '#fragment', url + '?token=secret']) {
  assert.throws(() => assertIsolatedTestBackend({url:badUrl, expectedProjectRef:ref, confirmedTestProject:true}), badUrl);
 }
});
