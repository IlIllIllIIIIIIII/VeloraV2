<script>
	import '$lib/style/browser.css';
	import Tab from '$lib/utils/browser/tab.svelte';
	import Iframe from '$lib/utils/browser/iframe.svelte';
	import Home from '$lib/utils/browser/home.svelte';
	import Icon from '$lib/utils/browser/icon.svelte';
	import Modal from '$lib/utils/browser/modal.svelte';
	import { loadSetting, saveSetting } from '$lib/utils/localspace.js';
	import {
		deleteTab,
		activeTab,
		reloadSignal,
		goBackSignal,
		goForwardSignal,
		slotsDragged,
		draggedOverLeft,
		draggedOverRight,
		isTabDragging
	} from '$lib/stores/index.js';
	import { onMount, tick } from 'svelte';
	import { loadScript, loadScriptsSequential } from '$lib/lethe/loader';
	import { search } from '$lib/lethe/search';
	import { createConnection, setCar } from '$lib/lethe/car';
	import { createScramjetController } from '$lib/lethe/poly';
	import { createPrismController, setPrismTransport, getPrismController } from '$lib/lethe/prism';
	import { enablePopupInterceptor } from '$lib/lethe/reflux';
	import { subscribeSettings } from '$lib/utils/settingsSync.js';
	let tabs = $state([]);
	let frames = $state([]);
	let query = $state('');
	/** @type {HTMLInputElement | undefined} */
	let inputEl = $state();
	let tabCounter = 0;
	let inputFocused = $state(false);
	let hydrated = $state(false);
	let letheEngine = $state('sj2');
	let ready = $state(false);
	let polygon;
	let prismController;
	let sjFrame;
	let customWisp = $state('');
	let searchEngine = $state('ddg');
	let car = $state('libcurl');
	let bookmarks = $state([]);
	let connection;
	let activeFrame = $derived(frames.find((frame) => frame.id === $activeTab));
	let draggedTab = null;
	let tabID = null;
	let LastPopupIntState = $state(true);

	$effect(() => {
		if ($deleteTab) {
			tabs = tabs.filter((tab) => tab.id !== $deleteTab);
			frames = frames.filter((frame) => frame.id !== $deleteTab);
			if ($deleteTab == $activeTab && tabs.length > 0) {
				const lastTab = tabs[tabs.length - 1];
				$activeTab = lastTab.id;
				$deleteTab = null;
			} else {
				$deleteTab = null;
			}
		}
		if ($activeTab) {
			tabID = $activeTab;
		}
	});

	function addTab() {
		// @ts-ignore
		tabID = Date.now();
		// @ts-ignore
		$activeTab = tabID;
		const newTab = {
			id: tabID
		};
		const newFrame = {
			id: tabID,
			url: null,
			displayUrl: '',
			title: 'New Tab'
		};
		let updatedTabs = [];
		let updatedFrames = [];
		for (let i = 0; i < tabs.length; i++) {
			let existingTab = tabs[i];
			let existingFrame = frames[i];
			updatedFrames.push(existingFrame);
			updatedTabs.push(existingTab);
		}
		updatedTabs.push(newTab);
		updatedFrames.push(newFrame);
		tabs = updatedTabs;
		frames = updatedFrames;
		tabCounter++;
	}
	onMount(async () => {
		LastPopupIntState = popupInterceptor;
		addTab();

		// hydrate saved settings
		const [lethe, savedCar, wisp, engine, marks, intercept, LastPopupIntStateX] = await Promise.all(
			[
				loadSetting('lethe', 'sj2'),
				loadSetting('car', 'libcurl'),
				loadSetting('customWisp', ''),
				loadSetting('searchEngine', 'brave'),
				loadSetting('bookmarks', [], JSON.parse),
				loadSetting('popupInterceptor', true, (raw) => raw === 'true'),
				loadSetting('LastPopupIntState', true)
			]
		);
		letheEngine = lethe;
		car = savedCar;
		customWisp = wisp;
		searchEngine = engine;
		bookmarks = marks;
		LastPopupIntState = LastPopupIntStateX;
		popupInterceptor = LastPopupIntState; //intercept
		hydrated = true;

		// Rendered inside the settings theme preview: show the chrome, skip the proxy stack
		// so opening /settings doesn't load the transports or open a wisp connection.
		if (new URLSearchParams(location.search).has('preview')) {
			ready = true;
			return;
		}

		await loadScriptsSequential([
			'/charon/index.js',
			'/glass/glass.bundle.js',
			'/glass/glass.config.js',
			'/poly/polygon.all.js'
		]);
		polygon = createScramjetController();
		connection = createConnection();
		await setCar(connection, car, customWisp);
		await enablePopupInterceptor();
		ready = true;
	});

	onMount(() =>
		subscribeSettings((key, value) => {
			if (key === 'lethe') letheEngine = value;
			else if (key === 'car') car = value;
			else if (key === 'customWisp') customWisp = value;
			else if (key === 'searchEngine') searchEngine = value;
		})
	);

	async function ensurePrism() {
		if (sjFrame) return sjFrame;
		prismController = await createPrismController(car, customWisp || undefined);
		sjFrame = prismController.createFrame();
		return sjFrame;
	}
	function prismEncode(fixedUrl) {
		// @ts-ignore
		return window.$scramjet.rewriteUrl(fixedUrl, sjFrame.context, {
			origin: new URL(location.href),
			base: new URL(location.href)
		});
	}

	async function navigateTo(rawQuery) {
		registerSW();
		if (!ready || !activeFrame) {
			return;
		}
		const fixedUrl = search(rawQuery, searchEngine);
		let encoded;
		if (letheEngine === 'sj2') {
			await ensurePrism();
			encoded = prismEncode(fixedUrl);
		} else if (letheEngine === 'uv') {
			// @ts-ignore
			encoded = window.__uv$config.prefix + window.__uv$config.encodeUrl(fixedUrl);
		} else {
			encoded = polygon.encodeUrl(fixedUrl);
		}
		activeFrame.url = encoded;
		if (rawQuery.includes('discord')) {
			LastPopupIntState = popupInterceptor;
			popupInterceptor = false;
		}
		if (!rawQuery.includes('discord')) {
			popupInterceptor = LastPopupIntState;
		}
	}

	let lastOpenedUrl = '';
	let lastOpenedTime = 0;
	async function openInNewTab(targetUrl) {
		if (!targetUrl || !popupInterceptor) {
			return;
		}
		const currentTime = Date.now();
		const timeSinceLastOpen = currentTime - lastOpenedTime;
		const isSameUrl = targetUrl === lastOpenedUrl;
		if (isSameUrl && timeSinceLastOpen < 800) {
			return;
		}
		lastOpenedUrl = targetUrl;
		lastOpenedTime = currentTime;
		addTab();
		await tick();
		navigateTo(targetUrl);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		navigateTo(query);
		inputEl?.blur();
	}
	let bookmarkMenu = $state(false);
	let activeFrameURL = $state();
	let activeFrameTitle = $state();
	let activeFrameEngine = $state();

	function startBookmark() {
		settingsOpen = false;
		activeFrameURL = activeFrame.displayUrl;
		activeFrameTitle = activeFrame.title;
		activeFrameEngine = letheEngine;
		bookmarkMenu = true;
	}
	function toggleBookmarks() {
		bookmarkMenu = !bookmarkMenu;
	}
	function addBookmark() {
		if (!activeFrame?.displayUrl) return;
		bookmarks.push({ url: activeFrameURL, title: activeFrameTitle, lethe: activeFrameEngine });
		bookmarkMenu = false;
	}
	function removeBookmark(index) {
		bookmarks.splice(index, 1);
	}
	async function bookmarkSearch(url, lethe) {
		let encoded;
		if (lethe === 'sj2') {
			await ensurePrism();
			encoded = prismEncode(url);
		} else if (lethe === 'uv') {
			// @ts-ignore
			encoded = window.__uv$config.prefix + window.__uv$config.encodeUrl(url);
		} else {
			encoded = polygon.encodeUrl(url);
		}
		activeFrame.url = encoded;
		inputEl?.blur();
	}

	function handleNavigate(id, { url, title }) {
		const frame = frames.find((frame) => frame.id === id);
		if (!frame) {
			return;
		}
		frame.displayUrl = url;
		frame.title = title;
	}
	$effect(() => {
		let current = $state(activeFrame?.displayUrl ?? '');
		console.log('current frameURL is: ' + current);
		if (!inputFocused) {
			query = current;
		}
	});
	let activeIndex;
	$effect(() => {
		if ($isTabDragging) {
			activeIndex = tabs.findIndex((tab) => tab.id === $activeTab);
			if (activeIndex > activeIndex + $slotsDragged) {
				$draggedOverRight = tabs[activeIndex + $slotsDragged].id;
			} else if (activeIndex < activeIndex + $slotsDragged) {
				$draggedOverLeft = tabs[activeIndex + $slotsDragged].id;
			}
		}
	});

	function moveTab(id) {
		const from = tabs.findIndex((tab) => tab.id === id);
		console.log('moving from: ' + from);
		if (from === -1) return;
		const temp = tabs.splice(from, 1)[0];
		const newIndex = Math.max(0, Math.min(from + ($slotsDragged ?? 0), tabs.length));
		console.log('moving to:' + newIndex);
		``;
		tabs.splice(newIndex, 0, temp);
		$slotsDragged = null;
		$draggedOverLeft = null;
		$draggedOverRight = null;
	}
	$effect(() => {
		if (ready && connection) {
			setCar(connection, car, customWisp);
		}
		if (getPrismController()) {
			setPrismTransport(car, customWisp || undefined);
		}
	});
	function goBack() {
		$goBackSignal = $activeTab;
	}
	function goForward() {
		$goForwardSignal = $activeTab;
	}

	function reloadTab() {
		$reloadSignal = $activeTab;
	}

	let settingsOpen = $state(false);
	let extensionsOpen = $state(false);
	let popupInterceptor = $state(true); // hydrated from localspace in onMount
	function toggleSettings() {
		settingsOpen = !settingsOpen;
	}
	function closeSettings() {
		settingsOpen = false;
	}
	function toggleExtensions() {
		extensionsOpen = !extensionsOpen;
	}
	function togglePopupInterceptor() {
		popupInterceptor = !popupInterceptor;
	}
	function openInNewWindow() {
		if (!activeFrame || !activeFrame.url) {
			return;
		}
		window.open(activeFrame.url, '_blank', 'noopener');
		closeSettings();
	}

	async function openInspector() {
		closeSettings();
		try {
			await loadScript('https://cdn.jsdelivr.net/npm/eruda');
			window.eruda?.init();
			inputEl;
			window.eruda?.show();
		} catch (e) {
			console.error('Failed to load inspector:', e);
		}
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			const iframes = document.querySelectorAll('.frameContainer iframe');
			const activeIframe = Array.from(iframes).find((el) => el.offsetParent !== null);
			if (activeIframe) {
				activeIframe.requestFullscreen();
			}
		}
		closeSettings();
	}

	$effect(() => {
		if (!hydrated) return;
		saveSetting('lethe', letheEngine);
		saveSetting('car', car);
		saveSetting('customWisp', customWisp);
		saveSetting('searchEngine', searchEngine);
		saveSetting('bookmarks', $state.snapshot(bookmarks));
		saveSetting('popupInterceptor', popupInterceptor);
		saveSetting('LastPopupIntState', LastPopupIntState);
	});
	function registerSW() {
		inputFocused = false;

		try {
			if (navigator.serviceWorker) {
				polygon.init();
				navigator.serviceWorker.register('/servy.js');
			} else {
				console.warn('Service workers not supported');
			}
		} catch (error) {
			console.error('Failed to initialize SJ:', error);
		}
	}

	// Presentation state only. Navigation and proxy controllers above remain shared.
	let collapsed = $state(false);
	let paletteOpen = $state(false);
	let paletteBusy = $state(false);
	let paletteError = $state('');
	let bookmarkListOpen = $state(false);
	let shortcutLabel = $state('Ctrl L');
	let uiMounted = false;

	onMount(() => {
		try {
			const saved = localStorage.getItem('galaxy-sidebar-collapsed');
			collapsed = saved === null ? matchMedia('(max-width: 720px)').matches : saved === 'true';
		} catch {
			collapsed = matchMedia('(max-width: 720px)').matches;
		}
		shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ L' : 'Ctrl L';
		uiMounted = true;
	});

	function toggleSidebar() {
		collapsed = !collapsed;
		try {
			localStorage.setItem('galaxy-sidebar-collapsed', String(collapsed));
		} catch {}
	}

	function closePalette() {
		paletteOpen = false;
		inputFocused = false;
	}

	async function openPalette(clear = false) {
		if (!uiMounted) return;
		settingsOpen = false;
		extensionsOpen = false;
		bookmarkListOpen = false;
		bookmarkMenu = false;
		inputFocused = true;
		query = clear ? '' : activeFrame?.displayUrl || '';
		paletteError = '';
		paletteOpen = true;
		await tick();
		inputEl?.focus();
		inputEl?.select();
	}

	async function submitPalette(event) {
		event.preventDefault();
		if (!ready || !query.trim() || paletteBusy) return;
		paletteBusy = true;
		const target = query.trim();
		paletteError = '';
		try {
			if (!activeFrame) {
				addTab();
				await tick();
			}
			await navigateTo(target);
			closePalette();
		} catch {
			query = target;
			paletteError = 'Could not open this page. Check your connection settings and try again.';
			inputFocused = true;
		} finally {
			paletteBusy = false;
		}
	}

	async function openHomeShortcut(url) {
		if (!ready) return;
		if (!activeFrame) { addTab(); await tick(); }
		try { await navigateTo(url); }
		catch {
			await openPalette();
			query = url;
			paletteError = 'Could not open this page. Check your connection settings and try again.';
		}
	}

	function handleShortcut(event) {
		if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'l') {
			event.preventDefault();
			event.stopPropagation();
			openPalette();
		}
	}

	// Keyboard events do not bubble out of iframe documents. Bind only a UI shortcut
	// to accessible documents; leave iframe loading, routing and navigation untouched.
	function frameShortcuts(node) {
		const documents = new Map();
		function attach(frame) {
			if (!(frame instanceof HTMLIFrameElement)) return;
			documents.get(frame)?.removeEventListener('keydown', handleShortcut, true);
			documents.delete(frame);
			try {
				const doc = frame.contentDocument;
				if (doc) {
					doc.addEventListener('keydown', handleShortcut, true);
					documents.set(frame, doc);
				}
			} catch {
				/* Cross-origin documents retain the clickable URL control. */
			}
		}
		function loaded(event) {
			attach(event.target);
		}
		node.addEventListener('load', loaded, true);
		const observer = new MutationObserver(() => {
			for (const [frame, doc] of documents) {
				if (!node.contains(frame)) {
					doc.removeEventListener('keydown', handleShortcut, true);
					documents.delete(frame);
				}
			}
		});
		observer.observe(node, { childList: true, subtree: true });
		node.querySelectorAll('iframe').forEach(attach);
		return {
			destroy() {
				node.removeEventListener('load', loaded, true);
				observer.disconnect();
				for (const doc of documents.values())
					doc.removeEventListener('keydown', handleShortcut, true);
			}
		};
	}

	let compactUrl = $derived.by(() => {
		if (!activeFrame?.displayUrl) return 'Search or enter URL';
		try {
			return new URL(activeFrame.displayUrl).hostname;
		} catch {
			return activeFrame.displayUrl;
		}
	});
</script>

<svelte:head><title>Velora — Browser</title></svelte:head>
<svelte:window onkeydown={handleShortcut} />

<div class="browser-shell" class:collapsed>
	<aside class="zen-sidebar" aria-label="Browser sidebar">
		<div class="sidebar-heading">
			<button
				class="icon-button collapse-button"
				onclick={toggleSidebar}
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!collapsed}
				aria-controls="browser-tabs"
				title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Icon name="sidebar" /></button
			>
			<span class="sidebar-wordmark">Velora</span>
		</div>
		<nav class="navigation-controls" aria-label="Page navigation">
			<button class="icon-button" onclick={goBack} aria-label="Back" title="Back"
				><Icon name="back" /></button
			>
			<button class="icon-button" onclick={goForward} aria-label="Forward" title="Forward"
				><Icon name="forward" /></button
			>
			<button class="icon-button" onclick={reloadTab} aria-label="Reload" title="Reload"
				><Icon name="reload" size={17} /></button
			>
		</nav>
		<button
			class="url-control"
			onclick={() => openPalette()}
			aria-label={`Open address bar: ${compactUrl}`}
			aria-haspopup="dialog"
			title={activeFrame?.displayUrl || `Search or enter URL (${shortcutLabel})`}
		>
			<Icon name={activeFrame?.url ? 'globe' : 'search'} size={16} /><span class="sidebar-label"
				>{compactUrl}</span
			><kbd>{shortcutLabel}</kbd>
		</button>
		<div class="sidebar-divider"></div>
		<button class="sidebar-action new-tab" onclick={addTab} aria-label="New tab" title="New tab"
			><Icon name="plus" /><span class="sidebar-label">New tab</span></button
		>
		<div
			class="vertical-tabs"
			id="browser-tabs"
			role="tablist"
			aria-label="Browser tabs"
			aria-orientation="vertical"
		>
			{#each tabs as tab (tab.id)}
				{@const frame = frames.find((frame) => frame.id === tab.id)}
				<Tab
					id={tab.id}
					title={frame?.title || 'New Tab'}
					displayUrl={frame?.displayUrl ?? ''}
					onDrop={moveTab}
					{collapsed}
				/>
			{/each}
		</div>
		<div class="sidebar-footer">
			<button
				class="sidebar-action"
				onclick={() => (bookmarkListOpen = true)}
				aria-label="Bookmarks"
				title="Bookmarks"
				><Icon name="bookmark" size={17} /><span class="sidebar-label">Bookmarks</span
				>{#if bookmarks.length}<span class="bookmark-count">{bookmarks.length}</span>{/if}</button
			>
			<a
				class="sidebar-action"
				href="/books"
				target="_blank"
				rel="noopener"
				aria-label="Games"
				title="Games"><Icon name="games" size={17} /><span class="sidebar-label">Games</span></a
			>
			<div class="sidebar-tools">
				<button
					class="icon-button"
					onclick={toggleSettings}
					aria-label="Settings"
					aria-haspopup="dialog"
					title="Settings"><Icon name="settings" size={17} /></button
				>
				<button
					class="icon-button"
					onclick={toggleExtensions}
					aria-label="Extensions"
					aria-haspopup="dialog"
					title="Extensions"><Icon name="extensions" size={17} /></button
				>
				<button
					class="icon-button"
					onclick={toggleFullscreen}
					aria-label="Fullscreen"
					title="Fullscreen"><Icon name="fullscreen" size={17} /></button
				>
			</div>
		</div>
	</aside>

	<main class="frameContainer" aria-label="Webpage" use:frameShortcuts>
		{#each frames as frame (frame.id)}
			<div
				class="webview-panel"
				class:active={frame.id === $activeTab}
				hidden={frame.id !== $activeTab}
			>
				<Iframe
					id={frame.id}
					src={frame.url}
					onnavigate={(info) => handleNavigate(frame.id, info)}
					onnewtab={(url) => openInNewTab(url)}
					interceptEnabled={popupInterceptor}
				/>
				{#if frame.id === $activeTab && !frame.url}<Home
						{ready}
						onsearch={() => openPalette(true)} onopen={openHomeShortcut}
					/>{/if}
			</div>
		{/each}
		{#if !tabs.length}<Home {ready} onsearch={() => openPalette(true)} onopen={openHomeShortcut} />{/if}
	</main>

	{#if paletteOpen}
		<Modal label="Search or enter a URL" onclose={closePalette} palette>
			<form class="palette-form" onsubmit={submitPalette}>
				<div class="palette-input-row">
					<Icon name="search" size={20} /><input
						bind:this={inputEl}
						bind:value={query}
						aria-label="Search or enter a URL"
						placeholder="Search or enter a URL"
						autocomplete="off"
						spellcheck="false"
						onfocus={() => (inputFocused = true)}
					/><button
						class="icon-button"
						type="button"
						aria-label="Close address bar"
						onclick={closePalette}><Icon name="close" size={16} /></button
					>
				</div>
				{#if paletteError}<p class="palette-error" role="alert">{paletteError}</p>{/if}
				<div class="palette-footer">
					<span>{ready ? 'Search the web or go to a page' : 'Starting browser…'}</span><button
						class="palette-go"
						type="submit"
						disabled={!ready || !query.trim() || paletteBusy}
						>{paletteBusy ? 'Opening…' : 'Go'}<Icon name="arrow" size={16} /></button
					>
				</div>
			</form>
		</Modal>
	{/if}

	{#if settingsOpen}
		<Modal label="Browser settings" onclose={closeSettings}>
			<div class="modal-heading">
				<h2>Browser settings</h2>
				<button class="icon-button" onclick={closeSettings} aria-label="Close settings"
					><Icon name="close" size={16} /></button
				>
			</div>
			<div class="settings-fields">
				<label
					>Proxy<select bind:value={letheEngine} disabled={!ready}
						><option value="sj2">SJ2</option><option value="sj">SJ</option><option value="uv"
							>UV</option
						></select
					></label
				>
				<label
					>Transport<select bind:value={car} disabled={!ready}
						><option value="libcurl">Lib</option><option value="epoxy">Epox</option></select
					></label
				>
				<label
					>Wisp server<input bind:value={customWisp} placeholder="Keep blank for default" /></label
				>
				<label
					>Search engine<select bind:value={searchEngine}
						><option value="ddg">DuckDuckGo</option><option value="brave">Brave</option><option
							value="google">Google</option
						></select
					></label
				>
			</div>
			<div class="modal-actions">
				<button
					onclick={() => {
						addTab();
						closeSettings();
					}}><Icon name="plus" size={16} />New tab</button
				>
				<button onclick={startBookmark} disabled={!activeFrame?.displayUrl}
					><Icon name="star" size={16} />Bookmark this page</button
				>
				<button onclick={openInNewWindow} disabled={!activeFrame?.url}
					><Icon name="arrow" size={16} />Open page in new window</button
				>
				<button onclick={toggleFullscreen}><Icon name="fullscreen" size={16} />Fullscreen</button>
				<button onclick={openInspector}><Icon name="globe" size={16} />Inspect element</button>
			</div>
			<div class="modal-links">
				<a href="/settings" target="_blank" rel="noopener">All settings ↗</a><a
					href="/apps"
					target="_blank"
					rel="noopener">Apps ↗</a
				><a href="/os" target="_blank" rel="noopener">Desktop ↗</a>
			</div>
		</Modal>
	{/if}

	{#if extensionsOpen}
		<Modal label="Extensions" onclose={() => (extensionsOpen = false)}>
			<div class="modal-heading">
				<h2>Extensions</h2>
				<button
					class="icon-button"
					onclick={() => (extensionsOpen = false)}
					aria-label="Close extensions"><Icon name="close" size={16} /></button
				>
			</div>
			<div class="extension-row">
				<div>
					<h3>Popup Interceptor</h3>
					<p>Open popup requests in Velora instead of the native browser.</p>
				</div>
				<button
					class="extension-toggle"
					class:on={popupInterceptor}
					role="switch"
					aria-checked={popupInterceptor}
					aria-label="Popup Interceptor"
					onclick={togglePopupInterceptor}><span></span></button
				>
			</div>
		</Modal>
	{/if}

	{#if bookmarkListOpen}
		<Modal label="Bookmarks" onclose={() => (bookmarkListOpen = false)}>
			<div class="modal-heading">
				<h2>Bookmarks</h2>
				<button
					class="icon-button"
					onclick={() => (bookmarkListOpen = false)}
					aria-label="Close bookmarks"><Icon name="close" size={16} /></button
				>
			</div>
			<div class="bookmark-list">
				{#each bookmarks as bm, i}
					<div class="bookmark-row">
						<button
							class="bookmark-open"
							disabled={!ready}
							onclick={async () => {
								if (!activeFrame) {
									addTab();
									await tick();
								}
								await bookmarkSearch(bm.url, bm.lethe);
								bookmarkListOpen = false;
							}}
							oncontextmenu={(event) => {
								event.preventDefault();
								removeBookmark(i);
							}}
							><Icon name="globe" size={16} /><span
								>{bm.title || bm.url}<small>{bm.url}</small></span
							></button
						><button
							class="icon-button"
							onclick={() => removeBookmark(i)}
							aria-label={`Remove ${bm.title || bm.url}`}><Icon name="close" size={14} /></button
						>
					</div>
				{:else}<p class="empty-note">Your saved pages will appear here.</p>{/each}
			</div>
			<button
				class="text-action"
				disabled={!activeFrame?.displayUrl}
				onclick={() => {
					bookmarkListOpen = false;
					startBookmark();
				}}><Icon name="plus" size={16} />Bookmark this page</button
			>
		</Modal>
	{/if}

	{#if bookmarkMenu}
		<Modal label="Add bookmark" onclose={toggleBookmarks}>
			<div class="modal-heading">
				<h2>Add bookmark</h2>
				<button class="icon-button" onclick={toggleBookmarks} aria-label="Close bookmark editor"
					><Icon name="close" size={16} /></button
				>
			</div>
			<form
				class="settings-fields"
				onsubmit={(event) => {
					event.preventDefault();
					addBookmark();
				}}
			>
				<label>Name<input bind:value={activeFrameTitle} /></label><label
					>URL<input bind:value={activeFrameURL} /></label
				><button class="save-button" type="submit">Done</button>
			</form>
		</Modal>
	{/if}
</div>
