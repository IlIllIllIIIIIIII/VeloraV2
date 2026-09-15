const AD_URL = 'https://www.profitableratecpmnetwork.com/gq87k39hs?key=829bb5eb83dab1aecc22a1013e54fcc4';
const COOLDOWN_MS = 20_000;
const LAST_ATTEMPT_KEY = 'velora:lastNavigationAdAttempt';

// Legacy page-wide mousedown listeners must not launch ads.
export function launchAds() {}

export function launchNavigationAd() {
    if (typeof window === 'undefined' || !window.navigator.userActivation?.isActive) return;
    try {
        if (window.localStorage.getItem('disableAds') === 'true') return;
        const now = Date.now();
        const stored = window.sessionStorage.getItem(LAST_ATTEMPT_KEY);
        const last = Number(stored);
        if (stored !== null && Number.isFinite(last) && now - last < COOLDOWN_MS) return;

        // Count blocked attempts too, so repeated clicks never retry during the cooldown.
        window.sessionStorage.setItem(LAST_ATTEMPT_KEY, String(now));
        window.open(AD_URL, '_blank', 'noopener,noreferrer');
    } catch {
        // Unavailable storage or blocked popups must never stop normal navigation.
    }
}
