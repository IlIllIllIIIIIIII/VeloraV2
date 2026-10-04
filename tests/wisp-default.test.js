import test from 'node:test';
import assert from 'node:assert/strict';
import { getWispUrl } from '../src/lib/lethe/car.js';
import { getGeForceLauncherUrl } from '../src/lib/utils/browser/geforce.js';

test('blank Wisp settings use the same relay as the GeForce launcher', () => {
	const geforce = new URL(getGeForceLauncherUrl(), 'https://example.test');
	const relay = geforce.searchParams.get('wisp');
	assert.equal(relay, 'wss://system.pilotrights.com/jsonn/');
	for (const value of [undefined, null, '']) assert.equal(getWispUrl(value), relay);
});

test('saved custom Wisp servers override the browser and GeForce defaults', () => {
	const custom = 'wss://relay.example.test/lively/';
	assert.equal(getWispUrl(custom), custom);
	const geforce = new URL(getGeForceLauncherUrl(custom), 'https://example.test');
	assert.equal(geforce.searchParams.get('wisp'), custom);
});
