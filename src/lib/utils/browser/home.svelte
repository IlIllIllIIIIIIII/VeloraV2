<script>
	import Icon from './icon.svelte';
	let { ready = false, onsearch } = $props();
</script>

<section class="zen-home" aria-label="New tab">
	<div class="zen-home-content">
		<h1>Velora</h1>
		<button class="zen-home-search" onclick={() => onsearch('')}
			><Icon name="search" size={16} /><span>Search or enter a URL</span></button
		>
		{#if !ready}<p role="status">Starting browser…</p>{/if}
	</div>
</section>

<style>
	.zen-home {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: #d7bd9a;
		color: #493722;
		overflow: auto;
		isolation: isolate;
	}
	/* Soft sand and cream fields inspired by the supplied background reference. */
	.zen-home::before {
		content: '';
		position: absolute;
		inset: -12%;
		z-index: -1;
		pointer-events: none;
		background:
			radial-gradient(ellipse 16% 55% at 52% 38%, #f0e3cf 0%, transparent 75%),
			radial-gradient(ellipse 25% 30% at 83% 17%, #eadcc5 0%, transparent 85%),
			radial-gradient(ellipse 28% 24% at 9% 57%, #eadbc4 0%, transparent 85%),
			radial-gradient(ellipse 22% 47% at 42% 65%, #b99261 0%, transparent 85%),
			radial-gradient(ellipse 38% 29% at 87% 72%, #c8a57c 0%, transparent 85%),
			radial-gradient(ellipse 35% 27% at 27% 96%, #ead8ba 0%, transparent 85%), #d5b994;
		filter: blur(clamp(30px, 4vw, 75px));
	}
	.zen-home-content {
		padding: 24px;
		text-align: center;
		transform: translateY(-20px);
	}
	h1 {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		font: 450 27px var(--zen-font);
		letter-spacing: -0.8px;
		margin: 0 0 23px;
	}

	.zen-home-search {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 10px 12px;
		background: rgba(255, 253, 248, 0.66);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: #604c36;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
		font: 400 14px var(--zen-font);
		transition:
			background 180ms ease-out,
			color 180ms ease-out;
	}
	.zen-home-search:hover {
		background: rgba(255, 253, 248, 0.88);
		color: #493722;
	}
	.zen-home-search:focus-visible {
		outline: 1px solid #685238;
		outline-offset: 3px;
	}
	p {
		margin: 14px 0 0;
		font: 400 12px var(--zen-font);
		color: #604c36;
	}
	@media (prefers-reduced-motion: reduce) {
		.zen-home-search {
			transition: none;
		}
	}
</style>
