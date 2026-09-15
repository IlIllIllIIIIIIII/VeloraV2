<script>
    import favicon from '$lib/assets/favicon.png';
    import '$lib/style/variables.css';
    import '$lib/style/themes.css';
    import '$lib/style/assets.css';
    import { initTheme } from '$lib/utils/theme.js';
    import { onMount } from 'svelte';

    let { children } = $props();

    let adsDisabled = $state(true);
    let desktop = $state(false);

    const adHtml = `
        <!doctype html>
        <html>
        <head>
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 300px;
                    height: 250px;
                    overflow: hidden;
                }
            </style>
        </head>
        <body>
            <script>
                window.atOptions = {
    'key' : '90c699020c687c1448867e4ef684412a',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
                };
            <\/script>
            <script src="https://www.highrevenueformat.com/90c699020c687c1448867e4ef684412a/invoke.js"><\/script>
        </body>
        </html>
    `;

    onMount(() => {
        initTheme();

        const media = window.matchMedia('(min-width: 1201px)');
        let typed = '';

        function syncDesktop() {
            desktop = media.matches;
        }

        function syncAds() {
            adsDisabled =
                localStorage.getItem('disableAds') === 'true';

        }

        function handleKeydown(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.key.length !== 1) return;

            typed = (typed + event.key.toLowerCase()).slice(-6);

            if (typed === 'pgtqbf') {
                typed = '';
                localStorage.setItem('disableAds', 'true');
                syncAds();
            }
        }

        syncAds();
        syncDesktop();

        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('ads-disabled', syncAds);
        window.addEventListener('storage', syncAds);
        media.addEventListener('change', syncDesktop);


        return () => {
            window.removeEventListener('keydown', handleKeydown);
            window.removeEventListener('ads-disabled', syncAds);
            window.removeEventListener('storage', syncAds);
            media.removeEventListener('change', syncDesktop);
        };
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Home - Classroom</title>
</svelte:head>

{#if desktop && !adsDisabled}
    <div class="sidebar-ad left-ad">
        <iframe
            title="Left advertisement"
            srcdoc={adHtml}
            width="300"
            height="250"
            scrolling="no"
        ></iframe>
    </div>
{/if}

<main class="site-content">
    {@render children()}
</main>

{#if desktop && !adsDisabled}
    <div class="sidebar-ad right-ad">
        <iframe
            title="Right advertisement"
            srcdoc={adHtml}
            width="300"
            height="250"
            scrolling="no"
        ></iframe>
    </div>
{/if}

<style>
    .site-content {
        width: 100%;
        min-height: 100vh;
    }

    .sidebar-ad {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 300;
        height: 250;
        z-index: 20;
    }

    .sidebar-ad iframe {
        display: block;
        border: 0;
        width: 300px;
        height: 250px;
    }

    .left-ad {
        left: 16px;
    }

    .right-ad {
        right: 16px;
    }

    @media (max-width: 1200px) {
        .sidebar-ad {
            display: none;
        }
    }
</style>