import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerProxyWorker } from '../src/lib/lethe/serviceworker.js';

function worker({ controlled = false, failure = false } = {}) {
 const listeners = new Set();
 const active = { scriptURL: 'https://velora.example/servy.js' };
 return {
  controller: controlled ? active : null,
  ready: Promise.resolve(),
  async register() { if (failure) throw new Error('Storage blocked'); return { scope: 'https://velora.example/' }; },
  addEventListener(type, handler) { listeners.add(handler); },
  removeEventListener(type, handler) { listeners.delete(handler); },
  claim() { this.controller = active; for (const listener of listeners) listener(); },
  listeners
 };
}

test('registration alone does not permit navigation; control handoff does', async () => {
 const sw = worker();
 let settled = false;
 const startup = registerProxyWorker(sw, 1000).then(result => { settled = true; return result; });
 await new Promise(resolve => setImmediate(resolve));
 assert.equal(settled, false);
 sw.claim();
 assert.equal(await startup, sw.controller);
 assert.equal(sw.listeners.size, 0);
});

test('already controlled pages can proceed', async () => {
 const sw = worker({ controlled: true });
 assert.equal(await registerProxyWorker(sw), sw.controller);
});

test('blocked registration returns actionable error', async () => {
 await assert.rejects(registerProxyWorker(worker({ failure: true }), 100), /Open Velora directly/);
});

test('a missing control handoff times out and removes the listener', async () => {
 const sw = worker();
 await assert.rejects(registerProxyWorker(sw, 10), /Open Velora directly/);
 assert.equal(sw.listeners.size, 0);
});

test('unsupported service workers return actionable error', async () => {
 await assert.rejects(registerProxyWorker(null), /Open Velora directly/);
});
