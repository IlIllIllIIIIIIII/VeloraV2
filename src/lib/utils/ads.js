// ADSTERRA
const sites = [
    'https://www.profitableratecpmnetwork.com/gq87k39hs?key=829bb5eb83dab1aecc22a1013e54fcc4'
];

export function launchAds() {
    if (typeof window === 'undefined') return;

    if (localStorage.getItem('disableAds') === 'true') return;
    if (location.hostname.includes('localhost')) return;

    const i = Math.floor(Math.random() * sites.length);
    const newTab = window.open(sites[i]);

    if (newTab) {
        newTab.opener = null;
    }

    document.removeEventListener('mousedown', launchAds);
}

// Type "hello" to disable ads for this browser.
if (typeof window !== 'undefined') {
    let typed = '';

    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key.length !== 1) return;

        typed = (typed + event.key.toLowerCase()).slice(-5);

        if (typed === 'hello') {
            localStorage.setItem('disableAds', 'true');
            document.removeEventListener('mousedown', launchAds);
            typed = '';
            alert('Ads disabled for this browser');
        }
    });
}