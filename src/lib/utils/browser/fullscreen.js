export async function toggleElementFullscreen(element, doc = document) {
	if (doc.fullscreenElement) return doc.exitFullscreen();
	if (
		!element ||
		typeof element.requestFullscreen !== 'function' ||
		doc.fullscreenEnabled === false
	) {
		throw new Error(
			'Full screen is unavailable here. Open Velora directly in your browser and try again.'
		);
	}
	await element.requestFullscreen({ navigationUI: 'hide' });
}
