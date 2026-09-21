// A user-selected direct link, never a silent proxy or hostname substitution.
export function youtubeDirectUrl(value) {
	try {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol)) return null;
		if (
			url.hostname !== 'youtu.be' &&
			url.hostname !== 'youtube.com' &&
			!url.hostname.endsWith('.youtube.com')
		)
			return null;
		url.protocol = 'https:';
		return url.href;
	} catch {
		return null;
	}
}
