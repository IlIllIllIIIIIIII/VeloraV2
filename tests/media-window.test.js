import test from 'node:test';
import assert from 'node:assert/strict';
import { snapTarget } from '../src/lib/utils/window/snap.js';
import { toggleElementFullscreen } from '../src/lib/utils/browser/fullscreen.js';
import { youtubeDirectUrl } from '../src/lib/utils/browser/youtube.js';

test('snaps before the old 48px edge and releases without flickering', () => {
	assert.equal(snapTarget(100, 1200), 'left');
	assert.equal(snapTarget(1100, 1200), true);
	assert.equal(snapTarget(155, 1200, 'left'), 'left');
	assert.equal(snapTarget(180, 1200, 'left'), false);
	assert.equal(snapTarget(600, 1200), false);
	assert.equal(snapTarget(10, 390), false);
	assert.equal(snapTarget(200, 4000), false);
});
test('fullscreen requests the selected content with native browser UI hidden', async () => {
	let options;
	await toggleElementFullscreen(
		{
			requestFullscreen: async (value) => {
				options = value;
			}
		},
		{ fullscreenEnabled: true, fullscreenElement: null }
	);
	assert.deepEqual(options, { navigationUI: 'hide' });
});
test('fullscreen exits when already active and reports blocked or denied requests', async () => {
	let exited = false;
	await toggleElementFullscreen(null, {
		fullscreenElement: {},
		exitFullscreen: async () => {
			exited = true;
		}
	});
	assert.equal(exited, true);
	await assert.rejects(toggleElementFullscreen(null, { fullscreenEnabled: false }), /unavailable/);
	await assert.rejects(
		toggleElementFullscreen(
			{
				requestFullscreen: async () => {
					throw Error('denied');
				}
			},
			{}
		),
		/denied/
	);
});
test('direct YouTube action preserves the video URL and excludes lookalike/unsafe URLs', () => {
	assert.equal(
		youtubeDirectUrl('https://www.youtube.com/watch?v=abc&t=25'),
		'https://www.youtube.com/watch?v=abc&t=25'
	);
	assert.equal(youtubeDirectUrl('https://youtu.be/abc'), 'https://youtu.be/abc');
	for (const url of [
		null,
		'javascript:alert(1)',
		'https://youtube.com.attacker.test/',
		'https://notyoutube.com/',
		'/proxy/youtube.com'
	])
		assert.equal(youtubeDirectUrl(url), null);
});
