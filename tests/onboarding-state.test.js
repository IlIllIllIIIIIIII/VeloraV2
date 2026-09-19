import test from 'node:test';
import assert from 'node:assert/strict';
import { isNewDesktopUser } from '../src/lib/utils/os/onboarding-state.js';

test('shows the welcome flow for a clean first visit', () => {
	assert.equal(isNewDesktopUser(null, [null, null], false), true);
});
test('does not repeat after showing, skipping, or completing the tour', () => {
	for (const marker of ['shown', 'skipped', 'completed', 'existing-user']) {
		assert.equal(isNewDesktopUser(marker, [null], false), false);
	}
});
test('recognizes existing users even when their saved preference is empty or false', () => {
	for (const saved of ['', false, 0, [], 'wallpaper.jpg']) {
		assert.equal(isNewDesktopUser(null, [null, saved], false), false);
	}
});
test('recognizes legacy visit markers before onboarding existed', () => {
	assert.equal(isNewDesktopUser(null, [null], true), false);
});
