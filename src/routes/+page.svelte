<script>
	import { onMount } from 'svelte';
	import DesktopLoader from '$lib/utils/os/desktop-loader.svelte';

	const smartLink =
		'https://www.profitableratecpmnetwork.com/vqypd4bd4z?key=6ffbf570d5a651935b80b8e1a472f652';

	onMount(() => {
		function openSponsor() {
			if (localStorage.getItem('disableAds') === 'true') return;
			window.open(smartLink, '_blank', 'noopener,noreferrer');
		}

		document.addEventListener('click', openSponsor, { capture: true, once: true });
		return () => document.removeEventListener('click', openSponsor, true);
	});
</script>

<DesktopLoader />
