import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIsolatedTestBackend } from '../src/lib/testEnvironmentGuard.js';

const ref = 'abcdefghijklmnopqrst';
const url = 'https://' + ref + '.supabase.co';

test('TEST backend guard requires explicit boolean confirmation', () => {
  for (const confirmation of [undefined, null, false, 'true', 1, {}, []]) {
    assert.throws(() => assertIsolatedTestBackend({
      url, expectedProjectRef: ref, confirmedTestProject: confirmation,
    }));
  }
});

test('TEST backend guard rejects malformed project references', () => {
  for (const invalidRef of ['', 'short', 'ABCDEFGHIJKLMNOPQRST', 'abcdefghijklmnopqrs-', 'abcdefghijklmnopqrs_', 'abcdefghijklmnopqrstu']) {
    assert.throws(() => assertIsolatedTestBackend({
      url, expectedProjectRef: invalidRef, confirmedTestProject: true,
    }), invalidRef);
  }
});

test('TEST backend guard rejects URL credentials, fragments, queries and alternate ports', () => {
  const invalidUrls = [
    url + '#fragment',
    url + '?token=secret',
    'https://username@' + ref + '.supabase.co',
    'https://' + ref + '.supabase.co:8443',
    'https://' + ref + '.supabase.co/path',
    'https://' + ref + '.supabase.co.evil.example',
  ];
  for (const invalidUrl of invalidUrls) {
    assert.throws(() => assertIsolatedTestBackend({
      url: invalidUrl, expectedProjectRef: ref, confirmedTestProject: true,
    }), invalidUrl);
  }
});

test('TEST backend guard rejects a valid but different project reference', () => {
  const differentRef = '12345678901234567890';
  assert.throws(() => assertIsolatedTestBackend({
    url, expectedProjectRef: differentRef, confirmedTestProject: true,
  }), /projet TEST confirmé/);
});

test('TEST backend guard does not mutate supplied configuration', () => {
  const config = Object.freeze({ url, expectedProjectRef: ref, confirmedTestProject: true });
  assert.deepEqual(assertIsolatedTestBackend(config), { projectRef: ref, url });
  assert.deepEqual(config, { url, expectedProjectRef: ref, confirmedTestProject: true });
});
