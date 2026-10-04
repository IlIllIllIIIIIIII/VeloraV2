<script>
	import { onMount } from 'svelte';
	const splash = '/learning-hub-splash.png';

	let { visible = true, onready } = $props();
	let image = $state();

	onMount(() => {
		if (document.documentElement.dataset.veloraSplash === 'skip') {
			onready();
			return;
		}

		let displayTimer;
		let fallbackTimer;
		const blockOpeningClick = (event) => {
			if (!visible) return;
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		document.addEventListener('click', blockOpeningClick, true);
		let started = false;
		const startApp = () => {
			if (started) return;
			started = true;
			onready();
		};
		const startTimer = () => {
			clearTimeout(fallbackTimer);
			displayTimer = setTimeout(startApp, 1000);
		};

		if (image.complete && image.naturalWidth > 0) {
			startTimer();
		} else {
			image.addEventListener('load', startTimer, { once: true });
			image.addEventListener('error', startApp, { once: true });
			// A missing image must never prevent access to the site.
			fallbackTimer = setTimeout(startApp, 4000);
		}

		return () => {
			clearTimeout(displayTimer);
			clearTimeout(fallbackTimer);
			document.removeEventListener('click', blockOpeningClick, true);
			image?.removeEventListener('load', startTimer);
			image?.removeEventListener('error', startApp);
		};
	});
</script>

<svelte:head>
	<link rel="preload" as="image" href={splash} />
	<script>
		(() => {
			// Only the outer Velora document shows the opening image.
			let nestedVelora = false;
			try {
				nestedVelora =
					window.parent !== window &&
					Boolean(window.parent.document.querySelector('[data-velora-site]'));
			} catch {
				// External HTML/SVG hosts are also entry points to Velora.
			}
			document.documentElement.dataset.veloraSplash = nestedVelora ? 'skip' : 'show';
		})();
	</script>
</svelte:head>

{#if visible}
	<div class="opening-splash" role="status" aria-label="Opening Velora">
		<img bind:this={image} src={splash} alt="" fetchpriority="high" />
	</div>
{/if}

<style>
	.opening-splash {
		position: fixed;
		inset: 0;
		z-index: 2147483647;
		background: #efedcf;
	}
	.opening-splash img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
	}
	:global(html[data-velora-splash='skip']) .opening-splash {
		display: none;
	}
	@media (max-width: 600px) {
		.opening-splash img {
			object-fit: contain;
		}
	}
</style>
