<script>
	// @ts-nocheck
	import Window from '$lib/utils/window/window.svelte';
	import Notifications from '$lib/utils/notifications.svelte';
	import {
		windowList,
		minimizedSig,
		activeSignal,
		focusWindowTop,
		notif
	} from '$lib/stores/index.js';
	import '$lib/style/os.css';
	import { onMount } from 'svelte';
	import mainBG from '$lib/img/bg/dark-mountains.jpg';
	import Wallpaper from '$lib/utils/os/wallpaper.svelte';
	import Onboarding from '$lib/utils/os/onboarding.svelte';
	import { isNewDesktopUser } from '$lib/utils/os/onboarding-state.js';
	import Icon from '$lib/utils/browser/icon.svelte';
	import browser from '$lib/img/icons/earthWhite.png';
	import g from '$lib/img/icons/controller.png';
	import a from '$lib/img/icons/apps.png';
	import s from '$lib/img/icons/settings.png';
	import p from '$lib/img/icons/pyrite.png';
	import sp from '$lib/img/icons/nvidia.png';
	import { get } from 'svelte/store';
	import { applyStartupSettings } from '$lib/utils/cloak.js';
	import gsap from 'gsap';
	import { loadSetting, saveSetting, onSettingChange } from '$lib/utils/localspace.js';
	import faviconFetch from 'favicon-fetch';
	import { launchAds } from '$lib/utils/ads';

	let activeButton = $state(null);
	let menuOpen = $state(false);
	let openMenuX = $state(0);
	let menuX = $state(0);
	let menuY = $state(0);
	let menuSender = $state(null);
	let previewOpen = $state(false);
	let previewApp = $state(null);
	let hoverTimeout = null;
	let timeString = $state('');
	let dateString = $state('');
	let bgURL = $state(mainBG);
	let bgFit = $state('cover');
	let wallpaperOpen = $state(false);
	let onboardingOpen = $state(false);
	let launcherOpen = $state(false);
	let launcherSearch = $state('');
	let customWisp = $state('');
	let fullscreen = $state(false);
	let hydrated = $state(false);
	let navSizeMulti = $state(24);
	let temp = 0;
	let accumY = 0;
	let dragging = $state(false);
	let windowComps = [];
	let hostname = $state(null);
	let proxApi = '%2Fapi%3Furl%3D%7Burl%7D%26type%3Dprism%26transport%3DlibcurlRaw%26autoSW%3Dfalse';
	function startNavResize(e) {
		dragging = true;
		temp = navSizeMulti;
		accumY = 0;
		e.currentTarget.requestPointerLock();
		addEventListener('mousemove', dragStart);
		addEventListener('mouseup', dragStop);
		document.addEventListener('pointerlockchange', onPointerLockChange);
	}
	function dragStart(e) {
		accumY += e.movementY;
		navSizeMulti = Math.max(Math.min(temp - accumY * 0.2, 39), 8);
	}
	function dragStop(e) {
		removeEventListener('mousemove', dragStart);
		removeEventListener('mouseup', dragStop);
		document.removeEventListener('pointerlockchange', onPointerLockChange);
		if (document.pointerLockElement) document.exitPointerLock();
		dragging = false;
		callTaskbarHeight();
	}
	function onPointerLockChange() {
		if (!document.pointerLockElement) dragStop();
	}
	const baseApps = $derived([
		{
			id: 1,
			url: '/slate',
			name: 'Browser',
			icon: browser,
			height: '76%',
			width: '80%',
			center: true,
			top: 100,
			left: 60
		},
		{
			id: 6,
			url:
				'/api?' +
				new URLSearchParams({
					url: 'https://play.geforcenow.com/mall',
					type: 'prism',
					transport: 'epoxy',
					autoSW: 'false',
					...(customWisp ? { wisp: customWisp } : {})
				}),
			name: 'GeForce NOW',
			icon: sp,
			height: '76%',
			width: '80%',
			center: true,
			top: 50,
			left: 210
		},
		{
			id: 2,
			url: '/books',
			name: 'Games',
			icon: g,
			height: '76%',
			width: '80%',
			center: true,
			top: 120,
			left: 110
		},
		{
			id: 3,
			url: `https://${hostname}/pyrite/?api=https%3A%2F%2F${hostname}${proxApi}`,
			name: 'Pyrite',
			icon: p,
			height: '76%',
			width: '80%',
			center: true,
			top: 30,
			left: 110
		},
		{
			id: 4,
			url: '/apps',
			name: 'Apps',
			icon: a,
			height: '76%',
			width: '80%',
			center: true,
			top: 90,
			left: 160
		},
		{
			id: 5,
			url: '/settings',
			name: 'Settings',
			icon: s,
			height: '80%',
			width: '80%',
			top: 0,
			left: 0,
			center: true
		}
	]);
	let customApps = $state([]);
	const apps = $derived([...baseApps, ...customApps]);
	function conertToPixies(size, viewportLength) {
		const sizeAsText = String(size);
		const isPercentage = sizeAsText.endsWith('%');

		if (isPercentage) {
			const percent = parseFloat(sizeAsText);
			const fraction = percent / 100;
			return fraction * viewportLength;
		} else {
			return parseFloat(sizeAsText);
		}
	}

	function getCenteredPosition(width, height) {
		const windowWidthInPixels = conertToPixies(width, window.innerWidth);
		const windowHeightInPixels = conertToPixies(height, window.innerHeight);

		const leftoverWidth = window.innerWidth - windowWidthInPixels;
		const leftoverHeight = window.innerHeight - windowHeightInPixels;

		const centeredLeft = leftoverWidth / 2;
		const centeredTop = leftoverHeight / 2;

		return {
			left: centeredLeft,
			top: centeredTop
		};
	}

	function getAppConfig(appId) {
		for (const app of apps) {
			if (app.id === appId) {
				return app;
			}
		}
		return null;
	}

	$effect(() => {
		activeButton = $activeSignal;
		if (!hydrated) return;
		saveSetting('navbarsize', navSizeMulti);
	});
	onMount(() => {
		applyStartupSettings();
		hostname = location.hostname;
		if (hostname.includes('localhost')) hostname = 'v7.galxy.it.com';
		document.addEventListener('mousedown', launchAds);
		const syncFullscreen = () => {
			fullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', syncFullscreen);
		return () => {
			document.removeEventListener('mousedown', launchAds);
			document.removeEventListener('fullscreenchange', syncFullscreen);
			clearTimeout(hoverTimeout);
			clearTimeout(closeTimeout);
			dragStop();
		};
	});

	function getAppWindows(appId) {
		const list = get(windowList);
		const matching = [];
		for (const win of list) {
			if (win.sender === appId || win.parentApp === appId) {
				matching.push(win);
			}
		}
		return matching;
	}

	function isAppActive(appId) {
		if (activeButton === appId) return true;
		const list = get(windowList);
		for (const win of list) {
			if (win.parentApp === appId && win.sender === activeButton) {
				return true;
			}
		}
		return false;
	}

	function getPreviewWindows() {
		const matching = [];
		for (const win of $windowList) {
			if (win.sender === previewApp || win.parentApp === previewApp) {
				matching.push(win);
			}
		}
		return matching;
	}

	function hasMinimizedWindow(appId) {
		for (const win of $windowList) {
			const belongsToApp = win.sender === appId || win.parentApp === appId;
			if (belongsToApp && win.minimized) {
				return true;
			}
		}
		return false;
	}
	function openWindow(url, name, height, width, top, left, appId) {
		if (localStorage.getItem('firstVisit') == 'false') {
		} else {
			localStorage.setItem('firstVisit', 'false');
			$notif = 'Right click an app to open new window!';
		}
		let appWindows = getAppWindows(appId);
		if (appWindows.length > 1) {
			previewApp = appId;
			previewOpen = true;
			return;
		}
		if (appWindows.length === 1) {
			minimizedSig.set(appWindows[0].sender);
			previewOpen = false;
			return;
		}

		activeSignal.set(appId);

		const appConfig = getAppConfig(appId);
		if (appConfig && appConfig.center) {
			const centeredPosition = getCenteredPosition(width, height);
			top = centeredPosition.top;
			left = centeredPosition.left;
		}

		const queryString = url.split('?')[1];
		if (queryString) {
			const params = new URLSearchParams(queryString);
			const notifMsg = params.get('notif');
			if (notifMsg) {
				$notif = notifMsg;
			}
		}
		windowList.update((list) => [
			...list,

			{
				url,
				name,
				height,
				width,
				top,
				left,
				id: `win-${Date.now()}`,
				sender: appId,
				parentApp: appId
			}
		]);
	}

	function openNewWindow(url, name, height, width, top, left, appId) {
		let uniqueSender = `${appId}-${Date.now()}`;
		let newName = String(name) + ' (' + getAppWindows(appId).length + ')';
		name = newName;
		activeSignal.set(uniqueSender);

		const appConfig = getAppConfig(appId);
		if (appConfig && appConfig.center) {
			const centeredPosition = getCenteredPosition(width, height);
			top = centeredPosition.top;
			left = centeredPosition.left;
		}

		windowList.update((list) => [
			...list,
			{
				url,
				name,
				height,
				width,
				top,
				left,
				id: `win-${Date.now()}`,
				sender: uniqueSender,
				parentApp: appId
			}
		]);
		closeMenu();
	}

	function focusWindow(sender) {
		focusWindowTop.set(sender);
		previewOpen = false;
	}
	let menuType = $state(null);
	function openMenu(e, type, appId, url, name, height, width, top, left) {
		e.preventDefault();
		e.stopPropagation();
		menuX = Math.min(e.clientX, window.innerWidth - 248);
		menuY = Math.min(e.clientY, window.innerHeight - 160);
		openMenuX = menuX;
		if (type == 'navBar') {
			menuType = 'nav';
			menuOpen = true;
		} else if (type == 'apps') {
			menuSender = { appId, url, name, height, width, top, left };
			menuType = 'app';
			hoverEnd();
			menuOpen = true;
		}
	}

	function closeMenu() {
		menuOpen = false;
		menuSender = null;
	}

	const proxies = [
		{ value: 'prism', label: 'SJ2' },
		{ value: 'polygon', label: 'SJ' },
		{ value: 'glass', label: 'UV' }
	];
	const transports = [
		{ value: 'libcurl', label: 'Libcurl' },
		{ value: 'epoxy', label: 'Epoxy' }
	];

	let addOpen = $state(false);
	let advancedOpen = $state(false);
	let addError = $state(null);
	let newName = $state('');
	let newUrl = $state('');
	let newIcon = $state('');
	let newProxy = $state('prism');
	let newTransport = $state('libcurl');
	let newWisp = $state('');
	let newNotif = $state('');

	function openAddApp() {
		closeMenu();
		addError = null;
		advancedOpen = false;
		newName = '';
		newUrl = '';
		newIcon = '';
		newProxy = 'prism';
		newTransport = 'libcurl';
		newWisp = '';
		newNotif = '';
		addOpen = true;
	}

	function closeAddApp() {
		addOpen = false;
	}

	function hostnameOf(url) {
		try {
			return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
		} catch {
			return null;
		}
	}
	function nextWindowPosition() {
		const step = customApps.length % 6;
		return { top: 60 + step * 24, left: 90 + step * 40 };
	}

	function addApp() {
		const url = newUrl.trim();
		const name = newName.trim();
		if (!url || !name) {
			addError = 'Name and URL are required';
			return;
		}

		const params = new URLSearchParams({ url, type: newProxy, transport: newTransport });
		if (newNotif.trim()) params.set('notif', newNotif.trim());
		if (newWisp.trim()) params.set('wisp', newWisp.trim());

		const host = hostnameOf(url);
		const { top, left } = nextWindowPosition();
		customApps.push({
			id: `custom-${Date.now()}`,
			url: `/api?${params.toString()}`,
			name,
			icon: newIcon.trim() || (host ? faviconFetch({ hostname: host }) : browser),
			height: '76%',
			width: '80%',
			center: true,
			top,
			left
		});
		saveSetting('customApps', $state.snapshot(customApps));
		addOpen = false;
	}

	function removeApp(appId) {
		customApps = customApps.filter((app) => app.id !== appId);
		saveSetting('customApps', $state.snapshot(customApps));
		closeMenu();
	}

	function isCustomApp(appId) {
		for (const app of customApps) {
			if (app.id === appId) return true;
		}
		return false;
	}

	function hoverStart(e, appId) {
		previewOpen = false;
		previewApp = null;
		e.preventDefault();
		e.stopPropagation();
		menuX = Math.max(12, Math.min(e.clientX - 80, window.innerWidth - 260));
		clearTimeout(hoverTimeout);
		clearTimeout(closeTimeout);
		hoverTimeout = setTimeout(() => {
			let appWindows = getAppWindows(appId);
			if (appWindows.length > 0) {
				previewApp = appId;
				previewOpen = true;
			}
		}, 400);
	}
	let closeTimeout = null;
	function hoverEnd() {
		clearTimeout(hoverTimeout);
		closeTimeout = setTimeout(() => {
			previewOpen = false;
			previewApp = null;
		}, 200);
	}
	function updateTime() {
		const now = new Date();
		timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
	}

	onMount(() => {
		let disposed = false;
		Promise.all([
			loadSetting('bg', mainBG),
			loadSetting('bgFit', 'cover'),
			loadSetting('navbarsize', 24),
			loadSetting('customApps', []),
			loadSetting('customWisp', ''),
			checkFirstVisit()
		]).then(([background, fit, size, savedApps, wisp, firstVisit]) => {
			if (disposed) return;
			bgURL = background || mainBG;
			bgFit = fit === 'contain' ? 'contain' : 'cover';
			navSizeMulti = Math.max(8, Math.min(Number(size) || 24, 39));
			customApps = Array.isArray(savedApps) ? savedApps : [];
			customWisp = wisp || '';
			onboardingOpen = firstVisit;
			hydrated = true;
		});
		updateTime();
		const interval = setInterval(updateTime, 1000);
		const subscriptions = [
			onSettingChange('bg', (value) => {
				bgURL = value || mainBG;
			}),
			onSettingChange('bgFit', (value) => {
				bgFit = value === 'contain' ? 'contain' : 'cover';
			}),
			onSettingChange('customApps', (value) => {
				customApps = value ?? [];
			}),
			onSettingChange('customWisp', (value) => {
				customWisp = value || '';
			})
		];
		return () => {
			disposed = true;
			clearInterval(interval);
			subscriptions.forEach((unsubscribe) => unsubscribe());
		};
	});

	async function checkFirstVisit() {
		try {
			const marker = await loadSetting('desktopOnboarding', null);
			const saved = await Promise.all(
				['bg', 'navbarsize', 'customApps', 'lethe', 'car', 'bookmarks', 'searchEngine'].map((key) =>
					loadSetting(key, null)
				)
			);
			const legacyVisit = [
				'firstVisit',
				'mode',
				'galaxy-sidebar-collapsed',
				'velora-onboarding-seen'
			].some((key) => localStorage.getItem(key) !== null);
			const firstVisit = isNewDesktopUser(marker, saved, legacyVisit);
			// Record the visit before any interaction, including reload or navigation away.
			try {
				localStorage.setItem('velora-onboarding-seen', 'true');
			} catch {}
			await saveSetting('desktopOnboarding', marker ?? (firstVisit ? 'shown' : 'existing-user'));
			return firstVisit;
		} catch {
			// If storage cannot be read, avoid interrupting a possibly returning user.
			return false;
		}
	}
	function finishOnboarding(result) {
		onboardingOpen = false;
		saveSetting('desktopOnboarding', result);
	}

	function launchApp(app) {
		launcherOpen = false;
		openWindow(app.url, app.name, app.height, app.width, app.top, app.left, app.id);
	}
	function runningCount(appId) {
		return $windowList.filter((win) => win.sender === appId || win.parentApp === appId).length;
	}
	async function toggleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
		} catch {
			$notif = 'Full screen is not available in this browser.';
		}
	}
	function personalize() {
		launcherOpen = false;
		closeMenu();
		wallpaperOpen = true;
	}

	function callTaskbarHeight() {
		for (const comp of windowComps) {
			comp?.updateTaskbarHeight();
		}
	}
	function openChangelogs() {
		const existing = getAppWindows('about-velora')[0];
		if (existing) {
			focusWindow(existing.sender);
			return;
		}
		openWindow('/changelog', 'About Velora', '65%', '600px', 70, 80, 'about-velora');
	}
</script>

<svelte:head><title>Velora — Desktop</title></svelte:head>
<svelte:window
	onclick={() => {
		closeMenu();
		launcherOpen = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			closeAddApp();
			closeMenu();
			launcherOpen = false;
		}
	}}
/>

<div class="velora-desktop" class:fullscreen style:--dock-height={`${40 + navSizeMulti}px`}>
	<div
		class="desktop-wallpaper"
		style:background-image={`url(${JSON.stringify(bgURL)})`}
		style:background-size={bgFit}
	></div>
	<div class="desktop-shade"></div>
	<header class="desktop-menubar">
		<div class="desktop-identity">
			<button class="brand-button" onclick={openChangelogs} aria-label="About Velora"
				><span class="velora-mark">v</span>Velora</button
			><span class="desktop-label">Desktop</span>
		</div>
		<div class="desktop-status">
			<a href="/slate" class="browser-mode" title="Open browser without desktop windows"
				><Icon name="globe" size={14} /><span>Browser mode</span></a
			>
			<button
				class="menubar-icon"
				onclick={toggleFullscreen}
				aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
				><Icon name="fullscreen" size={15} /></button
			>
			<time>{timeString}</time>
		</div>
	</header>
	<Notifications />
	<main
		class="desktop-workspace"
		aria-label="Velora desktop"
		oncontextmenu={(e) => openMenu(e, 'navBar')}
	>
		<div class="desktop-shortcuts" aria-label="Desktop apps">
			{#each apps.filter((app) => [1, 6, 2, 4].includes(app.id)) as app (app.id)}
				<button
					class="desktop-shortcut"
					onclick={() => launchApp(app)}
					disabled={!hydrated}
					oncontextmenu={(e) =>
						openMenu(
							e,
							'apps',
							app.id,
							app.url,
							app.name,
							app.height,
							app.width,
							app.top,
							app.left
						)}
				>
					<span class="shortcut-icon"><img src={app.icon} alt="" /></span><span>{app.name}</span>
				</button>
			{/each}
		</div>
		<div class="desktop-clock" aria-hidden="true">
			<p>{dateString}</p>
			<span>{timeString}</span>
		</div>
		<div class="desktop-signature">
			<span>VELORA</span>
			<p>Your space, your way.</p>
		</div>
		<button class="personalize-button" onclick={personalize}
			><Icon name="settings" size={15} /><span>Change wallpaper</span></button
		>
	</main>

	{#if launcherOpen}
		<section class="app-launcher" aria-label="App launcher" onclick={(e) => e.stopPropagation()}>
			<div class="launcher-heading">
				<h2>Your apps</h2>
				<button
					class="menubar-icon"
					onclick={() => {
						launcherOpen = false;
					}}
					aria-label="Close app launcher"><Icon name="close" size={16} /></button
				>
			</div>
			<label class="launcher-search"
				><Icon name="search" size={17} /><input
					placeholder="Find an app"
					aria-label="Find an app"
					bind:value={launcherSearch}
					{@attach (node) => {
						node.focus();
					}}
				/></label
			>
			<div class="launcher-grid">
				{#each apps.filter((app) => app.name
						.toLowerCase()
						.includes(launcherSearch.toLowerCase())) as app (app.id)}
					<button onclick={() => launchApp(app)}
						><span class="shortcut-icon"><img src={app.icon} alt="" /></span><span>{app.name}</span
						></button
					>
				{:else}<p class="no-apps">No apps found.</p>{/each}
			</div>
			<div class="launcher-footer">
				<button
					onclick={() => {
						launcherOpen = false;
						openAddApp();
					}}><Icon name="plus" size={15} />Add app</button
				><button onclick={personalize}><Icon name="settings" size={15} />Personalize</button>
			</div>
		</section>
	{/if}
	{#if onboardingOpen}
		<Onboarding
			background={bgURL}
			onapply={(background, fit) => {
				bgURL = background;
				bgFit = fit;
			}}
			onfinish={finishOnboarding}
		/>
	{/if}
	{#if wallpaperOpen}
		<Wallpaper
			onclose={() => {
				wallpaperOpen = false;
			}}
			onapply={(background, fit) => {
				bgURL = background;
				bgFit = fit;
			}}
		/>
	{/if}

	{#if menuOpen}
		<div
			class="contextMenu"
			style="left: {openMenuX}px; top: {menuY}px;"
			onclick={(e) => e.stopPropagation()}
		>
			{#if menuType == 'app'}
				<button
					class="menuOption"
					onclick={() =>
						openNewWindow(
							menuSender.url,
							menuSender.name,
							menuSender.height,
							menuSender.width,
							menuSender.top,
							menuSender.left,
							menuSender.appId
						)}
				>
					Open New Window
				</button>
				{#if isCustomApp(menuSender.appId)}
					<button class="menuOption danger" onclick={() => removeApp(menuSender.appId)}>
						Remove App
					</button>
				{/if}
			{:else if menuType == 'nav'}
				<button class="menuOption" onclick={openAddApp}>Add app</button>
				<button class="menuOption" onclick={personalize}>Change wallpaper</button>
			{/if}
		</div>
	{/if}
	{#if addOpen}
		<dialog
			class="modalOverlay"
			aria-label="Add app"
			onclose={closeAddApp}
			onclick={(e) => {
				if (e.target === e.currentTarget) closeAddApp();
			}}
			{@attach (node) => {
				const previous = document.activeElement;
				node.showModal();
				return () => {
					node.close();
					previous?.focus?.();
				};
			}}
		>
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				{@attach (node) => {
					gsap.fromTo(
						node,
						{ y: 12, opacity: 0, scale: 0.97 },
						{ y: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
					);
				}}
			>
				<p class="modalTitle">Add App</p>

				<p class="modalLabel">URL</p>
				<input
					class="modalInput"
					type="text"
					placeholder="example.com"
					bind:value={newUrl}
					oninput={() => (addError = null)}
					onkeydown={(e) => e.key === 'Enter' && addApp()}
				/>

				<p class="modalLabel">Name</p>
				<input
					class="modalInput"
					type="text"
					placeholder="Example"
					bind:value={newName}
					oninput={() => (addError = null)}
					onkeydown={(e) => e.key === 'Enter' && addApp()}
				/>

				<p class="modalLabel">Icon</p>
				<input
					class="modalInput"
					type="text"
					placeholder="leave blank to auto generate"
					bind:value={newIcon}
					onkeydown={(e) => e.key === 'Enter' && addApp()}
				/>

				<button class="advancedToggle" onclick={() => (advancedOpen = !advancedOpen)}>
					<span class="advancedArrow" class:open={advancedOpen}></span> Advanced
				</button>

				{#if advancedOpen}
					<div
						class="advancedPanel"
						{@attach (node) => {
							gsap.fromTo(node, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.2 });
						}}
					>
						<p class="modalLabel">Proxy</p>
						<div class="modalOptions">
							{#each proxies as proxy}
								<button
									class="modalOption"
									class:active={newProxy === proxy.value}
									onclick={() => (newProxy = proxy.value)}>{proxy.label}</button
								>
							{/each}
						</div>

						<p class="modalLabel">Transport</p>
						<div class="modalOptions">
							{#each transports as transport}
								<button
									class="modalOption"
									class:active={newTransport === transport.value}
									onclick={() => (newTransport = transport.value)}>{transport.label}</button
								>
							{/each}
						</div>

						<p class="modalLabel">Wisp</p>
						<input
							class="modalInput"
							type="text"
							placeholder="keep blank for default"
							bind:value={newWisp}
						/>

						<p class="modalLabel">Open Notification</p>
						<input
							class="modalInput"
							type="text"
							placeholder="shown when the app opens"
							bind:value={newNotif}
						/>
					</div>
				{/if}

				{#if addError}
					<p class="modalError">{addError}</p>
				{/if}

				<div class="modalActions">
					<button class="modalBtn" onclick={closeAddApp}>Cancel</button>
					<button class="modalBtn primary" onclick={addApp}>Add</button>
				</div>
			</div>
		</dialog>
	{/if}
	{#if previewOpen}
		<div
			style="left:{menuX}px"
			id="previewPanel"
			class="previewPanel"
			onclick={(e) => e.stopPropagation()}
			{@attach (node) => {
				gsap.fromTo(
					node,
					{ y: 20, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						duration: 0.3,
						ease: 'power2.out'
					}
				);
			}}
			onmouseenter={() => clearTimeout(closeTimeout)}
			onmouseleave={() => {
				previewOpen = false;
				previewApp = null;
			}}
		>
			{#each getPreviewWindows() as win}
				<button class="previewCard" onclick={() => focusWindow(win.sender)}>
					<p>{win.name}</p>
				</button>
			{/each}
		</div>
	{/if}
	<nav class="desktop-dock" aria-label="App dock">
		<div
			class="navResize"
			onmousedown={startNavResize}
			title="Drag to resize dock"
			role="presentation"
		></div>
		<button
			class="dock-launcher"
			class:active={launcherOpen}
			aria-label="Open app launcher"
			aria-expanded={launcherOpen}
			onclick={(e) => {
				e.stopPropagation();
				launcherSearch = '';
				launcherOpen = !launcherOpen;
			}}><Icon name="apps" size={24} /></button
		>
		<span class="dock-divider"></span>
		<div class="dock-apps" oncontextmenu={(e) => openMenu(e, 'navBar')}>
			{#each apps as app (app.id)}
				<button
					class="dock-app"
					class:active={isAppActive(app.id)}
					class:running={runningCount(app.id) > 0}
					aria-label={`Open ${app.name}`}
					title={app.name}
					disabled={!hydrated}
					onclick={() => launchApp(app)}
					oncontextmenu={(e) =>
						openMenu(
							e,
							'apps',
							app.id,
							app.url,
							app.name,
							app.height,
							app.width,
							app.top,
							app.left
						)}
					onmouseenter={(e) => hoverStart(e, app.id)}
					onmouseleave={hoverEnd}
				>
					<img src={app.icon} alt="" /><span class="dock-indicator"></span>
				</button>
			{/each}
		</div>
		<span class="dock-divider"></span>
		<button
			class="dock-personalize"
			onclick={personalize}
			aria-label="Change wallpaper"
			title="Change wallpaper"><Icon name="desktop" size={23} /></button
		>
	</nav>

	{#each $windowList as window, i (window.id)}
		<Window
			bind:this={windowComps[i]}
			url={window.url}
			name={window.name}
			height={window.height}
			width={window.width}
			top={window.top}
			left={window.left}
			id={window.id}
			sender={window.sender}
		/>
	{/each}
</div>
