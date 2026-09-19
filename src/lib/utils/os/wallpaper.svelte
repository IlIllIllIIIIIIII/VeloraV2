<script>
	import { onMount } from 'svelte';
	import { loadSetting, saveSetting, onSettingChange } from '$lib/utils/localspace.js';
	import Icon from '$lib/utils/browser/icon.svelte';
	import defaultBackground from '$lib/img/bg/dark-mountains.jpg';
	import atrium from '$lib/img/bg/dark-green-room.jpg';
	import sea from '$lib/img/bg/calmSea.png';
	import sunset from '$lib/img/bg/pink-sunset.jpg';
	import cottage from '$lib/img/bg/cozyCottageNight.png';
	import city from '$lib/img/bg/londonNight.png';
	import defaultThumbnail from '$lib/img/bg-downsized/dark-mountains.jpg';
	import atriumThumbnail from '$lib/img/bg-downsized/dark-green-room.jpg';
	import seaThumbnail from '$lib/img/bg-downsized/calmSea.png';
	import sunsetThumbnail from '$lib/img/bg-downsized/pink-sunset.jpg';
	import cottageThumbnail from '$lib/img/bg-downsized/cozyCottageNight.png';
	import cityThumbnail from '$lib/img/bg-downsized/londonNight.png';

	/** @type {{ onclose?: () => void, onapply?: (background: string, fit: 'cover' | 'contain') => void }} */
	let { onclose = () => {}, onapply = () => {} } = $props();
	let background = $state(defaultBackground);
	/** @type {'cover' | 'contain'} */
	let fit = $state('cover');
	/** @type {string[]} */
	let recents = $state([]);
	let loaded = $state(false);
	let busy = $state(false);
	let error = $state('');
	let notice = $state('');
	/** @type {HTMLInputElement | undefined} */
	let uploadInput;
	let alive = true;
	const maxSize = 8 * 1024 * 1024;
	const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
	const wallpapers = [
		{
			title: 'Alpine',
			subtitle: 'Velora original',
			src: defaultBackground,
			thumbnail: defaultThumbnail
		},
		{ title: 'Atrium', subtitle: 'Room to breathe', src: atrium, thumbnail: atriumThumbnail },
		{ title: 'Still water', subtitle: 'A slower pace', src: sea, thumbnail: seaThumbnail },
		{ title: 'Afterglow', subtitle: 'The golden hour', src: sunset, thumbnail: sunsetThumbnail },
		{ title: 'Hideaway', subtitle: 'Somewhere cozy', src: cottage, thumbnail: cottageThumbnail },
		{ title: 'Nightfall', subtitle: 'City after dark', src: city, thumbnail: cityThumbnail }
	];

	onMount(() => {
		alive = true;
		Promise.all([
			loadSetting('bg', defaultBackground),
			loadSetting('bgFit', 'cover'),
			loadSetting('bgRecents', [], JSON.parse)
		])
			.then(([savedBackground, savedFit, savedRecents]) => {
				if (!alive) return;
				background =
					typeof savedBackground === 'string' && savedBackground
						? savedBackground
						: defaultBackground;
				fit = savedFit === 'contain' ? 'contain' : 'cover';
				recents = Array.isArray(savedRecents)
					? savedRecents.filter((value) => typeof value === 'string').slice(0, 3)
					: [];
			})
			.catch(() => {
				if (alive)
					error =
						'Your saved backgrounds could not be read. You can still choose one for this session.';
			})
			.finally(() => {
				if (alive) loaded = true;
			});
		const stopBackground = onSettingChange('bg', (value) => {
			if (typeof value === 'string' && value) background = value;
		});
		const stopFit = onSettingChange('bgFit', (value) => {
			fit = value === 'contain' ? 'contain' : 'cover';
		});
		return () => {
			alive = false;
			stopBackground();
			stopFit();
		};
	});

	/** @param {HTMLDialogElement} node */
	function mountDialog(node) {
		const previouslyFocused = document.activeElement;
		node.showModal();
		node.querySelector('button')?.focus();
		return {
			destroy() {
				node.close();
				if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected)
					previouslyFocused.focus();
			}
		};
	}

	/** @param {KeyboardEvent & { currentTarget: EventTarget & HTMLDialogElement }} event */
	function trapFocus(event) {
		if (event.key !== 'Tab') return;
		const controls = Array.from(
			event.currentTarget.querySelectorAll(
				'button:not(:disabled), input:not(:disabled):not([hidden]), select:not(:disabled), a[href]'
			)
		).filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);
		const first = controls[0];
		const last = controls[controls.length - 1];
		if (event.shiftKey && document.activeElement === first && last instanceof HTMLElement) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last && first instanceof HTMLElement) {
			event.preventDefault();
			first.focus();
		}
	}

	async function apply(nextBackground, nextFit = fit, nextRecents = recents) {
		background = nextBackground;
		fit = nextFit;
		recents = nextRecents;
		error = '';
		notice = '';
		onapply(background, fit);
		await saveSetting('bg', background);
		await saveSetting('bgFit', fit);
		await saveSetting('bgRecents', $state.snapshot(recents));
		try {
			const persisted = await loadSetting('bg', '');
			const persistedFit = await loadSetting('bgFit', '');
			if (alive)
				notice =
					persisted === background && persistedFit === fit
						? 'Background applied.'
						: 'Applied for now. Browser storage is unavailable, so this may reset when you reload.';
		} catch {
			if (alive) notice = 'Applied for now. Your browser could not confirm that it was saved.';
		}
	}

	async function choose(nextBackground, nextFit = fit) {
		if (busy || !loaded) return;
		busy = true;
		try {
			await apply(nextBackground, nextFit);
		} finally {
			if (alive) busy = false;
		}
	}

	/** @param {File} file @returns {Promise<string>} */
	function readImage(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () =>
				reject(new Error('The image could not be read. Please choose it again.'));
			reader.onload = () =>
				typeof reader.result === 'string'
					? resolve(reader.result)
					: reject(new Error('The image could not be read.'));
			reader.readAsDataURL(file);
		});
	}

	/** @param {string} source @returns {Promise<void>} */
	function decodeImage(source) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () =>
				image.naturalWidth && image.naturalHeight
					? resolve()
					: reject(new Error('This image has no usable dimensions.'));
			image.onerror = () =>
				reject(
					new Error('This image could not be opened. Try a PNG, JPG, WebP, GIF, or AVIF file.')
				);
			image.src = source;
		});
	}

	/** @param {Event & { currentTarget: EventTarget & HTMLInputElement }} event */
	async function handleUpload(event) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file || busy || !loaded) return;
		error = '';
		notice = '';
		if (!acceptedTypes.includes(file.type)) {
			error = 'Choose a PNG, JPG, WebP, GIF, or AVIF image.';
			return;
		}
		if (file.size > maxSize) {
			error = 'That image is too large. Choose one smaller than 8 MB.';
			return;
		}
		busy = true;
		try {
			const source = await readImage(file);
			await decodeImage(source);
			if (!alive) return;
			await apply(source, fit, [source, ...recents.filter((item) => item !== source)].slice(0, 3));
		} catch (reason) {
			if (alive)
				error =
					reason instanceof Error
						? reason.message
						: 'The image could not be opened. Please try another file.';
		} finally {
			if (alive) busy = false;
		}
	}
</script>

<dialog
	class="wallpaper-panel"
	aria-labelledby="wallpaper-heading"
	aria-describedby="wallpaper-description"
	use:mountDialog
	onkeydown={trapFocus}
	oncancel={(event) => {
		event.preventDefault();
		onclose();
	}}
>
	<header>
		<div>
			<p class="eyebrow">MAKE IT YOURS</p>
			<h2 id="wallpaper-heading">A space of your own.</h2>
			<p id="wallpaper-description">Choose a view for your Velora desktop.</p>
		</div>
		<button
			class="close-button"
			type="button"
			aria-label="Close wallpaper settings"
			onclick={onclose}><Icon name="close" size={18} /></button
		>
	</header>

	<div class="panel-body">
		<div class="section-label">
			<h3>Curated backgrounds</h3>
			<span>06 views</span>
		</div>
		<div class="wallpaper-grid" aria-busy={!loaded || busy}>
			{#each wallpapers as wallpaper}
				<button
					class="wallpaper-choice"
					class:selected={background === wallpaper.src}
					type="button"
					aria-pressed={background === wallpaper.src}
					disabled={!loaded || busy}
					onclick={() => choose(wallpaper.src)}
				>
					<div class="thumbnail">
						<img
							src={wallpaper.thumbnail}
							alt=""
							loading="lazy"
							decoding="async"
						/>{#if background === wallpaper.src}<span class="selected-mark" aria-hidden="true"
								>✓</span
							>{/if}
					</div>
					<span class="wallpaper-name">{wallpaper.title}</span><span class="wallpaper-description"
						>{wallpaper.subtitle}</span
					>
				</button>
			{/each}
		</div>

		<div class="upload-row">
			<div>
				<h3>Your own image</h3>
				<p>PNG, JPG, WebP, GIF or AVIF · Up to 8 MB</p>
			</div>
			<input
				bind:this={uploadInput}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
				hidden
				onchange={handleUpload}
			/>
			<button
				class="upload-button"
				type="button"
				disabled={!loaded || busy}
				onclick={() => uploadInput?.click()}><Icon name="plus" size={16} />Upload image</button
			>
		</div>
		{#if recents.length}
			<div class="recent-row">
				<h3>Recent uploads</h3>
				<div class="recent-grid">
					{#each recents as source, i}
						<button
							class="recent-choice"
							class:selected={background === source}
							type="button"
							aria-label={`Use recent image ${i + 1}`}
							aria-pressed={background === source}
							disabled={!loaded || busy}
							onclick={() => choose(source)}
							><img src={source} alt="" decoding="async" />{#if background === source}<span
									class="selected-mark"
									aria-hidden="true">✓</span
								>{/if}</button
						>
					{/each}
				</div>
			</div>
		{/if}
		<div class="fit-row">
			<div>
				<h3>Image fit</h3>
				<p>
					{fit === 'cover'
						? 'Fill your desktop from edge to edge.'
						: 'Keep the entire image in view.'}
				</p>
			</div>
			<div class="fit-control" role="group" aria-label="Image fit">
				<button
					type="button"
					aria-pressed={fit === 'cover'}
					disabled={!loaded || busy}
					onclick={() => choose(background, 'cover')}>Fill</button
				>
				<button
					type="button"
					aria-pressed={fit === 'contain'}
					disabled={!loaded || busy}
					onclick={() => choose(background, 'contain')}>Fit</button
				>
			</div>
		</div>
		{#if error}<p class="upload-error" role="alert">{error}</p>{/if}
		<p class="status" role="status">
			{busy ? 'Applying background…' : notice || 'Uploaded images stay in this browser.'}
		</p>
	</div>
	<footer>
		<button
			type="button"
			class="reset-button"
			disabled={!loaded || busy}
			onclick={() => choose(defaultBackground, 'cover')}>Reset to default</button
		><button class="done-button" type="button" onclick={onclose}>Done</button>
	</footer>
</dialog>

<style>
	.wallpaper-panel {
		width: min(640px, calc(100vw - 32px));
		max-height: min(850px, calc(100dvh - 40px));
		margin: auto;
		padding: 0;
		overflow: auto;
		color: #e8e9ed;
		background: rgba(21, 24, 31, 0.96);
		border: 1px solid rgba(255, 255, 255, 0.13);
		border-radius: 18px;
		box-shadow:
			0 32px 100px #0008,
			0 4px 20px #0003;
		backdrop-filter: blur(30px);
		font-family: var(--zen-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
		animation: panel-enter 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.wallpaper-panel::backdrop {
		background: #07090f75;
		backdrop-filter: blur(9px);
	}
	.wallpaper-panel,
	.wallpaper-panel * {
		box-sizing: border-box;
	}
	button {
		font: inherit;
		cursor: pointer;
		color: inherit;
	}
	button:focus-visible {
		outline: 2px solid #d0bea1;
		outline-offset: 4px;
	}
	button:disabled {
		cursor: wait;
		opacity: 0.6;
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 28px 28px 24px;
		border-bottom: 1px solid #ffffff0d;
	}
	.eyebrow {
		margin: 0 0 10px;
		color: #b6a487;
		font-size: 10px;
		letter-spacing: 2px;
		font-weight: 600;
	}
	h2 {
		margin: 0;
		font-size: 25px;
		font-weight: 500;
		letter-spacing: -0.7px;
	}
	header p:last-child {
		margin: 10px 0 0;
		color: #979da9;
		font-size: 12px;
	}
	.close-button {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		margin: -6px -6px 0 12px;
		border: 0;
		border-radius: 8px;
		background: #ffffff05;
		color: #a8aebb;
		transition: background 180ms ease-out;
	}
	.close-button:hover {
		background: #ffffff12;
		color: #fff;
	}
	.panel-body {
		padding: 22px 28px 10px;
	}
	h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.1px;
	}
	.section-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}
	.section-label > span {
		font-size: 10px;
		color: #777f8d;
	}
	.wallpaper-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px 12px;
	}
	.wallpaper-choice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		padding: 0;
		border: 0;
		background: transparent;
		border-radius: 8px;
		text-align: left;
	}
	.thumbnail {
		position: relative;
		width: 100%;
		aspect-ratio: 1.7;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid transparent;
		box-shadow: inset 0 0 0 1px #ffffff12;
		transition:
			border-color 180ms ease-out,
			transform 180ms ease-out;
	}
	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 200ms ease-out;
	}
	.wallpaper-choice:hover .thumbnail img {
		transform: scale(1.035);
	}
	.selected .thumbnail,
	.recent-choice.selected {
		border-color: #c5b394;
	}
	.selected-mark {
		position: absolute;
		right: 6px;
		bottom: 6px;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #e0ceb0;
		color: #302a23;
		font-size: 12px;
		font-weight: 600;
		box-shadow: 0 1px 6px #0005;
	}
	.wallpaper-name {
		margin: 9px 0 3px;
		font-size: 12px;
		color: #d9dce3;
	}
	.wallpaper-description {
		color: #7d8592;
		font-size: 10px;
	}
	.upload-row,
	.fit-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 20px 0;
		border-top: 1px solid #ffffff0d;
	}
	.upload-row {
		margin-top: 25px;
	}
	.upload-row p,
	.fit-row p {
		margin: 6px 0 0;
		color: #858d9b;
		font-size: 10px;
	}
	.upload-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		flex-shrink: 0;
		padding: 9px 11px;
		border-radius: 7px;
		border: 1px solid #ffffff12;
		background: #ffffff08;
		font-size: 11px;
		transition: background 180ms ease-out;
	}
	.upload-button:hover {
		background: #ffffff14;
	}
	.recent-row {
		margin: 0 0 20px;
	}
	.recent-grid {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.recent-choice {
		position: relative;
		display: block;
		width: 94px;
		height: 56px;
		padding: 0;
		border: 2px solid transparent;
		border-radius: 7px;
		overflow: hidden;
		background: #ffffff09;
	}
	.recent-choice img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.fit-control {
		display: flex;
		padding: 3px;
		border: 1px solid #ffffff0d;
		border-radius: 7px;
		background: #05080c40;
	}
	.fit-control button {
		padding: 6px 14px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #858d9b;
		font-size: 11px;
	}
	.fit-control button[aria-pressed='true'] {
		background: #ffffff12;
		color: #e1d2b9;
		box-shadow: 0 1px 4px #0003;
	}
	.status {
		min-height: 14px;
		margin: 0 0 8px;
		color: #858d9b;
		font-size: 10px;
		line-height: 1.5;
	}
	.upload-error {
		margin: 0 0 12px;
		padding: 10px 12px;
		border: 1px solid #d68c7833;
		border-radius: 6px;
		background: #d68c7808;
		color: #e6ad9a;
		font-size: 12px;
		line-height: 1.5;
	}
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 28px;
		border-top: 1px solid #ffffff0d;
		background: #00000010;
	}
	.reset-button {
		padding: 7px 0;
		border: 0;
		background: transparent;
		color: #969da9;
		font-size: 11px;
	}
	.reset-button:hover {
		color: #fff;
	}
	.done-button {
		padding: 9px 22px;
		border: 1px solid #d6c8af24;
		border-radius: 7px;
		background: #d6c8af15;
		color: #e3d7c0;
		font-size: 11px;
	}
	.done-button:hover {
		background: #d6c8af25;
	}
	@keyframes panel-enter {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@media (max-width: 520px) {
		.wallpaper-panel {
			max-height: calc(100dvh - 24px);
		}
		header {
			padding: 22px 20px;
		}
		.panel-body {
			padding: 20px 20px 8px;
		}
		h2 {
			font-size: 22px;
		}
		.wallpaper-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.upload-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 12px;
		}
		footer {
			padding: 14px 20px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.wallpaper-panel {
			animation: none;
		}
		.wallpaper-panel * {
			transition: none;
		}
	}
</style>
