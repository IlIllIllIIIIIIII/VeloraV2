<script>
    import Browser from './slate/+page.svelte';
    import { onMount } from 'svelte';
    import { launchAds } from '$lib/utils/ads.js';

    onMount(() => {
        document.addEventListener('mousedown', launchAds);

        return () => {
            document.removeEventListener('mousedown', launchAds);
        };
    });
</script>

<svelte:head>
    <title>Velora — New tab</title>
    <meta
        name="description"
        content="Your Velora browser. Search, browse, and play in one place."
    />
</svelte:head>

<Browser />