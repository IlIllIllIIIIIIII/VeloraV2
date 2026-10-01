import html from '$lib/downloads/index.html?raw';
import svg from '$lib/downloads/velora.svg?raw';

export function GET({ params }) {
	const files = {
		'index.html': { content: html, type: 'text/html' },
		'velora.svg': { content: svg, type: 'image/svg+xml' }
	};
	const file = Object.hasOwn(files, params.file) ? files[params.file] : null;
	if (!file) return new Response('File not found', { status: 404 });
	return new Response(file.content, {
		headers: {
			'Content-Type': `${file.type}; charset=utf-8`,
			'Content-Disposition': `attachment; filename="${params.file}"`,
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
