<svelte:head>
	<title>Velora — Downloads</title>
	<meta name="description" content="Download the Velora HTML and SVG files." />
</svelte:head>

<main class="downloads">
	<div class="download-content">
		<a class="back" href="/os">← Desktop</a>
		<p class="eyebrow">VELORA</p>
		<h1>Your space, wherever you go.</h1>
		<p class="intro">Download the HTML or SVG file. Both open your hosted Velora desktop and require an internet connection.</p>
		<div class="files">
			<a class="file" href="/download/files/index.html" download="index.html" data-sveltekit-reload>
				<span class="format">HTML</span>
				<span class="details"><strong>index.html</strong><span>Velora desktop in an HTML file</span></span>
				<span class="action">Download ↓</span>
			</a>
			<a class="file" href="/download/files/velora.svg" download="velora.svg" data-sveltekit-reload>
				<span class="format">SVG</span>
				<span class="details"><strong>velora.svg</strong><span>Velora desktop in an SVG file</span></span>
				<span class="action">Download ↓</span>
			</a>
		</div>
	</div>
</main>

<style>
	.downloads { min-height: 100vh; box-sizing: border-box; padding: 40px 24px; display: grid; place-items: center; background: #181a1d; color: #eee; font-family: system-ui, sans-serif; }
	.download-content { width: 100%; max-width: 660px; }
	.back { color: #c6c7cc; font-size: 14px; text-decoration: none; }
	.eyebrow { margin: 64px 0 14px; color: #d7c5a4; font-size: 12px; letter-spacing: 4px; }
	h1 { margin: 0; font-size: clamp(28px, 5vw, 42px); font-weight: 500; letter-spacing: -1.4px; line-height: 1.15; }
	.intro { color: #afb1b9; line-height: 1.7; margin: 20px 0 32px; }
	.files { display: grid; gap: 12px; }
	.file { display: flex; gap: 18px; align-items: center; padding: 22px; border: 1px solid #ffffff12; border-radius: 12px; background: #ffffff04; color: inherit; text-decoration: none; transition: background 180ms ease-out, border-color 180ms ease-out; }
	.file:hover { background: #ffffff09; border-color: #d7c5a440; }
	a:focus-visible { outline: 2px solid #d7c5a4; outline-offset: 4px; }
	.format { padding: 12px 8px; width: 42px; text-align: center; border-radius: 8px; background: #d7c5a412; color: #d7c5a4; font-size: 12px; }
	.details { display: grid; gap: 6px; flex: 1; }
	.details strong { font-size: 16px; font-weight: 500; }
	.details > span { color: #afb1b9; font-size: 13px; }
	.action { color: #d7c5a4; font-size: 13px; white-space: nowrap; }
	@media (max-width: 480px) { .file { padding: 16px; gap: 12px; flex-wrap: wrap; } .action { width: 100%; text-align: right; } }
	@media (prefers-reduced-motion: reduce) { .file { transition: none; } }
</style>
