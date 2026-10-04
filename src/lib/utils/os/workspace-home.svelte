<script>
	import Icon from '../browser/icon.svelte';
	let {
		apps,
		windows,
		ready,
		date,
		time,
		onlaunch,
		onfocus,
		onpersonalize,
		onadd,
		onsearch,
		onappmenu
	} = $props();
	let view = $state('overview');
	let query = $state('');
	const descriptions = {
		1: 'A little curiosity goes a long way.',
		6: 'Your next world is waiting.',
		2: 'Find something worth playing.',
		3: 'Another way to explore.',
		4: 'More possibilities, one place.',
		5: 'Make yourself at home.'
	};
	let filtered = $derived(
		apps.filter((app) => app.name.toLowerCase().includes(query.trim().toLowerCase()))
	);
	const sections = [
		{ id: 'overview', name: 'Overview', icon: 'desktop' },
		{ id: 'library', name: 'App library', icon: 'apps' },
		{ id: 'windows', name: 'Open windows', icon: 'sidebar' }
	];
</script>

<div class="workspace-shell">
	<aside class="workspace-rail">
		<div class="workspace-wordmark"><span>v</span> YOUR SPACE</div>
		<nav aria-label="Workspace views">
			{#each sections as section}
				<button
					class:selected={view === section.id}
					aria-current={view === section.id ? 'page' : undefined}
					onclick={() => {
						view = section.id;
						query = '';
					}}
				>
					<Icon name={section.icon} size={18} /><span>{section.name}</span>
					{#if section.id === 'windows'}<small>{windows.length}</small>{/if}
				</button>
			{/each}
		</nav>
		<div class="rail-bottom">
			<div class="rail-note">
				<span class="status-dot"></span>{ready ? 'Ready when you are' : 'Getting things ready'}
			</div>
			<button onclick={onpersonalize}><Icon name="settings" size={17} />Change wallpaper</button>
			<button onclick={onadd} disabled={!ready}
				><Icon name="plus" size={17} />Add your own app</button
			>
		</div>
	</aside>
	<section
		class="workspace-body"
		aria-label={sections.find((section) => section.id === view)?.name ?? 'Workspace'}
	>
		<header class="workspace-heading">
			<div>
				<p class="eyebrow">{date || 'WELCOME TO VELORA'}</p>
				<h1>
					{view === 'overview'
						? 'Make room for more.'
						: view === 'library'
							? 'All your possibilities.'
							: 'Pick up where you left off.'}
				</h1>
			</div>
			<button class="search-trigger" onclick={onsearch} aria-label="Search apps and actions"
				><Icon name="search" size={19} /><span>Jump to anything</span><kbd>⌘ / Ctrl K</kbd></button
			>
		</header>
		{#if view === 'overview'}
			<div class="feature-grid">
				{#each apps.filter((app) => [1, 6].includes(app.id)) as app}
					<button
						class="feature"
						class:gaming={app.id === 6}
						onclick={() => onlaunch(app)}
						oncontextmenu={(event) => onappmenu(event, app)}
						disabled={!ready}
					>
						<div class="feature-top">
							<span class="feature-category"
								>{app.id === 1 ? 'EXPLORE WITHOUT LIMITS' : 'PRESS PLAY'}</span
							><img src={app.icon} alt="" />
						</div>
						<div class="feature-art" aria-hidden="true">
							{#if app.id === 1}<div class="orbit orbit-one"></div>
								<div class="orbit orbit-two"></div>
								<div class="orbit orbit-three"></div>
								<span class="orbit-core"></span>{:else}<span class="play-shape"></span><span
									class="play-line"
								></span>{/if}
						</div>
						<div class="feature-bottom">
							<div>
								<h2>{app.name}</h2>
								<p>{descriptions[app.id]}</p>
							</div>
							<span class="feature-arrow"><Icon name="arrow" size={22} /></span>
						</div>
					</button>
				{/each}
			</div>
			<div class="section-heading">
				<h2>The essentials</h2>
				<button onclick={() => (view = 'library')}
					>View all apps <Icon name="arrow" size={15} /></button
				>
			</div>
			<div class="essentials">
				{#each apps.filter((app) => ![1, 6].includes(app.id)).slice(0, 4) as app}
					<button
						class="essential"
						onclick={() => onlaunch(app)}
						oncontextmenu={(event) => onappmenu(event, app)}
						disabled={!ready}
						><span class="app-icon"><img src={app.icon} alt="" /></span><span
							><strong>{app.name}</strong><small>{descriptions[app.id] || 'Your shortcut'}</small
							></span
						><Icon name="arrow" size={16} /></button
					>
				{/each}
			</div>
			<footer class="workspace-footer">
				<span
					>{windows.length
						? `${windows.length} open ${windows.length === 1 ? 'window' : 'windows'} · Your session is in motion`
						: 'A fresh start. Where will you go?'}
				</span><time>{time}</time>
			</footer>
		{:else if view === 'library'}
			<label class="library-search"
				><Icon name="search" size={18} /><input
					aria-label="Filter apps"
					placeholder="Find your next destination…"
					bind:value={query}
				/></label
			>
			<div class="library-grid">
				{#each filtered as app}
					<button
						class="library-app"
						onclick={() => onlaunch(app)}
						oncontextmenu={(event) => onappmenu(event, app)}
						disabled={!ready}
						><span class="app-icon"><img src={app.icon} alt="" /></span><strong>{app.name}</strong>
						<p>{descriptions[app.id] || 'Your personal shortcut.'}</p>
						<span class="launch-label">Open app <Icon name="arrow" size={15} /></span></button
					>
				{:else}<p class="empty">No apps match “{query}”. Try another name.</p>{/each}
			</div>
		{:else}
			<div class="window-list">
				{#each windows as win (win.id)}
					{@const app = apps.find((item) => item.id === (win.parentApp ?? win.sender))}
					<button class="window-row" onclick={() => onfocus(win.sender)}
						><span class="app-icon"
							>{#if app}<img src={app.icon} alt="" />{:else}<Icon
									name="desktop"
									size={22}
								/>{/if}</span
						><span><strong>{win.name}</strong><small>Return to window</small></span><Icon
							name="arrow"
							size={18}
						/></button
					>
				{:else}<div class="empty-windows">
						<Icon name="desktop" size={42} />
						<h2>A little breathing room.</h2>
						<p>Your open apps will appear here.</p>
						<button onclick={() => (view = 'library')}
							>Explore your apps <Icon name="arrow" size={16} /></button
						>
					</div>{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.workspace-shell {
		display: grid;
		grid-template-columns: 190px minmax(0, 1fr);
		width: min(1200px, calc(100% - 64px));
		height: min(740px, calc(100% - 48px));
		margin: 24px auto;
		border: 1px solid #ffffff24;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 30px 90px #0004;
		background: #151b1bd9;
		backdrop-filter: blur(35px);
		color: #eeefe8;
	}
	button {
		border: 0;
		background: transparent;
		text-align: left;
	}
	.workspace-rail {
		display: flex;
		flex-direction: column;
		padding: 28px 15px 18px;
		border-right: 1px solid #ffffff12;
		background: #11171670;
	}
	.workspace-wordmark {
		display: flex;
		align-items: center;
		gap: 13px;
		font-size: 9px;
		letter-spacing: 2px;
		color: #a8b1a8;
		padding: 0 12px 34px;
	}
	.workspace-wordmark > span {
		font:
			italic 38px Georgia,
			serif;
		color: #d6c5a5;
	}
	nav {
		display: grid;
		gap: 6px;
	}
	nav button,
	.rail-bottom button {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 13px 11px;
		border-radius: 8px;
		color: #acb6af;
		font-size: 12px;
		transition:
			background 180ms,
			color 180ms;
	}
	nav button.selected {
		background: #d6c5a514;
		color: #e3d4b7;
	}
	nav button:hover,
	.rail-bottom button:hover {
		background: #ffffff0c;
		color: #fff;
	}
	nav small {
		margin-left: auto;
		opacity: 0.6;
	}
	.rail-bottom {
		margin-top: auto;
		padding-top: 30px;
	}
	.rail-note {
		font-size: 10px;
		color: #a0ada4;
		padding: 12px 11px;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.status-dot {
		width: 5px;
		height: 5px;
		background: #c3cfae;
		border-radius: 50%;
	}
	.workspace-body {
		padding: 36px;
		min-width: 0;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: #ffffff30 transparent;
	}
	.workspace-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 18px;
		margin-bottom: 30px;
	}
	.eyebrow {
		text-transform: uppercase;
		font-size: 9px;
		letter-spacing: 1.8px;
		color: #adb8ae;
		margin: 0 0 11px;
	}
	h1 {
		font-size: clamp(24px, 2.7vw, 37px);
		font-weight: 450;
		letter-spacing: -1.5px;
		margin: 0;
		line-height: 1.15;
	}
	.search-trigger {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid #ffffff1c;
		padding: 10px 12px;
		border-radius: 8px;
		color: #bac3bb;
		font-size: 11px;
	}
	.search-trigger kbd {
		font: inherit;
		font-size: 9px;
		color: #9aa99d;
	}
	.feature-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
	}
	.feature {
		position: relative;
		overflow: hidden;
		min-height: 255px;
		padding: 23px;
		background: #cfdbc4;
		color: #263830;
		border: 1px solid #e7eddb;
		border-radius: 13px;
		transition:
			transform 200ms ease-out,
			box-shadow 200ms;
		isolation: isolate;
	}
	.feature.gaming {
		background: #303c37;
		border-color: #5c6a59;
		color: #e1e7d5;
	}
	.feature:hover {
		transform: translateY(-3px);
		box-shadow: 0 14px 30px #0003;
	}
	.feature-top,
	.feature-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
		z-index: 1;
	}
	.feature-category {
		font-size: 9px;
		letter-spacing: 1.8px;
		font-weight: 600;
	}
	.feature-top img {
		width: 25px;
		height: 25px;
		object-fit: contain;
		filter: brightness(0.25);
	}
	.gaming .feature-top img {
		filter: none;
		opacity: 0.85;
	}
	.feature-bottom {
		margin-top: 134px;
		gap: 12px;
	}
	.feature h2 {
		margin: 0 0 7px;
		font-weight: 500;
		font-size: 24px;
		letter-spacing: -0.7px;
	}
	.feature p {
		margin: 0;
		font-size: 11px;
		opacity: 0.75;
	}
	.feature-arrow {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border: 1px solid currentColor;
		border-radius: 50%;
		opacity: 0.65;
	}
	.feature-art {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	.orbit {
		position: absolute;
		width: 160px;
		height: 160px;
		border: 1px solid #496b4940;
		border-radius: 50%;
		right: 30px;
		top: 31px;
	}
	.orbit-two {
		transform: rotate(-35deg) scaleX(0.45);
	}
	.orbit-three {
		transform: rotate(45deg) scaleX(0.5);
	}
	.orbit-one {
		box-shadow:
			0 0 0 19px #496b4907,
			0 0 0 40px #496b4905;
	}
	.orbit-core {
		position: absolute;
		right: 102px;
		top: 98px;
		width: 15px;
		height: 15px;
		background: #577550;
		border-radius: 50%;
	}
	.play-shape {
		position: absolute;
		right: 68px;
		top: 58px;
		width: 105px;
		height: 105px;
		clip-path: polygon(15% 0, 100% 50%, 15% 100%);
		background: #bdcf9d;
		transform: rotate(-12deg);
	}
	.play-line {
		position: absolute;
		right: -25px;
		top: 51px;
		width: 220px;
		height: 115px;
		border: 1px solid #c3dba73a;
		border-radius: 50%;
		transform: rotate(-30deg);
	}
	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 29px 0 14px;
	}
	.section-heading h2 {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
	}
	.section-heading button {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: #abb8aa;
	}
	.essentials {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.essential,
	.window-row {
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 15px;
		border: 1px solid #ffffff12;
		background: #ffffff03;
		border-radius: 10px;
		transition: background 180ms;
	}
	.essential:hover,
	.window-row:hover,
	.library-app:hover {
		background: #ffffff0c;
	}
	.app-icon {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		background: #ffffff09;
		border-radius: 9px;
		flex-shrink: 0;
	}
	.app-icon img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
	.essential > :last-child,
	.window-row > :last-child {
		margin-left: auto;
		opacity: 0.5;
	}
	strong {
		display: block;
		font-weight: 500;
		font-size: 12px;
	}
	small {
		display: block;
		margin-top: 5px;
		font-size: 10px;
		color: #a6b1a7;
	}
	.workspace-footer {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		color: #95a295;
		font-size: 10px;
		margin-top: 24px;
	}
	.workspace-footer time {
		color: #cfdbc7;
		font-variant-numeric: tabular-nums;
	}
	.library-search {
		display: flex;
		gap: 12px;
		align-items: center;
		border-bottom: 1px solid #ffffff24;
		padding: 4px 0 14px;
		margin-bottom: 24px;
		color: #acb8ad;
	}
	.library-search input {
		background: transparent;
		border: 0;
		color: #fff;
		width: 100%;
		padding: 7px;
	}
	.library-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}
	.library-app {
		padding: 20px;
		border: 1px solid #ffffff15;
		border-radius: 12px;
		transition: background 180ms;
	}
	.library-app strong {
		font-size: 15px;
		margin-top: 20px;
	}
	.library-app p {
		color: #a4b0a7;
		font-size: 11px;
		line-height: 1.6;
		min-height: 35px;
	}
	.launch-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 10px;
		color: #d1dabc;
		margin-top: 24px;
	}
	.window-list {
		display: grid;
		gap: 10px;
	}
	.empty {
		grid-column: 1 / -1;
		color: #b1bbae;
		padding: 25px 0;
	}
	.empty-windows {
		text-align: center;
		padding: 65px 15px;
		color: #aab7ac;
	}
	.empty-windows h2 {
		color: #e3e8dc;
		font-size: 23px;
		font-weight: 400;
		margin-top: 25px;
	}
	.empty-windows button {
		display: inline-flex;
		align-items: center;
		gap: 14px;
		border: 1px solid #ffffff30;
		padding: 13px 18px;
		border-radius: 8px;
		margin-top: 15px;
	}
	@media (max-width: 1000px) {
		.workspace-shell {
			width: calc(100% - 32px);
			grid-template-columns: 160px minmax(0, 1fr);
		}
		.workspace-body {
			padding: 25px;
		}
		.search-trigger span,
		.search-trigger kbd {
			display: none;
		}
		.feature {
			padding: 18px;
		}
		.feature p {
			max-width: 160px;
			line-height: 1.5;
		}
		.essential small {
			display: none;
		}
		.library-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 650px) {
		.workspace-shell {
			grid-template-columns: 1fr;
			grid-template-rows: auto minmax(0, 1fr);
			margin: 12px auto;
			height: calc(100% - 24px);
			border-radius: 14px;
			width: calc(100% - 20px);
		}
		.workspace-rail {
			padding: 8px;
			border-right: 0;
			border-bottom: 1px solid #ffffff12;
		}
		.workspace-wordmark,
		.rail-bottom {
			display: none;
		}
		nav {
			display: flex;
		}
		nav button {
			justify-content: center;
			padding: 12px 8px;
			font-size: 10px;
			gap: 7px;
		}
		nav small {
			margin: 0;
		}
		.workspace-body {
			padding: 23px 17px;
		}
		h1 {
			font-size: 28px;
		}
		.workspace-heading {
			margin-bottom: 22px;
		}
		.feature-grid {
			gap: 10px;
		}
		.feature {
			padding: 14px;
			min-height: 218px;
		}
		.feature-bottom {
			margin-top: 110px;
		}
		.feature h2 {
			font-size: 19px;
		}
		.feature p,
		.feature-arrow,
		.feature-top img {
			display: none;
		}
		.feature-category {
			font-size: 7px;
			letter-spacing: 1px;
		}
		.orbit {
			right: -35px;
			top: 30px;
			width: 135px;
			height: 135px;
		}
		.orbit-core {
			right: 25px;
			top: 90px;
		}
		.play-shape {
			right: 12px;
			top: 62px;
			width: 80px;
			height: 80px;
		}
		.essential {
			padding: 10px;
			gap: 8px;
		}
		.essential > :last-child {
			display: none;
		}
		.workspace-footer {
			font-size: 9px;
		}
	}
</style>
