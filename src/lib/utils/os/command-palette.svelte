<script>
	import { onMount } from 'svelte';
	import Icon from '../browser/icon.svelte';
	let { apps, ready, onlaunch, onclose, onpersonalize, onadd, onfullscreen } = $props();
	let dialog;
	let input;
	let query = $state('');
	let selected = $state(0);
	let actions = $derived([
		...apps.map((app) => ({
			id: `app-${app.id}`,
			title: app.name,
			category: 'Application',
			image: app.icon,
			disabled: !ready,
			run: () => onlaunch(app)
		})),
		{
			id: 'wallpaper',
			title: 'Change wallpaper',
			category: 'Personalize',
			icon: 'settings',
			run: onpersonalize
		},
		{
			id: 'add',
			title: 'Add your own app',
			category: 'Workspace',
			icon: 'plus',
			disabled: !ready,
			run: onadd
		},
		{
			id: 'fullscreen',
			title: 'Toggle full screen',
			category: 'Workspace',
			icon: 'fullscreen',
			run: onfullscreen
		}
	]);
	let results = $derived(
		actions.filter((action) =>
			`${action.title} ${action.category}`.toLowerCase().includes(query.trim().toLowerCase())
		)
	);
	function execute(action) {
		if (!action || action.disabled) return;
		onclose();
		action.run();
	}
	function keydown(event) {
		event.stopPropagation();
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			selected = results.length
				? (selected + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
				: 0;
			dialog.querySelector(`#command-${selected}`)?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter') {
			event.preventDefault();
			execute(results[selected]);
		}
	}
	onMount(() => {
		const previous = document.activeElement;
		dialog.showModal();
		input.focus();
		return () => {
			dialog.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	});
</script>

<dialog
	bind:this={dialog}
	class="command-palette"
	aria-label="Search apps and actions"
	oncancel={onclose}
	onkeydown={keydown}
	onclick={(event) => {
		event.stopPropagation();
		if (event.target === dialog) onclose();
	}}
>
	<div class="palette-content">
		<div class="palette-search">
			<Icon name="search" size={23} /><input
				bind:this={input}
				bind:value={query}
				oninput={() => (selected = 0)}
				placeholder="Where do you want to go?"
				role="combobox"
				aria-label="Search apps and actions"
				aria-expanded="true"
				aria-controls="command-results"
				aria-autocomplete="list"
				aria-activedescendant={results.length ? `command-${selected}` : undefined}
			/><button onclick={onclose} aria-label="Close search"><kbd>esc</kbd></button>
		</div>
		<p class="palette-label">{query ? 'SEARCH RESULTS' : 'APPS & QUICK ACTIONS'}</p>
		<div class="results" id="command-results" role="listbox" aria-label="Results">
			{#each results as action, index (action.id)}
				<button
					id={`command-${index}`}
					role="option"
					aria-selected={selected === index}
					class:highlighted={selected === index}
					disabled={action.disabled}
					onpointermove={() => (selected = index)}
					onclick={() => execute(action)}
					tabindex="-1"
				>
					<span class="result-icon"
						>{#if action.image}<img src={action.image} alt="" />{:else}<Icon
								name={action.icon}
								size={20}
							/>{/if}</span
					><span class="result-title">{action.title}</span><small>{action.category}</small><span
						class="return-mark">↵</span
					>
				</button>
			{:else}<p class="empty">Nothing found. Try an app name or “wallpaper”.</p>{/each}
		</div>
		<footer>
			<span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span
				>VELORA</span
			>
		</footer>
	</div>
</dialog>

<style>
	.command-palette {
		padding: 0;
		width: min(580px, calc(100vw - 32px));
		max-height: calc(100dvh - 60px);
		margin: 12vh auto auto;
		color: #e7ece1;
		background: #1b2421f5;
		border: 1px solid #b5c2a83b;
		border-radius: 16px;
		box-shadow: 0 35px 120px #0008;
		overflow: hidden;
		font-family: inherit;
		animation: palette-enter 180ms ease-out;
	}
	.command-palette::backdrop {
		background: #060d0a88;
		backdrop-filter: blur(12px);
	}
	.palette-content {
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 20vh);
	}
	.palette-search {
		display: flex;
		align-items: center;
		padding: 22px;
		gap: 14px;
		border-bottom: 1px solid #ffffff10;
	}
	.palette-search input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: 0;
		padding: 5px 0;
		color: #fff;
		font: inherit;
		font-size: 17px;
		outline: none;
	}
	.palette-search input::placeholder {
		color: #b6c0b0;
	}
	.palette-search button {
		background: transparent;
		border: 0;
		padding: 4px;
		color: #a6b5a5;
		cursor: pointer;
	}
	kbd {
		font: inherit;
		font-size: 10px;
		border: 1px solid #ffffff24;
		padding: 3px 5px;
		border-radius: 4px;
	}
	.palette-label {
		padding: 17px 24px 8px;
		margin: 0;
		color: #98a68f;
		font-size: 9px;
		letter-spacing: 1.7px;
	}
	.results {
		overflow: auto;
		padding: 0 10px 12px;
		min-height: 0;
		scrollbar-width: thin;
	}
	.results button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 14px;
		border: 1px solid transparent;
		border-radius: 9px;
		color: #e5eadf;
		background: transparent;
		padding: 10px 13px;
		text-align: left;
		cursor: pointer;
		font: inherit;
	}
	.results button.highlighted {
		background: #d6c5a513;
		border-color: #d6c5a524;
	}
	.results button:disabled {
		opacity: 0.4;
		cursor: wait;
	}
	.result-icon {
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
	}
	.result-icon img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
	.result-title {
		font-size: 13px;
	}
	small {
		margin-left: auto;
		color: #94a08f;
		font-size: 10px;
	}
	.return-mark {
		color: #b9c5ad;
		opacity: 0;
	}
	.highlighted .return-mark {
		opacity: 1;
	}
	footer {
		display: flex;
		gap: 18px;
		padding: 15px 24px;
		border-top: 1px solid #ffffff10;
		color: #9ba891;
		font-size: 10px;
	}
	footer span:last-child {
		margin-left: auto;
		font-size: 9px;
		letter-spacing: 2px;
	}
	footer kbd {
		margin-right: 4px;
	}
	.empty {
		padding: 28px 14px;
		color: #a6b19e;
		font-size: 13px;
	}
	@keyframes palette-enter {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.command-palette {
			animation: none;
		}
	}
	@media (max-width: 500px) {
		.palette-search {
			padding: 17px;
			gap: 10px;
		}
		.palette-search input {
			font-size: 14px;
		}
		small {
			display: none;
		}
		.return-mark {
			margin-left: auto;
		}
	}
</style>
