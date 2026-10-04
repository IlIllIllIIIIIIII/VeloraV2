<script>
	import favicon from '$lib/assets/favicon.png';
	import '$lib/style/variables.css';
	import '$lib/style/themes.css';
	import '$lib/style/assets.css';
	import { initTheme } from '$lib/utils/theme.js';
	import { onMount, setContext, tick } from 'svelte';
	import { STARTUP_CONTEXT } from '$lib/utils/startup.js';
	import OpeningSplash from '$lib/utils/opening-splash.svelte';

	const showOpeningSplash = import.meta.env.VITE_VELORA_S3 === '1';
	let { children } = $props();
	let opening = $state(true);
	let contentAllowed = $state(false);
	let pending = 0;
	let disposeTheme = () => {};

	setContext(STARTUP_CONTEXT, {
		hold() {
			pending += 1;
			let released = false;
			return () => {
				if (released) return;
				released = true;
				pending -= 1;
				if (contentAllowed && pending === 0) opening = false;
			};
		}
	});

	async function startContent() {
		if (contentAllowed) return;
		contentAllowed = true;
		disposeTheme = initTheme();
		await tick();
		// Lazy routes hold the image until their content has mounted.
		if (pending === 0) opening = false;
	}

	onMount(() => {
		// The opening PNG belongs to the S3 bundle; Cloudflare starts the app directly.
		if (!showOpeningSplash) startContent();

		let typed = '';

		function handleKeydown(event) {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (event.key.length !== 1) return;

			typed = (typed + event.key.toLowerCase()).slice(-6);

			if (typed === 'pgtqbf') {
				typed = '';
				localStorage.setItem('disableAds', 'true');
				window.dispatchEvent(new Event('ads-disabled'));
			}
		}

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			disposeTheme();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Home - Classroom</title>
</svelte:head>

{#if showOpeningSplash}
	<OpeningSplash visible={opening} onready={startContent} />
{/if}

<main class="site-content" data-velora-site inert={opening}>
	{#if contentAllowed}
		{@render children()}
	{/if}
</main>

<style>
	.site-content {
		width: 100%;
		min-height: 100vh;
	}
</style>
