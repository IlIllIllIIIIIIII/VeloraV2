<script>
    import favicon from '$lib/assets/favicon.png';
    import '$lib/style/variables.css';
    import '$lib/style/themes.css';
    import '$lib/style/assets.css';
    import { initTheme } from '$lib/utils/theme.js';
    import { onMount } from 'svelte';

    let { children } = $props();

    onMount(() => {
        initTheme();

        let typed = '';

        function handleKeydown(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.key.length !== 1) return;

            typed = (typed + event.key.toLowerCase()).slice(-6);

            if (typed === 'pgtqbf') {
                typed = '';
                localStorage.setItem('disableAds', 'true');
                window.dispatchEvent(new Event('ads-disabled'));
            }
        }

        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Home - Classroom</title>
</svelte:head>

<main class="site-content">
    {@render children()}
</main>

<style>
    .site-content {
        width: 100%;
        min-height: 100vh;
    }

</style>
