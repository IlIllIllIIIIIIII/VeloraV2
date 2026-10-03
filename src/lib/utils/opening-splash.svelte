<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import splash from '$lib/assets/learning-hub-splash.png';

	let { visible = $bindable(true) } = $props();
	let image;
	let reducedMotion = $state(false);

	onMount(() => {
		if (document.documentElement.dataset.veloraSplash === 'skip') {
			visible = false;
			return;
		}

		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let displayTimer;
		let fallbackTimer;
		const blockOpeningClick = (event) => {
			if (!visible) return;
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		document.addEventListener('click', blockOpeningClick, true);
		const dismiss = () => {
			visible = false;
			document.removeEventListener('click', blockOpeningClick, true);
		};
		const startTimer = () => {
			clearTimeout(fallbackTimer);
			displayTimer = setTimeout(dismiss, 1000);
		};

		if (image.complete && image.naturalWidth > 0) {
			startTimer();
		} else {
			image.addEventListener('load', startTimer, { once: true });
			image.addEventListener('error', dismiss, { once: true });
			// A missing image must never prevent access to the site.
			fallbackTimer = setTimeout(dismiss, 4000);
		}

		return () => {
			clearTimeout(displayTimer);
			clearTimeout(fallbackTimer);
			document.removeEventListener('click', blockOpeningClick, true);
			image?.removeEventListener('load', startTimer);
			image?.removeEventListener('error', dismiss);
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
	<div
		class="opening-splash"
		role="status"
		aria-label="Opening Velora"
		out:fade={{ duration: reducedMotion ? 0 : 180 }}
	>
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
