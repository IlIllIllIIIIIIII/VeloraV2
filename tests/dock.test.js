import test from 'node:test';
import assert from 'node:assert/strict';
import { clampDockSize, restoreDockSize, dockHeight } from '../src/lib/utils/os/dock.js';

test('legacy undersized and invalid docks recover to a readable default', () => {
	for (const saved of [8, '8', 19, -100, null, undefined, '', 'invalid', Infinity]) {
		assert.equal(restoreDockSize(saved), 24);
		assert.equal(dockHeight(saved), 64);
	}
});

test('valid custom sizes survive reload and resizing keeps icons at least 24px', () => {
	for (const saved of [20, '24', 30.5, 39]) {
		assert.equal(restoreDockSize(saved), Number(saved));
		assert.ok(dockHeight(saved) - 14 - 22 >= 24);
	}
	assert.equal(clampDockSize(-100), 20);
	assert.equal(clampDockSize(100), 39);
	assert.equal(restoreDockSize(100), 39);
});
