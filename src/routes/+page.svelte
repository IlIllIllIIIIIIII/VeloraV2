<script>
	import { onMount } from 'svelte';
	import { loadSetting, saveSetting } from '$lib/utils/localspace.js';
	import Desktop from './os/+page.svelte';

	let homeView = $state('loading');
	let display = $state('0');
	let savedValue = $state(null);
	let operation = $state(null);
	let awaitingValue = $state(false);
	let codeInput = '';
	let showSponsor = $state(false);
	const smartLink = 'https://www.profitableratecpmnetwork.com/gq87k39hs?key=829bb5eb83dab1aecc22a1013e54fcc4';

	onMount(() => {
		let disposed = false;
		function syncSponsor() {
			showSponsor = localStorage.getItem('disableAds') !== 'true' &&
				localStorage.getItem('initialSmartlinkOpened') !== 'true';
		}
		syncSponsor();
		window.addEventListener('ads-disabled', syncSponsor);
		window.addEventListener('storage', syncSponsor);
		async function chooseHome() {
			const [completed, ...existingSettings] = await Promise.all([
				loadSetting('calculatorCompleted', false, (raw) => raw === 'true'),
				loadSetting('navbarsize', null),
				loadSetting('lethe', null),
				loadSetting('car', null),
				loadSetting('bg', null),
				loadSetting('customApps', null)
			]);
			if (disposed) return;
			const visited = localStorage.getItem('firstVisit') === 'false';
			homeView = completed || visited || existingSettings.some((value) => value !== null)
				? 'desktop'
				: 'calculator';
		}
		void chooseHome();
		return () => {
			disposed = true;
			window.removeEventListener('ads-disabled', syncSponsor);
			window.removeEventListener('storage', syncSponsor);
		};
	});

	function openSponsor() {
		localStorage.setItem('initialSmartlinkOpened', 'true');
		showSponsor = false;
	}

	async function finishCalculator() {
		await saveSetting('calculatorCompleted', true);
		homeView = 'desktop';
	}

	const keys = [
		{ label: 'AC', action: 'clear', tone: 'utility' },
		{ label: '+/−', action: 'sign', tone: 'utility' },
		{ label: '%', action: 'percent', tone: 'utility' },
		{ label: '÷', action: 'divide', tone: 'operator' },
		{ label: '7', action: '7' },
		{ label: '8', action: '8' },
		{ label: '9', action: '9' },
		{ label: '×', action: 'multiply', tone: 'operator' },
		{ label: '4', action: '4' },
		{ label: '5', action: '5' },
		{ label: '6', action: '6' },
		{ label: '−', action: 'subtract', tone: 'operator' },
		{ label: '1', action: '1' },
		{ label: '2', action: '2' },
		{ label: '3', action: '3' },
		{ label: '+', action: 'add', tone: 'operator' },
		{ label: '0', action: '0', tone: 'zero' },
		{ label: '.', action: 'decimal' },
		{ label: '=', action: 'equals', tone: 'operator' }
	];

	function resetCode() {
		codeInput = '';
	}

	function inputDigit(digit) {
		codeInput = (codeInput + digit).slice(-4);
		if (codeInput === '0000') {
			resetCode();
			void finishCalculator();
			return;
		}

		if (display === 'Error' || awaitingValue) {
			display = digit;
			awaitingValue = false;
		} else if (display.replace(/[^\d]/g, '').length < 12) {
			display = display === '0' ? digit : display + digit;
		}
	}

	function calculate() {
		resetCode();
		if (operation === null || savedValue === null || awaitingValue) return;

		const current = Number(display);
		let result;
		switch (operation) {
			case 'add': result = savedValue + current; break;
			case 'subtract': result = savedValue - current; break;
			case 'multiply': result = savedValue * current; break;
			case 'divide': result = savedValue / current; break;
		}
		display = Number.isFinite(result) ? String(Number(result.toPrecision(12))) : 'Error';
		savedValue = null;
		operation = null;
		awaitingValue = true;
	}

	function press(action) {
		if (/^\d$/.test(action)) {
			inputDigit(action);
			return;
		}
		resetCode();

		switch (action) {
			case 'clear':
				display = '0';
				savedValue = null;
				operation = null;
				awaitingValue = false;
				break;
			case 'backspace':
				if (awaitingValue || display === 'Error') {
					display = '0';
					awaitingValue = false;
				} else {
					display = display.length > 1 ? display.slice(0, -1) : '0';
					if (display === '-') display = '0';
				}
				break;
			case 'decimal':
				if (awaitingValue || display === 'Error') {
					display = '0.';
					awaitingValue = false;
				} else if (!display.includes('.')) display += '.';
				break;
			case 'sign':
				if (display !== '0' && display !== 'Error') {
					display = display.startsWith('-') ? display.slice(1) : '-' + display;
				}
				break;
			case 'percent':
				if (display !== 'Error') display = String(Number(display) / 100);
				break;
			case 'equals':
				calculate();
				break;
			default:
				if (operation && !awaitingValue) calculate();
				if (display === 'Error') return;
				savedValue = Number(display);
				operation = action;
				awaitingValue = true;
		}
	}

	function handleKeydown(event) {
		if (homeView !== 'calculator') return;
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const actions = {
			Enter: 'equals', '=': 'equals', Escape: 'clear', Backspace: 'backspace',
			'.': 'decimal', '/': 'divide', '*': 'multiply', '-': 'subtract', '+': 'add', '%': 'percent'
		};
		const action = /^\d$/.test(event.key) ? event.key : actions[event.key];
		if (!action) return;
		event.preventDefault();
		press(action);
	}
</script>

<svelte:head>
	{#if homeView === 'calculator'}
		<title>Calculator</title>
		<meta name="description" content="A simple calculator." />
	{/if}
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

{#if homeView === 'desktop'}
	<Desktop />
{:else if homeView === 'calculator'}
<div class="calculator-page">
	<section class="calculator" aria-label="Calculator">
		<div class="calculator-top">Calculator</div>
		<output class="display" aria-live="polite" aria-label="Result">{display}</output>
		<div class="keypad">
			{#each keys as key}
				<button
					type="button"
					class:utility={key.tone === 'utility'}
					class:operator={key.tone === 'operator'}
					class:zero={key.tone === 'zero'}
					aria-label={key.action === 'sign' ? 'Change sign' : key.action === 'clear' ? 'All clear' : key.action}
					onclick={() => press(key.action)}>{key.label}</button
				>
			{/each}
		</div>
		{#if showSponsor}
			<a class="sponsor-link" href={smartLink} target="_blank" rel="noopener noreferrer sponsored" onclick={openSponsor}>Sponsored link ↗</a>
		{/if}
	</section>
</div>
{:else}
	<div class="loading-page" aria-label="Loading"></div>
{/if}

<style>
	.loading-page {
		position: fixed;
		inset: 0;
		background: #eff1f4;
	}
	.calculator-page {
		position: fixed;
		inset: 0;
		z-index: 21;
		display: grid;
		place-items: center;
		padding: 24px;
		background: #eff1f4;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	.calculator {
		box-sizing: border-box;
		width: min(100%, 340px);
		padding: 22px;
		border: 1px solid #d9dde4;
		border-radius: 18px;
		background: #fff;
		box-shadow: 0 12px 38px rgba(29, 39, 58, 0.1);
	}
	.calculator-top {
		color: #697386;
		font-size: 14px;
		font-weight: 600;
	}
	.display {
		box-sizing: border-box;
		display: block;
		width: 100%;
		min-height: 98px;
		padding: 28px 4px 14px;
		overflow: hidden;
		color: #1c2635;
		font-size: clamp(28px, 8vw, 43px);
		font-variant-numeric: tabular-nums;
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.keypad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}
	.keypad button {
		min-height: 60px;
		border: 1px solid #e6e9ed;
		border-radius: 12px;
		background: #f6f7f9;
		color: #1c2635;
		font: 500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		cursor: pointer;
		transition: background 160ms ease-out, transform 160ms ease-out;
	}
	.keypad button:hover { background: #e9edf2; }
	.keypad button:active { transform: scale(0.96); }
	.keypad button:focus-visible { outline: 2px solid #5275aa; outline-offset: 2px; }
	.keypad .utility { background: #e9edf2; font-size: 17px; }
	.keypad .operator { background: #dce8fa; color: #20549a; }
	.keypad .operator:hover { background: #cbdcf6; }
	.keypad .zero { grid-column: span 2; }
	.sponsor-link {
		display: block;
		margin-top: 18px;
		color: #697386;
		font-size: 12px;
		text-align: center;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.sponsor-link:hover { color: #20549a; }
	.sponsor-link:focus-visible { outline: 2px solid #5275aa; outline-offset: 3px; }
</style>
