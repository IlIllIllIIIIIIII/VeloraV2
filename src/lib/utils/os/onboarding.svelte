<script>
	import Wallpaper from './wallpaper.svelte';
	import Icon from '$lib/utils/browser/icon.svelte';
	/** @type {{ background: string, onapply: (background: string, fit: 'cover' | 'contain') => void, onfinish: (result: string) => void }} */
	let { background, onapply, onfinish } = $props();
	let step = $state(0);
	let choosing = $state(false);
	const steps = ['Welcome', 'Your wallpaper', 'Your desktop', 'Browse & play'];
	/** @param {HTMLDialogElement} node */
	function mountDialog(node) {
		const previous = document.activeElement;
		node.showModal();
		return () => {
			node.close();
			if (previous instanceof HTMLElement) previous.focus();
		};
	}
	const desktopFeatures = [
		{
			icon: 'apps',
			title: 'Everything in your dock',
			text: 'Open apps from the dock or desktop. Use the launcher to search your apps or add a website of your own.'
		},
		{
			icon: 'desktop',
			title: 'Room for more than one thing',
			text: 'Drag title bars to move windows, resize from their edges, or drag to either side to snap. Double-click a title bar to maximize.'
		},
		{
			icon: 'sidebar',
			title: 'Pick up where you left off',
			text: 'Minimize a window and bring it back from the dock. Right-click an app for a new window; hover over its dock icon to switch between open windows.'
		},
		{
			icon: 'settings',
			title: 'Make it yours',
			text: 'Change wallpaper any time, upload your own image, or open Settings for appearance and browsing preferences. The top bar has full screen and Browser mode.'
		}
	];
	const browserFeatures = [
		{
			icon: 'globe',
			title: 'Your browser, inside a window',
			text: 'Browse with vertical tabs, back, forward, and reload. Collapse the sidebar for more room, or use Browser mode to browse without desktop windows.'
		},
		{
			icon: 'search',
			title: 'One place to go anywhere',
			text: 'Click the URL control or press Cmd/Ctrl + L while using Browser to open the address and search palette.'
		},
		{
			icon: 'bookmark',
			title: 'Keep your favorites close',
			text: 'Use bookmarks to save sites and Settings to change search and browser preferences. Your existing browsing controls are all still there.'
		},
		{
			icon: 'games',
			title: 'Browse, play, explore',
			text: 'Open Games, Apps, or GeForce NOW from your desktop or launcher. GeForce NOW may ask you to sign in and start its own session.'
		}
	];
</script>

<dialog
	class="welcome"
	aria-labelledby="welcome-title"
	oncancel={(event) => {
		event.preventDefault();
		onfinish('skipped');
	}}
	{@attach mountDialog}
>
	<header>
		<span class="wordmark">v <span>Velora</span></span><button
			class="skip"
			onclick={() => onfinish('skipped')}>Skip setup <Icon name="close" size={14} /></button
		>
	</header>
	<div class="progress" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
		{#each steps as label, i}<span class:current={step === i} class:passed={step > i}
				><i></i><span>{label}</span></span
			>{/each}
	</div>
	<section class="body" aria-live="polite">
		{#if step === 0}
			<div class="intro-art" style:background-image={`url(${JSON.stringify(background)})`}>
				<div class="mini-window">
					<span>Velora</span>
					<div><Icon name="globe" size={30} /></div>
				</div>
				<div class="mini-dock">
					<Icon name="apps" size={18} /><Icon name="globe" size={18} /><Icon
						name="games"
						size={18}
					/><Icon name="settings" size={18} />
				</div>
			</div>
			<p class="eyebrow">A SPACE OF YOUR OWN</p>
			<h1 id="welcome-title">Welcome to Velora.</h1>
			<p class="lede">
				Choose a background, meet your desktop, and find your favorite places. A quick introduction,
				then it’s all yours.
			</p>
		{:else if step === 1}
			<p class="eyebrow">MAKE YOURSELF AT HOME</p>
			<h1 id="welcome-title">Start with your view.</h1>
			<p class="lede">
				Choose a built-in wallpaper or upload your own. You can always change it from the desktop.
			</p>
			<button
				class="wallpaper-preview"
				style:background-image={`url(${JSON.stringify(background)})`}
				onclick={() => {
					choosing = true;
				}}
				aria-label="Choose your wallpaper"
				><span><Icon name="desktop" size={17} />Choose wallpaper</span></button
			>
			<p class="hint">Your choice is saved automatically. Keeping this one works too.</p>
		{:else}
			<p class="eyebrow">{step === 2 ? 'GET COMFORTABLE' : 'READY WHEN YOU ARE'}</p>
			<h1 id="welcome-title">
				{step === 2 ? 'A desktop that moves with you.' : 'Your next stop is up to you.'}
			</h1>
			<div class="features">
				{#each step === 2 ? desktopFeatures : browserFeatures as feature}<article>
						<span class="feature-icon"><Icon name={feature.icon} size={20} /></span>
						<div>
							<h2>{feature.title}</h2>
							<p>{feature.text}</p>
						</div>
					</article>{/each}
			</div>
		{/if}
	</section>
	<footer>
		<span class="step-count">{step + 1} / {steps.length}</span>
		<div>
			{#if step > 0}<button
					class="back"
					onclick={() => {
						step -= 1;
					}}>Back</button
				>{/if}<button
				class="primary"
				onclick={() => {
					if (step === steps.length - 1) onfinish('completed');
					else step += 1;
				}}
				>{step === steps.length - 1
					? 'Start using Velora'
					: step === 0
						? 'Make it mine'
						: 'Continue'}<Icon name="arrow" size={16} /></button
			>
		</div>
	</footer>
</dialog>
{#if choosing}<Wallpaper
		onclose={() => {
			choosing = false;
		}}
		{onapply}
	/>{/if}

<style>
	.welcome {
		width: min(640px, calc(100vw - 28px));
		max-height: calc(100dvh - 28px);
		padding: 0;
		border: 1px solid #ffffff20;
		border-radius: 20px;
		color: #eeede9;
		background: #202329f5;
		box-shadow: 0 30px 100px #0007;
		font:
			13px Inter,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		overflow: auto;
		animation: appear 200ms ease-out;
	}
	.welcome::backdrop {
		background: #090d1470;
		backdrop-filter: blur(14px);
	}
	header,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22px 28px;
	}
	.wordmark {
		font:
			italic 27px Georgia,
			serif;
		color: #d6c5a5;
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.wordmark span {
		color: #eeede9;
		font:
			600 13px Inter,
			sans-serif;
	}
	button {
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #d6c5a5;
		outline-offset: 4px;
	}
	.skip,
	.back {
		background: transparent;
		border: 0;
		padding: 8px;
	}
	.skip {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #bfc1c7;
		font-size: 12px;
	}
	.skip:hover,
	.back:hover {
		color: white;
	}
	.progress {
		display: flex;
		gap: 12px;
		padding: 0 28px 23px;
		border-bottom: 1px solid #ffffff0e;
	}
	.progress > span {
		flex: 1;
		color: #858994;
		font-size: 10px;
	}
	.progress i {
		display: block;
		height: 2px;
		background: #ffffff14;
		margin-bottom: 9px;
		border-radius: 2px;
	}
	.progress .current {
		color: #e0d3bc;
	}
	.current i,
	.passed i {
		background: #cdbb9b;
	}
	.body {
		padding: 26px 28px 14px;
		min-height: 350px;
	}
	.eyebrow {
		font-size: 9px;
		letter-spacing: 2px;
		color: #cabc9f;
		margin: 0 0 12px;
	}
	h1 {
		font-size: clamp(25px, 4vw, 32px);
		letter-spacing: -0.9px;
		font-weight: 450;
		margin: 0 0 12px;
	}
	.lede {
		font-size: 13px;
		line-height: 1.7;
		color: #b9bdc5;
		max-width: 490px;
		margin: 0 0 20px;
	}
	.intro-art {
		height: 155px;
		background-size: cover;
		background-position: center;
		border: 1px solid #ffffff17;
		border-radius: 12px;
		position: relative;
		margin-bottom: 24px;
		display: grid;
		place-items: center;
	}
	.mini-window {
		width: 180px;
		border: 1px solid #ffffff35;
		border-radius: 9px;
		background: #21252ac9;
		box-shadow: 0 10px 25px #0004;
		transform: rotate(-4deg);
	}
	.mini-window > span {
		display: block;
		font-size: 9px;
		padding: 7px 10px;
		border-bottom: 1px solid #ffffff14;
	}
	.mini-window > div {
		display: grid;
		place-items: center;
		height: 55px;
		color: #d6c5a5;
	}
	.mini-dock {
		position: absolute;
		bottom: 9px;
		display: flex;
		gap: 15px;
		background: #282b32de;
		padding: 9px 16px;
		border: 1px solid #ffffff25;
		border-radius: 10px;
	}
	.wallpaper-preview {
		height: 190px;
		width: 100%;
		border: 1px solid #ffffff20;
		border-radius: 12px;
		background-color: #171a20;
		background-position: center;
		background-size: cover;
		display: grid;
		place-items: center;
	}
	.wallpaper-preview span {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 11px 16px;
		background: #22252bd9;
		backdrop-filter: blur(10px);
		border: 1px solid #ffffff25;
		border-radius: 8px;
	}
	.hint {
		font-size: 11px;
		color: #9399a3;
		line-height: 1.5;
	}
	.features {
		display: grid;
		gap: 18px;
		margin: 23px 0 10px;
	}
	article {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}
	.feature-icon {
		display: grid;
		place-items: center;
		color: #cfbea0;
		background: #d6c5a509;
		border: 1px solid #d6c5a51c;
		border-radius: 10px;
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}
	h2 {
		font-size: 13px;
		font-weight: 500;
		margin: 1px 0 5px;
	}
	article p {
		font-size: 12px;
		line-height: 1.6;
		color: #aeb4bf;
		margin: 0;
	}
	footer {
		border-top: 1px solid #ffffff0e;
		margin-top: 12px;
	}
	.step-count {
		color: #8e949f;
		font-size: 11px;
	}
	footer > div {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.primary {
		border: 1px solid #d6c5a5;
		color: #25241f;
		background: #d6c5a5;
		padding: 11px 15px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.primary:hover {
		background: #e3d4b7;
	}
	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (max-width: 480px) {
		header,
		footer {
			padding: 18px;
		}
		.body {
			padding: 22px 18px 12px;
		}
		.progress {
			padding: 0 18px 17px;
			gap: 8px;
		}
		.progress > span > span {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.welcome {
			animation: none;
		}
	}
</style>
